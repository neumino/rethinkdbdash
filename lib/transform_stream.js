var Transform = require('stream').Transform;
var Cursor = require(__dirname+"/cursor.js");
var util = require('util');

// Experimental, but should work fine.
function TransformStream(table, options, connection) {
    this._table = table;
    this._options = options;
    this._cache = [];
    this._pendingCallback = null;
    this._ended = false;
    this._inserting = false;
    this._delayed = false;
    this._connection = connection;
    this._highWaterMark = options.highWaterMark || 100;
    this._insertOptions = {};
    this._insertOptions.durability = options.durability || 'hard';
    this._insertOptions.conflict = options.conflict || 'error';
    this._insertOptions.returnChanges = options.returnChanges || true;

    // Internal option to run some tests
    if (options.debug === true) {
        this._sequence = [];
    }

    Transform.call(this, {
        objectMode: true,
        highWaterMark: this._highWaterMark
    });
};
util.inherits(TransformStream, Transform);

TransformStream.prototype._transform = function(value, encoding, done) {
    this._cache.push(value);
    this._next(value, encoding, done);
}

// Everytime we want to insert but do not have a full buffer,
// we recurse with setImmediate to give a chance to the input
// stream to push a few more elements
TransformStream.prototype._next = function(value, encoding, done) {
    if ((this._writableState.lastBufferedRequest != null) && (this._writableState.lastBufferedRequest.chunk !== value)) {
        // There's more data to buffer
        if (this._cache.length < this._highWaterMark) {
            this._delayed = false;
            // Call done now, and more data will be put in the cache
            done();
        }
        else {
            if (this._inserting === false) {
                if (this._delayed === true) {
                    // We have to flush
                    this._delayed = false;
                    this._insert();
                    // Fill the buffer while we are inserting data
                    done();
                }
                else {
                    var self = this;
                    this._delayed = true;
                    setImmediate(function() {
                        self._next(value, encoding, done);
                    })
                }

            }
            else {
                // to call when we are dong inserting to keep buffering
                this._pendingCallback = done;
            }
        }
    }
    else { // We just pushed the last element in the internal buffer
        if (this._inserting === false) {
            if (this._delayed === true) {
                this._delayed = false;
                // to call when we are dong inserting to maybe flag the end
                this._insert();
                // We can call done now, because we have _flush to close the stream
                done();
            }
            else {
                var self = this;
                this._delayed = true;
                setImmediate(function() {
                    self._next(value, encoding, done);
                })
            }
        }
        else {
            this._delayed = false;
            // There is nothing left in the internal buffer
            // But something is already inserting stuff.
            if (this._cache.length < this._highWaterMark-1) {
                // Call done, to attempt to buffer more
                // This may trigger _flush
                //this._pendingCallback = done;
                done();
            }
            else {
                this._pendingCallback = done;
            }
        }
    }
}

TransformStream.prototype._insert = function() {
    var self = this;
    self._inserting = true;

    var cache = self._cache;
    self._cache = [];

    if (Array.isArray(self._sequence)) {
        self._sequence.push(cache.length);
    }

    var pendingCallback = self._pendingCallback;
    self._pendingCallback = null;
    if (typeof pendingCallback === 'function') {
        pendingCallback();
    }

    self._table.insert(cache, self._insertOptions).run(self._connection).then(function(result) {
        self._inserting = false;

        if (result.errors > 0) {
            self._inserting = false;
            self.emit('error', new Error("Failed to insert some documents:"+JSON.stringify(result, null, 2)));
        }
        else {
            if (self._insertOptions.returnChanges === true) {
                for(var i=0; i<result.changes.length; i++) {
                    self.push(result.changes[i].new_val);
                }
            }
        }

        pendingCallback = self._pendingCallback
        self._pendingCallback = null;
        if (typeof pendingCallback === 'function') {
            // Mean that we can buffer more
            pendingCallback();
        }
        else if (self._ended !== true) {
            if (((((self._writableState.lastBufferedRequest === null) ||
                  self._writableState.lastBufferedRequest.chunk === self._cache[self._cache.length-1])))
                && (self._cache.length > 0)) {
                    self._insert();
            }
        }
        else if (self._ended === true) {
            if (self._cache.length > 0) {
                self._insert();
            }
            else {
                if (typeof self._flushCallback === 'function') {
                    self._flushCallback();
                }
                self.push(null);
            }
        }
    }).error(function(error) {
        self._inserting = false;
        self.emit('error', error);
    });
}

TransformStream.prototype._flush = function(done) {
    this._ended = true;
    if ((this._cache.length === 0) && (this._inserting === false)) {
        done();
    }
    else { // this._inserting === true
        if (this._inserting === false) {
            this._flushCallback = done;
            this._insert();
        }
        else {
            this._flushCallback = done;
        }
    }
}


module.exports = TransformStream;
