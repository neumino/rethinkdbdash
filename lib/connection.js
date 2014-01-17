var net = require('net');
var error = require('./error.js');
var pb = require('./protobuf.js');

function Connection(r, resolve, reject) {
    var self = this;
    this.token = 0;
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
    self.connection.once("error", function() {
        reject();
    });
    self.connection.once("end", function() {
        self.open = false;
    });

    self.connection.on("data", function(buffer) {
        self.buffer = Buffer.concat([self.buffer, buffer]);

        if (self.open == false) {
            for(var i=0; i<self.buffer.length; i++) {
                if (buffer[i] === 0) {
                    var connectionStatus = buffer.slice(0, i).toString()
                    if (connectionStatus === "SUCCESS") {
                        self.open = true;
                        resolve(self);
                    }
                    else {
                        reject(new error.RqlDriverError("Server dropped connection with message: \""+connectionStatus+"\""));
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
        this.resolveMap[token](pb.makeAtom(response, options));

        delete this.resolveMap[token];
        delete this.resolveMap[token];
    }
    else if (type === pb.Response.ResponseType["SUCCESS_PARTIAL"]) {
    }
    else if (type === pb.Response.ResponseType["SUCCESS_SEQUENCE"]) {
    }
    else if (type === pb.Response.ResponseType["WAIT_COMPLETE"]) {
    }


}
Connection.prototype._send = function(buffer, token, resolve, reject) {
    var self = this;

    self.resolveMap[token] = resolve;
    self.rejectMap[token] = reject;

    self.connection.write(buffer);
};

Connection.prototype.close = function(options) {
    var self = this;

    var p = new Promise(function(resolve, reject) {
        //TODO Add stronger check
        if (!util.isPlainObject(options)) options = {};
        if (options.noreplyWait === true) {
            token++;
            query = {
                type: "NOREPLY_WAIT",
                token: self.token
            }
            self.queue[token] = function() {
                self.connection.end();
                resolve();
            };
        }
        else {
            self.connection.end()
            resolve();
        }
    });
    return p;
};

module.exports = Connection
