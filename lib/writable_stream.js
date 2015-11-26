var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
// Experimental, but should work fine.
var WritableStream = (function (_super) {
    __extends(WritableStream, _super);
    function WritableStream(table, options, connection) {
        _super.call(this);
        this._table = table;
        this._options = options;
        this._cache = [];
        this._pendingCallback = null;
        this._inserting = false;
        this._delayed = false;
        this._connection = connection;
        this._highWaterMark = options.highWaterMark || 100;
        this._insertOptions = {};
        this._insertOptions.durability = options.durability || 'hard';
        this._insertOptions.conflict = options.conflict || 'error';
        // Internal option to run some tests
        if (options.debug === true) {
            this._sequence = [];
        }
        stream_1.Writable.call(this, {
            objectMode: true,
            highWaterMark: this._highWaterMark
        });
        this._i = 0;
    }
    WritableStream.prototype._insert = function () {
        var _this = this;
        var self = this;
        this._inserting = true;
        var cache = this._cache;
        this._cache = [];
        if (Array.isArray(this._sequence)) {
            this._sequence.push(cache.length);
        }
        this._table.insert(cache, this._insertOptions).run(this._connection).then(function (result) {
            _this._inserting = false;
            if (result.errors > 0) {
                _this._inserting = false;
                _this.emit('error', new Error('Failed to insert some documents:' + JSON.stringify(result, null, 2)));
            }
            if (typeof _this._pendingCallback === 'function') {
                var pendingCallback = _this._pendingCallback;
                _this._pendingCallback = null;
                pendingCallback();
            }
        }).error(function (error) {
            _this._inserting = false;
            _this.emit('error', error);
        });
    };
    WritableStream.prototype._next = function (value, encoding, done) {
        var _this = this;
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
                        this._delayed = false;
                        // We have to flush
                        this._insert();
                        // Fill the buffer while we are inserting data
                        done();
                    }
                    else {
                        var self = this;
                        this._delayed = true;
                        setImmediate(function () {
                            _this._next(value, encoding, done);
                        });
                    }
                }
                else {
                    this._delayed = false;
                    // to call when we are dong inserting to keep buffering
                    this._pendingCallback = done;
                }
            }
        }
        else {
            if (this._inserting === false) {
                if (this._delayed === true) {
                    this._delayed = false;
                    // to call when we are dong inserting to maybe flag the end
                    // We cannot call done here as we may be inserting the last batch
                    this._pendingCallback = done;
                    this._insert();
                }
                else {
                    var self = this;
                    this._delayed = true;
                    setImmediate(function () {
                        _this._next(value, encoding, done);
                    });
                }
            }
            else {
                this._delayed = false;
                // We cannot call done here as we may be inserting the last batch
                this._pendingCallback = done;
            }
        }
    };
    WritableStream.prototype._write = function (value, encoding, done) {
        this._i++;
        this._cache.push(value);
        this._next(value, encoding, done);
    };
    return WritableStream;
})(stream_1.Writable);
exports.WritableStream = WritableStream;
;
// Everytime we want to insert but do not have a full buffer,
// we recurse with setImmediate to give a chance to the input
// stream to push a few more elements
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGFibGVfc3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dyaXRhYmxlX3N0cmVhbS50cyJdLCJuYW1lcyI6WyJXcml0YWJsZVN0cmVhbSIsIldyaXRhYmxlU3RyZWFtLmNvbnN0cnVjdG9yIiwiV3JpdGFibGVTdHJlYW0uX2luc2VydCIsIldyaXRhYmxlU3RyZWFtLl9uZXh0IiwiV3JpdGFibGVTdHJlYW0uX3dyaXRlIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHVCQUF1QixRQUFRLENBQUMsQ0FBQTtBQUloQyxzQ0FBc0M7QUFDdEM7SUFBb0NBLGtDQUFRQTtJQTJHMUNBLHdCQUFZQSxLQUFLQSxFQUFFQSxPQUFPQSxFQUFFQSxVQUFVQTtRQUNwQ0MsaUJBQU9BLENBQUNBO1FBQ1JBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLEtBQUtBLENBQUNBO1FBQ3BCQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxPQUFPQSxDQUFDQTtRQUN4QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDakJBLElBQUlBLENBQUNBLGdCQUFnQkEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLEtBQUtBLENBQUNBO1FBQ3hCQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUN0QkEsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsVUFBVUEsQ0FBQ0E7UUFDOUJBLElBQUlBLENBQUNBLGNBQWNBLEdBQUdBLE9BQU9BLENBQUNBLGFBQWFBLElBQUlBLEdBQUdBLENBQUNBO1FBRW5EQSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUN6QkEsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsVUFBVUEsR0FBR0EsT0FBT0EsQ0FBQ0EsVUFBVUEsSUFBSUEsTUFBTUEsQ0FBQ0E7UUFDOURBLElBQUlBLENBQUNBLGNBQWNBLENBQUNBLFFBQVFBLEdBQUdB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