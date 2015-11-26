var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var net = require('net');
var tls = require('tls');
var Promise = require('bluebird');
var events = require('events');
var helper = require('./helper');
var Err = require('./error');
var cursor_1 = require('./cursor');
var stream_1 = require('./stream');
var metadata_1 = require('./metadata');
var protodef = require('./protodef');
var responseTypes = protodef.Response.ResponseType;
var Connection = (function (_super) {
    __extends(Connection, _super);
    function Connection(r, options, resolve, reject) {
        var _this = this;
        _super.call(this);
        var self = this;
        this.r = r;
        // Set default options - We have to save them in case the user tries to reconnect
        if (!helper.isPlainObject(options))
            options = {};
        this.host = options.host || r._host;
        this.port = options.port || r._port;
        this.authKey = options.authKey || r._authKey;
        this.timeoutConnect = options.timeout || r._timeoutConnect; // period in *seconds* for the connection to be opened
        if (options.db)
            this.db = options.db; // Pass to each query
        this.token = 1;
        this.buffer = new Buffer(0);
        this.metadata = {};
        this.open = false; // true only if the user can write on the socket
        this.timeout = null;
        var family = 'IPv4';
        if (net.isIPv6(this.host)) {
            family = 'IPv6';
        }
        var tlsOptions = options.ssl || false;
        if (tlsOptions === false) {
            var connectionArgsNet = {
                host: this.host,
                port: this.port,
                family: family == 'IPv4' ? 4 : 6
            };
            this.connection = net.connect(connectionArgsNet);
        }
        else {
            var connectionArgs = {
                host: this.host,
                port: this.port,
                family: family
            };
            if (helper.isPlainObject(tlsOptions)) {
                // Copy the TLS options in connectionArgs
                helper.loopKeys(tlsOptions, function (tlsOptions, key) {
                    connectionArgs[key] = tlsOptions[key];
                });
            }
            this.connection = tls.connect(connectionArgs);
        }
        this.connection.setKeepAlive(true);
        this.timeoutOpen = setTimeout(function () {
            _this.connection.end(); // Send a FIN packet
            reject(new Err.ReqlDriverError('Failed to connect to ' + _this.host + ':' + _this.port + ' in less than ' + _this.timeoutConnect + 's').setOperational());
        }, this.timeoutConnect * 1000);
        this.connection.on('end', function (error) {
            // We emit end or close just once
            _this.connection.removeAllListeners();
            _this.emit('end');
            // We got a FIN packet, so we'll just flush
            _this._flush();
        });
        this.connection.on('close', function (error) {
            // We emit end or close just once
            clearTimeout(_this.timeoutOpen);
            _this.connection.removeAllListeners();
            _this.emit('closed');
            // The connection is fully closed, flush (in case 'end' was not triggered)
            _this._flush();
        });
        this.connection.setNoDelay();
        this.connection.once('error', function (error) {
            reject(new Err.ReqlDriverError('Failed to connect to ' + _this.host + ':' + _this.port + '\nFull error:\n' + JSON.stringify(error)).setOperational());
        });
        this.connection.on('connect', function () {
            _this.connection.removeAllListeners('error');
            _this.connection.on('error', function (error) {
                _this.emit('error', error);
            });
            var initBuffer = new Buffer(4);
            initBuffer.writeUInt32LE(protodef.VersionDummy.Version.V0_4, 0);
            var authBuffer = new Buffer(_this.authKey, 'ascii');
            var lengthBuffer = new Buffer(4);
            lengthBuffer.writeUInt32LE(authBuffer.length, 0);
            var protocolBuffer = new Buffer(4);
            protocolBuffer.writeUInt32LE(protodef.VersionDummy.Protocol.JSON, 0);
            helper.tryCatch(function () {
                _this.connection.write(Buffer.concat([initBuffer, lengthBuffer, authBuffer, protocolBuffer]));
            }, function (err) {
                // The TCP connection is open, but the ReQL connection wasn't established.
                // We can just abort the whole thing
                _this.open = false;
                reject(new Err.ReqlDriverError('Failed to perform handshake with ' + _this.host + ':' + _this.port));
            });
        });
        this.connection.once('end', function () {
            _this.open = false;
        });
        this.connection.on('data', function (buffer) {
            _this.buffer = Buffer.concat([_this.buffer, buffer]);
            if (_this.open == false) {
                for (var i = 0; i < _this.buffer.length; i++) {
                    if (buffer[i] === 0) {
                        clearTimeout(_this.timeoutOpen);
                        var connectionStatus = buffer.slice(0, i).toString();
                        if (connectionStatus === 'SUCCESS') {
                            _this.open = true;
                            resolve(_this);
                        }
                        else {
                            reject(new Err.ReqlDriverError('Server dropped connection with message: \'' + connectionStatus + '\''));
                        }
                        _this.buffer = buffer.slice(i + 1);
                        break;
                    }
                }
                _this.connection.removeAllListeners('error');
                _this.connection.on('error', function (e) {
                    _this.open = false;
                });
            }
            else {
                while (_this.buffer.length >= 12) {
                    var token = _this.buffer.readUInt32LE(0) + 0x100000000 * _this.buffer.readUInt32LE(4);
                    var responseLength = _this.buffer.readUInt32LE(8);
                    if (_this.buffer.length < 12 + responseLength)
                        break;
                    var responseBuffer = _this.buffer.slice(12, 12 + responseLength);
                    var response = JSON.parse(responseBuffer);
                    _this._processResponse(response, token);
                    _this.buffer = _this.buffer.slice(12 + responseLength);
                }
            }
        });
        this.connection.on('timeout', function (buffer) {
            _this.connection.open = false;
            _this.emit('timeout');
        });
        this.connection.toJSON = function () { return '"A socket object cannot be converted to JSON due to circular references."'; };
    }
    Connection.prototype._flush = function () {
        helper.loopKeys(this.metadata, function (metadata, key) {
            if (typeof metadata[key].reject === 'function') {
                metadata[key].reject(new Err.ReqlServerError('The connection was closed before the query could be completed.', metadata[key].query));
            }
            if (typeof metadata[key].endReject === 'function') {
                metadata[key].endReject(new Err.ReqlServerError('The connection was closed before the query could be completed.', metadata[key].query));
            }
        });
        this.metadata = {};
    };
    Connection.prototype._isOpen = function () {
        return this.open;
    };
    Connection.prototype._isConnection = function () {
        return true;
    };
    Connection.prototype.noreplyWait = function (callback) {
        var _this = this;
        var self = this;
        var token = this._getToken();
        var p = new Promise(function (resolve, reject) {
            var query = [protodef.Query.QueryType.NOREPLY_WAIT];
            _this._send(query, token, resolve, reject);
        }).nodeify(callback);
        return p;
    };
    Connection.prototype.noReplyWait = function () {
        throw new Err.ReqlDriverError('Did you mean to use `noreplyWait` instead of `noReplyWait`?');
    };
    Connection.prototype.close = function (options, callback) {
        var _this = this;
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        var p = new Promise(function (resolve, reject) {
            if (!helper.isPlainObject(options))
                options = {};
            if (options.noreplyWait === true) {
                _this.noreplyWait().then(function (r) {
                    _this.open = false;
                    _this.connection.end();
                    resolve(r);
                }).error(function (e) {
                    reject(e);
                });
            }
            else {
                _this.open = false;
                _this.connection.end();
                resolve();
            }
        }).nodeify(callback);
        return p;
    };
    Connection.prototype._getToken = function () {
        return this.token++;
    };
    Connection.prototype.server = function (callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var query = [protodef.Query.QueryType.SERVER_INFO];
            _this._send(query, _this._getToken(), resolve, reject, undefined, undefined, true);
        }).nodeify(callback);
    };
    Connection.prototype.use = function (db) {
        if (typeof db !== 'string')
            throw new Err.ReqlDriverError('First argument of `use` must be a string');
        this.db = db;
    };
    Connection.prototype._end = function (token, resolve, reject) {
        var query = [protodef.Query.QueryType.STOP];
        this._send(query, token, resolve, reject, undefined, undefined, true);
    };
    Connection.prototype._continue = function (token, resolve, reject) {
        var query = [protodef.Query.QueryType.CONTINUE];
        this._send(query, token, resolve, reject);
    };
    Connection.prototype._send = function (query, token, resolve, reject, originalQuery, options, end) {
        //console.log('Connection.prototype._send: '+token);
        //console.log(JSON.stringify(query, null, 2));
        var _this = this;
        var self = this;
        var queryStr = JSON.stringify(query);
        var querySize = Buffer.byteLength(queryStr);
        var buffer = new Buffer(8 + 4 + querySize);
        buffer.writeUInt32LE(token & 0xFFFFFFFF, 0);
        buffer.writeUInt32LE(Math.floor(token / 0xFFFFFFFF), 4);
        buffer.writeUInt32LE(querySize, 8);
        buffer.write(queryStr, 12);
        // noreply instead of noReply because the otpions are translated for the server
        if ((!helper.isPlainObject(options)) || (options.noreply != true)) {
            if (!this.metadata[token]) {
                this.metadata[token] = new metadata_1.Metadata(resolve, reject, originalQuery, options);
            }
            else if (end === true) {
                this.metadata[token].setEnd(resolve, reject);
            }
            else {
                this.metadata[token].setCallbacks(resolve, reject);
            }
        }
        else {
            if (typeof resolve === 'function')
                resolve();
            this.emit('release');
        }
        // This will emit an error if the connection is closed
        helper.tryCatch(function () {
            _this.connection.write(buffer);
        }, function (err) {
            _this.metadata[token].reject(err);
            delete _this.metadata[token];
        });
    };
    Connection.prototype.reconnect = function (options, callback) {
        var _this = this;
        var self = this;
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        if (!helper.isPlainObject(options))
            options = {};
        if (options.noreplyWait === true) {
            var p = new Promise(function (resolve, reject) {
                _this.close(options).then(function () {
                    _this.r.connect({
                        host: _this.host,
                        port: _this.port,
                        authKey: _this.authKey,
                        db: _this.db
                    }).then(function (c) {
                        resolve(c);
                    }).error(function (e) {
                        reject(e);
                    });
                }).error(function (e) {
                    reject(e);
                });
            }).nodeify(callback);
        }
        else {
            return this.r.connect({
                host: this.host,
                port: this.port,
                authKey: this.authKey,
                db: this.db
            }, callback);
        }
        return p;
    };
    Connection.prototype._processResponse = function (response, token) {
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
            delete self.metadata[token];
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
                    delete self.metadata[token];
                }
            }
            else if (typeof self.metadata[token].endResolve === 'function') {
                currentResolve = self.metadata[token].endResolve;
                currentReject = self.metadata[token].endReject;
                self.metadata[token].removeEndCallbacks();
                currentReject(new Err.ReqlClientError(helper.makeAtom(response), self.metadata[token].query, response));
                delete self.metadata[token];
            }
            else if (token === -1) {
                var error = new Err.ReqlClientError(helper.makeAtom(response) + '\nClosing all outstanding queries...');
                self.emit('error', error);
                // We don't want a function to yield forever, so we just reject everything
                helper.loopKeys(self.rejectMap, function (rejectMap, key) {
                    rejectMap[key](error);
                });
                self.close();
                delete self.metadata[token];
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
                    delete self.metadata[token];
                }
            }
            else if (typeof self.metadata[token].endResolve === 'function') {
                currentResolve = self.metadata[token].endResolve;
                currentReject = self.metadata[token].endReject;
                self.metadata[token].removeEndCallbacks();
                currentReject(new Err.ReqlRuntimeError(helper.makeAtom(response), self.metadata[token].query, response));
                delete self.metadata[token];
            }
        }
        else if (type === responseTypes.SUCCESS_ATOM) {
            self.emit('release');
            // self.metadata[token].resolve is always a function
            datum = helper.makeAtom(response, self.metadata[token].options);
            if ((Array.isArray(datum)) &&
                ((self.metadata[token].options.cursor === true) || ((self.metadata[token].options.cursor === undefined) && (self.r._options.cursor === true)))) {
                cursor = new cursor_1.Cursor(self, token, self.metadata[token].options, 'cursor');
                if (self.metadata[token].options.profile === true) {
                    self.metadata[token].resolve({
                        profile: response.p,
                        result: cursor
                    });
                }
                else {
                    self.metadata[token].resolve(cursor);
                }
                cursor._push({ done: true, response: { r: datum } });
            }
            else if ((Array.isArray(datum)) &&
                ((self.metadata[token].options.stream === true || self.r._options.stream === true))) {
                cursor = new cursor_1.Cursor(self, token, self.metadata[token].options, 'cursor');
                stream = new stream_1.ReadableStream({}, cursor);
                if (self.metadata[token].options.profile === true) {
                    self.metadata[token].resolve({
                        profile: response.p,
                        result: stream
                    });
                }
                else {
                    self.metadata[token].resolve(stream);
                }
                cursor._push({ done: true, response: { r: datum } });
            }
            else {
                if (self.metadata[token].options.profile === true) {
                    result = {
                        profile: response.p,
                        result: cursor || datum
                    };
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
            if (!self.metadata[token].cursor) {
                self.metadata[token].cursor = true;
                var typeResult = 'Cursor';
                var includesStates = false;
                ;
                if (Array.isArray(response.n)) {
                    for (var i = 0; i < response.n.length; i++) {
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
                            currentReject(new Err.ReqlDriverError('Unknown ResponseNote ' + response.n[i] + ', the driver is probably out of date.'));
                            return;
                        }
                    }
                }
                cursor = new cursor_1.Cursor(self, token, self.metadata[token].options, typeResult);
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
                    stream = new stream_1.ReadableStream({}, cursor);
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
                    cursor.toArray().then(function (result) {
                        if (options.profile === true) {
                            currentResolve({
                                profile: response.p,
                                result: result
                            });
                        }
                        else {
                            currentResolve(result);
                        }
                    }).error(currentReject);
                }
                cursor._push({ done: false, response: response });
            }
            else {
                currentResolve({ done: false, response: response });
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
            if (!self.metadata[token].cursor) {
                cursor = new cursor_1.Cursor(self, token, self.metadata[token].options, 'Cursor');
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
                    stream = new stream_1.ReadableStream({}, cursor);
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
                    cursor.toArray().then(function (result) {
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
                    }).error(currentReject);
                }
                cursor._push({ done: true, response: response });
            }
            else {
                currentResolve({ done: true, response: response });
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
    };
    return Connection;
})(events.EventEmitter);
exports.Connection = Connection;
// Return the next token and update it. 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb25uZWN0aW9uLnRzIl0sIm5hbWVzIjpbIkNvbm5lY3Rpb24iLCJDb25uZWN0aW9uLmNvbnN0cnVjdG9yIiwiQ29ubmVjdGlvbi5fZmx1c2giLCJDb25uZWN0aW9uLl9pc09wZW4iLCJDb25uZWN0aW9uLl9pc0Nvbm5lY3Rpb24iLCJDb25uZWN0aW9uLm5vcmVwbHlXYWl0IiwiQ29ubmVjdGlvbi5ub1JlcGx5V2FpdCIsIkNvbm5lY3Rpb24uY2xvc2UiLCJDb25uZWN0aW9uLl9nZXRUb2tlbiIsIkNvbm5lY3Rpb24uc2VydmVyIiwiQ29ubmVjdGlvbi51c2UiLCJDb25uZWN0aW9uLl9lbmQiLCJDb25uZWN0aW9uLl9jb250aW51ZSIsIkNvbm5lY3Rpb24uX3NlbmQiLCJDb25uZWN0aW9uLnJlY29ubmVjdCIsIkNvbm5lY3Rpb24uX3Byb2Nlc3NSZXNwb25zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxJQUFZLEdBQUcsV0FBTSxLQUFLLENBQUMsQ0FBQTtBQUMzQixJQUFZLEdBQUcsV0FBTSxLQUFLLENBQUMsQ0FBQTtBQUMzQixJQUFPLE9BQU8sV0FBVyxVQUFVLENBQUMsQ0FBQztBQUNyQyxJQUFZLE1BQU0sV0FBTSxRQUFRLENBQUMsQ0FBQTtBQUdqQyxJQUFZLE1BQU0sV0FBTSxVQUFVLENBQUMsQ0FBQTtBQUNuQyxJQUFZLEdBQUcsV0FBTSxTQUFTLENBQUMsQ0FBQTtBQUMvQix1QkFBcUIsVUFBVSxDQUFDLENBQUE7QUFDaEMsdUJBQTZCLFVBQVUsQ0FBQyxDQUFBO0FBQ3hDLHlCQUF1QixZQUFZLENBQUMsQ0FBQTtBQUVwQyxJQUFPLFFBQVEsV0FBVyxZQUFZLENBQUMsQ0FBQztBQUN4QyxJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQztBQUVuRDtJQUFnQ0EsOEJBQW1CQTtJQWdCakRBLG9CQUFZQSxDQUFDQSxFQUFFQSxPQUFP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QUNBLG1DQUFtQ0EsR0FBR0EsS0FBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsR0FBR0EsS0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckdBLENBQUNBLENBQUNBLENBQUNBO1FBQ0xBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBO1lBQzFCQSxLQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUNwQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFFSEEsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsTUFBTUEsRUFBRUEsVUFBQUEsTUFBTUE7WUFDL0JBLEtBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEtBQUlBLENBQUNBLE1BQU1BLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO1lBRW5EQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdkJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO29CQUM1Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3BCQSxZQUFZQSxDQUFDQSxLQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTt3QkFDL0JBLElBQUlBLGdCQUFnQkEsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7d0JBQ3JEQSxFQUFFQSxDQUFDQSxDQUFDQSxnQkFBZ0JBLEtBQUtBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBOzRCQUNuQ0EsS0FBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ2pCQSxPQUFPQSxDQUFDQSxLQUFJQSxDQUFDQSxDQUFDQTt3QkFDaEJBLENBQUNBO3dCQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTs0QkFDSkEsTUFBTUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsNENBQTRDQSxHQUFHQSxnQkFBZ0JBLEdBQUdBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO3dCQUMxR0EsQ0FBQ0E7d0JBQ0RBLEtBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO3dCQUNsQ0EsS0FBS0EsQ0FBQ0E7b0JBQ1JBLENBQUNBO2dCQUNIQSxDQUFDQTtnQkFDREEsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDNUNBLEtBQUlBLENBQUNBLFVBQVVBLENBQUNBLEVBQUVBLENBQUNBLE9BQU9BLEVBQUVBLFVBQUNBLENBQUNBO29CQUM1QkEsS0FBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ3BCQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNMQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsT0FBT0EsS0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsSUFBSUEsRUFBRUEsRUFBRUEsQ0FBQ0E7b0JBQ2hDQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxXQUFXQSxHQUFHQSxLQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDcEZBLElBQUlBLGNBQWNBLEdBQUdBLEtBQUlBLENBQUNBLE1BQU1BLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUVqREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsRUFBRUEsR0FBR0EsY0FBY0EsQ0FBQ0E7d0JBQUNBLEtBQUtBLENBQUNBO29CQUVwREEsSUFBSUEsY0FBY0EsR0FBR0EsS0FBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsRUFBRUEsRUFBRUEsR0FBR0EsY0FBY0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hFQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQTtvQkFFMUNBLEtBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsUUFBUUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBRXZDQSxLQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxLQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxHQUFHQSxjQUFjQSxDQUFDQSxDQUFDQTtnQkFDdkRBLENBQUNBO1lBQ0hBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBO1FBRUhBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLEVBQUVBLENBQUNBLFNBQVNBLEVBQUVBLFVBQUFBLE1BQU1BO1lBQ2xDQSxLQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUM3QkEsS0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDdkJBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLE1BQU1BLEdBQUdBLGNBQU1BLE9BQUFBLDJFQUEyRUEsRUFBM0VBLENBQTJFQSxDQUFDQTtJQUM3R0EsQ0FBQ0E7SUFFREQsMkJBQU1BLEdBQU5BO1FBQ0VFLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLFVBQUNBLFFBQVFBLEVBQUVBLEdBQUdBO1lBQzNDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxNQUFNQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0NBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLGVBQWVBLENBQzFDQSxnRUFBZ0VBLEVBQ2hFQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxQkEsQ0FBQ0E7WUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsS0FBS0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xEQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxlQUFlQSxDQUM3Q0EsZ0VBQWdFQSxFQUNoRUEsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBO1FBQ0hBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLEVBQUVBLENBQUNBO0lBQ3JCQSxDQUFDQTtJQUVERiw0QkFBT0EsR0FBUEE7UUFDRUcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDbkJBLENBQUNBO0lBRURILGtDQUFhQSxHQUFiQTtRQUNFSSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVESixnQ0FBV0EsR0FBWEEsVUFBWUEsUUFBeUNBO1FBQXJESyxpQkFVQ0E7UUFUQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLENBQUNBO1FBRTdCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxPQUFPQSxDQUFNQSxVQUFDQSxPQUFPQSxFQUFFQSxNQUFNQTtZQUN2Q0EsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0E7WUFFcERBLEtBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEVBQUVBLEtBQUtBLEVBQUVBLE9BQU9BLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1FBQzVDQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDWEEsQ0FBQ0E7SUFFREwsZ0NBQVdBLEdBQVhBO1FBQ0VNLE1BQU1BLElBQUlBLEdBQUdBLENBQUNBLGVBQWVBLENBQUNBLDZEQUE2REEsQ0FBQ0EsQ0FBQ0E7SUFDL0ZBLENBQUNBO0lBRUROLDBCQUFLQSxHQUFMQSxVQUFNQSxPQUFRQSxFQUFFQSxRQUF5Q0E7UUFBekRPLGlCQXVCQ0E7UUF0QkNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLE9BQU9BLEtBQUtBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxRQUFRQSxHQUFHQSxPQUFPQSxDQUFDQTtZQUNuQkEsT0FBT0EsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsT0FBT0EsQ0FBTUEsVUFBQ0EsT0FBT0EsRUFBRUEsTUFBTUE7WUFDdkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO2dCQUFDQSxPQUFPQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNqREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsV0FBV0EsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pDQSxLQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFDQSxDQUFDQTtvQkFDeEJBLEtBQUlBLENBQUNBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBO29CQUNsQkEsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7b0JBQ3RCQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDYkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBQUEsQ0FBQ0E7b0JBQ1JBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNaQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNMQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsS0FBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ2xCQSxLQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDdEJBLE9BQU9BLEVBQUVBLENBQUNBO1lBQ1pBLENBQUNBO1FBQ0hBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNYQSxDQUFDQTtJQUVEUCw4QkFBU0EsR0FBVEE7UUFDRVEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7SUFDdEJBLENBQUNBO0lBRURSLDJCQUFNQSxHQUFOQSxVQUFPQSxRQUFRQTtRQUFmUyxpQkFLQ0E7UUFKQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsT0FBT0EsQ0FBQ0EsVUFBQ0EsT0FBT0EsRUFBRUEsTUFBTUE7WUFDakNBLElBQUlBLEtBQUtBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO1lBQ25EQSxLQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxLQUFJQSxDQUFDQSxTQUFTQSxFQUFFQSxFQUFFQSxPQUFPQSxFQUFFQSxNQUFNQSxFQUFFQSxTQUFTQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNuRkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7SUFDdkJBLENBQUNBO0lBRURULHdCQUFHQSxHQUFIQSxVQUFJQSxFQUFFQTtRQUNKVSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxFQUFFQSxLQUFLQSxRQUFRQSxDQUFDQTtZQUFDQSxNQUFNQSxJQUFJQSxHQUFHQSxDQUFDQSxlQUFlQSxDQUFDQSwwQ0FBMENBLENBQUNBLENBQUNBO1FBQ3RHQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQTtJQUNmQSxDQUFDQTtJQUVEVix5QkFBSUEsR0FBSkEsVUFBS0EsS0FBS0EsRUFBRUEsT0FBT0EsRUFBRUEsTUFBTUE7UUFDekJXLElBQUlBLEtBQUtBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzVDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxLQUFLQSxFQUFFQSxPQUFPQSxFQUFFQSxNQUFNQSxFQUFFQSxTQUFTQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUN4RUEsQ0FBQ0E7SUFFRFgsOEJBQVNBLEdBQVRBLFVBQVVBLEtBQUtBLEVBQUVBLE9BQU9BLEVBQUVBLE1BQU1BO1FBQzlCWSxJQUFJQSxLQUFLQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxTQUFTQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUNoREEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsRUFBRUEsS0FBS0EsRUFBRUEsT0FBT0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7SUFDNUNBLENBQUNBO0lBRURaLDBCQUFLQSxHQUFMQSxVQUFNQSxLQUFLQSxFQUFFQSxLQUFLQSxFQUFFQSxPQUFPQSxFQUFFQSxNQUFNQSxFQUFFQSxhQUFjQSxFQUFFQSxPQUFRQSxFQUFFQSxHQUFJQTtRQUNqRWEsb0RBQW9EQTtRQUNwREEsOENBQThDQTtRQUZoREEsaUJBeUNDQTtRQXJDQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFFaEJBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ3JDQSxJQUFJQSxTQUFTQSxHQUFHQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUU1Q0EsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLEtBQUtBLEdBQUdBLFVBQVVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1FBQzVDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxHQUFHQSxVQUFVQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN4REEsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFFbkNBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLFFBQVFBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO1FBRTNCQSwrRUFBK0VBO1FBQy9FQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxJQUFJQSxtQkFBUUEsQ0FBQ0EsT0FBT0EsRUFBRUEsTUFBTUEsRUFBRUEsYUFBYUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDL0VBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUN0QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFDL0NBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLENBQUNBO2dCQUNKQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxZQUFZQSxDQUFDQSxPQUFPQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUNyREEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsT0FBT0EsS0FBS0EsVUFBVUEsQ0FBQ0E7Z0JBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1lBQzdDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFFREEsc0RBQXNEQTtRQUN0REEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7WUFDZEEsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDaENBLENBQUNBLEVBQUVBLFVBQUFBLEdBQUdBO1lBQ0pBLEtBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ2pDQSxPQUFPQSxLQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUM5QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFFTEEsQ0FBQ0E7SUFFRGIsOEJBQVNBLEdBQVRBLFVBQVVBLE9BQU9BLEVBQUVBLFFBQXlDQTtRQUE1RGMsaUJBc0NDQTtRQXJDQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFFaEJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLE9BQU9BLEtBQUtBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxRQUFRQSxHQUFHQSxPQUFPQSxDQUFDQTtZQUNuQkEsT0FBT0EsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZkEsQ0FBQ0E7UUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsT0FBT0EsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFFakRBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFdBQVdBLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1lBQ2pDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxPQUFPQSxDQUFNQSxVQUFDQSxPQUFPQSxFQUFFQSxNQUFNQTtnQkFDdkNBLEtBQUlBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLElBQUlBLENBQUNBO29CQUN2QkEsS0FBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0E7d0JBQ2JBLElBQUlBLEVBQUVBLEtBQUlBLENBQUNBLElBQUlBO3dCQUNmQSxJQUFJQSxFQUFFQSxLQUFJQSxDQUFDQSxJQUFJQTt3QkFDZkEsT0FBT0EsRUFBRUEsS0FBSUEsQ0FBQ0EsT0FBT0E7d0JBQ3JCQSxFQUFFQSxFQUFFQSxLQUFJQSxDQUFDQSxFQUFFQTtxQkFDWkEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBQUEsQ0FBQ0E7d0JBQ1BBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUNiQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFBQSxDQUFDQTt3QkFDUkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ1pBLENBQUNBLENBQUNBLENBQUNBO2dCQUNMQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFBQSxDQUFDQTtvQkFDUkEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ1pBLENBQUNBLENBQUNBLENBQUNBO1lBQ0xBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQTtnQkFDcEJBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLElBQUlBO2dCQUNmQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxJQUFJQTtnQkFDZkEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsT0FBT0E7Z0JBQ3JCQSxFQUFFQSxFQUFFQSxJQUFJQSxDQUFDQSxFQUFFQTthQUNaQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUNmQSxDQUFDQTtRQUVEQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNYQSxDQUFDQTtJQUVEZCxxQ0FBZ0JBLEdBQWhCQSxVQUFpQkEsUUFBUUEsRUFBRUEsS0FBS0E7UUFDOUJlLCtEQUErREE7UUFDL0RBLGlEQUFpREE7UUFDakRBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO1FBRWhCQSxJQUFJQSxJQUFJQSxHQUFHQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN0QkEsSUFBSUEsTUFBTUEsQ0FBQ0E7UUFDWEEsSUFBSUEsTUFBTUEsQ0FBQ0E7UUFDWEEsSUFBSUEsTUFBTUEsQ0FBQ0E7UUFDWEEsSUFBSUEsY0FBY0EsRUFBRUEsYUFBYUEsQ0FBQ0E7UUFDbENBLElBQUlBLEtBQUtBLENBQUNBO1FBQ1ZBLElBQUlBLE9BQU9BLENBQUNBO1FBRVpBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEtBQUtBLGFBQWFBLENBQUNBLGFBQWFBLENBQUNBLENBQUNBLENBQUNBO1lBQ3pDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUNyQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsS0FBS0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3REQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxnQkFBZ0JBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO1lBQ3pIQSxDQUFDQTtZQUVEQSxPQUFPQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFBQTtRQUM3QkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsYUFBYUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1lBRXJCQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxNQUFNQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdERBLGNBQWNBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO2dCQUM5Q0EsYUFBYUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7Z0JBQzVDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTtnQkFDdkNBLGFBQWFBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBLGVBQWVBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO2dCQUN4R0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsS0FBS0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pEQSx1Q0FBdUNBO29CQUN2Q0EsT0FBT0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQUE7Z0JBQzdCQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxVQUFVQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0RBLGNBQWNBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLFVBQVVBLENBQUNBO2dCQUNqREEsYUFBYUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0E7Z0JBQy9DQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxrQkFBa0JBLEVBQUVBLENBQUNBO2dCQUMxQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hHQSxPQUFPQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFBQTtZQUM3QkEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RCQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxHQUFHQSxDQUFDQSxlQUFlQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFDQSxzQ0FBc0NBLENBQUNBLENBQUNBO2dCQUN0R0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSwwRUFBMEVBO2dCQUMxRUEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsRUFBRUEsVUFBU0EsU0FBU0EsRUFBRUEsR0FBR0E7b0JBQ3JELFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsQ0FBQyxDQUFDQSxDQUFDQTtnQkFDSEEsSUFBSUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7Z0JBQ2JBLE9BQU9BLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUFBO1lBQzdCQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxLQUFLQSxhQUFhQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM5Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDckJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE1BQU1BLEtBQUtBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBQ3hEQSxDQUFDQTtZQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxNQUFNQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdERBLGNBQWNBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO2dCQUM5Q0EsYUFBYUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7Z0JBQzVDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTtnQkFDdkNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEdBQUdBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RHQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDMUJBLGFBQWFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNyQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsS0FBS0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pEQSx1Q0FBdUNBO29CQUN2Q0EsT0FBT0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQUE7Z0JBQzdCQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxVQUFVQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0RBLGNBQWNBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLFVBQVVBLENBQUNBO2dCQUNqREEsYUFBYUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0E7Z0JBQy9DQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxrQkFBa0JBLEVBQUVBLENBQUNBO2dCQUMxQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDekdBLE9BQU9BLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUFBO1lBQzdCQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxLQUFLQSxhQUFhQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDckJBLG9EQUFvREE7WUFDcERBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1lBRWhFQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDdEJBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEtBQUtBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEtBQUtBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNuSkEsTUFBTUEsR0FBR0EsSUFBSUEsZUFBTUEsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pFQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbERBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBO3dCQUMzQkEsT0FBT0EsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0E7d0JBQ25CQSxNQUFNQSxFQUFFQSxNQUFNQTtxQkFDZkEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0xBLENBQUNBO2dCQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDSkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZDQSxDQUFDQTtnQkFFREEsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsUUFBUUEsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsRUFBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckRBLENBQUNBO1lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENB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