var net = require('net');
var Promise = require('bluebird');
var events = require("events");
var util = require('util');

var helper = require(__dirname+"/helper.js");
var Error = require(__dirname+"/error.js");
var Cursor = require(__dirname+"/cursor.js");

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

    if (options.db) this.db = options.db; // Pass to each query
    if (options.batch_conf) this.batch_conf = options.batch_conf; // For testing only

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
    self.connection.on("connect", function() {
        self.connection.removeAllListeners("error");

        var initBuffer = new Buffer(4)
        initBuffer.writeUInt32LE(protodef.VersionDummy.Version.V0_3)
        self.connection.write(initBuffer);

        var authBuffer = new Buffer(self.authKey, 'ascii')
        var lengthBuffer = new Buffer(4);
        lengthBuffer.writeUInt32LE(authBuffer.length, 0)
        self.connection.write(lengthBuffer);
        self.connection.write(authBuffer);

        var protocolBuffer = new Buffer(4)
        protocolBuffer.writeUInt32LE(protodef.VersionDummy.Protocol.JSON)
        self.connection.write(protocolBuffer);
    });
    self.connection.once("error", function(error) {
        reject(new Error.ReqlDriverError("Failed to connect to "+self.host+":"+self.port+"\nFull error:\n"+JSON.stringify(error, null, 2)));
    });
    self.connection.once("end", function() {
        self.open = false;
    });

    self.connection.on("data", function(buffer) {
        self.buffer = Buffer.concat([self.buffer, buffer]);

        if (self.open == false) {
            for(var i=0; i<self.buffer.length; i++) {
                if (buffer[i] === 0) {
                    var connectionStatus = buffer.slice(0, i).toString();
                    if (connectionStatus === "SUCCESS") {
                        self.open = true;
                        resolve(self);
                    }
                    else {
                        reject(new Error.ReqlDriverError("Server dropped connection with message: \""+connectionStatus+"\""));
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
    var type = response.t;
    var result;
    var cursor;
    var currentResolve;
    var datum;

    if (type === responseTypes.COMPILE_ERROR) {
        this.emit('release');
        if (typeof this.rejectMap[token] === "function") {
            this.rejectMap[token](new Error.ReqlCompileError(helper.makeAtom(response), this.query[token], response));
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
        delete this.cursors[token];

    }
    else if (type === responseTypes.CLIENT_ERROR) {
        this.emit('release');
        if (typeof this.rejectMap[token] === "function") {
            this.rejectMap[token](new Error.ReqlClientError(helper.makeAtom(response), this.query[token], response));
        }
        else if (token === -1) { // This can happen if the server fails to parse the protobuf message
            var error = new Error.ReqlClientError(helper.makeAtom(response)+"\nClosing all outstanding queries...");
            this.emit('error', error);
            // We don't want a function to yield forever, so we just reject everything
            helper.loopKeys(this.rejectMap, function(rejectMap, key) {
                rejectMap[key](error);
            });
            this.close();
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
        delete this.cursors[token];
    }
    else if (type === responseTypes.RUNTIME_ERROR) {
        this.emit('release');
        if (typeof this.rejectMap[token] === "function") {
            this.rejectMap[token](new Error.ReqlRuntimeError(helper.makeAtom(response), this.query[token], response));
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
        delete this.cursors[token];
    }
    else if (type === responseTypes.SUCCESS_ATOM) {
        this.emit('release');
        if (typeof this.resolveMap[token] === "function") {
            datum = helper.makeAtom(response, this.options[token]);
            if (Array.isArray(datum)) {
                cursor = new Cursor(this, token, this.options[token]);
                cursor._set(datum);
            }

            if (this.options[token].profile === true) {
                result = {
                    profile: response.p,
                    result: cursor || datum
                }
            }
            else {
                result = cursor || datum;
            }
            this.resolveMap[token](result);
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
    }
    else if (type === responseTypes.SUCCESS_PARTIAL) {
        if (typeof this.resolveMap[token] === "function") {
            // We save the current resolve function because we are going to call cursor._fetch before resuming the user's yield
            currentResolve = this.resolveMap[token];

            delete this.resolveMap[token];
            delete this.rejectMap[token];

            if (!this.cursors[token]) { //No cursor, let's create one
                this.cursors[token] = true;
                cursor = new Cursor(this, token, this.options[token]);
                cursor._push({done: false, response: response});
                if (this.options[token].profile === true) {
                    result = {
                        profile: response.p,
                        result: cursor
                    }
                    //Next batches will still have a profile (even though it's the same). So it's safe to keep the options
                    //this.options[token].profile = false;

                }
                else {
                    result = cursor
                }
                currentResolve(result);
            }
            else { // That was a continue query
                currentResolve({done: false, response: response});
            }
        }
    }
    else if (type === responseTypes.SUCCESS_SEQUENCE) {
        this.emit('release');
        if (typeof this.resolveMap[token] === "function") {
            currentResolve = this.resolveMap[token];

            delete this.resolveMap[token];
            delete this.rejectMap[token];

            if (!this.cursors[token]) { //No cursor, let's create one
                cursor = new Cursor(this, token, this.options[token]);
                cursor._push({done: true, response: response});

                if (this.options[token].profile === true) {
                    result = {
                        profile: response.p,
                        result: cursor
                    }
                    //Next batches will still have a profile (even though it's the same). So it's safe to keep the options
                    //this.options[token].profile = false;

                }
                else {
                    result = cursor
                }

                currentResolve(result);

                delete this.cursors[token];
            }
            else { // That was a continue query
                currentResolve({done: true, response: response});
            }
        }

        if (typeof this.resolveMap[token] === "function") this.resolveMap[token](cursor);

        delete this.query[token];
        delete this.options[token];
    }
    else if (type === responseTypes.WAIT_COMPLETE) {
        this.emit('release');
        this.resolveMap[token]();

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
        delete this.cursors[token];
        this.connection.removeAllListeners();
    }
}

Connection.prototype.reconnect = function(options) {
    var self = this;

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
                }).error(function() {
                    reject(e);
                });
            }).error(function(e) {
                reject(e)
            })
        });
    }
    else {
        return self.r.connect({
            host: self.host,
            port: self.port,
            authKey: self.authKey,
            db: self.db
        });
    }

    return p;
}

Connection.prototype._send = function(query, token, resolve, reject, originalQuery, options) {
    //console.log(JSON.stringify(query, null, 2));

    var self = this;

    var tokenBuffer = new Buffer(8);
    tokenBuffer.writeUInt32LE(token & 0xFFFFFFFF, 0)
    tokenBuffer.writeUInt32LE(Math.floor(token / 0xFFFFFFFF), 4)

    self.connection.write(tokenBuffer);

    var data = JSON.stringify(query);

    var lengthBuffer = new Buffer(4);
    lengthBuffer.writeUInt32LE(data.length, 0);

    if ((!helper.isPlainObject(options)) || (options.noReply != true)) {
        if ((self.resolveMap[token]) && (typeof resolve === 'function')) throw new Error.ReqlDriverError("Driver is buggy, trying to overwrite a promise, this is a bug.")
        if (typeof resolve === 'function') self.resolveMap[token] = resolve;
        if (typeof reject === 'function') self.rejectMap[token] = reject;
        if (originalQuery) self.query[token] = originalQuery; // It's not just query.query because we have get CONTINUE queries
        if (options) self.options[token] = options;
    }

    // This will emit an error if the connection is closed
    self.connection.write(lengthBuffer);
    self.connection.write(data);

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
    if (typeof db !== "string") throw new Error.ReqlDriverError("First argument of `use` must be a string")
    this.db = db;
}

Connection.prototype.close = function(options) {
    var self = this;
    self.open = false; // As soon as someone call .close() on it, no one should use it

    var p = new Promise(function(resolve, reject) {
        if (!helper.isPlainObject(options)) options = {};
        if (options.noReplyWait === true) {
            self.noReplyWait().then(function(r) {
                self.connection.end()
                resolve(r);
            }).error(function(e) {
                reject(e)
            });
        }
        else{
            self.connection.end()
            resolve();
        }
    });
    return p;
};


Connection.prototype.noReplyWait = function() {
    throw new Error.ReqlDriverError("Did you mean to use `noreplyWait` instead of `noReplyWait`?")
}
Connection.prototype.noreplyWait = function() {
    var self = this;
    var token = self.token++;

    var p = new Promise(function(resolve, reject) {
        var query = [protodef.Query.QueryType.NOREPLY_WAIT];

        self._send(query, token, resolve, reject);
    });
    return p;
}
Connection.prototype._isConnection = function() {
    return true;
}
Connection.prototype._isOpen = function() {
    return this.open;
}


module.exports = Connection
