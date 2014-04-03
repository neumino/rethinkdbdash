var Promise = require("bluebird");
var pb = require(__dirname+"/protobuf.js");
var cs = require(__dirname+"/stream.js");

function Cursor(connection, token, options) {
    this.connection = connection;
    this.token = token;

    this._index = 0; // Position in this._data[0]
    this._data = []; // Array of arrays
    this._fetching = false; // Are we fetching data
    this._canFetch = true; // Can we fetch more data?
    this._pendingPromise = null; // Whether there is a pending promise or not
    this.options = options || {};
    this._closed = false;
}

Cursor.prototype.toJSON = function() {
    return "You cannot serialize to JSON a cursor. Retrieve data from the cursor with `toArray` or `next`."
}

Cursor.prototype.next = function() {
    var self = this;
    if (self._pendingPromise != null) {
        var resolve = self._pendingPromise.resolve;
        var reject = self._pendingPromise.reject;
        self._pendingPromise = null;

        var result = self._data[0][self._index++];
        if (result instanceof Error) {
            reject(result);
        }
        else {
            resolve(result);
        }

        if (self._data[0].length === self._index) {
            self._index = 0;
            self._data.shift();
            if ((self._data.length === 1) && (self._canFetch) && (self._fetching === false)) self._fetch();
        }
    }
    else {
        var p = new Promise(function(resolve, reject) {
            if (self._closed === true) {
                process.nextTick(function() {
                    reject(new Error.ReqlDriverError("You cannot called `next` on a closed cursor."))
                });
            }
            else {
                if ((self._data.length > 1) || (self._data[0].length > self._index+1) || ((self._canFetch === false))) {
                    var result = self._data[0][self._index++];
                    if (result instanceof Error) {
                        reject(result);
                    }
                    else {
                        resolve(result);

                        // This could be possible if we get back batch with just one document?
                        if (self._data[0].length === self._index) {
                            self._index = 0;
                            self._data.shift();
                            if ((self._data.length === 1) && (self._canFetch) && (self._fetching === false)) self._fetch();
                        }
                    }
                }
                else if (self._fetching === true) {
                    self._pendingPromise = {resolve: resolve, reject: reject};
                }
            }
        });
        return p;
    }
}
Cursor.prototype.hasNext = function() {
    // If we are fetching data, there is more, or if there are documents left
    return ((this._fetching) || ((this._data.length > 0) && (this._data[0].length > this._index)))
}
Cursor.prototype.toArray = function() {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        var result = [];

        var errorHandler = function(error) {
            reject(error);
        }
        var resultHandler = function(value) {
            result.push(value);
            if (self.hasNext()) {
                self.next().then(resultHandler).error(errorHandler)
            }
            else {
                resolve(result);
            }
        }

        if (self.hasNext()) {
            self.next().then(resultHandler).error(errorHandler)
        }
        else {
            resolve(result);
        }

    });
    return p;
}

Cursor.prototype._fetch = function() {
    var self = this;
    this._fetching = true;

    var p = new Promise(function(resolve, reject) {
            self.connection._continue(self.token, resolve, reject);
        }).then(function(response) {
            self._push(response);
        }).error(function(error) {
            self._fetching = false;
            self._canFetch = false;
            self._pushError(error);
        })
}

Cursor.prototype._push = function(data) {
    if (data.done) this._done();
    response = data.response;
    this._fetching = false;
    this._data.push(pb.makeSequence(response, this.options));

    if (this.closeAsap === true) {
        this.connection._end(this.token);
        if (this._pendingPromise != null) {
            this._pendingPromise.reject(new Error.ReqlDriverError("You cannot retrieve data from a cursor that is closed"))
        }
    }
    else {
        if ((this._canFetch) && (this._data.length === 1)) this._fetch();
        if (this._pendingPromise != null) {
            this.next();
        }
    }
}
Cursor.prototype._pushError = function(error) {
    this._data.push([error]);
    if (this._pendingPromise != null) {
        this.next();
    }
}

Cursor.prototype._done = function() {
    this._canFetch = false;
}

Cursor.prototype._set = function(ar) {
    this._fetching = false;
    this._data.push(ar);
    this._canFetch = false;
}

Cursor.prototype.close = function() {
    var self = this;

    self._closed = true;

    var p = new Promise(function(resolve, reject) {
        if ((self._canFetch === true) && (self._fetching === false)) {
            self.connection._end(self.token, resolve, reject);
        }
        else if ((self._canFetch === false) && (self._fetching === false)) {
            resolve()
        }
        else {
            this._closeAsap = true;
        }
    });
    return p;
}

Cursor.prototype.createReadStream = function() {
  var stream = cs(this);
  return stream;
}

module.exports = Cursor;
