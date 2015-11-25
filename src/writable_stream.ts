import stream = require('stream');
var Writable = stream.Writable;
var Cursor = require('./cursor.js');
var util = require('util');

// Experimental, but should work fine.
class WritableStream extends Writable {
  _insert() {
    var self = this;
    self._inserting = true;

    var cache = self._cache;
    self._cache = [];

    if (Array.isArray(self._sequence)) {
      self._sequence.push(cache.length);
    }

    self._table.insert(cache, self._insertOptions).run(self._connection).then(result => {
      this._inserting = false;
      if (result.errors > 0) {
        this._inserting = false;
        this.emit('error', new Error('Failed to insert some documents:'+JSON.stringify(result, null, 2)));
      }
      if (typeof this._pendingCallback === 'function') {
        var pendingCallback = this._pendingCallback;
        this._pendingCallback = null;
        pendingCallback();
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
            this._delayed = false;
            // We have to flush
            this._insert();
            // Fill the buffer while we are inserting data
            done();
          }
          else {
            var self = this;
            this._delayed = true;
            setImmediate(() => {
              self._next(value, encoding, done);
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
    else { // We just pushed the last element in the internal buffer
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
          setImmediate(() => {
            self._next(value, encoding, done);
          });
        }
      }
      else {
        this._delayed = false;
        // We cannot call done here as we may be inserting the last batch
        this._pendingCallback = done;
      }
    }
  }

  _write(value, encoding, done) {
    this._i++;
    this._cache.push(value);
    this._next(value, encoding, done);
  }

  _i;
  _sequence;
  _insertOptions;
  _highWaterMark;
  _connection;
  _delayed;
  _inserting;
  _pendingCallback;
  _cache;
  _options;
  _table;

  constructor(table, options, connection) {
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

    Writable.call(this, {
      objectMode: true,
      highWaterMark: this._highWaterMark
    });
    this._i = 0;
  }
};

// Everytime we want to insert but do not have a full buffer,
// we recurse with setImmediate to give a chance to the input
// stream to push a few more elements
