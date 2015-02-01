var Readable = require('stream').Readable;
var Cursor = require(__dirname+"/cursor.js");
var util = require('util');

// Experimental, but should work fine.
function Stream(cursor) {
    this._cursor = cursor;
    this._index = 0;
    Readable.call(this, {
        objectMode: true
    });
};
util.inherits(Stream, Readable);


Stream.prototype._read = function(size) {
    var self = this;
    //Avoid maximum call stack errors
    var maxRecursion = 1000; // Hardcoded
    var recursion = 0;
    var fetch = function() {
        if (self._cursor._closed === true) {
            self.push(null);
        }
        else {
            self._cursor._next().then(function(data) {
                // Silently drop null values for now
                if (data === null) {
                    if (recursion++ === maxRecursion) {
                        process.nextTick(fetch);
                    }
                    else {
                        fetch();
                    }
                }
                else {
                    if (self.push(data) !== false) {
                        if (recursion++ === maxRecursion) {
                            process.nextTick(fetch);
                        }
                        else {
                            fetch();
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
    fetch();
}


Stream.prototype.close = function() {
    this.push(null);
    return this._cursor.close();
}

module.exports = Stream;
