import {Readable} from 'stream';
import * as util from 'util';
import {Cursor} from './cursor';

export class ReadableStream extends Readable {
  private Cursor = Cursor;
  _recursion;
  _highWaterMark;
  _maxRecursion;
  _index;
  _pending;
  _cursor;
  _count;

  constructor(options, cursor?) {
// Experimental, but should work fine.
    super();
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

  close() {
    this.push(null);
    return this._cursor.close();
  }

  _fetch() {
    var self = this;
    if (this._cursor._closed === true) {
      this.push(null);
    }
    else {
      this._cursor._next().then(data => {
        // Silently drop null values for now
        if (data === null) {
          if (this._recursion++ === this._maxRecursion) {
            process.nextTick(() => {
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
              process.nextTick(() => {
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
    this._pending--;
    if (this._pending < 0) {
      return;
    }

    if (this._cursor._closed === true) {
      this.push(null);
    }
    else {
      this._cursor._next().then(data => {
        // Silently drop null values for now
        if (data === null) {
          if (this._recursion++ === this._maxRecursion) {
            //Avoid maximum call stack errors
            process.nextTick(() => {
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
              process.nextTick(() => {
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
};

//TODO: Refactor with _fetch?