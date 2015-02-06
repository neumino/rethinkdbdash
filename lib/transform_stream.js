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
    this._insertOptions = {};
    this._insertOptions.durability = options.durability || 'hard';
    this._insertOptions.conflict = options.conflict || 'error';
    this._insertOptions.returnChanges = true

    Transform.call(this, {
        objectMode: true
    });
};
util.inherits(TransformStream, Transform);

TransformStream.prototype._transform = function(value, encoding, done) {
    if (this._inserting === false) {
        this._cache.push(value);
        var buffer = (typeof this._writableState.getBuffer === 'function') ? this._writableState.getBuffer(): this._writableState.buffer;
        if ((buffer.length > 0) && (buffer[buffer.length-1].chunk !== value)) {
            done();
        }
        else {
            this._pendingCallback = done;
        }
        this._insert();
    }
    else {
        this._cache.push(value);
        if (this._cache.length < this._highWaterMark) {
            var buffer = (typeof this._writableState.getBuffer === 'function') ? this._writableState.getBuffer(): this._writableState.buffer;
            if ((buffer.length > 0) && (buffer[buffer.length-1].chunk !== value)) {
                done();
            }
            else {
                this._pendingCallback = done;
                return false;
            }
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

    self._table.insert(cache, self._insertOptions).run(self._connection).then(function(result) {
        self._inserting = false;
        if (result.errors > 0) {
            self._inserting = false;
            self.emit('error', new Error("Failed to insert some documents:"+JSON.stringify(result, null, 2)));
        }
        else {
          for(var i=0; i<result.changes.length; i++) {
              self.push(result.changes[i].new_val);
          }
          if (self._cache.length > 0) {
              self._insert();
          }
        }
        if (typeof pendingCallback === 'function') {
            pendingCallback();
        }
    }).error(function(error) {
        self._inserting = false;
        self.emit('error', error);
    });
}

TransformStream.prototype._flush = function() {
    this.push(null);
}


module.exports = TransformStream;
