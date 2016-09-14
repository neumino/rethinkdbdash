var Promise = require('bluebird');
var Dequeue = require(__dirname+'/dequeue.js');
var helper = require(__dirname+'/helper.js');
var Err = require(__dirname+'/error.js');
var events = require('events');
var util = require('util');

function Pool(r, options) {
  this._r = r;

  if (!helper.isPlainObject(options)) options = {};
  this.options = {};
  this.options.max = options.max || 1000; // 4000 is about the maximum the kernel can take
  var buffer = (typeof options.buffer === 'number') ? options.buffer : 50;
  this.options.buffer = (buffer < this.options.max) ? buffer : this.options.max;
  this.options.timeoutError = options.timeoutError || 1000; // How long should we wait before recreating a connection that failed?
  this.options.timeoutGb = options.timeoutGb || 60*60*1000; // Default timeout for TCP connection is 2 hours on Linux, we time out after one hour.
  this.options.maxExponent = options.maxExponent || 6; // Maximum timeout is 2^maxExponent*timeoutError

  this.options.silent = options.silent || false;

  this.options.connection = {
    host: options.host || this._r._host,
    port: options.port || this._r._port,
    db: options.db || this._r._db,
    timeout: options.timeout || this._r._timeoutConnect,
    authKey: options.authKey,
    user: options.user,
    password: options.password,
    cursor: options.cursor || false,
    stream: options.stream || false,
    ssl: options.ssl || false,
    pingInterval: options.pingInterval || this._r._pingInterval
  }
  this._log = options._log;

  this._pool = new Dequeue(this.options.buffer+1);
  this._draining = false;
  this._drainingHandlers = null; // Store the resolve/reject methods once draining is called
  this._localhostToDrain = 0; // number of connections to "localhost" to remove
  this._connectionToReplace = 0; // number of connections to "localhost" to remove

  this._numConnections = 0;
  this._openingConnections = 0; // Number of connections being opened
  this._consecutiveFails = 0;   // In slow growth, the number of consecutive failures to open a connection
  this._slowGrowth = false;     // Opening one connection at a time
  this._slowlyGrowing = false;  // The next connection to be returned is one opened in slowGrowth mode
  this._extraConnections = 0; // Number of extra connections being opened that we should eventually close

  this._empty = true;

  var self = this;
  // So we can let the pool master bind listeners
  setTimeout(function() {
    if (self._draining === false) {
      for(var i=0; i<self.options.buffer; i++) {
        if (self.getLength() < self.options.max) {
          self.createConnection();
        }
      }
    }
  }, 0);
  this.id = Math.floor(Math.random()*100000);
  this._log('Creating a pool connected to '+this.getAddress());
}

util.inherits(Pool, events.EventEmitter);
/*
 * Events:
 *  - draining // when `drain` is called
 *  - queueing(size of the queue) // the number of queries being beffered changed
 *  - size(number of connections) // the size of the pool changed
 *  - available-size(available size) // the number of AVAILABLE conncetions of the pool changed
 */

Pool.prototype.getConnection = function() {
  var self = this;
  var p = new Promise(function(resolve, reject) {
    if (self._draining === true) {
      return reject(new Err.ReqlDriverError('The pool is being drained').setOperational());
    }

    var connection = self._pool.pop();
    self.emit('available-size', self._pool.getLength());
    self.emit('available-size-diff', -1);

    if (connection) {
      clearTimeout(connection.timeout);
      resolve(connection);
    }
    else {
      if ((self._numConnections === 0) && (self._slowGrowth === true)) {
        // If the server is down we do not want to buffer the queries
        return reject(new Err.ReqlDriverError('The pool does not have any opened connections and failed to open a new one').setOperational());
      }
    }

    if (self._slowGrowth === false) {
      self._expandBuffer();
    }

  });
  return p;
};

Pool.prototype._decreaseNumConnections = function() {
  this._numConnections--;
  this.emit('size', this._numConnections)
  this.emit('size-diff', -1)
  if ((this._drainingHandlers !== null) && (this._numConnections === 0)) {
    this._drainingHandlers.resolve();
  }
  // We do not check for this._empty === false because we want to emit empty if the pool
  // tries to connect to an unavailable server (such that the master can remove it from the
  // healthy pool
  if (this._numConnections === 0) {
    this._empty = true;
    this.emit('empty');
  }
}
Pool.prototype._increaseNumConnections = function() {
  this._numConnections++;
  this.emit('size', this._numConnections)
  this.emit('size-diff', 1)
}


Pool.prototype.putConnection = function(connection) {
  var self = this;
  if (connection.end === false) {
    // Temporary attempt to fix #192 - this should not happen.
    return;
  }
  if (self._empty === true) {
    self._empty = false;
    // We emit not-empty only we have at least one opened connection
    self.emit('not-empty');
  }
  if ((self._localhostToDrain > 0) && (helper.localhostAliases.hasOwnProperty(connection.host))) {
    self._localhostToDrain--;
    connection.close();
    clearTimeout(connection.timeout);
    self.createConnection();
  }
  else if (self._drainingHandlers !== null) {
    connection.close();
    clearTimeout(connection.timeout);
    if (self.getLength() === 0) {
      self._drainingHandlers.resolve();
    }
  }
  else if (self._extraConnections > 0) {
    self._extraConnections--;
    connection.close().error(function(error) {
      self._log('Fail to properly close a connection. Error:'+JSON.stringify(error));
    });
    clearTimeout(connection.timeout);
  }
  /*
  // We let the pool garbage collect these connections
  else if (self.getAvailableLength()+1 > self.options.buffer) { // +1 for the connection we may put back
    // Note that because we have available connections here, the pool master has no pending
    // queries.
    connection.close().error(function(error) {
      self._log('Fail to properly close a connection. Error:'+JSON.stringify(error));
    });
    clearTimeout(connection.timeout);
  }
  */
  else {
    self._pool.push(connection);
    self.emit('available-size', self._pool.getLength());
    self.emit('available-size-diff', 1);
    self.emit('new-connection', connection);

    clearTimeout(connection.timeout);
    var timeoutCb = function() {
      if (self._pool.get(0) === connection) {
        if (self._pool.getLength() > self.options.buffer) {
          self._pool.shift().close();
          self.emit('available-size', self._pool.getLength());
          self.emit('available-size-diff', -1);
        }
        else {
          connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
        }
      }
      else {
        // This should technically never happens
        connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
      }
    }
    connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
  }
};

Pool.prototype.createConnection = function() {
  var self = this;
  self._increaseNumConnections();
  self._openingConnections++;

  self.emit('creating-connection', self);
  if (self._draining === true) {
    return; // Do not create a new connection if we are draining the pool.
  }

  return self._r.connect(self.options.connection).then(function(connection) {
    self.emit('created-connection', self);

    self._openingConnections--;

    if ((self._slowlyGrowing === false) && (self._slowGrowth === true) && (self._openingConnections === 0)) {
      self._consecutiveFails++;
      self._slowlyGrowing = true;
      self.timeoutReconnect = setTimeout(function() {
        self.createConnection();
        //self._expandBuffer();
      }, (1<<Math.min(self.options.maxExponent, self._consecutiveFails))*self.options.timeoutError);
    }
    // Need another flag
    else if ((self._slowlyGrowing === true) && (self._slowGrowth === true) && (self._consecutiveFails > 0)) {
      self._log('Exiting slow growth mode');
      self._consecutiveFails = 0;
      self._slowGrowth = false;
      self._slowlyGrowing = false;
      self._aggressivelyExpandBuffer();
    }



    connection.on('error', function(error) {
      // We are going to close connection, but we don't want another process to use it before
      // So we remove it from the pool now (if it's inside)
      self._log('Error emitted by a connection: '+JSON.stringify(error));
      for(var i=0; i<self.getAvailableLength(); i++) {
        if (self._pool.get(i) === this) {
          self._pool.delete(i);
          self.emit('available-size', self._pool.getLength());
          self.emit('available-size-diff', -1);
          break;
        }
      }
      // We want to make sure that it's not going to try to reconnect
      clearTimeout(connection.timeout);

      // Not sure what happened here, so let's be safe and close this connection.
      connection.close().then(function() {
        return self._expandBuffer();
      }).error(function(e) {
        // We failed to close this connection, but we removed it from the pool... so err, let's just ignore that.
        self._expandBuffer();
      });
    });
    connection.on('end', function(e) {
      // The connection was closed by the server, let's clean...
      for(var i=0; i<self.getAvailableLength(); i++) {
        if (self._pool.get(i) === this) {
          self._pool.delete(i);
          self.emit('available-size', self._pool.getLength());
          self.emit('available-size-diff', -1);
          break;
        }
      }

      clearTimeout(connection.timeout);
      self._decreaseNumConnections();
      self._expandBuffer();
    });
    connection.on('timeout', function() {
      for(var i=0; i<self.getAvailableLength(); i++) {
        if (self._pool.get(i) === this) {
          self._pool.delete(i);
          self.emit('available-size', self._pool.getLength());
          self.emit('available-size-diff', -1);
          break;
        }
      }

      clearTimeout(connection.timeout);
      self._decreaseNumConnections();
      self._expandBuffer();
    });
    connection.on('release', function() {
      if (this._isOpen()) self.putConnection(this);
    });
    self.putConnection(connection);
    return null;
  }).error(function(error) {
    // We failed to create a connection, we are now going to create connections one by one
    self._openingConnections--;
    self._decreaseNumConnections();

    self._slowGrowth = true;
    if (self._slowlyGrowing === false) {
      self._log('Entering slow growth mode');
    }
    self._slowlyGrowing = true;

    // Log an error
    self._log('Fail to create a new connection for the connection pool. Error:'+JSON.stringify(error));

    if (self._openingConnections === 0) {
      self._consecutiveFails++;
      self.timeoutReconnect = setTimeout(function() {
        //self._expandBuffer();
        self.createConnection();
      }, (1<<Math.min(self.options.maxExponent, self._consecutiveFails))*self.options.timeoutError);
    }
  })
};

Pool.prototype._aggressivelyExpandBuffer = function() {
  for(var i=0; i<this.options.buffer; i++) {
    this._expandBuffer();
  }
}
Pool.prototype._expandBuffer = function() {
  if ((this._draining === false) &&
      (this._pool.getLength() < this.options.buffer+this._localhostToDrain) &&
      (this._numConnections < this.options.max+this._localhostToDrain)) {
    this.createConnection();
  }
}

Pool.prototype.getLength = function() {
  return this._numConnections;
}
Pool.prototype.getAvailableLength = function() {
  return this._pool.getLength();
}

Pool.prototype.setOptions = function(options) {
  if (helper.isPlainObject(options)) {
    for(var key in options) {
      this.options[key] = options[key];
    }
  }
  return this.options;
}
Pool.prototype.drainLocalhost = function() {
  var self = this;
  // All the connections are to localhost, let's create new ones (not to localhost)
  self._connectionToReplace = self._numConnections;
  ;
  for(var i=0, numConnections=self._numConnections; i<numConnections; i++) {
    self.createConnection().finally(function() {
      self._localhostToDrain++;
      self._connectionToReplace--;
      if ((self._connectionToReplace === 0) && (self._localhostToDrain > 0)) {
        var len = self._pool.getLength();
        for(var j=0; j<len; j++) {
          if (self._localhostToDrain === 0) {
            break;
          }
          var _connection = self._pool.shift();
          if (helper.localhostAliases.hasOwnProperty(_connection.host)) {
            self._localhostToDrain--;
            _connection.close();
            clearTimeout(_connection.timeout);
          }
          else {
            self._pool.push(_connection);
          }
        }
      }

    });
  }
}

Pool.prototype.drain = function() {
  var self = this;
  self._draining = true;
  self._log('Draining the pool connected to '+this.getAddress());
  self.emit('draining');
  var p = new Promise(function(resolve, reject) {
    var connection = self._pool.pop();
    self.emit('available-size', self._pool.getLength());
    self.emit('available-size-diff', -1);
    while(connection) {
      connection.close();
      clearTimeout(connection.timeout);
      connection = self._pool.pop();
    }
    if (self.timeoutReconnect !== undefined) {
      clearTimeout(self.timeoutReconnect);
      self.timeoutReconnect = null;
    }
    if (self.getLength() === 0) {
      resolve();
    }
    else {
      self._drainingHandlers = {
        resolve: resolve,
        reject: reject
      }
    }
  });
  return p;
}


Pool.prototype.getAddress = function() {
  return this.options.connection.host+':'+this.options.connection.port;
}
module.exports = Pool;
