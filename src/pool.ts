import Promise = require('bluebird');
import {Dequeue} from './dequeue';
import * as helper from './helper';
import * as Err from './error';
import * as events from 'events';
import * as util from 'util';

export class Pool extends events.EventEmitter {
  getAddress() {
    return this.options.connection.host + ':' + this.options.connection.port;
  }

  drain() {
    var self = this;
    self._log('Draining the pool connected to ' + this.getAddress());
    self.emit('draining');
    var p = new Promise((resolve, reject) => {
      var connection = this._pool.pop();
      this.emit('available-size', this._pool.getLength());
      this.emit('available-size-diff', -1);
      while (connection) {
        connection.close();
        clearTimeout(connection.timeout);
        connection = this._pool.pop();
      }
      if (this.timeoutReconnect !== undefined) {
        clearTimeout(this.timeoutReconnect);
        this.timeoutReconnect = null;
      }
      if (this.getLength() === 0) {
        resolve();
      }
      else {
        this._draining = {
          resolve: resolve,
          reject: reject
        };
      }
    });
    return p;
  }

  drainLocalhost() {
    var self = this;
    // All the connections are to localhost, let's create new ones (not to localhost)
    self._connectionToReplace = self._numConnections;
    ;
    for (var i = 0, numConnections = self._numConnections; i < numConnections; i++) {
      self.createConnection().finally(() => {
        this._localhostToDrain++;
        this._connectionToReplace--;
        if ((this._connectionToReplace === 0) && (this._localhostToDrain > 0)) {
          var len = this._pool.getLength();
          for (var j = 0; j < len; j++) {
            if (this._localhostToDrain === 0) {
              break;
            }
            var _connection = this._pool.shift();
            if (helper.localhostAliases.hasOwnProperty(_connection.host)) {
              this._localhostToDrain--;
              _connection.close();
              clearTimeout(_connection.timeout);
            }
            else {
              this._pool.push(_connection);
            }
          }
        }

      });
    }
  }

  setOptions(options) {
    if (helper.isPlainObject(options)) {
      for (var key in options) {
        this.options[key] = options[key];
      }
    }
    return this.options;
  }

  getAvailableLength() {
    return this._pool.getLength();
  }

  getLength() {
    return this._numConnections;
  }

  _expandBuffer() {
    if ((this._draining === null) &&
      (this._pool.getLength() < this.options.buffer + this._localhostToDrain) &&
      (this._numConnections < this.options.max + this._localhostToDrain)) {
      this.createConnection();
    }
  }

  _aggressivelyExpandBuffer() {
    for (var i = 0; i < this.options.buffer; i++) {
      this._expandBuffer();
    }
  }

  createConnection() {
    var self = this;
    self._increaseNumConnections();
    self._openingConnections++;

    self.emit('creating-connection', self);
    if (self._draining) {
      return; // Do not create a new connection if we are draining the pool.
    }

    return self._r.connect(self.options.connection).then(connection => {
      this.emit('created-connection', this);

      this._openingConnections--;

      if ((this._slowlyGrowing === false) && (this._slowGrowth === true) && (this._openingConnections === 0)) {
        this._consecutiveFails++;
        this._slowlyGrowing = true;
        this.timeoutReconnect = setTimeout(function () {
          this.createConnection();
          //self._expandBuffer();
        }, (1 << Math.min(this.options.maxExponent, this._consecutiveFails)) * this.options.timeoutError);
      }
      // Need another flag
      else if ((this._slowlyGrowing === true) && (this._slowGrowth === true) && (this._consecutiveFails > 0)) {
        this._log('Exiting slow growth mode');
        this._consecutiveFails = 0;
        this._slowGrowth = false;
        this._slowlyGrowing = false;
        this._aggressivelyExpandBuffer();
      }

      connection.on('error', function (e) {
        // We are going to close connection, but we don't want another process to use it before
        // So we remove it from the pool now (if it's inside)
        this._log('Error emitted by a connection: ' + JSON.stringify(error));
        for (var i = 0; i < this.getAvailableLength(); i++) {
          if (this._pool.get(i) === this) {
            this._pool.delete(i);
            this.emit('available-size', this._pool.getLength());
            this.emit('available-size-diff', -1);
            break;
          }
        }
        // We want to make sure that it's not going to try to reconnect
        clearTimeout(connection.timeout);

        // Not sure what happened here, so let's be safe and close this connection.
        connection.close().then(function () {
          this._expandBuffer();
        }).error(function (e) {
          // We failed to close this connection, but we removed it from the pool... so err, let's just ignore that.
          this._expandBuffer();
        });
        clearTimeout(connection.timeout);
      });
      connection.on('end', function (e) {
        // The connection was closed by the server, let's clean...
        for (var i = 0; i < this.getAvailableLength(); i++) {
          if (this._pool.get(i) === this) {
            this._pool.delete(i);
            this.emit('available-size', this._pool.getLength());
            this.emit('available-size-diff', -1);
            break;
          }
        }

        clearTimeout(connection.timeout);
        this._decreaseNumConnections();
        this._expandBuffer();
      });
      connection.on('timeout', function () {
        for (var i = 0; i < this.getAvailableLength(); i++) {
          if (this._pool.get(i) === this) {
            this._pool.delete(i);
            this.emit('available-size', this._pool.getLength());
            this.emit('available-size-diff', -1);
            break;
          }
        }

        clearTimeout(connection.timeout);
        this._decreaseNumConnections();
        this._expandBuffer();
      });
      connection.on('release', function () {
        if (this._isOpen()) this.putConnection(this);
      });
      this.putConnection(connection);
      return null;
    }).error(error => {
      // We failed to create a connection, we are now going to create connections one by one
      this._openingConnections--;
      this._decreaseNumConnections();

      this._slowGrowth = true;
      if (this._slowlyGrowing === false) {
        this._log('Entering slow growth mode');
      }
      this._slowlyGrowing = true;

      // Log an error
      this._log('Fail to create a new connection for the connection pool. Error:' + JSON.stringify(error));

      if (this._openingConnections === 0) {
        this._consecutiveFails++;
        this.timeoutReconnect = setTimeout(function () {
          //self._expandBuffer();
          this.createConnection();
        }, (1 << Math.min(this.options.maxExponent, this._consecutiveFails)) * this.options.timeoutError);
      }
    });
  }

  putConnection(connection) {
    var self = this;
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
    else if (self._draining !== null) {
      connection.close();
      clearTimeout(connection.timeout);
      if (self.getLength() === 0) {
        self._draining.resolve();
      }
    }
    else if (self._extraConnections > 0) {
      self._extraConnections--;
      connection.close().error(error => {
        this._log('Fail to properly close a connection. Error:' + JSON.stringify(error));
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
      var timeoutCb = () => {
        if (this._pool.get(0) === connection) {
          if (this._pool.getLength() > this.options.buffer) {
            this._pool.shift().close();
            this.emit('available-size', this._pool.getLength());
            this.emit('available-size-diff', -1);
          }
          else {
            connection.timeout = setTimeout(timeoutCb, this.options.timeoutGb);
          }
        }
        else {
          // This should technically never happens
          connection.timeout = setTimeout(timeoutCb, this.options.timeoutGb);
        }
      };
      connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
    }
  }

  _increaseNumConnections() {
    this._numConnections++;
    this.emit('size', this._numConnections);
    this.emit('size-diff', 1);
  }

  _decreaseNumConnections() {
    this._numConnections--;
    this.emit('size', this._numConnections);
    this.emit('size-diff', -1);
    if ((this._draining !== null) && (this._numConnections === 0)) {
      this._draining.resolve();
    }
    // We do not check for this._empty === false because we want to emit empty if the pool
    // tries to connect to an unavailable server (such that the master can remove it from the
    // healthy pool
    if (this._numConnections === 0) {
      this._empty = true;
      this.emit('empty');
    }
  }

  getConnection() {
    var p = new Promise((resolve, reject) => {
      if (this._draining !== null) {
        return reject(new Err.ReqlDriverError('The pool is being drained').setOperational());
      }

      var connection = this._pool.pop();
      this.emit('available-size', this._pool.getLength());
      this.emit('available-size-diff', -1);

      if (connection) {
        clearTimeout(connection.timeout);
        resolve(connection);
      }
      else {
        if ((this._numConnections === 0) && (this._slowGrowth === true)) {
          // If the server is down we do not want to buffer the queries
          return reject(new Err.ReqlDriverError('The pool does not have any opened connections and failed to open a new one').setOperational());
        }
      }

      if (this._slowGrowth === false) {
        this._expandBuffer();
      }

    });
    return p;
  }

  id;
  _empty;
  _extraConnections;
  _slowlyGrowing;
  _slowGrowth;
  _consecutiveFails;
  _openingConnections;
  _numConnections;
  _connectionToReplace;
  _localhostToDrain;
  _draining;
  _pool;
  _log;
  options;
  timeoutReconnect;
  _r;

  constructor(r, options) {
    super();
    this._r = r;

    if (!helper.isPlainObject(options)) options = {};
    this.options = {};
    this.options.max = options.max || 1000; // 4000 is about the maximum the kernel can take
    var buffer = (typeof options.buffer === 'number') ? options.buffer : 50;
    this.options.buffer = (buffer < this.options.max) ? buffer : this.options.max;
    this.options.timeoutError = options.timeoutError || 1000; // How long should we wait before recreating a connection that failed?
    this.options.timeoutGb = options.timeoutGb || 60 * 60 * 1000; // Default timeout for TCP connection is 2 hours on Linux, we time out after one hour.
    this.options.maxExponent = options.maxExponent || 6; // Maximum timeout is 2^maxExponent*timeoutError

    this.options.silent = options.silent || false;

    this.options.connection = {
      host: options.host || this._r._host,
      port: options.port || this._r._port,
      db: options.db || this._r._db,
      timeout: options.timeout || this._r._timeoutConnect,
      authKey: options.authKey || this._r._authKey,
      cursor: options.cursor || false,
      stream: options.stream || false,
      ssl: options.ssl || false
    };
    this._log = options._log;

    this._pool = new Dequeue(this.options.buffer + 1);
    this._draining = null;
    this._localhostToDrain = 0; // number of connections to "localhost" to remove
    this._connectionToReplace = 0; // number of connections to "localhost" to remove

    this._numConnections = 0;
    this._openingConnections = 0; // Number of connections being opened
    this._consecutiveFails = 0;   // In slow growth, the number of consecutive failures to open a connection
    this._slowGrowth = false;     // Opening one connection at a time
    this._slowlyGrowing = false;  // The next connection to be returned is one opened in slowGrowth mode
    this._extraConnections = 0; // Number of extra connections being opened that we should eventually close

    this._empty = true;

    // So we can let the pool master bind listeners
    setTimeout(() => {
      for (var i = 0; i < this.options.buffer; i++) {
        if (this.getLength() < this.options.max) {
          this.createConnection();
        }
      }
    }, 0);
    this.id = Math.floor(Math.random() * 100000);
    this._log('Creating a pool connected to ' + this.getAddress());
  }
}

/*
 * Events:
 *  - draining // when `drain` is called
 *  - queueing(size of the queue) // the number of queries being beffered changed
 *  - size(number of connections) // the size of the pool changed
 *  - available-size(available size) // the number of AVAILABLE conncetions of the pool changed
 */