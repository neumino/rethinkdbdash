var Writable = require('stream').Writable;
var Cursor = require(__dirname+"/cursor.js");
var util = require('util');

// Experimental, but should work fine.
function WritableStream(table, options, connection) {
    this._table = table;
    this._options = options;
    this._cache = [];
    this._pendingCallback = null;
    this._inserting = false;
    this._connection = connection;
    this._highWaterMark = options.highWaterMark || 100;

    Writable.call(this, {
        objectMode: true,
        highWaterMark: this._highWaterMark
    });
};
util.inherits(WritableStream, Writable);

WritableStream.prototype._write = function(value, encoding, done) {
    if (this._inserting === false) {
        this._cache.push(value);
        this._insert();
        done();
    }
    else {
        this._cache.push(value);
        if (this._cache.length < this._highWaterMark) {
            done();
        }
        else {
            this._pendingCallback = done;
            return false;
        }
    }
}
WritableStream.prototype._insert = function() {
    var self = this;
    self._inserting = true;

    var cache = self._cache;
    var pendingCallback = self._pendingCallback;
    self._pendingCallback = null;
    self._cache = [];

    if (typeof pendingCallback === 'function') {
        pendingCallback();
    }

    self._table.insert(cache).run(self._connection).then(function() {
        self._inserting = false;

        if (self._cache.length > 0) {
            self._insert();
        }

    }).error(function(error) {
        self._inserting = false;
    });
}


module.exports = WritableStream;
