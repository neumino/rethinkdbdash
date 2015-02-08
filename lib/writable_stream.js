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

    this._insertOptions = {};
    this._insertOptions.durability = options.durability || 'hard';
    this._insertOptions.conflict = options.conflict || 'error';

    Writable.call(this, {
        objectMode: true,
        highWaterMark: this._highWaterMark
    });
};
util.inherits(WritableStream, Writable);

WritableStream.prototype._write = function(value, encoding, done) {
    this._cache.push(value);

    if ((this._writableState.lastBufferedRequest != null) && (this._writableState.lastBufferedRequest.chunk !== value)) {
        // There's more data to buffer
        if (this._cache.length < this._highWaterMark-1) {
            // Call done now, and more data will be put in the cache
            done();
        }
        else {
            if (this._inserting === false) {
                // We have to flush
                this._insert();
                // Fill the buffer while we are inserting data
                done();
            }
            else {
                // to call when we are dong inserting to keep buffering
                this._pendingCallback = done;
            }
        }
    }
    else { // We just pushed the last element in the internal buffer
        if (this._inserting === false) {
            // to call when we are dong inserting to maybe flag the end
            this._pendingCallback = done;
            this._insert();
        }
        else {
            // There is nothing left in the internal buffer
            // But something is already inserting stuff.
            // to call when we are dong inserting the current batch and the next one
            var self = this;
            var pendingCallback = this._pendingCallback;
            var cb = function() {
                if (typeof pendingCallback === 'function') {
                    pendingCallback();
                }
                if ((self._writableState.lastBufferedRequest != null) && (self._writableState.lastBufferedRequest.chunk !== value) &&
                    (self._cache.length < self._highWaterMark-1)) {
                    done(); // buffer more
                }
                else {
                    self._pendingCallback = done;
                    self._insert();
                }
            }
            this._pendingCallback = cb;
            return false;
        }
    }
}

WritableStream.prototype._insert = function() {
    var self = this;
    self._inserting = true;

    var cache = self._cache;
    self._cache = [];

    console.log('cache length', cache.length);
    self._table.insert(cache, self._insertOptions).run(self._connection).then(function(result) {
        self._inserting = false;
        if (result.errors > 0) {
            self._inserting = false;
            self.emit('error', new Error("Failed to insert some documents:"+JSON.stringify(result, null, 2)));
        }
        if (typeof self._pendingCallback === 'function') {
            var pendingCallback = self._pendingCallback;
            self._pendingCallback = null;
            pendingCallback();
        }

    }).error(function(error) {
        self._inserting = false;
        self.emit('error', error);
    });
}


module.exports = WritableStream;
