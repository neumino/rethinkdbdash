var net = require('net');
var Promise = require('bluebird');
var events = require("events");
var util = require('util');

var helper = require(__dirname+"/helper.js");
var Err = require(__dirname+"/error.js");
var Cursor = require(__dirname+"/cursor.js");
var Stream = require(__dirname+"/stream.js");

var protodef = require(__dirname+"/protodef.js");
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

    this.resolveMap = {};
    this.rejectMap = {};
    this.cursors = {}; // Store a boolean to know if a cursor was created for a given token
    this.query = {};
    this.options = {}; // Options when the user use run

    this.open = false; // true only if the user can write on the socket
    this.timeout = null;

    self.connection = net.connect({
        host: self.host,
        port: self.port
    });

    self.timeoutOpen = setTimeout(function() {
        self.connection.end(); // Send a FIN packet
        reject(new Err.ReqlDriverError("Failed to connect to "+self.host+":"+self.port+" in less than "+self.timeoutConnect+"s"));
    }, self.timeoutConnect*1000);

    self.connection.on("end", function(error) {
        // We emit end or close just once
        self.connection.removeAllListeners();
        self.emit('end');
    });
    self.connection.on("close", function(error) {
        // We emit end or close just once
        clearTimeout(self.timeoutOpen)
        self.connection.removeAllListeners();
        self.emit('closed');
    });
    self.connection.setNoDelay();
    self.connection.on("connect", function() {
        self.connection.removeAllListeners("error");

        var initBuffer = new Buffer(4)
        initBuffer.writeUInt32LE(protodef.VersionDummy.Version.V0_3, 0)

        var authBuffer = new Buffer(self.authKey, 'ascii')
        var lengthBuffer = new Buffer(4);
        lengthBuffer.writeUInt32LE(authBuffer.length, 0)

        var protocolBuffer = new Buffer(4)
        protocolBuffer.writeUInt32LE(protodef.VersionDummy.Protocol.JSON, 0)
        self.connection.write(Buffer.concat([initBuffer, lengthBuffer, authBuffer, protocolBuffer]));
    });
    self.connection.once("error", function(error) {
        reject(new Err.ReqlDriverError("Failed to connect to "+self.host+":"+self.port+"\nFull error:\n"+JSON.stringify(error, null, 2)));
    });
    self.connection.once("end", function() {
        self.open = false;
    });

    self.connection.on("data", function(buffer) {
        self.buffer = Buffer.concat([self.buffer, buffer]);

        if (self.open == false) {
            for(var i=0; i<self.buffer.length; i++) {
                if (buffer[i] === 0) {
                    clearTimeout(self.timeoutOpen)
                    var connectionStatus = buffer.slice(0, i).toString();
                    if (connectionStatus === "SUCCESS") {
                        self.open = true;
                        resolve(self);
                    }
                    else {
                        reject(new Err.ReqlDriverError("Server dropped connection with message: \""+connectionStatus+"\""));
                    }
                    self.buffer = buffer.slice(i+1);
                    break;
                }
            }
            self.connection.removeAllListeners("error");
            self.connection.on("error", function(e) {
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

    self.connection.on("timeout", function(buffer) {
        self.connection.open = false;
        self.emit("timeout");
    })
    self.connection.toJSON = function() { // We want people to be able to jsonify a cursor
        return '"A socket object cannot be converted to JSON due to circular references."'
    }
}

util.inherits(Connection, events.EventEmitter);

Connection.prototype._processResponse = function(response, token) {
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
        if (typeof self.rejectMap[token] === "function") {
            self.rejectMap[token](new Err.ReqlCompileError(helper.makeAtom(response), self.query[token], response));
        }

        delete self.resolveMap[token];
        delete self.rejectMap[token];
        delete self.query[token];
        delete self.options[token];
        delete self.cursors[token];

    }
    else if (type === responseTypes.CLIENT_ERROR) {
        self.emit('release');
        if (typeof self.rejectMap[token] === "function") {
            self.rejectMap[token](new Err.ReqlClientError(helper.makeAtom(response), self.query[token], response));
        }
        else if (token === -1) { // This should not happen now since 1.13 took the token out of the query
            var error = new Err.ReqlClientError(helper.makeAtom(response)+"\nClosing all outstanding queries...");
            self.emit('error', error);
            // We don't want a function to yield forever, so we just reject everything
            helper.loopKeys(self.rejectMap, function(rejectMap, key) {
                rejectMap[key](error);
            });
            self.close();
        }

        delete self.resolveMap[token];
        delete self.rejectMap[token];
        delete self.query[token];
        delete self.options[token];
        delete self.cursors[token];
    }
    else if (type === responseTypes.RUNTIME_ERROR) {
        self.emit('release');
        if (typeof self.rejectMap[token] === "function") {
            self.rejectMap[token](new Err.ReqlRuntimeError(helper.makeAtom(response), self.query[token], response));
        }

        delete self.resolveMap[token];
        delete self.rejectMap[token];
        delete self.query[token];
        delete self.options[token];
        delete self.cursors[token];
    }
    else if (type === responseTypes.SUCCESS_ATOM) {
        self.emit('release');
        if (typeof self.resolveMap[token] === "function") {
            datum = helper.makeAtom(response, self.options[token]);

            if ((Array.isArray(datum)) &&
                  ((self.options[token].cursor === true || self.r._options.cursor === true))) {
                cursor = new Cursor(self, token, self.options[token], 'cursor');
                if (self.options[token].profile === true) {
                    self.resolveMap[token]({
                        profile: response.p,
                        result: cursor
                    });
                }
                else {
                    self.resolveMap[token](cursor);
                }

                cursor._push({done: true, response: { r: datum }});
            }
            else if ((Array.isArray(datum)) &&
                  ((self.options[token].stream === true || self.r._options.stream === true))) {
                cursor = new Cursor(self, token, self.options[token], 'cursor');
                stream = new Stream({}, cursor);
                if (self.options[token].profile === true) {
                    self.resolveMap[token]({
                        profile: response.p,
                        result: stream 
                    });
                }
                else {
                    self.resolveMap[token](stream);
                }

                cursor._push({done: true, response: { r: datum }});

            }
            else {
                if (self.options[token].profile === true) {
                    result = {
                        profile: response.p,
                        result: cursor || datum
                    }
                }
                else {
                    result = datum;
                }
                self.resolveMap[token](result);
            }
        }

        delete self.resolveMap[token];
        delete self.rejectMap[token];
        delete self.query[token];
        delete self.options[token];
    }
    else if ((type === responseTypes.SUCCESS_FEED) || (type === responseTypes.SUCCESS_ATOM_FEED)) {
        if (typeof self.resolveMap[token] === "function") {
            // We save the current resolve function because we are going to call cursor._fetch before resuming the user's yield
            currentResolve = self.resolveMap[token];

            delete self.resolveMap[token];
            delete self.rejectMap[token];

            //Handle stream: true
            if (!self.cursors[token]) { //No cursor, let's create one
                self.cursors[token] = true;
                if (type === responseTypes.SUCCESS_ATOM_FEED) {
                    cursor = new Cursor(self, token, self.options[token], 'atomFeed');
                }
                else {
                    cursor = new Cursor(self, token, self.options[token], 'feed');
                }

                cursor._push({done: false, response: response});

                if ((self.options[token].stream === true || self.r._options.stream === true)) {
                    stream = new Stream({}, cursor);
                    if (self.options[token].profile === true) {
                        result = {
                            profile: response.p,
                            result: stream 
                        }
                        //Next batches will still have a profile (even though it's the same). So it's safe to keep the options
                        //self.options[token].profile = false;

                    }
                    else {
                        result = stream 
                  }
                }
                else {
                    // The default behavior is to create a cursor for feeds
                  if (self.options[token].profile === true) {
                      result = {
                          profile: response.p,
                          result: cursor
                      }
                      //Next batches will still have a profile (even though it's the same). So it's safe to keep the options
                      //self.options[token].profile = false;

                  }
                  else {
                      result = cursor
                  }
                }
                currentResolve(result);
            }
            else { // That was a continue query
                currentResolve({done: false, response: response});
            }
        }
    }
    else if (type === responseTypes.SUCCESS_PARTIAL) {
        // We save the current resolve function because we are going to call cursor._fetch before resuming the user's yield
        currentResolve = self.resolveMap[token];
        currentReject = self.rejectMap[token];

        // We need to delete before calling cursor._push
        delete self.resolveMap[token];
        delete self.rejectMap[token];

        if (!self.cursors[token]) { //No cursor, let's create one
            self.cursors[token] = true;
            cursor = new Cursor(self, token, self.options[token], 'cursor');

            if ((self.options[token].cursor === true || self.r._options.cursor === true)) {
                // Return a cursor
                if (self.options[token].profile === true) {
                    currentResolve({
                        profile: response.p,
                        result: cursor
                    });
                }
                else {
                    currentResolve(cursor);
                }
            }
            else if ((self.options[token].stream === true || self.r._options.stream === true)) {
                stream = new Stream({}, cursor);
                if (self.options[token].profile === true) {
                    currentResolve({
                        profile: response.p,
                        result: stream 
                    });
                }
                else {
                    currentResolve(stream);
                }
            }
            else {
                // When we get SUCCESS_SEQUENCE, we will delete self.options[token]
                // So we keep a reference of it here
                options = self.options[token];

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

        currentResolve = self.resolveMap[token];
        currentReject = self.rejectMap[token];

        if (!self.cursors[token]) { //No cursor, let's create one
            cursor = new Cursor(self, token, self.options[token], 'cursor');

            if ((self.options[token].cursor === true || self.r._options.cursor === true)) {
                if (self.options[token].profile === true) {
                    currentResolve({
                        profile: response.p,
                        result: cursor
                    });
                }
                else {
                    currentResolve(cursor);
                }

                // We need to keep the options in the else statement, so we clean it inside the if/else blocks
                delete self.options[token];
            }
            else if ((self.options[token].stream === true || self.r._options.stream === true)) {
                stream = new Stream(cursor);
                if (self.options[token].profile === true) {
                    currentResolve({
                        profile: response.p,
                        result: stream
                    });
                }
                else {
                    currentResolve(stream);
                }

                // We need to keep the options in the else statement, so we clean it inside the if/else blocks
                delete self.options[token];
            }
            else {
                cursor.toArray().then(function(result) {
                    if (self.options[token].profile === true) {
                        currentResolve({
                            profile: response.p,
                            result: result
                        });
                    }
                    else {
                        currentResolve(result);
                    }
                    delete self.options[token];
                }).error(currentReject)
            }
            cursor._push({done: true, response: response});
        }
        else { // That was a continue query
            currentResolve({done: true, response: response});
            delete self.options[token];
        }

        delete self.resolveMap[token];
        delete self.rejectMap[token];
        delete self.query[token];
        delete self.cursors[token];

    }
    else if (type === responseTypes.WAIT_COMPLETE) {
        self.emit('release');
        self.resolveMap[token]();

        delete self.resolveMap[token];
        delete self.rejectMap[token];
        delete self.query[token];
        delete self.options[token];
        delete self.cursors[token];
    }
}

Connection.prototype.reconnect = function(options, callback) {
    var self = this;

    if (typeof options === "function") {
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

Connection.prototype._send = function(query, token, resolve, reject, originalQuery, options) {
    //console.log(JSON.stringify(query, null, 2));

    var self = this;

    var tokenBuffer = new Buffer(8);
    tokenBuffer.writeUInt32LE(token & 0xFFFFFFFF, 0)
    tokenBuffer.writeUInt32LE(Math.floor(token / 0xFFFFFFFF), 4)

    var data = new Buffer(JSON.stringify(query));
    var lengthBuffer = new Buffer(4);
    lengthBuffer.writeUInt32LE(data.length, 0);

    // noreply instead of noReply because the otpions are translated for the server
    if ((!helper.isPlainObject(options)) || (options.noreply != true)) {
        if ((self.resolveMap[token]) && (typeof resolve === 'function')) throw new Err.ReqlDriverError("Driver is buggy, trying to overwrite a promise, this is a bug.")
        if (typeof resolve === 'function') self.resolveMap[token] = resolve;
        if (typeof reject === 'function') self.rejectMap[token] = reject;
        if (originalQuery) self.query[token] = originalQuery; // It's not just query.query because we have get CONTINUE queries
        if (options) self.options[token] = options;
    }
    else {
        if (typeof resolve === 'function') resolve();
        this.emit('release');
    }

    // This will emit an error if the connection is closed
    self.connection.write(Buffer.concat([tokenBuffer, lengthBuffer, data]));
};

Connection.prototype._continue = function(token, resolve, reject) {
    var query = [protodef.Query.QueryType.CONTINUE];
    this._send(query, token, resolve, reject);
}
Connection.prototype._end = function(token, resolve, reject) {
    var query = [protodef.Query.QueryType.STOP];
    this._send(query, token, resolve, reject);
}


Connection.prototype.use = function(db) {
    if (typeof db !== "string") throw new Err.ReqlDriverError("First argument of `use` must be a string")
    this.db = db;
}

Connection.prototype.close = function(options, callback) {
    if (typeof options === "function") {
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
    throw new Err.ReqlDriverError("Did you mean to use `noreplyWait` instead of `noReplyWait`?")
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


module.exports = Connection
