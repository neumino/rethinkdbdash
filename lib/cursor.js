var Promise = require('bluebird');
var pb = require('./protobuf.js');

function Cursor(connection, token) {
    this.connection = connection;
    this.token = token;

    this._index = 0;
    this._data = [];
    this._fetching = false;
    this._canFetch = true;
}

Cursor.prototype.next = function() {
    var self = this;
    if (self._pendingPromise != null) {
        var resolve = self._pendingPromise;
        self._pendingPromise = null;
        resolve(self._data[0][self._index++]);
        if (self._data[0].length === self._index) {
            self._index = 0;
            self._data.shift();
            if ((self._data.length === 1) && (self._canFetch)) self._fetch();
        }
    }
    else {
        var p = new Promise(function(resolve, reject) {
            if ((self._data.length > 1) || (self._data[0].length > self._index+1) || ((self._canFetch === false))) {
                resolve(self._data[0][self._index++]);
            }
            else if (self._fetching === true) {
                self._pendingPromise = resolve;
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
        while(self.hasNext()) {
            self.next().then(function(value) {
                result.push(value);
            }).error(function(error) {
                reject(error);
            });
        }
        resolve(result);
    });
    return p;
}

Cursor.prototype._fetch = function() {
    this._fetching = true;
    this.connection._continue(this.token);
}

Cursor.prototype._push = function(response) {
    this._fetching = false;
    this._data.push(pb.makeSequence(response));
    if ((this._canFetch) && (this._data.length === 1)) this._fetch();
    if (this._pendingPromise != null) this.next();

    var count = 0;
    for(var i=0; i<this._data.length; i++) {
        count += this._data[i].length;
    }
}

Cursor.prototype._done = function() {
    this._canFetch = false;
}

Cursor.prototype.close = function() {
    var self = this;

    self._data = [];

    //TODO How to handle concurrency between _fetch and _close? and return a promise?
    self.connection._end(self.token);
}

module.exports = Cursor;
