var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
var cursor_1 = require('./cursor');
var ReadableStream = (function (_super) {
    __extends(ReadableStream, _super);
    function ReadableStream(options, cursor) {
        // Experimental, but should work fine.
        _super.call(this);
        this.Cursor = cursor_1.Cursor;
        if (cursor)
            this._cursor = cursor;
        this._pending = 0; // How many time we called _read while no cursor was available
        this._index = 0;
        this._maxRecursion = 1000; // Hardcoded
        this._highWaterMark = options.highWaterMark;
        stream_1.Readable.call(this, {
            objectMode: true,
            highWaterMark: this._highWaterMark
        });
    }
    ReadableStream.prototype.close = function () {
        this.push(null);
        return this._cursor.close();
    };
    ReadableStream.prototype._fetch = function () {
        var _this = this;
        var self = this;
        if (this._cursor._closed === true) {
            this.push(null);
        }
        else {
            this._cursor._next().then(function (data) {
                // Silently drop null values for now
                if (data === null) {
                    if (_this._recursion++ === _this._maxRecursion) {
                        process.nextTick(function () {
                            _this._fetch();
                        });
                    }
                    else {
                        _this._fetch();
                    }
                }
                else {
                    if (_this.push(data) !== false) {
                        if (_this._recursion++ === _this._maxRecursion) {
                            process.nextTick(function () {
                                _this._fetch();
                            });
                        }
                        else {
                            _this._fetch();
                        }
                    }
                }
            }).error(function (error) {
                if (error.message.match(/No more rows in the/)) {
                    _this.push(null);
                }
                else if (error.message === 'You cannot retrieve data from a cursor that is closed.') {
                }
                else {
                    _this.emit('error', error);
                }
            });
        }
    };
    ReadableStream.prototype._fetchAndDecrement = function () {
        var _this = this;
        var self = this;
        this._pending--;
        if (this._pending < 0) {
            return;
        }
        if (this._cursor._closed === true) {
            this.push(null);
        }
        else {
            this._cursor._next().then(function (data) {
                // Silently drop null values for now
                if (data === null) {
                    if (_this._recursion++ === _this._maxRecursion) {
                        //Avoid maximum call stack errors
                        process.nextTick(function () {
                            _this._fetchAndDecrement();
                        });
                    }
                    else {
                        _this._fetchAndDecrement();
                    }
                }
                else {
                    if (_this.push(data) !== false) {
                        if (_this._recursion++ === _this._maxRecursion) {
                            process.nextTick(function () {
                                _this._fetchAndDecrement();
                            });
                        }
                        else {
                            _this._fetchAndDecrement();
                        }
                    }
                }
            }).error(function (error) {
                if (error.message.match(/No more rows in the/)) {
                    _this.push(null);
                }
                else if (error.message === 'You cannot retrieve data from a cursor that is closed.') {
                }
                else {
                    _this.emit('error', error);
                }
            });
        }
    };
    ReadableStream.prototype._read = function (size) {
        this._count++;
        if (this._cursor === undefined) {
            this._pending++;
            return;
        }
        this._recursion = 0;
        this._fetch();
    };
    ReadableStream.prototype._setCursor = function (cursor) {
        if (cursor instanceof this.Cursor === false) {
            this.emit('error', new Error('Cannot create a stream on a single value.'));
            return this;
        }
        this._cursor = cursor;
        this._fetchAndDecrement();
    };
    return ReadableStream;
})(stream_1.Readable);
exports.ReadableStream = ReadableStream;
;
//TODO: Refactor with _fetch? 
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0cmVhbS50cyJdLCJuYW1lcyI6WyJSZWFkYWJsZVN0cmVhbSIsIlJlYWRhYmxlU3RyZWFtLmNvbnN0cnVjdG9yIiwiUmVhZGFibGVTdHJlYW0uY2xvc2UiLCJSZWFkYWJsZVN0cmVhbS5fZmV0Y2giLCJSZWFkYWJsZVN0cmVhbS5fZmV0Y2hBbmREZWNyZW1lbnQiLCJSZWFkYWJsZVN0cmVhbS5fcmVhZCIsIlJlYWRhYmxlU3RyZWFtLl9zZXRDdXJzb3IiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsdUJBQXVCLFFBQVEsQ0FBQyxDQUFBO0FBRWhDLHVCQUFxQixVQUFVLENBQUMsQ0FBQTtBQUVoQztJQUFvQ0Esa0NBQVFBO0lBVTFDQSx3QkFBWUEsT0FBT0EsRUFBRUEsTUFBT0E7UUFDOUJDLHNDQUFzQ0E7UUFDbENBLGlCQUFPQSxDQUFDQTtRQVhGQSxXQUFNQSxHQUFHQSxlQUFNQSxDQUFDQTtRQVl0QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsTUFBTUEsQ0FBQ0E7UUFDbENBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLDhEQUE4REE7UUFDakZBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hCQSxJQUFJQSxDQUFDQSxhQUFhQSxHQUFHQSxJQUFJQSxDQUFDQSxDQUFDQSxZQUFZQTtRQUN2Q0EsSUFBSUEsQ0FBQ0EsY0FBY0EsR0FBR0EsT0FBT0EsQ0FBQ0EsYUFBYUEsQ0FBQ0E7UUFFNUNBLGlCQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQTtZQUNsQkEsVUFBVUEsRUFBRUEsSUFBSUE7WUFDaEJBLGFBQWFBLEVBQUVBLElBQUlBLENBQUNBLGNBQWNBO1NBQ25DQSxDQUFDQSxDQUFDQTtJQUNMQSxDQUFDQTtJQUVERCw4QkFBS0EsR0FB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