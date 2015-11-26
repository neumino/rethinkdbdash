import {Transform} from 'stream';
import {Cursor} from './cursor';
import * as util from 'util';

// Experimental, but should work fine.
export class TransformStream extends Transform {
  _flushCallback;
  _writableState;
  _sequence;
  _insertOptions;
  _highWaterMark;
  _connection;
  _delayed;
  _inserting;
  _ended;
  _pendingCallback;
  _cache;
  _options;
  _r;
  _table;
  
  constructor(table, options, connection) {
    super();
    this._table = table;
    this._r = table._r;
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
  }

  _flush(done) {
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

  _insert() {
    var self = this;
    this._inserting = true;

    var cache = this._cache;
    this._cache = [];

    if (Array.isArray(this._sequence)) {
      this._sequence.push(cache.length);
    }

    var pendingCallback = this._pendingCallback;
    this._pendingCallback = null;
    if (typeof pendingCallback === 'function') {
      pendingCallback();
    }

    var query = this._table.insert(cache, this._insertOptions);
    if (this._options.format === 'primaryKey') {
      query = query.do(result => this._r.branch(
        result('errors').eq(0),
        this._table.config()('primary_key').do(primaryKey => result('changes')('new_val')(primaryKey)),
        result(this._r.error(result('errors').coerceTo('STRING').add(' errors returned. First error:\n').add(result('first_error'))))
      ));
    }

    query.run(this._connection).then(result => {
      this._inserting = false;
      if (this._options.format === 'primaryKey') {
        for(var i=0; i<result.length; i++) {
          this.push(result[i]);
        }
      }
      else {
        if (result.errors > 0) {
          this._inserting = false;
          this.emit('error', new Error('Failed to insert some documents:'+JSON.stringify(result, null, 2)));
        }
        else {
          if (this._insertOptions.returnChanges === true) {
            for(var i=0; i<result.changes.length; i++) {
              this.push(result.changes[i].new_val);
            }
          }
        }
      }

      pendingCallback = this._pendingCallback;
      this._pendingCallback = null;
      if (typeof pendingCallback === 'function') {
        // Mean that we can buffer more
        pendingCallback();
      }
      else if (this._ended !== true) {
        if (((((this._writableState.lastBufferedRequest === null) ||
            this._writableState.lastBufferedRequest.chunk === this._cache[this._cache.length-1])))
          && (this._cache.length > 0)) {
          this._insert();
        }
      }
      else if (this._ended === true) {
        if (this._cache.length > 0) {
          this._insert();
        }
        else {
          if (typeof this._flushCallback === 'function') {
            this._flushCallback();
          }
          this.push(null);
        }
      }
    }).error(error => {
      this._inserting = false;
      this.emit('error', error);
    });
  }

  _next(value, encoding, done) {
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
            setImmediate(() => {
              this._next(value, encoding, done);
            });
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
          setImmediate(() => {
            this._next(value, encoding, done);
          });
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

  _transform(value, encoding, done) {
    this._cache.push(value);
    this._next(value, encoding, done);
  }
};

// Everytime we want to insert but do not have a full buffer,
// we recurse with setImmediate to give a chance to the input
// stream to push a few more elements
