var net = require('net');

var helper = require('./helper.js');
var Error = require('./error.js');
var Cursor = require('./cursor.js');

var pb = require('./protobuf.js');

var Promise = require('bluebird');
var events = require("events");
var util = require('util');

function Connection(r, options, resolve, reject) {
    var self = this;
    this.r = r;

    // Set default options - We have to save them in case the user tries to reconnect
    if (!helper.isPlainObject(options)) options = {};
    this.host = options.host || r.host;
    this.port = options.port || r.port;
    this.authKey = options.authKey || r.authKey;

    if (options.db) this.db = options.db; // Pass to each query

    this.token = 1;
    this.buffer = new Buffer(0);

    this.resolveMap = {};
    this.rejectMap = {};
    this.cursors = {};
    this.query = {};
    this.options = {};

    this.open = false; // true only if the user can write on the socket

    self.connection = net.connect({
        host: r.host,
        port: r.port
    });
    self.connection.on("connect", function() {
        self.connection.removeAllListeners("error");

        var initBuffer = new Buffer(8)
        initBuffer.writeUInt32LE(0x723081e1, 0)
        initBuffer.writeUInt32LE(r.authKey.length, 4)

        self.connection.write(initBuffer);
        self.connection.write(r.authKey, 'ascii');
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
        }
        else {
            while(self.buffer.length >= 4) {
                //TODO Move var
                var responseLength = self.buffer.readUInt32LE(0);
                if (self.buffer.length < 4+responseLength) break;

                var responseBuffer = self.buffer.slice(4, 4+responseLength);
                var response = pb.parseResponse(responseBuffer);
                //console.log(JSON.stringify(response, null, 2));

                self._processResponse(response);

                self.buffer = self.buffer.slice(4+responseLength);
            }
        }
    });
}

util.inherits(Connection, events.EventEmitter);

Connection.prototype._processResponse = function(response) {
    //console.log(JSON.stringify(response, null, 2));
    var token = response.token;
    var type = response.type;
    var result;
    var cursor;

    //TODO Retrieve options
    var options = undefined;

    //TODO Benchmark with a switch
    if (type === "COMPILE_ERROR") {
        if (typeof this.rejectMap[token] === "function") {
            this.rejectMap[token](new Error.ReqlCompileError(pb.makeAtom(response, this.query[token], response)));
        }
        else if (token === -1) {
            this.emit('error', new Error.ReqlClientError(pb.makeAtom(response), this.query[token], response));
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
    }
    else if (type === "CLIENT_ERROR") {
        if (typeof this.rejectMap[token] === "function") {
            this.rejectMap[token](new Error.ReqlClientError(pb.makeAtom(response), this.query[token], response));
        }
        else if (token === -1) {
            this.emit('error', new Error.ReqlClientError(pb.makeAtom(response), this.query[token], response));
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
    }
    else if (type === "RUNTIME_ERROR") {
        if (typeof this.rejectMap[token] === "function") {
            this.rejectMap[token](new Error.ReqlRuntimeError(pb.makeAtom(response), this.query[token], response));
        }
        else if (token === -1) {
            this.emit('error', new Error.ReqlClientError(pb.makeAtom(response), this.query[token], response));
        }

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
    }
    else if (type === "SUCCESS_ATOM") {
        if (typeof this.resolveMap[token] === "function") {
            var datum = pb.makeAtom(response, this.options[token]);
            if (Array.isArray(datum)) {
                cursor = new Cursor(this, token, this.options[token]);
                cursor._set(datum);
            }

            if (this.options[token].profile === true) {
                result = {
                    profile: pb.makeDatum(response.profile),
                    value: cursor || datum
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
    else if (type === "SUCCESS_PARTIAL") {
        if (typeof this.resolveMap[token] === "function") {
            var cursor = this.cursors[token] || new Cursor(this, token, this.options[token]);
            cursor._push(response);
            if (this.options[token].profile === true) {
                result = {
                    profile: pb.makeDatum(response.profile),
                    value: cursor
                }
            }
            else {
                result = cursor
            }
            this.resolveMap[token](cursor);
        }

        this.cursors[token] = cursor;


        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
    }
    else if (type === "SUCCESS_SEQUENCE") {
        var cursor = this.cursors[token] || new Cursor(this, token, this.options[token]);
        cursor._done()
        cursor._push(response);
        if (typeof this.resolveMap[token] === "function") this.resolveMap[token](cursor);

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
    }
    else if (type === "WAIT_COMPLETE") {
        this.resolveMap[token]();

        delete this.resolveMap[token];
        delete this.rejectMap[token];
        delete this.query[token];
        delete this.options[token];
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

    return p;
}

Connection.prototype._send = function(query, token, resolve, reject, originalQuery, options) {
    var self = this;

    //console.log(JSON.stringify(query, null, 2));
    //var data = new pb.Query(query).toBuffer();
    var data = pb.serializeQuery(query);

    var lengthBuffer = new Buffer(4);
    lengthBuffer.writeUInt32LE(data.length, 0);

    var buffer = Buffer.concat([lengthBuffer, data]);

    if ((!helper.isPlainObject(options)) || (options.noReply != true)) {
        if (typeof resolve === 'function') self.resolveMap[token] = resolve;
        if (typeof reject === 'function') self.rejectMap[token] = reject;
        if (originalQuery) self.query[token] = originalQuery; // It's not just query.query because we have get CONTINUE queries
        if (options) self.options[token] = options;
    }

    self.connection.write(buffer);
};

Connection.prototype._continue = function(token) {
    var query = {
        type: "CONTINUE",
        token: token
    }
    this._send(query, token);
}
Connection.prototype._end = function(token, resolve, reject) {
    var query = {
        type: "STOP",
        token: token
    }
    this._send(query, token, resolve, reject);
}


Connection.prototype.use = function(db) {
    if (typeof db !== "string") throw new Error.ReqlDriverError("First argument of `use` must be a string")
    this.db = db;
}

Connection.prototype.close = function(options) {
    var self = this;

    var p = new Promise(function(resolve, reject) {
        if (!helper.isPlainObject(options)) options = {};
        if (options.noReplyWait === true) {
            self.noReplyWait().then(function(r) {
                self.open = false;
                self.connection.end()
                resolve(r);
            }).error(function(e) {
                reject(e)
            });
        }
        else{
            self.open = false;
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
        var query = {
            type: "NOREPLY_WAIT",
            token: token
        }

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
