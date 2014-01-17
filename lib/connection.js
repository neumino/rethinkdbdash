var net = require('net');

var helper = require('./helper.js');
var Error = require('./error.js');

var pb = require('./protobuf.js');

var Promise = require('bluebird');

function Connection(r, options, resolve, reject) {
    var self = this;

    // Set default options
    if (!helper.isPlainObject(options)) options = {};
    options.host = options.host || "localhost";
    options.port = options.port || 28015;
    options.authKey = options.authKey || "";
    options.nestingLevel = options.nestingLevel || 20;

    this.token = 1;
    this.buffer = new Buffer(0);
    this.resolveMap = {}
    this.rejectMap = {}
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
        reject(new Error.ReqlDriverError("Failed to connect to "+options.host+":"+options.port+"\nFull error:\n"+JSON.stringify(error, null, 2)));
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

Connection.prototype._processResponse = function(response) {

    var token = response.token;
    var type = response.type;

    //TODO Retrieve options
    var options = undefined;

    //TODO Benchmark with a switch
    if (type === pb.Response.ResponseType["COMPILE_ERROR"]) {
    }
    else if (type === pb.Response.ResponseType["CLIENT_ERROR"]) {
    }
    else if (type === pb.Response.ResponseType["RUNTIME_ERROR"]) {
    }
    else if (type === pb.Response.ResponseType["SUCCESS_ATOM"]) {
        //console.log(JSON.stringify(response));
        this.resolveMap[token](pb.makeAtom(response, options));

        delete this.resolveMap[token];
        delete this.resolveMap[token];
    }
    else if (type === pb.Response.ResponseType["SUCCESS_PARTIAL"]) {
    }
    else if (type === pb.Response.ResponseType["SUCCESS_SEQUENCE"]) {
    }
    else if (type === pb.Response.ResponseType["WAIT_COMPLETE"]) {
        this.resolveMap[token]();

        delete this.resolveMap[token];
        delete this.resolveMap[token];
    }


}
Connection.prototype._send = function(query, token, resolve, reject) {
    var self = this;

    //console.log(JSON.stringify(query, null, 2));
    var data = new pb.Query(query).toBuffer();

    var lengthBuffer = new Buffer(4);
    lengthBuffer.writeUInt32LE(data.length, 0)

    var buffer = Buffer.concat([lengthBuffer, data]);

    self.resolveMap[token] = resolve;
    self.rejectMap[token] = reject;

    self.connection.write(buffer);
};

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

module.exports = Connection
