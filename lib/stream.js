var Readable = require('stream').Readable;
var util = require('util');

function CursorStream(cursor) {
  if (!(this instanceof CursorStream)) {
    return new CursorStream(cursor);
  }
  Readable.call(this, {
    objectMode: true
  });
  this._cursor = cursor;
}
util.inherits(CursorStream, Readable);

CursorStream.prototype._read = function read() {
  var self = this;
  while(this._cursor.hasNext()) {
    this._cursor.next().then(function (next) {
        self.push(next);
    }).error (function(err) {
        self.emit('error', err);
        return;
    });
  }
};

module.exports = CursorStream;
