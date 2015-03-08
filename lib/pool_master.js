var Promise = require('bluebird');
var Dequeue = require(__dirname+"/dequeue.js");
var Pool = require(__dirname+"/pool.js");
var helper = require(__dirname+"/helper.js");
var Err = require(__dirname+"/error.js");
var UNKNOWN_POOLS = 'unknownPools';
var localhostAliases = {
    'localhost': true,
    '127.0.0.1': true,
    '::1': true
}
function PoolMaster(r, options) {
    var self = this;
    var options = options || {};
    var lineLength = options.buffer || 50;

    self._r = r;
    self._line = new Dequeue(lineLength);
    self._pools = {};
    self._pools[UNKNOWN_POOLS] = []; // pools for which we do not know the server'id
    self._healthyPools = [];
    self._init = false;
    self._index = 0; // next pool to used
    self._indexUnknown =  0 // next unknown pool to used
    self._auto = (typeof options.auto === 'boolean') ? options.auto: true; // Whether the pool master is in auto mode or not
    self._refresh = (typeof options.refresh === 'number') ? options.refresh: 1000*60*60; // Refresh rate for the list of servers
    self._options = options;
    self._options.buffer = options.buffer || 50;
    self._options.max = options.max || 1000;
    self._options.silent = options.silent || false;
    self._draining = false;

    var pool;
    if (Array.isArray(options.hosts)) {
        for(var i=0; i<options.hosts.length; i++) {
            // Create settings for this pool
            var settings = {};
            helper.loopKeys(options, function(options, key) {
                if ((key === 'buffer') || (key === 'max')) {
                    settings[key] = Math.ceil(options[key]/options.hosts.length);
                    settings[key] = Math.ceil(options[key]/options.hosts.length);
                }
                else if (key !== 'hosts') {
                    settings[key] = options[key];
                }
            });
            helper.loopKeys(options.hosts[i], function(options, key) {
                settings[key] = options[key];
            });
            pool = new Pool(self._r, settings);
            self._pools[UNKNOWN_POOLS].push(pool);
            // A pool is considered healthy by default such that people can do
            // var = require(...)(); query.run();
            self._healthyPools.push(pool);
        }
    }
    else {
        pool = new Pool(self._r, options);
        self._pools[UNKNOWN_POOLS].push(pool);
        self._healthyPools.push(pool);
    }

    // Initialize all the pools - bind listeners
    for(var i=0; i<self._pools[UNKNOWN_POOLS].length; i++) {
        self.initPool(self._pools[UNKNOWN_POOLS][i]);
    }

    if ((self._auto === true) && (self._healthyPools.length > 0)) {
        setTimeout(function() { self.fetchServers() }, 0);
        setInterval(function() { self.fetchServers() }, self._refresh);
    }

}

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

// Return whether if at least one pool is healthy
// Reject all promises in this._line
PoolMaster.prototype._flushErrors = function() {
    while(this._line.getLength() > 0) {
        this._line.shift().reject(new Err.ReqlDriverError("None of the pools have an opened connection and failed to open a new one"));
    }
}

PoolMaster.prototype.getConnection = function() {
    var self = this;
    var index = self._index;
    // Find a pool with available connections
    for(var i=0; i<self._healthyPools.length; i++) {
        if (self._healthyPools[index].getAvailableLength() > 0) {
            self._index++;
            if (self._index === self._healthyPools.length) {
                self._index = 0;
            }
            return self._healthyPools[index].getConnection();
        }
        index++;
        if (index === self._healthyPools.length) {
            index = 0;
        }
    }
    if (self._healthyPools.length === 0) {
        return new Promise(function(resolve, reject) {
            reject(new Error("None of the pools have an opened connection and failed to open a new one"));
        });
    }
    else {
        // All pool are busy, buffer the request
        return new Promise(function(resolve, reject) {
            //console.log('------------');
            //console.log(new Error().stack);
            self._line.push({
                resolve: resolve,
                reject: reject
            });
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

PoolMaster.prototype.fetchServers = function() {
    var self = this;
    self._r.db('rethinkdb').table('server_status').run({cursor: false}).then(function(servers) {
        for(var i=0; i<servers.length; i++) {
            var server = servers[i];
            //if (servers[i].status === 'connected') {
            if (self._pools[server.id] === undefined) {
                var found = false;
                for(var j=0; j<self._pools[UNKNOWN_POOLS].length; j++) {
                    if (found) break;
                    var pool = self._pools[UNKNOWN_POOLS][j]; 
                    for(var k=0; k<server.network.canonical_addresses.length; k++) {
                        // Check for the same host (or if they are both localhost) and port
                        if (((server.network.canonical_addresses[k].host === pool.options.connection.host) ||
                            (localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host) && (localhostAliases.hasOwnProperty(pool.options.connection.host)))) &&
                            (server.network.reql_port === pool.options.connection.port)) {
                            self._pools[server.id] = self._pools[UNKNOWN_POOLS].splice(j, 1)[0];
                            found = true;
                            break;
                        }
                    }
                }
                if (found === false) {
                    // We just found a new server, let's extract the canonical address and connect to it
                    var address = helper.getCanonicalAddress(server.network.canonical_addresses);
                    var settings = {};
                    helper.loopKeys(self._options, function(options, key) {
                        if (key !== 'hosts') {
                            settings[key] = options[key];
                        }
                    });
                    self._pools[server.id] = new Pool(self._r, settings);
                    self.initPool(self._pools[server.id])
                }
            }
        }
        // Check if we need to remove pools
        helper.loopKeys(self._pools, function(pools, key) {
            if (key === UNKNOWN_POOLS) {
                for(var i=0;i<pools[key].length; i++) {
                    var found = false;
                    for(var j=0; j<servers.length; j++) {
                        if (((servers[j].network.canonical_addresses[k].host === pools[key][i].options.connection.host) ||
                            (localhostAliases.hasOwnProperty(servers[j].network.canonical_addresses[k].host) && (localhostAliases.hasOwnProperty(pools[key][i].options.connection.host)))) &&
                            (servers[j].network.reql_port === pools[key][i].options.connection.port)) {
                            found = true;
                            break;
                        }
                    }
                    if (found === false) {
                        pools[key].splice(i, 1);
                    }
                }
            }
            else {
                var found = false;
                for(var i=0; i<servers.length; i++) {
                    if (servers[i].id === key) {
                        found = true;
                        break;
                    }
                }
                if (found === false) {
                    delete self._pools[key]
                }
            }
        });
    }).error(function(error) {
        if (self._options.silent !== true) {
            console.error('Failed to retrieve the servers. The error returned was:');
            console.error(error.message);
            console.error(error.stack);
        }
    })
}
PoolMaster.prototype.initPool = function(pool) {
    var self = this;

    pool.on('new-connection', function() {
        if (self._line.getLength() > 0) {
            var p = self._line.shift();
            this.getConnection().then(p.resolve).error(p.reject);
        }
    });
    pool.on('not-empty', function() {
        var found = false;
        for(var i=0; i<self._healthyPools.length; i++) {
            if (self._healthyPools[i] === this) {
                self._healthyPools.length;
                found = true;
                break;
            }
        }
        if (found === false) {
            if (self._auto === true) {
                self._healthyPools.push(this);
                self.resetBufferParameters();
            }
            else {
                var toRemoveBuffer = Math.floor(this.options.buffer/self._healthyPools.length);
                var toRemoveMax = Math.floor(this.options.max/self._healthyPools.length);

                for(var i=0; i<self._healthyPools.length; i++) {
                    self._healthyPools[i].options.max -= toRemoveMax;
                    self._healthyPools[i].options.buffer -= toRemoveBuffer;
                }
                self._healthyPools.push(this);
            }

        }
    });
    pool.on('empty', function() {
        if ((self._draining === false) && (self._auto === true)) {
            self.fetchServers();
        }
        // A pool that become empty is considered unhealthy
        for(var i=0; i<self._healthyPools.length; i++) {
            if (self._healthyPools[i] === this) {
                self._healthyPools.splice(i, 1);
            }
        }

        if (self._auto === true) {
            self.resetBufferParameters();
        }
        else {
            // Its connections are spread over the healthy pools
            var toSpreadBuffer = Math.floor(this.options.buffer/self._healthyPools.length);
            var toSpreadMax = Math.floor(this.options.max/self._healthyPools.length);
            for(i=0; i<self._healthyPools.length; i++) {
                self._healthyPools[i].options.max += toSpreadMax;
                self._healthyPools[i].options.buffer += toSpreadBuffer;
            }
        }

        if (self._healthyPools.length === 0) {
            self._flushErrors();
        }
    });
    pool.on('draining', function() {
        if (self._healthyPools === 0) {
            self._flushErrors();
        }
    });
}

PoolMaster.prototype.getNumConnections = function() {
    var sum = 0;
    for(var i=0; i<this._pools.length; i++) {
        sum += this._pools[i].getLength();
    }
    return sum;
}
PoolMaster.prototype.getNumAvailableConnections = function() {
    var sum = 0;
    for(var i=0; i<this._pools.length; i++) {
        sum += this._pools[i].getAvailableLength();
    }
    return sum;
}

// Reset buffer and max for each pool
PoolMaster.prototype.resetBufferParameters = function() {
    var max = Math.floor(this._options.max/this._healthyPools.length)
    var buffer = Math.floor(this._options.buffer/this._healthyPools.length)
    for(var i=0; i<this._healthyPools.length; i++) {
        this._healthyPools[i].options.max = max
        this._healthyPools[i].options.buffer = buffer;
    }
}



PoolMaster.prototype.drain = function() {
    if (this._auto === true) {
        this._auto = false;
        clearInterval(this._interval);
    }
    this._draining = true;
    var promises = [];
    var pools = this.getPools();
    for(var i=0; i<pools.length; i++) {
        promises.push(pools[i].drain());
    }
    return Promise.all(promises);
}

module.exports = PoolMaster;
