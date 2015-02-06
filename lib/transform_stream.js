var Transform = require('stream').Transform;
var Cursor = require(__dirname+"/cursor.js");
var util = require('util');

// Experimental, but should work fine.
function TransformStream(table, options, connection) {
    this._table = table;
    this._options = options;
    this._cache = [];
    this._pendingCallback = null;
    this._inserting = false;
    this._connection = connection;
    this._highWaterMark = options.highWaterMark || 100;

    Transform.call(this, {
        objectMode: true
    });
};
util.inherits(TransformStream, Transform);

TransformStream.prototype._transform = function(value, encoding, done) {
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
TransformStream.prototype._insert = function() {
    var self = this;
    self._inserting = true;

    var cache = self._cache;
    var pendingCallback = self._pendingCallback;
    self._pendingCallback = null;
    self._cache = [];

    if (typeof pendingCallback === 'function') {
        pendingCallback();
    }

    self._table.insert(cache, {returnChanges: true}).run(self._connection).then(function(result) {
        self._inserting = false;
        if (result.inserted !== cache.length) {
            self._inserting = false;
            self.emit('error', new Error("The number of inserted document is too low:"+JSON.stringify(result, null, 2)));
        }
        else {
          for(var i=0; i<result.changes.length; i++) {
              self.push(result.changes[i].new_val);
          }
          if (self._cache.length > 0) {
              self._insert();
          }
        }

    }).error(function(error) {
        self._inserting = false;
        self.emit('error', error);
    });
}

TransformStream.prototype._flush = function() {
}


module.exports = TransformStream;
