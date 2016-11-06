var net = require('net');
var tls = require('tls');
var Promise = require('bluebird');
var events = require('events');
var util = require('util');
var crypto = require('crypto');

var helper = require(__dirname+'/helper.js');
var Err = require(__dirname+'/error.js');
var Cursor = require(__dirname+'/cursor.js');
var ReadableStream = require(__dirname+'/stream.js');
var Metadata = require(__dirname+'/metadata.js');

var protodef = require(__dirname+'/protodef.js');
var responseTypes = protodef.Response.ResponseType;

// We'll ping a connection using this special value.
var PING_VALUE = "__rethinkdbdash_ping__";

var PROTOCOL_VERSION = 0;
var AUTHENTIFICATION_METHOD = "SCRAM-SHA-256";
var KEY_LENGTH = 32; // Because we are currently using SHA 256
var NULL_BUFFER = new Buffer('\0', "binary");
var CACHE_PBKDF2 = {};

function Connection(r, options, resolve, reject) {
  var self = this;
  this.r = r;
  this.state = 0; // Track the progress of the handshake. -1 will be used for an error state.

  // Set default options - We have to save them in case the user tries to reconnect
  if (!helper.isPlainObject(options)) options = {};
  this.host = options.host || r._host;
  this.port = options.port || r._port;
  if (options.authKey != null) {
    if (options.user != null || options.password != null) {
      throw new Err.ReqlDriverError('Cannot use both authKey and password');
    }
    this.user = r._user;
    this.password = options.authKey;
  } else {
    if (options.user === undefined) {
      this.user = r._user;
    } else {
      this.user = options.user;
    }
    if (options.password === undefined) {
      this.password = r._password;
    } else {
      this.password = options.password;
    }
  }

  this.authKey = options.authKey || r._authKey;
  // period in *seconds* for the connection to be opened
  this.timeoutConnect = options.timeout || r._timeoutConnect;
  // The connection will be pinged every <pingInterval> seconds
  this.pingInterval = options.pingInterval || r._pingInterval;

  if (options.db) this.db = options.db; // Pass to each query

  this.token = 1;
  this.buffer = new Buffer(0);

  this.metadata = {}

  this.open = false; // true only if the user can write on the socket
  this.timeout = null;

  if (options.connection) {
    this.connection = options.connection;
  }
  else {
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
  }

  self.connection.setKeepAlive(true);

  self.timeoutOpen = setTimeout(function() {
    self.connection.end(); // Send a FIN packet
    reject(new Err.ReqlDriverError('Failed to connect to '+self.host+':'+self.port+' in less than '+self.timeoutConnect+'s').setOperational());
  }, self.timeoutConnect*1000);

  self.connection.on('end', function() {
    self.open = false;
    self.emit('end');
    // We got a FIN packet, so we'll just flush
    self._flush();
  });
  self.connection.on('close', function() {
    // We emit end or close just once
    clearTimeout(self.timeoutOpen)
    clearInterval(self.pingIntervalId);
    self.connection.removeAllListeners();
    self.open = false;
    self.emit('closed');
    // The connection is fully closed, flush (in case 'end' was not triggered)
    self._flush();
  });
  self.connection.setNoDelay();
  self.connection.once('error', function(error) {
    reject(new Err.ReqlDriverError('Failed to connect to '+self.host+':'+self.port+'\nFull error:\n'+JSON.stringify(error)).setOperational());
  });
  self.connection.on('connect', function() {
    self.connection.removeAllListeners('error');
    self.connection.on('error', function(error) {
      self.emit('error', error);
    });

    var versionBuffer = new Buffer(4)
    versionBuffer.writeUInt32LE(protodef.VersionDummy.Version.V1_0, 0)

    self.randomString = new Buffer(crypto.randomBytes(18)).toString('base64')
    var authBuffer = new Buffer(JSON.stringify({
      protocol_version: PROTOCOL_VERSION,
      authentication_method: AUTHENTIFICATION_METHOD,
      authentication: "n,,n=" + self.user + ",r=" + self.randomString
    }));

    helper.tryCatch(function() {
      self.connection.write(Buffer.concat([versionBuffer, authBuffer, NULL_BUFFER]));
    }, function(err) {
      // The TCP connection is open, but the ReQL connection wasn't established.
      // We can just abort the whole thing
      self.open = false;
      reject(new Err.ReqlDriverError('Failed to perform handshake with '+self.host+':'+self.port).setOperational());
    });
  });
  self.connection.once('end', function() {
    self.open = false;
  });

  self.connection.on('data', function(buffer) {
    if (self.state === -1) {
      // This is an error state
      return;
    }
    self.buffer = Buffer.concat([self.buffer, buffer]);

    if (self.open == false) {
      for(var i=0; i<self.buffer.length; i++) {
        if (self.buffer[i] === 0) {
          var messageServerStr = self.buffer.slice(0, i).toString();
          self.buffer = self.buffer.slice(i+1); // +1 to remove the null byte
          try {
            var messageServer = JSON.parse(messageServerStr);
          } catch(error) {
            self._abort();
            reject(new Err.ReqlDriverError('Could not parse the message sent by the server : \''+messageServerStr+'\'').setOperational());
            return;
          }
          if (messageServer.success !== true) {
            self._abort();
            reject(new Err.ReqlDriverError('Error '+messageServer.error_code+':'+messageServer.error).setOperational());
            return;
          }

          if (self.state === 0) {
            self._checkProtocolVersion(messageServer, reject);
          } else if (self.state === 1) {
            // Compute salt and send the proof
            self._computeSaltedPassword(messageServer, reject);
          } else if (self.state === 2) {
            self._compareDigest(messageServer, resolve, reject);
          }
        }
      }
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

Connection.prototype._checkProtocolVersion = function(messageServer, reject) {
  // Expect max_protocol_version, min_protocol_version, server_version, success
  var minVersion = messageServer.min_protocol_version
  var maxVersion = messageServer.max_protocol_version

  if (minVersion > PROTOCOL_VERSION || maxVersion < PROTOCOL_VERSION) {
    this._abort();
    reject(new Err.ReqlDriverError('Unsupported protocol version: '+PROTOCOL_VERSION+', expected between '+minVersion+' and '+ maxVersion).setOperational());
  }
  this.state = 1;
};

Connection.prototype._computeSaltedPassword = function(messageServer, reject) {
  var self = this;
  var authentication = helper.splitCommaEqual(messageServer.authentication);

  var randomNonce = authentication.r
  var salt = new Buffer(authentication.s, 'base64')
  var iterations = parseInt(authentication.i)

  if (randomNonce.substr(0, self.randomString.length) !== self.randomString) {
    self._abort();
    reject(new Err.ReqlDriverError('Invalid nonce from server').setOperational());
  }

  // The salt is constant, so we can cache the salted password.
  var cacheKey = self.password.toString("base64")+','+salt.toString("base64")+','+iterations;
  if (CACHE_PBKDF2.hasOwnProperty(cacheKey)) {
    helper.tryCatch(function() {
      self._sendProof(messageServer.authentication, randomNonce, CACHE_PBKDF2[cacheKey]);
    }, function(err) {
      // The TCP connection is open, but the ReQL connection wasn't established.
      // We can just abort the whole thing
      self.open = false;
      reject(new Err.ReqlDriverError('Failed to perform handshake with '+self.host+':'+self.port).setOperational());
    });
  } else {
    crypto.pbkdf2(self.password, salt, iterations, KEY_LENGTH, "sha256", function(error, saltedPassword) {
      if (error != null) {
        self._abort();
        reject(new Err.ReqlDriverError('Could not derive the key. Error:' + error.toString()).setOperational());
      }
      CACHE_PBKDF2[cacheKey] = saltedPassword;
      helper.tryCatch(function() {
        self._sendProof(messageServer.authentication, randomNonce, saltedPassword);
      }, function(err) {
        // The TCP connection is open, but the ReQL connection wasn't established.
        // We can just abort the whole thing
        self.open = false;
        reject(new Err.ReqlDriverError('Failed to perform handshake with '+self.host+':'+self.port).setOperational());
      });
    })
  }
}

Connection.prototype._sendProof = function(authentication, randomNonce, saltedPassword) {
  var clientFinalMessageWithoutProof = "c=biws,r=" + randomNonce;
  var clientKey = crypto.createHmac("sha256", saltedPassword).update("Client Key").digest()
  var storedKey = crypto.createHash("sha256").update(clientKey).digest()

  var authMessage =
      "n=" + this.user + ",r=" + this.randomString + "," +
      authentication + "," +
      clientFinalMessageWithoutProof

  var clientSignature = crypto.createHmac("sha256", storedKey).update(authMessage).digest()
  var clientProof = helper.xorBuffer(clientKey, clientSignature)

  var serverKey = crypto.createHmac("sha256", saltedPassword).update("Server Key").digest()
  this.serverSignature = crypto.createHmac("sha256", serverKey).update(authMessage).digest()

  this.state = 2
  var message = JSON.stringify({
    authentication: clientFinalMessageWithoutProof + ",p=" + clientProof.toString("base64")
  })
  this.connection.write(Buffer.concat([new Buffer(message.toString()), NULL_BUFFER]))
}

Connection.prototype._compareDigest = function(messageServer, resolve, reject) {
  var self = this;
  var firstEquals = messageServer.authentication.indexOf('=')
  var serverSignatureValue = messageServer.authentication.slice(firstEquals+1)

  if (!helper.compareDigest(serverSignatureValue, self.serverSignature.toString("base64"))) {
    reject(new Err.ReqlDriverError('Invalid server signature').setOperational());
  }

  self.state = 4
  self.connection.removeAllListeners('error');
  self.open = true;
  self.connection.on('error', function(e) {
    self.open = false;
  });
  clearTimeout(self.timeoutOpen)
  resolve(self);
  if (self.pingInterval > 0) {
    self.pingIntervalId = setInterval(function() {
      self.pendingPing = true;
      self.r.error(PING_VALUE).run(self).error(function(error) {
        self.pendingPing = false;
        if (error.message !== PING_VALUE) {
          self.emit('error', new Err.ReqlDriverError(
                'Could not ping the connection').setOperational());
          self.open = false;
          self.connection.end();
        } else {
        }
      });
    }, self.pingInterval*1000);
  }
}

Connection.prototype._abort = function() {
  this.state = -1;
  this.removeAllListeners();
  this.close();
}

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
    var errorValue = helper.makeAtom(response);
    var error;
    // We don't want to release a connection if we just pinged it.
    if (self.pendingPing === false || (errorValue !== PING_VALUE)) {
      self.emit('release');
      error = new Err.ReqlRuntimeError(errorValue, self.metadata[token].query, response);
    } else {
      error = new Err.ReqlRuntimeError(errorValue);
    }

    if (typeof self.metadata[token].reject === 'function') {
      currentResolve = self.metadata[token].resolve;
      currentReject = self.metadata[token].reject;
      self.metadata[token].removeCallbacks();
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
    var done = false;
    if (typeof self.metadata[token].resolve !== 'function') {
      // According to issues/190, we can get a SUCESS_COMPLETE followed by a
      // SUCCESS_PARTIAL when closing an feed. So resolve/reject will be undefined
      // in this case.
      currentResolve = self.metadata[token].endResolve;
      currentReject = self.metadata[token].endReject;
      if (typeof currentResolve === 'function') {
        done = true;
      }
    }
    else {
      currentResolve = self.metadata[token].resolve;
      currentReject = self.metadata[token].reject;
    }

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
            currentReject(new Err.ReqlDriverError('Unknown ResponseNote '+response.n[i]+', the driver is probably out of date.').setOperational());
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
      currentResolve({done: done, response: response});
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
        if (typeof self.metadata[token].endResolve !== 'function') {
          delete self.metadata[token];
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

        // We need to keep the options in the else statement,
        // so we clean it inside the if/else blocks (the one looking 
        // if a cursor was already created)
        if (typeof self.metadata[token].endResolve !== 'function') {
          // We do not want to delete the metadata if there is an END query waiting
          delete self.metadata[token];
        }

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
          if (typeof self.metadata[token].endResolve !== 'function') {
            delete self.metadata[token];
          }

        }).error(currentReject)
      }
      done = true;
      cursor._push({done: true, response: response});
    }
    else { // That was a continue query
      // If there is a pending STOP query we do not want to close the cursor yet
      done = true;
      if (typeof self.metadata[token].endResolve === 'function') {
        done = false;
      }
      currentResolve({done: done, response: response});
    }
  }
  else if (type === responseTypes.WAIT_COMPLETE) {
    self.emit('release');
    self.metadata[token].resolve();

    delete self.metadata[token];
  }
  else if (type === responseTypes.SERVER_INFO) {
    self.emit('release');
    datum = helper.makeAtom(response, self.metadata[token].options);
    self.metadata[token].resolve(datum);
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
  if (self.open === false) {
    var err = new Err.ReqlDriverError('The connection was closed by the other party');
    err.setOperational();
    reject(err);
    return;
  }

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

Connection.prototype.server = function(callback) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var query = [protodef.Query.QueryType.SERVER_INFO];
    self._send(query, self._getToken(), resolve, reject, undefined, undefined, true);
  }).nodeify(callback);
}

// Return the next token and update it.
Connection.prototype._getToken = function() {
  return this.token++;
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
  var token = self._getToken();

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
