import * as util from 'util';
import * as events from 'events';
import Promise = require('bluebird');
import {Dequeue} from './dequeue';
import {Pool} from './pool';
import * as helper from './helper';
import * as Err from './error';

var UNKNOWN_POOLS = 'unknownPools';
var SEPARATOR = 'feedSeparator';

export class PoolMaster extends events.EventEmitter {
  emitStatus() {
    // Emit the healthy event with a boolean indicating whether the pool master
    // is healthy or not
    var healthy = this._healthyPools.length !== 0;
    if (this._healthy !== healthy) {
      this._healthy = healthy;
      this.emit('healthy', healthy);
    }
  }

  drain() {
    this.emit('draining');
    if (this._discovery === true) {
      this._discovery = false;
      if (this._feed != null) {
        this._feed.close();
      }
    }
    this._draining = true;
    var promises = [];
    var pools = this.getPools();
    for (var i = 0; i < pools.length; i++) {
      promises.push(pools[i].drain());
    }
    this._healthyPools = [];
    var self = this;
    return Promise.all(promises).then(() => {
      for (var i = 0; i < pools.length; i++) {
        pools[i].removeAllListeners();
      }
    }).error(function (error) {
      if (this._options.silent !== true) {
        this._log('Failed to drain all the pools:');
        this._log(error.message);
        this._log(error.stack);
      }
    });
  }

  getAvailableLength() {
    return this._numAvailableConnections;
  }

  getLength() {
    return this._numConnections;
  }

  resetBufferParameters() {
    // Reset buffer and max for each pool
    var max = Math.floor(this._options.max / this._healthyPools.length);
    var buffer = Math.floor(this._options.buffer / this._healthyPools.length);
    for (var i = 0; i < this._healthyPools.length; i++) {
      if (this._healthyPools[i].getLength() > max) {
        this._healthyPools[i]._extraConnections = this._healthyPools[i].getLength() - max;
      }
      else {
        this._healthyPools[i]._extraConnections = 0;
      }
      this._healthyPools[i].options.max = max;
      this._healthyPools[i].options.buffer = buffer;
    }
  }

  getNumAvailableConnections() {
    var sum = 0;
    for (var i = 0; i < this._healthyPools.length; i++) {
      sum += this._healthyPools[i].getAvailableLength();
    }
    return sum;
  }

  getNumConnections() {
    var sum = 0;
    for (var i = 0; i < this._healthyPools.length; i++) {
      sum += this._healthyPools[i].getLength();
    }
    return sum;
  }

  initPool(pool) {
    // Bind listeners on the pools
    var self = this;

    pool.on('size-diff', function (diff) {
      this._numConnections += diff;
      this.emit('size', this._numConnections);
    });
    pool.on('available-size-diff', function (diff) {
      this._numAvailableConnections += diff;
      this.emit('available-size', this._numAvailableConnections);
    });

    pool.on('new-connection', function () {
      if (this._line.getLength() > 0) {
        var p = this._line.shift();
        this.getConnection().then(p.resolve).error(p.reject);
        this.emit('queueing', this._line.getLength());
      }
    });
    pool.on('not-empty', function () {
      if (this._draining === false) {
        var found = false;
        for (var i = 0; i < this._healthyPools.length; i++) {
          if (this._healthyPools[i] === this) {
            this._healthyPools.length;
            found = true;
            break;
          }
        }
        if (found === false) {
          this._healthyPools.push(this);
          this.emitStatus();
          this.resetBufferParameters();
        }
      }
    });
    pool.on('empty', function () {
      // A pool that become empty is considered unhealthy
      for (var i = 0; i < this._healthyPools.length; i++) {
        if (this._healthyPools[i] === this) {
          this._healthyPools.splice(i, 1);
          this.emitStatus();
          break;
        }
      }
      if (this._healthyPools.length === 0) {
        this._flushErrors();
      }

      this.resetBufferParameters();
    });
    pool.on('draining', function () {
      for (var i = 0; i < this._healthyPools.length; i++) {
        if (this._healthyPools[i] === this) {
          this._healthyPools.splice(i, 1);
          this.emitStatus();
          break;
        }
      }

      if (this._healthyPools === 0) {
        this._flushErrors();
      }
    });
  }

  fetchServers(useSeeds) {
    //  Create the feed on server_status and bind the listener to the feed
    var self = this;
    var query = this._r.db('rethinkdb').table('server_status')
      .union([SEPARATOR])
      .union(this._r.db('rethinkdb').table('server_status').changes());
    // In case useSeeds is true, we rotate through all the seeds + the pool master
    if (!useSeeds || this._seed === this._servers.length) {
      if (useSeeds && this._seed === this._servers.length) {
        // We increase the back off only when we went through all the seeds
        this._consecutiveFails++;
      }

      this._seed = 0;
      var promise = query.run({ cursor: true });
    }
    else {
      var settings = this._servers[this._seed];
      this._seed++;
      var promise = this._r.connect(settings).then(connection => query.run(connection, { cursor: true }));
    }
    promise.then(function (feed) {
      if (this._draining === true) {
        // There is no need to close the feed here as we'll close the connections
        return;
      }
      this._feed = feed;
      var initializing = true;
      var servers = [];
      feed.each(function (err, change) {
        if (err) {
          this._log('The changefeed on server_status returned an error: ' + err.toString());
          // We have to refetch everything as the server that was serving the feed may
          // have died.
          if (!this._draining) {
            setTimeout(function () {
              this.fetchServers();
            }, 0); // Give a timeout to let the driver clean the pools
          }
          return;
        }
        if (initializing === true) {
          if (change === SEPARATOR) {
            initializing = false;
            this.handleAllServersResponse(servers);
            // Rerun the whole query after to make sure that a change did not skip/sneak between the union. As long
            // as RethinkDB does not provide initial results
            setTimeout(function () {
              this._r.db('rethinkdb').table('server_status').run({ cursor: false }).then(function (servers) {
                this.handleAllServersResponse(servers);
              }).error(function (error) {
                this._log('Fail to retrieve a second copy of server_status');
                //TODO Retry
              });
            }, 1000);
          }
          else {
            servers.push(change);
          }
          return;
        }

        if (change.new_val !== null && change.old_val === null) {
          // New server
          this.createPool(change.new_val);
        }
        else if (change.new_val === null && change.old_val !== null) {
          // A server was removed
          var server = change.old_val;
          if (this._pools[server.id] != null) {
            this.deletePool(server.id);
          }
          else {
            var found = false;
            for (var i = 0; i < this._pools[UNKNOWN_POOLS].length; i++) {
              if (((server.network.canonical_addresses[k].host === this._pools[UNKNOWN_POOLS][i].options.connection.host) ||
                (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host) && (helper.localhostAliases.hasOwnProperty(this._pools[UNKNOWN_POOLS][i].options.connection.host)))) &&
                (server.network.reql_port === this._pools[UNKNOWN_POOLS][i].options.connection.port)) {
                found = true;

                (function (pool) {
                  this._log('Removing pool connected to: ' + pool.getAddress());
                  var pool = this._pools[UNKNOWN_POOLS].splice(i, 1)[0];
                  pool.drain().then(() => {
                    pool.removeAllListeners();
                  }).error(function (error) {
                    if (this._options.silent !== true) {
                      this._log('Pool connected to: ' + pool.getAddress() + ' could not be properly drained.');
                      this._log(error.message);
                      this._log(error.stack);
                    }
                  });
                })(this._pools[UNKNOWN_POOLS][i]);
                break;
              }
            }
          }
          if (found === false) {
            this._log('A server was removed but no pool for this server exists...');
          }
        }
        // We ignore this change since this it doesn't affect whether the server
        // is available or not.
        // else if (change.new_val !== null && change.old_val !== null) {}
      });
    }).error(function (error) {
      this._log('Could not retrieve the data from server_status: ' + JSON.stringify(error));

      var timeout;
      if (this._consecutiveFails === -1) {
        timeout = 0;
      }
      else {
        timeout = (1 << Math.min(this._maxExponent, this._consecutiveFails)) * this._timeoutError;
      }
      setTimeout(function () {
        this.fetchServers(true);
      }, timeout);
    });
  }

  deletePool(key) {
    // Delete a known pool
    var self = this;
    var pool = this._pools[key];
    this._log('Removing pool connected to: ' + pool.getAddress());
    pool.drain().then(() => {
      pool.removeAllListeners();
    }).error(function (error) {
      this._log('Pool connected to: ' + this._pools[key].getAddress() + ' could not be properly drained.');
      this._log(error.message);
      this._log(error.stack);
    });
    delete this._pools[key];
    this.resetBufferParameters();
  }

  createPool(server) {
    // Create a new pool
    var self = this;
    var address = helper.getCanonicalAddress(server.network.canonical_addresses);
    var settings = this.createPoolSettings(this._options, {
      port: server.network.reql_port,
      host: address.host
    }, this._log);
    var pool = new Pool(this._r, settings);
    this._pools[server.id] = pool;
    this.initPool(pool);
    this._healthyPools.push(pool);
    this.emitStatus();
    this.resetBufferParameters();
  }

  createPoolSettings(globalOptions, serverOptions, log) {
    // Create the settings for a given pool. Merge the global options + the servers's one.
    var settings:any = {};
    var numServers = Array.isArray(globalOptions.servers) ? globalOptions.servers.length : 1;
    helper.loopKeys(globalOptions, (options, key) => {
      if ((key === 'buffer') || (key === 'max')) {
        settings[key] = Math.ceil(options[key] / numServers);
        settings[key] = Math.ceil(options[key] / numServers);
      }
      else if (key !== 'servers') {
        settings[key] = options[key];
      }
    });
    if (serverOptions) {
      helper.loopKeys(serverOptions, (options, key) => {
        settings[key] = options[key];
      });
    }
    settings._log = log;
    return settings;
  }

  handleAllServersResponse(servers) {
    // Fetch all the servers once
    var self = this;
    // Fill all the known server from RethinkDB
    var knownServer = {};
    for (var i = 0; i < servers.length; i++) {
      var server = servers[i];
      knownServer[server.id] = { count: 0, server: server };
      if (this._pools[server.id] === undefined) {
        // We potentially have a new server in the cluster, or we already have a pool for this server
        // in one of the UNKNOWN_POOLS
        var found = false;
        for (var j = 0; j < this._pools[UNKNOWN_POOLS].length; j++) {
          if (found) break;
          var pool = this._pools[UNKNOWN_POOLS][j]; 
          // If a pool is created with localhost, it will probably match the first server even though it may not the the one
          // So it gets an id
          for (var k = 0; k < server.network.canonical_addresses.length; k++) {
            // Check for the same host (or if they are both localhost) and port
            if (((server.network.canonical_addresses[k].host === pool.options.connection.host) ||
              (server.network.hostname === pool.options.connection.host) ||
              (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host) &&
                helper.localhostAliases.hasOwnProperty(pool.options.connection.host))) &&
              (server.network.reql_port === pool.options.connection.port)) {

              this._pools[server.id] = this._pools[UNKNOWN_POOLS].splice(j, 1)[0];
              // We may assign the wrong pool to this server if it's maching on localhost
              if (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host)) {
                this._pools[server.id].options.connection.host = helper.getCanonicalAddress(server.network.canonical_addresses).host;
                if (!helper.getCanonicalAddress(this._pools[server.id].options.connection.host)) {
                  this._pools[server.id].drainLocalhost();
                }
              }
              found = true;
              break;
            }
          }
        }
        if (found === false) {
          // We just found a new server, let's extract the canonical address and connect to it
          this.createPool(server);
        }
      }
    } // Each server know has a pool

    // Check if we need to remove pools
    helper.loopKeys(this._pools, function (pools, key) { // among the pools with a server id
      if (key !== UNKNOWN_POOLS) {
        if (knownServer.hasOwnProperty(key) === false) {
          this.deletePool(key); // We just found a pool that doesn't map to any known RethinkDB server
        }
        else {
          knownServer[key].count++;
        }
      }
    });
    for (var i = 0; i < this._pools[UNKNOWN_POOLS].length; i++) {
      // These pools does not match any server returned by RethinkDB.
      var pool = this._pools[UNKNOWN_POOLS].splice(i, 1)[0];
      this._log('Removing pool connected to: ' + pool.getAddress());
      pool.drain().then(() => {
        pool.removeAllListeners();
      }).error(function (error) {
        this._log('Pool connected to: ' + this._pools[UNKNOWN_POOLS][i].getAddress() + ' could not be properly drained.');
        this._log(error.message);
        this._log(error.stack);
      });
    }
  }

  _expandAll() {
    for (var i = 0; i < this._healthyPools.length; i++) {
      this._healthyPools[i]._expandBuffer();
    }
  }

  getConnection() {
    var self = this;
    // Find a pool with available connections
    var result;
    for (var i = 0; i < this._healthyPools.length; i++) {
      if (this._index >= this._healthyPools.length) {
        this._index = 0;
      }
      if (this._healthyPools[this._index].getAvailableLength() > 0) {
        result = this._healthyPools[this._index].getConnection();
      }
      this._index++;
      if (this._index === this._healthyPools.length) {
        this._index = 0;
      }
      if (result) {
        return result;
      }
    }
    if (this._healthyPools.length === 0) {
      return new Promise((resolve, reject) => {
        reject(new Err.ReqlDriverError('None of the pools have an opened connection and failed to open a new one').setOperational());
      });
    }
    else {
      // All pool are busy, buffer the request
      return new Promise(function (resolve, reject) {
        this._line.push({
          resolve: resolve,
          reject: reject
        });

        this.emit('queueing', this._line.getLength());
        // We could add a condition to be less greedy (for early start)
        this._expandAll();
      });

    }
  }

  _flushErrors() {
    // Reject all promises in this._line
    while (this._line.getLength() > 0) {
      this._line.shift().reject(new Err.ReqlDriverError('None of the pools have an opened connection and failed to open a new one').setOperational());
      this.emit('queueing', this._line.getLength());
    }
  }

  getPools() {
    var result = [];
    helper.loopKeys(this._pools, (pools, key) => {
      if (key === UNKNOWN_POOLS) {
        for (var i = 0; i < pools[key].length; i++) {
          result.push(pools[key][i]);
        }
      }
      else {
        result.push(pools[key]);
      }
    });
    return result;
  }

  _timeout;
  _servers;
  _seed;
  _maxExponent;
  _timeoutError;
  _consecutiveFails;
  _feed;
  _hasPrintWarningLocalhost;
  _numAvailableConnections;
  _numConnections;
  _draining;
  _log;
  _options;
  _discovery;
  _indexUnknown;
  _index;
  _init;
  _healthy;
  _healthyPools;
  _pools;
  _line;
  _r;

  constructor(r, options) {
    super();
    var self = this;
    var options = options || {};
    var lineLength = options.buffer || 50;

    this._r = r;
    this._line = new Dequeue(lineLength);
    this._pools = {};
    this._pools[UNKNOWN_POOLS] = []; // pools for which we do not know the server'id
    this._healthyPools = [];
    this._healthy = false;
    this._init = false;
    this._index = 0; // next pool to used
    this._indexUnknown = 0; // next unknown pool to used
    this._discovery = (typeof options.discovery === 'boolean') ? options.discovery : false; // Whether the pool master is in discovery mode or not
    //this._refresh = (typeof options.refresh === 'number') ? options.refresh: 1000*60*60; // Refresh rate for the list of servers
    this._options = options;
    this._options.buffer = options.buffer || 50;
    this._options.max = options.max || 1000;
    this._log = helper.createLogger(self, options.silent || false);
    this._draining = false;
    this._numConnections = 0;
    this._numAvailableConnections = 0;
    this._hasPrintWarningLocalhost = false;
    this._feed = null;
    this._consecutiveFails = -1;
    this._timeoutError = options.timeoutError || 1000; // How long should we wait before recreating a connection that failed?
    this._maxExponent = options.maxExponent || 6; // Maximum timeout is 2^maxExponent*timeoutError

    //TODO
    //this._usingPool = true; // If we have used the pool
    this._seed = 0;

    var pool;
    if (Array.isArray(options.servers) && options.servers.length > 0) {
      this._servers = options.servers;
      for (var i = 0; i < options.servers.length; i++) {
        var settings = this.createPoolSettings(options, options.servers[i], this._log);
        pool = new Pool(this._r, settings);
        this._pools[UNKNOWN_POOLS].push(pool);
        // A pool is considered healthy by default such that people can do
        // var = require(...)(); query.run();
        this._healthyPools.push(pool);
        this.emitStatus();
      }
    }
    else {
      this._servers = [{
        host: options.host || 'localhost',
        port: options.port || 28015
      }];
      var settings = this.createPoolSettings(options, {}, this._log);
      pool = new Pool(this._r, settings);
      this._pools[UNKNOWN_POOLS].push(pool);
      this._healthyPools.push(pool);
      this.emitStatus();
    }

    // Initialize all the pools - bind listeners
    for (var i = 0; i < this._pools[UNKNOWN_POOLS].length; i++) {
      this.initPool(this._pools[UNKNOWN_POOLS][i]);
    }
    if ((this._discovery === true)) {
      this._timeout = setTimeout(function () { this.fetchServers() }, 0);
    }
  }
}
