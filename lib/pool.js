var Promise = require('bluebird');
var Dequeue = require(__dirname+"/dequeue.js");
var helper = require(__dirname+"/helper.js");
var COUNT = 0;
var KILL = 0;

function Pool(r, options) {
    this._r = r;

    if (!helper.isPlainObject(options)) options = {};
    this.options = {};
    this.options.min = options.min || 50;
    this.options.max = options.max || 1000; // 4000 is about the maximum the kernel can take
    this.options.bufferSize = options.bufferSize || options.min || 50;
    this.options.timeoutError = options.timeoutError || 1000; // How long should we wait before recreating a connection that failed?
    this.options.timeoutGb = options.timeoutGb || 60*60*1000; // Default timeout for TCP connection is 2 hours on Linux, we time out after one hour.

    this.options.connection = {
        host: options.host || this._r._host,
        port: options.port || this._r._port,
        db: options.db || this._r._db,
        authKey: options.authKey || this._r._authKey
    }

    this._pool = new Dequeue(this.options.min+1);
    this._line = new Dequeue(this.options.min+1);
    this._draining = null;

    if (this.options.min > this.options.bufferSize) throw new Error.ReqlDriverError("You cannot set a buffer smaller than the number of connections")

    this._numConnections = 0;

    for(var i=0; i<this.options.min; i++) {
        this.createConnection();
    }
}

Pool.prototype.getConnection = function() {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        var connection = self._pool.pop();

        while (self._pool.getLength() > 0 && !connection) {
            var localConn = self._pool.pop();
            if (localConn && localConn.open) connection = localConn;
        }

        if (connection) {
            clearTimeout(connection.timeout);
            resolve(connection);
        }
        else {
            self._line.push(resolve);
        }

        self._expandBuffer();

    });
    return p;
};

Pool.prototype.putConnection = function(connection) {
    var self = this;

    if (self._draining) {
        self._numConnections--;
        connection.close();
        if (self.getLength() === 0) {
            self._draining.resolve();
        }
    }
    else {
        if (self._line.getLength() > 0) {
            clearTimeout(connection.timeout);

            var resolve = self._line.shift();
            resolve(connection);
        }
        else {
            self._pool.push(connection);

            var timeoutCb = function() {
                if (self._pool.get(0) === connection) {
                    if (self._pool.getLength() > self.options.min) {
                        self._pool.shift();
                        self._numConnections--;
                    }
                    else {
                        connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
                    }
                }
                else {
                    connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
                }
            }
            connection.timeout = setTimeout(timeoutCb, self.options.timeoutGb);
        }
    }
};

Pool.prototype.createConnection = function() {
    var self = this;
    self._numConnections++;
    self._r.connect(self.options.connection).then(function(connection) {


        connection.on('error', function(e) {
            // We are going to close connection, but we don't want another process to use it before
            // So we remove it from the pool now (if it's inside)
            for(var i=0; i<self.getAvailableLength(); i++) {
                if (self._pool.get(i) === this) {
                    self._pool.delete(i);
                    break;
                }
            }
            // We want to make sure that it's not going to try to reconnect
            clearTimeout(connection.timeout);

            // Not sure what happened here, so let's be safe and close this connection.
            connection.close().then(function() {
                self._numConnections--;
                self._expandBuffer();
            }).error(function(e) {
                // We failed to close this connection, but we removed it from the pool... so err, let's just ignore that.
                self._numConnections--;
                self._expandBuffer();
            });
        });
        connection.on('end', function(e) {
            // The connection was closed by something, let's clean...
            for(var i=0; i<self.getAvailableLength(); i++) {
                if (self._pool.get(i) === this) {
                    self._pool.delete(i);
                    break;
                }
            }

            clearTimeout(connection.timeout);
            self._numConnections--;
            self._expandBuffer();
        });
        connection.on('timeout', function() {
            for(var i=0; i<self.getAvailableLength(); i++) {
                if (self._pool.get(i) === this) {
                    self._pool.delete(i);
                    break;
                }
            }

            clearTimeout(connection.timeout);
            self._numConnections--;
            self._expandBuffer();
        });
        connection.on('release', function() {
            if (this._isOpen()) self.putConnection(this);
        });
        self.putConnection(connection);
    }).error(function(error) {
        // Log an error
        console.log("Fail to create a new connection for the connection pool The error returned was:")
        console.log(error.message);
        console.log(error.stack);
        setTimeout(function() {
            self._expandBuffer();
        }, self.options.timeoutError);
    })
};

Pool.prototype._expandBuffer = function() {
    if ((this._draining === null) && (this._pool.getLength() < this.options.bufferSize) && (this._numConnections < this.options.max)) {
        this.createConnection();
    }
}

Pool.prototype.getLength = function() {
    return this._numConnections;
}
Pool.prototype.getAvailableLength = function() {
    return this._pool.getLength();
}

Pool.prototype.getLineSize = function() {
    return this._line.getLength();
}
Pool.prototype.setOptions = function(options) {
    if (helper.isPlainObject(options)) {
        for(var key in options) {
            this.options[key] = options[key];
        }
    }
    return this.options;
}
Pool.prototype.drain = function() {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        var connection = self._pool.pop();
        while(connection) {
            self._numConnections--;

            connection.close();
            clearTimeout(connection.timeout);
            connection = self._pool.pop();
        }
        if (self.getLength() === 0) {
            resolve();
        }
        else {
            self._draining = {
                resolve: resolve,
                reject: reject
            }
        }
    });
    return p;
}




module.exports = Pool;
