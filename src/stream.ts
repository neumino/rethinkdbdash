import stream = require('stream');
var Readable = stream.Readable;
var util = require('util');

class ReadableStream extends Readable {
  _recursion;

  close() {
    this.push(null);
    return this._cursor.close();
  }

  _fetch() {
    var self = this;
    if (self._cursor._closed === true) {
      self.push(null);
    }
    else {
      self._cursor._next().then(data => {
        // Silently drop null values for now
        if (data === null) {
          if (this._recursion++ === this._maxRecursion) {
            process.nextTick(function() {
              this._fetch();
            });
          }
          else {
            this._fetch();
          }
        }
        else {
          if (this.push(data) !== false) {
            if (this._recursion++ === this._maxRecursion) {
              process.nextTick(function() {
                this._fetch();
              });
            }
            else {
              this._fetch();
            }
          }
        }
      }).error(error => {
        if (error.message.match(/No more rows in the/)) {
          this.push(null);
        }
        else if (error.message === 'You cannot retrieve data from a cursor that is closed.') {
          // if the user call `close`, the cursor may reject pending requests. We just
          // ignore them here.
        }
        else {
          this.emit('error', error);
        }
      });
    }
  }

  _fetchAndDecrement() {
    var self = this;
    self._pending--;
    if (self._pending < 0) {
      return;
    }

    if (self._cursor._closed === true) {
      self.push(null);
    }
    else {
      self._cursor._next().then(data => {
        // Silently drop null values for now
        if (data === null) {
          if (this._recursion++ === this._maxRecursion) {
            //Avoid maximum call stack errors
            process.nextTick(function() {
              this._fetchAndDecrement();
            });
          }
          else {
            this._fetchAndDecrement();
          }
        }
        else {
          if (this.push(data) !== false) {
            if (this._recursion++ === this._maxRecursion) {
              process.nextTick(function() {
                this._fetchAndDecrement();
              });
            }
            else {
              this._fetchAndDecrement();
            }
          }
        }
      }).error(error => {
        if (error.message.match(/No more rows in the/)) {
          this.push(null);
        }
        else if (error.message === 'You cannot retrieve data from a cursor that is closed.') {
          // if the user call `close`, the cursor may reject pending requests. We just
          // ignore them here.
        }
        else {
          this.emit('error', error);
        }
      });
    }
  }

  _read(size) {
    this._count++;
    if (this._cursor === undefined) {
      this._pending++;
      return;
    }

    this._recursion = 0;
    this._fetch();
  }

  _setCursor(cursor) {
    if (cursor instanceof this.Cursor === false) {
      this.emit('error', new Error('Cannot create a stream on a single value.'));
      return this;
    }
    this._cursor = cursor;
    this._fetchAndDecrement();
  }

  private Cursor = require('./cursor.js');
  _highWaterMark;
  _maxRecursion;
  _index;
  _pending;
  _cursor;

  constructor(options, cursor) {
// Experimental, but should work fine.
    if (cursor) this._cursor = cursor;
    this._pending = 0; // How many time we called _read while no cursor was available
    this._index = 0;
    this._maxRecursion = 1000; // Hardcoded
    this._highWaterMark = options.highWaterMark;

    Readable.call(this, {
      objectMode: true,
      highWaterMark: this._highWaterMark
    });
  }
};

//TODO: Refactor with _fetch?
export = ReadableStream;