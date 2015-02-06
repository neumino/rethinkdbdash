var Readable = require('stream').Readable;
var Cursor = require(__dirname+"/cursor.js");
var util = require('util');

// Experimental, but should work fine.
function Stream(options, cursor) {
    if (cursor) this._cursor = cursor;
    this._pending = 0; // How many time we called _read while no cursor was available
    this._index = 0;
    this._maxRecursion = 1000; // Hardcoded
    this._highWaterMark = options.highWaterMark;

    Readable.call(this, {
        objectMode: true,
        highWaterMark: this._highWaterMark
    });
};
util.inherits(Stream, Readable);


Stream.prototype._setCursor = function(cursor) {
    if (cursor instanceof Cursor === false) {
        this.emit('error', new Error("Cannot create a stream on a single value."));
        return this;
    }
    this._cursor = cursor;
    this._fetchAndDecrement();
}
Stream.prototype._read = function(size) {
    this._count++;
    if (this._cursor === undefined) {
        this._pending++;
        return;
    }

    this._recursion = 0;
    this._fetch();
}

//TODO: Refactor with _fetch?
Stream.prototype._fetchAndDecrement = function() {
    var self = this;
    self._pending--;
    if (self._pending < 0) {
        return;
    }

    if (self._cursor._closed === true) {
        self.push(null);
    }
    else {
        self._cursor._next().then(function(data) {
            // Silently drop null values for now
            if (data === null) {
                if (self._recursion++ === self._maxRecursion) {
                    //Avoid maximum call stack errors
                    process.nextTick(function() {
                        self._fetchAndDecrement();
                    });
                }
                else {
                    self._fetchAndDecrement();
                }
            }
            else {
                if (self.push(data) !== false) {
                    if (self._recursion++ === self._maxRecursion) {
                        process.nextTick(function() {
                            self._fetchAndDecrement();
                        });
                    }
                    else {
                        self._fetchAndDecrement();
                    }
                }
            }
        }).error(function(error) {
            if (error.message.match(/No more rows in the/)) {
                self.push(null);
            }
            else if (error.message === "You cannot retrieve data from a cursor that is closed.") {
                // if the user call `close`, the cursor may reject pending requests. We just
                // ignore them here.
            }
            else {
                self.emit('error', error);
            }
        });
    }
}

Stream.prototype._fetch = function() {
  var self = this;
    if (self._cursor._closed === true) {
        self.push(null);
    }
    else {
        self._cursor._next().then(function(data) {
            // Silently drop null values for now
            if (data === null) {
                if (self._recursion++ === self._maxRecursion) {
                    process.nextTick(function() {
                        self._fetch();
                    });
                }
                else {
                    self._fetch();
                }
            }
            else {
                if (self.push(data) !== false) {
                    if (self._recursion++ === self._maxRecursion) {
                        process.nextTick(function() {
                            self._fetch();
                        });
                    }
                    else {
                        self._fetch();
                    }
                }
            }
        }).error(function(error) {
            if (error.message.match(/No more rows in the/)) {
                self.push(null);
            }
            else if (error.message === "You cannot retrieve data from a cursor that is closed.") {
                // if the user call `close`, the cursor may reject pending requests. We just
                // ignore them here.
            }
            else {
                self.emit('error', error);
            }
        });
    }
}


Stream.prototype.close = function() {
    this.push(null);
    return this._cursor.close();
}

module.exports = Stream;
