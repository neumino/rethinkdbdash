var net = require('net');
var tls = require('tls');
var Promise = require('bluebird');
var events = require('events');
var util = require('util');

var helper = require(__dirname+'/helper.js');
var Err = require(__dirname+'/error.js');
var Cursor = require(__dirname+'/cursor.js');
var ReadableStream = require(__dirname+'/stream.js');
var Metadata = require(__dirname+'/metadata.js');

var protodef = require(__dirname+'/protodef.js');
var responseTypes = protodef.Response.ResponseType;

function Connection(r, options, resolve, reject) {
  var self = this;
  this.r = r;

  // Set default options - We have to save them in case the user tries to reconnect
  if (!helper.isPlainObject(options)) options = {};
  this.host = options.host || r._host;
  this.port = options.port || r._port;
  this.authKey = options.authKey || r._authKey;
  this.timeoutConnect = options.timeout || r._timeoutConnect; // period in *seconds* for the connection to be opened

  if (options.db) this.db = options.db; // Pass to each query
  if (options.max_batch_rows) this.max_batch_rows = options.max_batch_rows; // For testing only

  this.token = 1;
  this.buffer = new Buffer(0);

  this.metadata = {}

  this.open = false; // true only if the user can write on the socket
  this.timeout = null;

  var family = 'IPv4';
  if (net.isIPv6(self.host)) {
    family = 'IPv6';
  }

  var connectionArgs = {
    host: self.host,
    port: self.port,
    family: family
  }

  var tlsOptions = options.ssl || false;
  if (tlsOptions === false) {
    self.connection = net.connect(connectionArgs);
  } else {
    if (helper.isPlainObject(tlsOptions)) {
      // Copy the TLS options in connectionArgs
      helper.loopKeys(tlsOptions, function(tlsOptions, key) {
        connectionArgs[key] = tlsOptions[key];
      });
    }
    self.connection = tls.connect(connectionArgs);
  }

  self.connection.setKeepAlive(true);

  self.timeoutOpen = setTimeout(function() {
    self.connection.end(); // Send a FIN packet
    reject(new Err.ReqlDriverError('Failed to connect to '+self.host+':'+self.port+' in less than '+self.timeoutConnect+'s'));
  }, self.timeoutConnect*1000);

  self.connection.on('end', function(error) {
    // We emit end or close just once
    self.connection.removeAllListeners();
    self.emit('end');
    // We got a FIN packet, so we'll just flush
    self._flush();
  });
  self.connection.on('close', function(error) {
    // We emit end or close just once
    clearTimeout(self.timeoutOpen)
    self.connection.removeAllListeners();
    self.emit('closed');
    // The connection is fully closed, flush (in case 'end' was not triggered)
    self._flush();
  });
  self.connection.setNoDelay();
  self.connection.once('error', function(error) {
    reject(new Err.ReqlDriverError('Failed to connect to '+self.host+':'+self.port+'\nFull error:\n'+JSON.stringify(error)));
  });
  self.connection.on('connect', function() {
    self.connection.removeAllListeners('error');
    self.connection.on('error', function(error) {
      self.emit('error', error);
    });

    var initBuffer = new Buffer(4)
    initBuffer.writeUInt32LE(protodef.VersionDummy.Version.V0_4, 0)

    var authBuffer = new Buffer(self.authKey, 'ascii')
    var lengthBuffer = new Buffer(4);
    lengthBuffer.writeUInt32LE(authBuffer.length, 0)

    var protocolBuffer = new Buffer(4)
    protocolBuffer.writeUInt32LE(protodef.VersionDummy.Protocol.JSON, 0)
    helper.tryCatch(function() {
      self.connection.write(Buffer.concat([initBuffer, lengthBuffer, authBuffer, protocolBuffer]));
    }, function(err) {
      // The TCP connection is open, but the ReQL connection wasn't established.
      // We can just abort the whole thing
      // TODO dig in node's code to see if it can actually happen, errors are probably just emitted.
      self.connection.emit('error', err);
    });
  });
  self.connection.once('end', function() {
    self.open = false;
  });

  self.connection.on('data', function(buffer) {
    self.buffer = Buffer.concat([self.buffer, buffer]);

    if (self.open == false) {
      for(var i=0; i<self.buffer.length; i++) {
        if (buffer[i] === 0) {
          clearTimeout(self.timeoutOpen)
          var connectionStatus = buffer.slice(0, i).toString();
          if (connectionStatus === 'SUCCESS') {
            self.open = true;
            resolve(self);
          }
          else {
            reject(new Err.ReqlDriverError('Server dropped connection with message: \''+connectionStatus+'\''));
          }
          self.buffer = buffer.slice(i+1);
          break;
        }
      }
      self.connection.removeAllListeners('error');
      self.connection.on('error', function(e) {
        self.open = false;
      });
    }
    else {
      while(self.buffer.length >= 12) {
        var token = self.buffer.readUInt32LE(0) + 0x100000000 * self.buffer.readUInt32LE(4);
        var responseLength = self.buffer.readUInt32LE(8);

        if (self.buffer.length < 12+responseLength) break;

        var responseBuffer = self.buffer.slice(12, 12+responseLength);
        var response = JSON.parse(responseBuffer);

        self._processResponse(response, token);

        self.buffer = self.buffer.slice(12+responseLength);
      }
    }
  });

  self.connection.on('timeout', function(buffer) {
    self.connection.open = false;
    self.emit('timeout');
  })
  self.connection.toJSON = function() { // We want people to be able to jsonify a cursor
    return '"A socket object cannot be converted to JSON due to circular references."'
  }
}

util.inherits(Connection, events.EventEmitter);

Connection.prototype._processResponse = function(response, token) {
  //console.log('Connection.prototype._processResponse: '+token);
  //console.log(JSON.stringify(response, null, 2));
  var self = this;

  var type = response.t;
  var result;
  var cursor;
  var stream;
  var currentResolve, currentReject;
  var datum;
  var options;

  if (type === responseTypes.COMPILE_ERROR) {
    self.emit('release');
    if (typeof self.metadata[token].reject === 'function') {
      self.metadata[token].reject(new Err.ReqlCompileError(helper.makeAtom(response), self.metadata[token].query, response));
    }

    delete self.metadata[token]
  }
  else if (type === responseTypes.CLIENT_ERROR) {
    self.emit('release');

    if (typeof self.metadata[token].reject === 'function') {
      currentResolve = self.metadata[token].resolve;
      currentReject = self.metadata[token].reject;
      self.metadata[token].removeCallbacks();
      currentReject(new Err.ReqlClientError(helper.makeAtom(response), self.metadata[token].query, response));
      if (typeof self.metadata[token].endReject !== 'function') {
        // No pending STOP query, we can delete
        delete self.metadata[token]
      }
    }
    else if (typeof self.metadata[token].endResolve === 'function') {
      currentResolve = self.metadata[token].endResolve;
      currentReject = self.metadata[token].endReject;
      self.metadata[token].removeEndCallbacks();
      currentReject(new Err.ReqlClientError(helper.makeAtom(response), self.metadata[token].query, response));
      delete self.metadata[token]
    }
    else if (token === -1) { // This should not happen now since 1.13 took the token out of the query
      var error = new Err.ReqlClientError(helper.makeAtom(response)+'\nClosing all outstanding queries...');
      self.emit('error', error);
      // We don't want a function to yield forever, so we just reject everything
      helper.loopKeys(self.rejectMap, function(rejectMap, key) {
        rejectMap[key](error);
      });
      self.close();
      delete self.metadata[token]
    }
  }
  else if (type === responseTypes.RUNTIME_ERROR) {
    self.emit('release');
    if (typeof self.metadata[token].reject === 'function') {
    }

    if (typeof self.metadata[token].reject === 'function') {
      currentResolve = self.metadata[token].resolve;
      currentReject = self.metadata[token].reject;
      self.metadata[token].removeCallbacks();
      var error = new Err.ReqlRuntimeError(helper.makeAtom(response), self.metadata[token].query, response);
      error.setName(response.e);
      currentReject(error);
      if (typeof self.metadata[token].endReject !== 'function') {
        // No pending STOP query, we can delete
        delete self.metadata[token]
      }
    }
    else if (typeof self.metadata[token].endResolve === 'function') {
      currentResolve = self.metadata[token].endResolve;
      currentReject = self.metadata[token].endReject;
      self.metadata[token].removeEndCallbacks();
      currentReject(new Err.ReqlRuntimeError(helper.makeAtom(response), self.metadata[token].query, response));
      delete self.metadata[token]
    }
  }
  else if (type === responseTypes.SUCCESS_ATOM) {
    self.emit('release');
    // self.metadata[token].resolve is always a function
    datum = helper.makeAtom(response, self.metadata[token].options);

    if ((Array.isArray(datum)) &&
        ((self.metadata[token].options.cursor === true) || ((self.metadata[token].options.cursor === undefined) && (self.r._options.cursor === true)))) {
      cursor = new Cursor(self, token, self.metadata[token].options, 'cursor');
      if (self.metadata[token].options.profile === true) {
        self.metadata[token].resolve({
          profile: response.p,
          result: cursor
        });
      }
      else {
        self.metadata[token].resolve(cursor);
      }

      cursor._push({done: true, response: { r: datum }});
    }
    else if ((Array.isArray(datum)) &&
        ((self.metadata[token].options.stream === true || self.r._options.stream === true))) {
      cursor = new Cursor(self, token, self.metadata[token].options, 'cursor');
      stream = new ReadableStream({}, cursor);
      if (self.metadata[token].options.profile === true) {
        self.metadata[token].resolve({
          profile: response.p,
          result: stream 
        });
      }
      else {
        self.metadata[token].resolve(stream);
      }

      cursor._push({done: true, response: { r: datum }});

    }
    else {
      if (self.metadata[token].options.profile === true) {
        result = {
          profile: response.p,
          result: cursor || datum
        }
      }
      else {
        result = datum;
      }
      self.metadata[token].resolve(result);
    }

    delete self.metadata[token];
  }
  else if (type === responseTypes.SUCCESS_PARTIAL) {
    // We save the current resolve function because we are going to call cursor._fetch before resuming the user's yield
    currentResolve = self.metadata[token].resolve;
    currentReject = self.metadata[token].reject;

    // We need to delete before calling cursor._push
    self.metadata[token].removeCallbacks();

    if (!self.metadata[token].cursor) { //No cursor, let's create one
      self.metadata[token].cursor = true;

      var typeResult = 'Cursor';
      var includesStates = false;;
      if (Array.isArray(response.n)) {
        for(var i=0; i<response.n.length; i++) {
          if (response.n[i] === protodef.Response.ResponseNote.SEQUENCE_FEED) {
            typeResult = 'Feed';
          }
          else if (response.n[i] === protodef.Response.ResponseNote.ATOM_FEED) {
            typeResult = 'AtomFeed';
          }
          else if (response.n[i] === protodef.Response.ResponseNote.ORDER_BY_LIMIT_FEED) {
            typeResult = 'OrderByLimitFeed';
          }
          else if (response.n[i] === protodef.Response.ResponseNote.UNIONED_FEED) {
            typeResult = 'UnionedFeed';
          }
          else if (response.n[i] === protodef.Response.ResponseNote.INCLUDES_STATES) {
            includesStates = true;
          }
          else {
            currentReject(new Err.ReqlDriverError('Unknown ResponseNote '+response.n[i]+', the driver is probably out of date.'));
            return;
          }
        }
      }
      cursor = new Cursor(self, token, self.metadata[token].options, typeResult);
      if (includesStates === true) {
        cursor.setIncludesStates();
      }
      if ((self.metadata[token].options.cursor === true) || ((self.metadata[token].options.cursor === undefined) && (self.r._options.cursor === true))) {
        // Return a cursor
        if (self.metadata[token].options.profile === true) {
          currentResolve({
            profile: response.p,
            result: cursor
          });
        }
        else {
          currentResolve(cursor);
        }
      }
      else if ((self.metadata[token].options.stream === true || self.r._options.stream === true)) {
        stream = new ReadableStream({}, cursor);
        if (self.metadata[token].options.profile === true) {
          currentResolve({
            profile: response.p,
            result: stream 
          });
        }
        else {
          currentResolve(stream);
        }
      }
      else if (typeResult !== 'Cursor') {
        // Return a feed
        if (self.metadata[token].options.profile === true) {
          currentResolve({
            profile: response.p,
            result: cursor
          });
        }
        else {
          currentResolve(cursor);
        }
      }
      else {
        // When we get SUCCESS_SEQUENCE, we will delete self.metadata[token].options
        // So we keep a reference of it here
        options = self.metadata[token].options;

        // Fetch everything and return an array
        cursor.toArray().then(function(result) {
          if (options.profile === true) {
            currentResolve({
              profile: response.p,
              result: result
            });
          }
          else {
            currentResolve(result);
          }
        }).error(currentReject)
      }
      cursor._push({done: false, response: response});
    }
    else { // That was a continue query
      currentResolve({done: false, response: response});
    }
  }
  else if (type === responseTypes.SUCCESS_SEQUENCE) {
    self.emit('release');

    if (typeof self.metadata[token].resolve === 'function') {
      currentResolve = self.metadata[token].resolve;
      currentReject = self.metadata[token].reject;
      self.metadata[token].removeCallbacks();
    }
    else if (typeof self.metadata[token].endResolve === 'function') {
      currentResolve = self.metadata[token].endResolve;
      currentReject = self.metadata[token].endReject;
      self.metadata[token].removeEndCallbacks();
    }

    if (!self.metadata[token].cursor) { // No cursor, let's create one
      cursor = new Cursor(self, token, self.metadata[token].options, 'Cursor');

      if ((self.metadata[token].options.cursor === true) || ((self.metadata[token].options.cursor === undefined) && (self.r._options.cursor === true))) {
        if (self.metadata[token].options.profile === true) {
          currentResolve({
            profile: response.p,
            result: cursor
          });
        }
        else {
          currentResolve(cursor);
        }

        // We need to keep the options in the else statement, so we clean it inside the if/else blocks
        delete self.metadata[token];
      }
      else if ((self.metadata[token].options.stream === true || self.r._options.stream === true)) {
        stream = new ReadableStream({}, cursor);
        if (self.metadata[token].options.profile === true) {
          currentResolve({
            profile: response.p,
            result: stream
          });
        }
        else {
          currentResolve(stream);
        }

        // We need to keep the options in the else statement, so we clean it inside the if/else blocks
        delete self.metadata[token];
      }
      else {
        cursor.toArray().then(function(result) {
          if (self.metadata[token].options.profile === true) {
            currentResolve({
              profile: response.p,
              result: result
            });
          }
          else {
            currentResolve(result);
          }
          delete self.metadata[token];
        }).error(currentReject)
      }
      cursor._push({done: true, response: response});
    }
    else { // That was a continue query
      currentResolve({done: true, response: response});
    }
  }
  else if (type === responseTypes.WAIT_COMPLETE) {
    self.emit('release');
    self.metadata[token].resolve();

    delete self.metadata[token];
  }
}

Connection.prototype.reconnect = function(options, callback) {
  var self = this;

  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (!helper.isPlainObject(options)) options = {};

  if (options.noreplyWait === true) {
    var p = new Promise(function(resolve, reject) {
      self.close(options).then(function() {
        self.r.connect({
          host: self.host,
          port: self.port,
          authKey: self.authKey,
          db: self.db
        }).then(function(c) {
          resolve(c);
        }).error(function(e) {
          reject(e);
        });
      }).error(function(e) {
        reject(e)
      })
    }).nodeify(callback);
  }
  else {
    return self.r.connect({
      host: self.host,
      port: self.port,
      authKey: self.authKey,
      db: self.db
    }, callback);
  }

  return p;
}

Connection.prototype._send = function(query, token, resolve, reject, originalQuery, options, end) {
  //console.log('Connection.prototype._send: '+token);
  //console.log(JSON.stringify(query, null, 2));

  var self = this;

  var queryStr = JSON.stringify(query);
  var querySize = Buffer.byteLength(queryStr);

  var buffer = new Buffer(8+4+querySize);
  buffer.writeUInt32LE(token & 0xFFFFFFFF, 0)
  buffer.writeUInt32LE(Math.floor(token / 0xFFFFFFFF), 4)

  buffer.writeUInt32LE(querySize, 8);

  buffer.write(queryStr, 12);

  // noreply instead of noReply because the otpions are translated for the server
  if ((!helper.isPlainObject(options)) || (options.noreply != true)) {
    if (!self.metadata[token]) {
      self.metadata[token] = new Metadata(resolve, reject, originalQuery, options);
    }
    else if (end === true) {
      self.metadata[token].setEnd(resolve, reject);
    }
    else {
      self.metadata[token].setCallbacks(resolve, reject);
    }
  }
  else {
    if (typeof resolve === 'function') resolve();
    this.emit('release');
  }

  // This will emit an error if the connection is closed
  helper.tryCatch(function() {
    self.connection.write(buffer);
  }, function(err) {
    self.metadata[token].reject(err);
    delete self.metadata[token]
  });

};

Connection.prototype._continue = function(token, resolve, reject) {
  var query = [protodef.Query.QueryType.CONTINUE];
  this._send(query, token, resolve, reject);
}
Connection.prototype._end = function(token, resolve, reject) {
  var query = [protodef.Query.QueryType.STOP];
  this._send(query, token, resolve, reject, undefined, undefined, true);
}


Connection.prototype.use = function(db) {
  if (typeof db !== 'string') throw new Err.ReqlDriverError('First argument of `use` must be a string')
  this.db = db;
}

Connection.prototype.close = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  var self = this;

  var p = new Promise(function(resolve, reject) {
    if (!helper.isPlainObject(options)) options = {};
    if (options.noreplyWait === true) {
      self.noreplyWait().then(function(r) {
        self.open = false;
        self.connection.end()
        resolve(r);
      }).error(function(e) {
        reject(e)
      });
    }
    else{
      self.open = false;
      self.connection.end();
      resolve();
    }
  }).nodeify(callback);
  return p;
};


Connection.prototype.noReplyWait = function() {
  throw new Err.ReqlDriverError('Did you mean to use `noreplyWait` instead of `noReplyWait`?')
}
Connection.prototype.noreplyWait = function(callback) {
  var self = this;
  var token = self.token++;

  var p = new Promise(function(resolve, reject) {
    var query = [protodef.Query.QueryType.NOREPLY_WAIT];

    self._send(query, token, resolve, reject);
  }).nodeify(callback);
  return p;
}
Connection.prototype._isConnection = function() {
  return true;
}
Connection.prototype._isOpen = function() {
  return this.open;
}

Connection.prototype._flush = function() {
  helper.loopKeys(this.metadata, function(metadata, key) {
    if (typeof metadata[key].reject === 'function') {
      metadata[key].reject(new Err.ReqlServerError(
            'The connection was closed before the query could be completed.',
            metadata[key].query));
    }
    if (typeof metadata[key].endReject === 'function') {
      metadata[key].endReject(new Err.ReqlServerError(
            'The connection was closed before the query could be completed.',
            metadata[key].query));
    }
  });
  this.metadata = {};
}

module.exports = Connection
