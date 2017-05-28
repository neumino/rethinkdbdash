var util = require('util');
var events = require('events');
var Promise = require('bluebird');
var Dequeue = require(__dirname+'/dequeue.js');
var Pool = require(__dirname+'/pool.js');
var helper = require(__dirname+'/helper.js');
var Err = require(__dirname+'/error.js');
var UNKNOWN_POOLS = 'unknownPools';
var SEPARATOR = 'feedSeparator';
function PoolMaster(r, options) {
  var self = this;
  var options = options || {};
  var lineLength = options.buffer || 50;

  self._r = r;
  self._line = new Dequeue(lineLength);
  self._pools = {};
  self._pools[UNKNOWN_POOLS] = []; // pools for which we do not know the server'id
  self._healthyPools = [];
  self._healthy = false;
  self._init = false;
  self._index = 0; // next pool to used
  self._indexUnknown =  0 // next unknown pool to used
  self._discovery = (typeof options.discovery === 'boolean') ? options.discovery: false; // Whether the pool master is in discovery mode or not
  //self._refresh = (typeof options.refresh === 'number') ? options.refresh: 1000*60*60; // Refresh rate for the list of servers
  self._options = options;
  self._options.buffer = options.buffer || 50;
  self._options.max = options.max || 1000;
  self._log = helper.createLogger(self, options.silent || false);
  if (typeof options.log == 'function') {
    self.on('log', options.log);
  }
  self._draining = false;
  self._numConnections = 0;
  self._numAvailableConnections = 0;
  self._hasPrintWarningLocalhost = false;
  self._feed = null;
  self._consecutiveFails = -1;
  self._timeoutError = options.timeoutError || 1000; // How long should we wait before recreating a connection that failed?
  self._maxExponent = options.maxExponent || 6; // Maximum timeout is 2^maxExponent*timeoutError

  //TODO
  //self._usingPool = true; // If we have used the pool
  self._seed = 0;

  var pool;
  if (Array.isArray(options.servers)) {
    if (options.servers.length > 0) {
      self._servers = options.servers;
      for(var i=0; i<options.servers.length; i++) {
        var settings = self.createPoolSettings(options, options.servers[i], self._log);
        pool = new Pool(self._r, settings);
        self._pools[UNKNOWN_POOLS].push(pool);
        // A pool is considered healthy by default such that people can do
        // var = require(...)(); query.run();
        self._healthyPools.push(pool);
        self.emitStatus()
      }
    }
    else {
      throw new Err.ReqlDriverError("If `servers` is an array, it must contain at least one server")
    }
  }
  else {
    self._servers = [{
      host: options.host || 'localhost',
      port: options.port || 28015
    }]
    var settings = self.createPoolSettings(options, {}, self._log);
    pool = new Pool(self._r, settings);
    self._pools[UNKNOWN_POOLS].push(pool);
    self._healthyPools.push(pool);
    self.emitStatus()
  }

  // Initialize all the pools - bind listeners
  for(var i=0; i<self._pools[UNKNOWN_POOLS].length; i++) {
    self.initPool(self._pools[UNKNOWN_POOLS][i]);
  }
  if ((self._discovery === true)) {
    self._timeout = setTimeout(function() { self.fetchServers() }, 0);
  }
}
util.inherits(PoolMaster, events.EventEmitter);

PoolMaster.prototype.getPools = function() {
  var result = [];
  helper.loopKeys(this._pools, function(pools, key) {
    if (key === UNKNOWN_POOLS) {
      for(var i=0;i<pools[key].length; i++) {
        result.push(pools[key][i]);
      }
    }
    else {
      result.push(pools[key]);
    }
  });
  return result;
}

// Reject all promises in this._line
PoolMaster.prototype._flushErrors = function() {
  while(this._line.getLength() > 0) {
    this._line.shift().reject(new Err.ReqlDriverError('None of the pools have an opened connection and failed to open a new one').setOperational());
    this.emit('queueing', this._line.getLength())
  }
}

PoolMaster.prototype.getConnection = function() {
  var self = this;
  // Find a pool with available connections
  var result;
  for(var i=0; i<self._healthyPools.length; i++) {
    if (self._index >= self._healthyPools.length) {
      self._index = 0;
    }
    if (self._healthyPools[self._index].getAvailableLength() > 0) {
      result = self._healthyPools[self._index].getConnection();
    }
    self._index++;
    if (self._index === self._healthyPools.length) {
      self._index = 0;
    }
    if (result) {
      return result;
    }
  }
  if (self._healthyPools.length === 0) {
    return new Promise(function(resolve, reject) {
      reject(new Err.ReqlDriverError('None of the pools have an opened connection and failed to open a new one').setOperational());
    });
  }
  else {
    // All pool are busy, buffer the request
    return new Promise(function(resolve, reject) {
      self._line.push({
        resolve: resolve,
        reject: reject
      });

      self.emit('queueing', self._line.getLength())
      // We could add a condition to be less greedy (for early start)
      self._expandAll();
    });

  }
}
PoolMaster.prototype._expandAll = function() {
  for(var i=0; i<this._healthyPools.length; i++) {
    this._healthyPools[i]._expandBuffer();
  }
}

// Fetch all the servers once
PoolMaster.prototype.handleAllServersResponse = function(servers) {
  var self = this;
  if (self._draining === true) {
    return;
  }
  // Fill all the known server from RethinkDB
  var knownServer = {};
  for(var i=0; i<servers.length; i++) {
    var server = servers[i];
    knownServer[server.id] = {count: 0, server: server};
    if (self._pools[server.id] === undefined) {
      // We potentially have a new server in the cluster, or we already have a pool for this server
      // in one of the UNKNOWN_POOLS
      var found = false;
      for(var j=0; j<self._pools[UNKNOWN_POOLS].length; j++) {
        if (found) break;
        var pool = self._pools[UNKNOWN_POOLS][j]; 
        // If a pool is created with localhost, it will probably match the first server even though it may not the the one
        // So it gets an id
        for(var k=0; k<server.network.canonical_addresses.length; k++) {
          // Check for the same host (or if they are both localhost) and port
          if (((server.network.canonical_addresses[k].host === pool.options.connection.host) ||
               (server.network.hostname === pool.options.connection.host) ||
            (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host) &&
            helper.localhostAliases.hasOwnProperty(pool.options.connection.host))) &&
            (server.network.reql_port === pool.options.connection.port)) {

            self._pools[server.id] = self._pools[UNKNOWN_POOLS].splice(j, 1)[0];
            // We may assign the wrong pool to this server if it's maching on localhost
            if (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host)) {
              self._pools[server.id].options.connection.host = helper.getCanonicalAddress(server.network.canonical_addresses).host;
              self._pools[server.id].drainLocalhost();
            }
            found = true;
            break;
          }
        }
      }
      if (found === false) {
        // We just found a new server, let's extract the canonical address and connect to it
        self.createPool(server);
      }
    }
  } // Each server know has a pool

  // Check if we need to remove pools
  helper.loopKeys(self._pools, function(pools, key) { // among the pools with a server id
    if (key !== UNKNOWN_POOLS) {
      if (knownServer.hasOwnProperty(key) === false) {
        self.deletePool(key); // We just found a pool that doesn't map to any known RethinkDB server
      }
      else {
        knownServer[key].count++;
      }
    }
  });
  for(var i=0;i<self._pools[UNKNOWN_POOLS].length; i++) {
    // These pools does not match any server returned by RethinkDB.
    var pool = self._pools[UNKNOWN_POOLS].splice(i, 1)[0];
    self._log('Removing pool connected to: '+pool.getAddress())
    pool.drain().then(function() {
      pool.removeAllListeners();
    }).error(function(error) {
      self._log('Pool connected to: '+self._pools[UNKNOWN_POOLS][i].getAddress()+' could not be properly drained.')
      self._log(error.message);
      self._log(error.stack);
    });
  }
}

// Create the settings for a given pool. Merge the global options + the servers's one.
PoolMaster.prototype.createPoolSettings = function(globalOptions, serverOptions, log) {
  var settings = {};
  var numServers = Array.isArray(globalOptions.servers) ? globalOptions.servers.length: 1;
  helper.loopKeys(globalOptions, function(options, key) {
    if ((key === 'buffer') || (key === 'max')) {
      settings[key] = Math.ceil(options[key]/numServers);
      settings[key] = Math.ceil(options[key]/numServers);
    }
    else if (key !== 'servers') {
      settings[key] = options[key];
    }
  });
  if (serverOptions) {
    helper.loopKeys(serverOptions, function(options, key) {
      settings[key] = options[key];
    });
  }
  settings._log = log;
  return settings;
}

// Create a new pool
PoolMaster.prototype.createPool = function(server) {
  var self = this;
  var address = helper.getCanonicalAddress(server.network.canonical_addresses);
  var settings = self.createPoolSettings(self._options, {
    port: server.network.reql_port,
    host: address.host
  }, self._log);
  var pool = new Pool(self._r, settings);
  self._pools[server.id] = pool
  self.initPool(pool);
  self._healthyPools.push(pool);
  self.emitStatus()
  self.resetBufferParameters();
}

// Delete a known pool
PoolMaster.prototype.deletePool = function(key) {
  var self = this;
  var pool = self._pools[key];
  self._log('Removing pool connected to: '+pool.getAddress())
  pool.drain().then(function() {
    pool.removeAllListeners();
  }).error(function(error) {
    self._log('Pool connected to: '+self._pools[key].getAddress()+' could not be properly drained.')
    self._log(error.message);
    self._log(error.stack);
  });
  delete self._pools[key];
  self.resetBufferParameters();
}

//  Create the feed on server_status and bind the listener to the feed
PoolMaster.prototype.fetchServers = function(useSeeds) {
  var self = this;
  var query = self._r.db('rethinkdb').table('server_status')
      .union([SEPARATOR])
      .union(self._r.db('rethinkdb').table('server_status').changes())
  // In case useSeeds is true, we rotate through all the seeds + the pool master
  if (!useSeeds || self._seed === self._servers.length) {
    if (useSeeds && self._seed === self._servers.length) {
      // We increase the back off only when we went through all the seeds
      self._consecutiveFails++;
    }

    self._seed = 0;
    var promise = query.run({cursor: true})
  }
  else {
    var settings = self._servers[self._seed];
    self._seed++;
    var promise = self._r.connect(settings).then(function(connection) {
      return query.run(connection, {cursor: true})
    });
  }
  promise.then(function(feed) {
    if (self._draining === true) {
      // There is no need to close the feed here as we'll close the connections
      return feed.close();
    }
    self._feed = feed;
    var initializing = true;
    var servers = [];
    feed.each(function(err, change) {
      if (err) {
        self._log('The changefeed on server_status returned an error: '+err.toString());
        // We have to refetch everything as the server that was serving the feed may
        // have died.
        if (!self._draining) {
          setTimeout(function() {
            self.fetchServers();
          }, 0); // Give a timeout to let the driver clean the pools
        }
        return;
      }
      if (initializing === true) {
        if (change === SEPARATOR) {
          initializing = false;
          self.handleAllServersResponse(servers);
          // Rerun the whole query after to make sure that a change did not skip/sneak between the union. As long
          // as RethinkDB does not provide initial results
          setTimeout(function() {
            self._r.db('rethinkdb').table('server_status').run({cursor: false}).then(function(servers) {
              self.handleAllServersResponse(servers);
            }).error(function(error) {
              self._log('Fail to retrieve a second copy of server_status');
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
        self.createPool(change.new_val);
      }
      else if (change.new_val === null && change.old_val !== null) {
        // A server was removed
        var server = change.old_val;
        if (self._pools[server.id] != null) {
          self.deletePool(server.id);
        }
        else {
          var found = false;
          for(var i=0; i<self._pools[UNKNOWN_POOLS].length; i++) {
            if (((server.network.canonical_addresses[k].host === self._pools[UNKNOWN_POOLS][i].options.connection.host) ||
              (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host) && (helper.localhostAliases.hasOwnProperty(self._pools[UNKNOWN_POOLS][i].options.connection.host)))) &&
              (server.network.reql_port === self._pools[UNKNOWN_POOLS][i].options.connection.port)) {
              found = true;

              (function (pool) {
                self._log('Removing pool connected to: '+pool.getAddress())
                var pool = self._pools[UNKNOWN_POOLS].splice(i, 1)[0];
                pool.drain().then(function() {
                  pool.removeAllListeners();
                }).error(function(error) {
                  if (self._options.silent !== true) {
                    self._log('Pool connected to: '+pool.getAddress()+' could not be properly drained.')
                    self._log(error.message);
                    self._log(error.stack);
                  }
                });
              })(self._pools[UNKNOWN_POOLS][i]);
              break;
            }
          }
        }
        if (found === false) {
          self._log('A server was removed but no pool for this server exists...')
        }
      }
      // We ignore this change since this it doesn't affect whether the server
      // is available or not.
      // else if (change.new_val !== null && change.old_val !== null) {}
    });
    return null;
  }).error(function(error) {
    self._log('Could not retrieve the data from server_status: '+JSON.stringify(error));
    
    var timeout;
    if (self._consecutiveFails === -1) {
      timeout = 0;
    }
    else {
      timeout = (1<<Math.min(self._maxExponent, self._consecutiveFails))*self._timeoutError;
    }
    setTimeout(function() {
      self.fetchServers(true);
    }, timeout);
  });
}

// Bind listeners on the pools
PoolMaster.prototype.initPool = function(pool) {
  var self = this;

  pool.on('size-diff', function(diff) {
    self._numConnections += diff;
    self.emit('size', self._numConnections)
  });
  pool.on('available-size-diff', function(diff) {
    self._numAvailableConnections += diff;
    self.emit('available-size', self._numAvailableConnections)
  });

  pool.on('new-connection', function() {
    if (self._line.getLength() > 0) {
      var p = self._line.shift();
      this.getConnection().then(p.resolve).error(p.reject);
      self.emit('queueing', self._line.getLength())
    }
  });
  pool.on('not-empty', function() {
    if (self._draining === false) {
      var found = false;
      for(var i=0; i<self._healthyPools.length; i++) {
        if (self._healthyPools[i] === this) {
          self._healthyPools.length;
          found = true;
          break;
        }
      }
      if (found === false) {
        self._healthyPools.push(this);
        self.emitStatus()
        self.resetBufferParameters();
      }
    }
  });
  pool.on('empty', function() {
    // A pool that become empty is considered unhealthy
    for(var i=0; i<self._healthyPools.length; i++) {
      if (self._healthyPools[i] === this) {
        self._healthyPools.splice(i, 1);
        self.emitStatus()
        break;
      }
    }
    if (self._healthyPools.length === 0) {
      self._flushErrors();
    }

    self.resetBufferParameters();
  });
  pool.on('draining', function() {
    for(var i=0; i<self._healthyPools.length; i++) {
      if (self._healthyPools[i] === this) {
        self._healthyPools.splice(i, 1);
        self.emitStatus()
        break;
      }
    }

    if (self._healthyPools === 0) {
      self._flushErrors();
    }
  });
}

PoolMaster.prototype.getNumConnections = function() {
  var sum = 0;
  for(var i=0; i<this._healthyPools.length; i++) {
    sum += this._healthyPools[i].getLength();
  }
  return sum;
}
PoolMaster.prototype.getNumAvailableConnections = function() {
  var sum = 0;
  for(var i=0; i<this._healthyPools.length; i++) {
    sum += this._healthyPools[i].getAvailableLength();
  }
  return sum;
}

// Reset buffer and max for each pool
PoolMaster.prototype.resetBufferParameters = function() {
  var max = Math.floor(this._options.max/this._healthyPools.length)
  var buffer = Math.floor(this._options.buffer/this._healthyPools.length)
  for(var i=0; i<this._healthyPools.length; i++) {
    if (this._healthyPools[i].getLength() > max) {
      this._healthyPools[i]._extraConnections = this._healthyPools[i].getLength()-max;
    }
    else {
      this._healthyPools[i]._extraConnections = 0;
    }
    this._healthyPools[i].options.max = max
    this._healthyPools[i].options.buffer = buffer;
  }
}

PoolMaster.prototype.getLength = function() {
  return this._numConnections;
}
PoolMaster.prototype.getAvailableLength = function() {
  return this._numAvailableConnections;
}

PoolMaster.prototype.drain = function() {
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
  for(var i=0; i<pools.length; i++) {
    promises.push(pools[i].drain());
  }
  this._healthyPools = [];
  var self = this;
  return Promise.all(promises).then(function() {
    for(var i=0; i<pools.length; i++) {
      pools[i].removeAllListeners();
    }
  }).error(function(error) {
    if (self._options.silent !== true) {
      self._log('Failed to drain all the pools:');
      self._log(error.message);
      self._log(error.stack);
    }
  });
}

// Emit the healthy event with a boolean indicating whether the pool master
// is healthy or not
PoolMaster.prototype.emitStatus = function() {
  var healthy = this._healthyPools.length !== 0;
  if (this._healthy !== healthy) {
    this._healthy = healthy;
    this.emit('healthy', healthy)
  }
}

module.exports = PoolMaster;
