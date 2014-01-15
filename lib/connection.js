var net = require('net');
var errors = require('./errors.js');

function Connection(r, resolve, reject) {
    var self = this;
    this.token = 0;
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

        self.connection.on("data", function(buffer) {
            for(var i=0; i<buffer.length; i++) {
                if (buffer[i] === 0) {
                    self.connection.removeAllListeners("data");
                    var connectionStatus = buffer.slice(0, i).toString()
                    if (connectionStatus === "SUCCESS") {
                        self.open = true;
                        resolve(self);
                    }
                    else {
                        reject(new errors.RqlDriverError("Server dropped connection with message: \""+connectionStatus+"\""));
                    }
                }
            }
        });

    });
    self.connection.once("error", function() {
        reject();
    });
    self.connection.once("end", function() {
        self.open = false;
    });
}

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
