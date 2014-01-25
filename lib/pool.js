var Promise = require('bluebird');
var Dequeue = require(__dirname+"/dequeue.js");
var helper = require(__dirname+"/helper.js");

function Pool(r, options) {
    this._r = r;

    if (!helper.isPlainObject(options)) options = {};
    this.options = {};
    this.options.min = options.min || 1;
    this.options.max = options.max || 4; // 4000 is about the maximum the kernel can take
    this.options.bufferSize = options.bufferSize || options.min || 1;
    this.options.timeoutError = options.timeoutError || 1000; // How long should we wait before recreating a connection that failed?
    this.options.timeoutGb = options.timeoutGb || 60*1000; // We close a connection if not used for some time

    this._pool = new Dequeue();
    this._line = new Dequeue();

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

    if (self._line.getLength() > 0) {
        clearTimeout(connection.timeout);

        var resolve = self._line.shift();
        resolve(connection);
    }
    else {
        self._pool.push(connection);

        var fooo = []
        for(var i=0; i<self._pool.getLength(); i++) {
            if (self._pool.get(i)) fooo.push(self._pool.get(i).foo)
        }

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
};

Pool.prototype.createConnection = function() {
    var self = this;
    self._numConnections++;
    self._r.connect(self.options).then(function(connection) {
        connection.on('error', function(e) {

            // We are going to close connection, but we don't want another process to use it before
            // So we remove it from the pool now (if it's inside)
            //TODO

            // Not sure what happened here, so let's be safe and close this connection.
            connection.close(); 
            self._expandBuffer();
        });
        connection.on('end', function(e) {
            // The connection was closed by something, let's clean...
            //TODO
            
            self._numConnections--;
            self._expandBuffer();
        });

        connection.on('release', function() {
            
            if (this._isOpen()) self.putConnection(this);
        });


        self.putConnection(connection); 

    }).error(function(error) {
        setTimeout(function() {
            self._expandBuffer
        }, self.options.timeoutError);
    })
};

Pool.prototype._expandBuffer = function() {
    if ((this._pool.getLength() < this.options.bufferSize) && (this._numConnections < this.options.max)) {
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
        for(key in options) {
            this.options[key] = options[key];
        }
    }
    return this.options;
}




module.exports = Pool;
