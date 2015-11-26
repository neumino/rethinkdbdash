var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events = require('events');
var Promise = require('bluebird');
var dequeue_1 = require('./dequeue');
var pool_1 = require('./pool');
var helper = require('./helper');
var Err = require('./error');
var UNKNOWN_POOLS = 'unknownPools';
var SEPARATOR = 'feedSeparator';
var PoolMaster = (function (_super) {
    __extends(PoolMaster, _super);
    function PoolMaster(r, options) {
        var _this = this;
        _super.call(this);
        var self = this;
        var options = options || {};
        var lineLength = options.buffer || 50;
        this._r = r;
        this._line = new dequeue_1.Dequeue(lineLength);
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
                pool = new pool_1.Pool(this._r, settings);
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
            pool = new pool_1.Pool(this._r, settings);
            this._pools[UNKNOWN_POOLS].push(pool);
            this._healthyPools.push(pool);
            this.emitStatus();
        }
        // Initialize all the pools - bind listeners
        for (var i = 0; i < this._pools[UNKNOWN_POOLS].length; i++) {
            this.initPool(this._pools[UNKNOWN_POOLS][i]);
        }
        if ((this._discovery === true)) {
            this._timeout = setTimeout(function () { _this.fetchServers(); }, 0);
        }
    }
    PoolMaster.prototype.emitStatus = function () {
        // Emit the healthy event with a boolean indicating whether the pool master
        // is healthy or not
        var healthy = this._healthyPools.length !== 0;
        if (this._healthy !== healthy) {
            this._healthy = healthy;
            this.emit('healthy', healthy);
        }
    };
    PoolMaster.prototype.drain = function () {
        var _this = this;
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
        return Promise.all(promises).then(function () {
            for (var i = 0; i < pools.length; i++) {
                pools[i].removeAllListeners();
            }
        }).error(function (error) {
            if (_this._options.silent !== true) {
                _this._log('Failed to drain all the pools:');
                _this._log(error.message);
                _this._log(error.stack);
            }
        });
    };
    PoolMaster.prototype.getAvailableLength = function () {
        return this._numAvailableConnections;
    };
    PoolMaster.prototype.getLength = function () {
        return this._numConnections;
    };
    PoolMaster.prototype.resetBufferParameters = function () {
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
    };
    PoolMaster.prototype.getNumAvailableConnections = function () {
        var sum = 0;
        for (var i = 0; i < this._healthyPools.length; i++) {
            sum += this._healthyPools[i].getAvailableLength();
        }
        return sum;
    };
    PoolMaster.prototype.getNumConnections = function () {
        var sum = 0;
        for (var i = 0; i < this._healthyPools.length; i++) {
            sum += this._healthyPools[i].getLength();
        }
        return sum;
    };
    PoolMaster.prototype.initPool = function (pool) {
        // Bind listeners on the pools
        var self = this;
        pool.on('size-diff', function (diff) {
            self._numConnections += diff;
            self.emit('size', self._numConnections);
        });
        pool.on('available-size-diff', function (diff) {
            self._numAvailableConnections += diff;
            self.emit('available-size', self._numAvailableConnections);
        });
        pool.on('new-connection', function () {
            if (self._line.getLength() > 0) {
                var p = self._line.shift();
                this.getConnection().then(p.resolve).error(p.reject);
                self.emit('queueing', self._line.getLength());
            }
        });
        pool.on('not-empty', function () {
            if (self._draining === false) {
                var found = false;
                for (var i = 0; i < self._healthyPools.length; i++) {
                    if (self._healthyPools[i] === this) {
                        self._healthyPools.length;
                        found = true;
                        break;
                    }
                }
                if (found === false) {
                    self._healthyPools.push(this);
                    self.emitStatus();
                    self.resetBufferParameters();
                }
            }
        });
        pool.on('empty', function () {
            // A pool that become empty is considered unhealthy
            for (var i = 0; i < self._healthyPools.length; i++) {
                if (self._healthyPools[i] === this) {
                    self._healthyPools.splice(i, 1);
                    self.emitStatus();
                    break;
                }
            }
            if (self._healthyPools.length === 0) {
                self._flushErrors();
            }
            self.resetBufferParameters();
        });
        pool.on('draining', function () {
            for (var i = 0; i < self._healthyPools.length; i++) {
                if (self._healthyPools[i] === this) {
                    self._healthyPools.splice(i, 1);
                    self.emitStatus();
                    break;
                }
            }
            if (self._healthyPools === 0) {
                self._flushErrors();
            }
        });
    };
    PoolMaster.prototype.fetchServers = function (useSeeds) {
        var _this = this;
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
            var promise = this._r.connect(settings).then(function (connection) { return query.run(connection, { cursor: true }); });
        }
        promise.then(function (feed) {
            if (_this._draining === true) {
                // There is no need to close the feed here as we'll close the connections
                return;
            }
            _this._feed = feed;
            var initializing = true;
            var servers = [];
            feed.each(function (err, change) {
                if (err) {
                    _this._log('The changefeed on server_status returned an error: ' + err.toString());
                    // We have to refetch everything as the server that was serving the feed may
                    // have died.
                    if (!_this._draining) {
                        setTimeout(function () {
                            _this.fetchServers();
                        }, 0); // Give a timeout to let the driver clean the pools
                    }
                    return;
                }
                if (initializing === true) {
                    if (change === SEPARATOR) {
                        initializing = false;
                        _this.handleAllServersResponse(servers);
                        // Rerun the whole query after to make sure that a change did not skip/sneak between the union. As long
                        // as RethinkDB does not provide initial results
                        setTimeout(function () {
                            _this._r.db('rethinkdb').table('server_status').run({ cursor: false }).then(function (servers) {
                                _this.handleAllServersResponse(servers);
                            }).error(function (error) {
                                _this._log('Fail to retrieve a second copy of server_status');
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
                    _this.createPool(change.new_val);
                }
                else if (change.new_val === null && change.old_val !== null) {
                    // A server was removed
                    var server = change.old_val;
                    if (_this._pools[server.id] != null) {
                        _this.deletePool(server.id);
                    }
                    else {
                        var found = false;
                        for (var i = 0; i < _this._pools[UNKNOWN_POOLS].length; i++) {
                            if (((server.network.canonical_addresses[k].host === _this._pools[UNKNOWN_POOLS][i].options.connection.host) ||
                                (helper.localhostAliases.hasOwnProperty(server.network.canonical_addresses[k].host) && (helper.localhostAliases.hasOwnProperty(_this._pools[UNKNOWN_POOLS][i].options.connection.host)))) &&
                                (server.network.reql_port === _this._pools[UNKNOWN_POOLS][i].options.connection.port)) {
                                found = true;
                                (function (pool) {
                                    _this._log('Removing pool connected to: ' + pool.getAddress());
                                    var pool = _this._pools[UNKNOWN_POOLS].splice(i, 1)[0];
                                    pool.drain().then(function () {
                                        pool.removeAllListeners();
                                    }).error(function (error) {
                                        if (_this._options.silent !== true) {
                                            _this._log('Pool connected to: ' + pool.getAddress() + ' could not be properly drained.');
                                            _this._log(error.message);
                                            _this._log(error.stack);
                                        }
                                    });
                                })(_this._pools[UNKNOWN_POOLS][i]);
                                break;
                            }
                        }
                    }
                    if (found === false) {
                        _this._log('A server was removed but no pool for this server exists...');
                    }
                }
                // We ignore this change since this it doesn't affect whether the server
                // is available or not.
                // else if (change.new_val !== null && change.old_val !== null) {}
            });
        }).error(function (error) {
            _this._log('Could not retrieve the data from server_status: ' + JSON.stringify(error));
            var timeout;
            if (_this._consecutiveFails === -1) {
                timeout = 0;
            }
            else {
                timeout = (1 << Math.min(_this._maxExponent, _this._consecutiveFails)) * _this._timeoutError;
            }
            setTimeout(function () {
                _this.fetchServers(true);
            }, timeout);
        });
    };
    PoolMaster.prototype.deletePool = function (key) {
        var _this = this;
        // Delete a known pool
        var self = this;
        var pool = this._pools[key];
        this._log('Removing pool connected to: ' + pool.getAddress());
        pool.drain().then(function () {
            pool.removeAllListeners();
        }).error(function (error) {
            _this._log('Pool connected to: ' + _this._pools[key].getAddress() + ' could not be properly drained.');
            _this._log(error.message);
            _this._log(error.stack);
        });
        delete this._pools[key];
        this.resetBufferParameters();
    };
    PoolMaster.prototype.createPool = function (server) {
        // Create a new pool
        var self = this;
        var address = helper.getCanonicalAddress(server.network.canonical_addresses);
        var settings = this.createPoolSettings(this._options, {
            port: server.network.reql_port,
            host: address.host
        }, this._log);
        var pool = new pool_1.Pool(this._r, settings);
        this._pools[server.id] = pool;
        this.initPool(pool);
        this._healthyPools.push(pool);
        this.emitStatus();
        this.resetBufferParameters();
    };
    PoolMaster.prototype.createPoolSettings = function (globalOptions, serverOptions, log) {
        // Create the settings for a given pool. Merge the global options + the servers's one.
        var settings = {};
        var numServers = Array.isArray(globalOptions.servers) ? globalOptions.servers.length : 1;
        helper.loopKeys(globalOptions, function (options, key) {
            if ((key === 'buffer') || (key === 'max')) {
                settings[key] = Math.ceil(options[key] / numServers);
                settings[key] = Math.ceil(options[key] / numServers);
            }
            else if (key !== 'servers') {
                settings[key] = options[key];
            }
        });
        if (serverOptions) {
            helper.loopKeys(serverOptions, function (options, key) {
                settings[key] = options[key];
            });
        }
        settings._log = log;
        return settings;
    };
    PoolMaster.prototype.handleAllServersResponse = function (servers) {
        var _this = this;
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
                    if (found)
                        break;
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
        helper.loopKeys(this._pools, function (pools, key) {
            if (key !== UNKNOWN_POOLS) {
                if (knownServer.hasOwnProperty(key) === false) {
                    _this.deletePool(key); // We just found a pool that doesn't map to any known RethinkDB server
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
            pool.drain().then(function () {
                pool.removeAllListeners();
            }).error(function (error) {
                _this._log('Pool connected to: ' + _this._pools[UNKNOWN_POOLS][i].getAddress() + ' could not be properly drained.');
                _this._log(error.message);
                _this._log(error.stack);
            });
        }
    };
    PoolMaster.prototype._expandAll = function () {
        for (var i = 0; i < this._healthyPools.length; i++) {
            this._healthyPools[i]._expandBuffer();
        }
    };
    PoolMaster.prototype.getConnection = function () {
        var _this = this;
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
            return new Promise(function (resolve, reject) {
                reject(new Err.ReqlDriverError('None of the pools have an opened connection and failed to open a new one').setOperational());
            });
        }
        else {
            // All pool are busy, buffer the request
            return new Promise(function (resolve, reject) {
                _this._line.push({
                    resolve: resolve,
                    reject: reject
                });
                _this.emit('queueing', _this._line.getLength());
                // We could add a condition to be less greedy (for early start)
                _this._expandAll();
            });
        }
    };
    PoolMaster.prototype._flushErrors = function () {
        // Reject all promises in this._line
        while (this._line.getLength() > 0) {
            this._line.shift().reject(new Err.ReqlDriverError('None of the pools have an opened connection and failed to open a new one').setOperational());
            this.emit('queueing', this._line.getLength());
        }
    };
    PoolMaster.prototype.getPools = function () {
        var result = [];
        helper.loopKeys(this._pools, function (pools, key) {
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
    };
    return PoolMaster;
})(events.EventEmitter);
exports.PoolMaster = PoolMaster;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbF9tYXN0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcG9vbF9tYXN0ZXIudHMiXSwibmFtZXMiOlsiUG9vbE1hc3RlciIsIlBvb2xNYXN0ZXIuY29uc3RydWN0b3IiLCJQb29sTWFzdGVyLmVtaXRTdGF0dXMiLCJQb29sTWFzdGVyLmRyYWluIiwiUG9vbE1hc3Rlci5nZXRBdmFpbGFibGVMZW5ndGgiLCJQb29sTWFzdGVyLmdldExlbmd0aCIsIlBvb2xNYXN0ZXIucmVzZXRCdWZmZXJQYXJhbWV0ZXJzIiwiUG9vbE1hc3Rlci5nZXROdW1BdmFpbGFibGVDb25uZWN0aW9ucyIsIlBvb2xNYXN0ZXIuZ2V0TnVtQ29ubmVjdGlvbnMiLCJQb29sTWFzdGVyLmluaXRQb29sIiwiUG9vbE1hc3Rlci5mZXRjaFNlcnZlcnMiLCJQb29sTWFzdGVyLmRlbGV0ZVBvb2wiLCJQb29sTWFzdGVyLmNyZWF0ZVBvb2wiLCJQb29sTWFzdGVyLmNyZWF0ZVBvb2xTZXR0aW5ncyIsIlBvb2xNYXN0ZXIuaGFuZGxlQWxsU2VydmVyc1Jlc3BvbnNlIiwiUG9vbE1hc3Rlci5fZXhwYW5kQWxsIiwiUG9vbE1hc3Rlci5nZXRDb25uZWN0aW9uIiwiUG9vbE1hc3Rlci5fZmx1c2hFcnJvcnMiLCJQb29sTWFzdGVyLmdldFBvb2xzIl0sIm1hcHBpbmdzIjoiOzs7OztBQUNBLElBQVksTUFBTSxXQUFNLFFBQVEsQ0FBQyxDQUFBO0FBQ2pDLElBQU8sT0FBTyxXQUFXLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLHdCQUFzQixXQUFXLENBQUMsQ0FBQTtBQUNsQyxxQkFBbUIsUUFBUSxDQUFDLENBQUE7QUFDNUIsSUFBWSxNQUFNLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbkMsSUFBWSxHQUFHLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFFL0IsSUFBSSxhQUFhLEdBQUcsY0FBYyxDQUFDO0FBQ25DLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQztBQUVoQztJQUFnQ0EsOEJB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SUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsTUFBTUEsRUFBRUEsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBQ0EsT0FBT0E7Z0NBQ2pGQSxLQUFJQSxDQUFDQSx3QkFBd0JBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBOzRCQUN6Q0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBQ0EsS0FBS0E7Z0NBQ2JBLEtBQUlBLENBQUNBLElBQUlBLENBQUNBLGlEQUFpREEsQ0FBQ0EsQ0FBQ0E7Z0NBQzdEQSxZQUFZQTs0QkFDZEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ0xBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO29CQUNYQSxDQUFDQTtvQkFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ0pBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO29CQUN2QkEsQ0FBQ0E7b0JBQ0RBLE1BQU1BLENBQUNBO2dCQUNUQSxDQUFDQTtnQkFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsS0FBS0EsSUFBSUEsSUFBSUEsTUFBTUEsQ0FBQ0EsT0FBT0EsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZEQSxhQUFhQTtvQkFDYkEsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xDQSxDQUFDQTtnQkFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsS0FBS0EsSUFBSUEsSUFBSUEsTUFBTUEsQ0FBQ0EsT0FBT0EsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzVEQSx1QkFBdUJBO29CQUN2QkEsSUFBSUEsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0EsT0FBT0Es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Q0FBQ0E7UUFDekZBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLGFBQWFBLEVBQUVBLFVBQUNBLE9BQU9BLEVBQUVBLEdBQUdBO1lBQzFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDMUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBLENBQUNBO2dCQUNyREEsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDdkRBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO2dCQUMzQkEsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDL0JBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLEVBQUVBLENBQUNBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xCQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxhQUFhQSxFQUFFQSxVQUFDQSxPQUFPQSxFQUFFQSxHQUFHQTtnQkFDMUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQy9CQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNMQSxDQUFDQTtRQUNEQSxRQUFRQSxDQUFDQSxJQUFJQSxHQUFHQSxHQUFHQSxDQUFDQTtRQUNwQkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7SUFDbEJBLENBQUNBO0lBRURiLDZDQUF3QkEsR0FBeEJBLFVBQXlCQSxPQUFPQTtRQUFoQ2MsaUJBb0VDQTtRQW5FQ0EsNkJBQTZCQTtRQUM3QkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLDJDQUEyQ0E7UUFDM0NBLElBQUlBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ3JCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN4Q0EsSUFBSUEsTUFBTUEsR0FBR0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDeEJBLFdBQVdBLENBQUNBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEVBQUVBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ3REQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDekNBLDZGQUE2RkE7Z0JBQzdGQSw4QkFBOEJBO2dCQUM5QkEsSUFBSUEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtvQkFDM0RBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBO3dCQUFDQSxLQUFLQSxDQUFDQTtvQkFDakJBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUN6Q0Esa0hBQWtIQTtvQkFDbEhBLG1CQUFtQkE7b0JBQ25CQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxtQkFBbUJBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO3dCQUNuRUEsbUVBQW1FQTt3QkFDbkVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLG1CQUFtQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7NEJBQ2hGQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQTs0QkFDMURBLENBQUNBLE1BQU1BLENBQUNBLGdCQUFnQkEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtnQ0FDakZBLE1BQU1BLENBQUNBLGdCQUFnQkEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3hFQSxDQUFDQSxNQUFNQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQSxLQUFLQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFFOURBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBOzRCQUNwRUEsMkVBQTJFQTs0QkFDM0VBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGdCQUFnQkEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDdkZBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLEdBQUdBLE1BQU1BLENBQUNBLG1CQUFtQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQTtnQ0FDckhBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLG1CQUFtQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0NBQ2hGQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQTtnQ0FDMUNBLENBQUNBOzRCQUNIQSxDQUFDQTs0QkFDREEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ2JBLEtBQUtBLENBQUNBO3dCQUNSQSxDQUFDQTtvQkFDSEEsQ0FBQ0E7Z0JBQ0hBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDcEJBLG9GQUFvRkE7b0JBQ3BGQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtnQkFDMUJBLENBQUNBO1lBQ0hBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLDhCQUE4QkE7UUFFaENBLG1DQUFtQ0E7UUFDbkNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLFVBQUNBLEtBQUtBLEVBQUVBLEdBQUdBO1lBQ3RDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDMUJBLEVBQUVBLENBQUNBLENBQUNBLFdBQVdBLENBQUNBLGNBQWNBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO29CQUM5Q0EsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0Esc0VBQXNFQTtnQkFDOUZBLENBQUNBO2dCQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDSkEsV0FBV0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7Z0JBQzNCQSxDQUFDQTtZQUNIQSxDQUFDQTtRQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNIQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUMzREEsK0RBQStEQTtZQUMvREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdERBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLDhCQUE4QkEsR0FBR0EsSUFBSUEsQ0FBQ0EsVUFBVUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDOURBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLElBQUlBLENBQUNBO2dCQUNoQkEsSUFBSUEsQ0FBQ0Esa0JBQWtCQSxFQUFFQSxDQUFDQTtZQUM1QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBQ0EsS0FBS0E7Z0JBQ2JBLEtBQUlBLENBQUNBLElBQUlBLENBQUNBLHFCQUFxQkEsR0FBR0EsS0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsVUFBVUEsRUFBRUEsR0FBR0EsaUNBQWlDQSxDQUFDQSxDQUFDQTtnQkFDbEhBLEtBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUN6QkEsS0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDekJBLENBQUNBLENBQUNBLENBQUNBO1FBQ0xBLENBQUNBO0lBQ0hBLENBQUNBO0lBRURkLCtCQUFVQSxHQUFWQTtRQUNFZSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUNuREEsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7UUFDeENBLENBQUNBO0lBQ0hBLENBQUNBO0lBRURmLGtDQUFhQSxHQUFiQTtRQUFBZ0IsaUJBc0NDQTtRQXJDQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLHlDQUF5Q0E7UUFDekNBLElBQUlBLE1BQU1BLENBQUNBO1FBQ1hBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ25EQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxJQUFJQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDN0NBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBO1lBQ2xCQSxDQUFDQTtZQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxhQUFhQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxrQkFBa0JBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3REEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7WUFDM0RBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ2RBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEtBQUtBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dCQUM5Q0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDbEJBLENBQUNBO1lBQ0RBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO2dCQUNYQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUNoQkEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLE1BQU1BLENBQUNBLElBQUlBLE9BQU9BLENBQUNBLFVBQUNBLE9BQU9BLEVBQUVBLE1BQU1BO2dCQUNqQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsMEVBQTBFQSxDQUFDQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUMvSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDTEEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsd0NBQXdDQTtZQUN4Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsT0FBT0EsQ0FBQ0EsVUFBQ0EsT0FBT0EsRUFBRUEsTUFBTUE7Z0JBQ2pDQSxLQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQTtvQkFDZEEsT0FBT0EsRUFBRUEsT0FBT0E7b0JBQ2hCQSxNQUFNQSxFQUFFQSxNQUFNQTtpQkFDZkEsQ0FBQ0EsQ0FBQ0E7Z0JBRUhBLEtBQUlBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLEVBQUVBLEtBQUlBLENBQUNBLEtBQUtBLENBQUNBLFNBQVNBLEVBQUVBLENBQUNBLENBQUNBO2dCQUM5Q0EsK0RBQStEQTtnQkFDL0RBLEtBQUlBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBO1lBQ3BCQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUVMQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVEaEIsaUNBQVlBLEdBQVpBO1FBQ0VpQixvQ0FBb0NBO1FBQ3BDQSxPQUFPQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxTQUFTQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQTtZQUNsQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsMEVBQTBFQSxDQUFDQSxDQUFDQSxjQUFjQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUNoSkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO0lBQ0hBLENBQUNBO0lBRURqQiw2QkFBUUEsR0FBUkE7UUFDRWtCLElBQUlBLE1BQU1BLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2hCQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxVQUFDQSxLQUFLQSxFQUFFQSxHQUFHQTtZQUN0Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtvQkFDM0NBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3QkEsQ0FBQ0E7WUFDSEEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQzFCQSxDQUFDQTtRQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNIQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtJQUNoQkEsQ0FBQ0E7SUFDSGxCLGlCQUFDQTtBQUFEQSxDQUFDQSxBQXZpQkQsRUFBZ0MsTUFBTSxDQUFDLFlBQVksRUF1aUJsRDtBQXZpQlksa0JBQVUsYUF1aUJ0QixDQUFBIn0=