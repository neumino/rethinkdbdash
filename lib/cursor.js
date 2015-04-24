var Promise = require('bluebird');
var Err = require(__dirname+'/error.js');
var helper = require(__dirname+'/helper.js');
var EventEmitter = require('events').EventEmitter;

function Cursor(connection, token, options, type) {
  this.connection = connection;
  this.token = token;

  this._index = 0; // Position in this._data[0]
  this._data = []; // Array of non empty arrays
  this._fetching = false; // Are we fetching data
  this._canFetch = true; // Can we fetch more data?
  this._pendingPromises = []; // Pending promises' resolve/reject
  this.options = options || {};
  this._closed = false;
  this._type = type;
  this._setIncludesStates = false;
  if ((type === 'feed') || (type === 'atomFeed')) {
    this.toArray = function() {
      throw new Error('The `toArray` method is not available on feeds.')
    }
  }
  this.each = this._each;
  this.next = this._next;
}

Cursor.prototype.toString = function() {
  return '[object '+this._type+']';
}
Cursor.prototype.setIncludesStates = function() {
  this._setIncludesStates = true;
}
Cursor.prototype.includesStates = function() {
  return this._setIncludesStates;
}
Cursor.prototype.getType = function() {
  return this._type;
}

Cursor.prototype.toJSON = function() {
  if (this._type === 'Cursor') {
    throw new Err.ReqlDriverError('You cannot serialize a Cursor to JSON. Retrieve data from the cursor with `toArray` or `next`');
  }
  else {
    throw new Err.ReqlDriverError('You cannot serialize a '+this._type+' to JSON. Retrieve data from the cursor with `each` or `next`');
  }
}

Cursor.prototype._next = function(callback) {
  var self = this;
  var p = new Promise(function(resolve, reject) {
    if (self._closed === true) {
      reject(new Err.ReqlDriverError('You cannot called `next` on a closed '+this._type))
    }
    else if ((self._data.length === 0) && (self._canFetch === false)) {
      reject(new Err.ReqlDriverError('No more rows in the '+self._type))
    }
    else {
      if ((self._data.length > 0) && (self._data[0].length > self._index)) {
        var result = self._data[0][self._index++];
        if (result instanceof Error) {
          reject(result);
        }
        else {
          resolve(result);

          // This could be possible if we get back batch with just one document?
          if (self._data[0].length === self._index) {
            self._index = 0;
            self._data.shift();
            if ((self._data.length === 1)
              && (self._canFetch === true)
              && (self._closed === false)
              && (self._fetching === false)) {
                self._fetch();
            }
          }
        }
      }
      else {
        self._pendingPromises.push({resolve: resolve, reject: reject});
      }
    }
  }).nodeify(callback);
  return p;
}
Cursor.prototype.hasNext = function() {
  throw new Error('The `hasNext` command has been removed in 1.13, please use `next`.')
}
Cursor.prototype.toArray = function(callback) {
  var self = this;
  var p = new Promise(function(resolve, reject) {
    var result = [];
    var i =0;
    self._each(function(err, data) {
      if (err) {
        reject(err);
      }
      else {
        result.push(data);
      }
    }, function() {
      resolve(result);
    });
  }).nodeify(callback);
  return p;
}

Cursor.prototype._fetch = function() {
  var self = this;
  this._fetching = true;

  var p = new Promise(function(resolve, reject) {
    self.connection._continue(self.token, resolve, reject);
  }).then(function(response) {
    self._push(response);
  }).error(function(error) {
    self._fetching = false;
    self._canFetch = false;
    self._pushError(error);
  })
}

Cursor.prototype._push = function(data) {
  var couldfetch = this._canFetch;
  if (data.done) this._done();
  var response = data.response;
  this._fetching = false;
  // If the cursor was closed, we ignore all following response
  if ((response.r.length > 0) && (couldfetch === true)) {
    this._data.push(helper.makeSequence(response, this.options));
  }
  // this._fetching = false
  if ((this._closed === false) && (this._canFetch) && (this._data.length <= 1)) this._fetch();
  this._flush();
}
// Try to solve as many pending promises as possible
Cursor.prototype._flush = function() {
  while ((this._pendingPromises.length > 0) && ((this._data.length > 0) || ((this._fetching === false) && (this._canFetch === false)))) {
    var fullfiller = this._pendingPromises.shift(); 
    var resolve = fullfiller.resolve;
    var reject = fullfiller.reject;

    if (this._data.length > 0) {
      var result = this._data[0][this._index++];
      if (result instanceof Error) {
        reject(result);
      }
      else {
        resolve(result);
      }

      if (this._data[0].length === this._index) {
        this._index = 0;
        this._data.shift();
        if ((this._data.length <= 1)
          && (this._canFetch === true)
          && (this._closed === false)
          && (this._fetching === false)) {
            this._fetch();
        }
      }
    }
    else {
      reject(new Err.ReqlDriverError('No more rows in the '+this._type))
    }
  }
}
Cursor.prototype._pushError = function(error) {
  this._data.push([error]);
  this._flush();
}

Cursor.prototype._done = function() {
  this._canFetch = false;
}

Cursor.prototype._set = function(ar) {
  this._fetching = false;
  this._canFetch = false;
  if (ar.length > 0) {
    this._data.push(ar);
  }
  this._flush();
}

Cursor.prototype.close = function(callback) {
  var self = this;

  self._closed = true;

  var p = new Promise(function(resolve, reject) {
    if ((self._canFetch === false) && (self._fetching === false)) {
      resolve()
    }
    else { // since v0_4 (RethinkDB 2.0) we can (must) force a STOP request even if a CONTINUE query is pending
      self.connection._end(self.token, resolve, reject);
    }
  }).nodeify(callback);
  return p;
}
Cursor.prototype._each = function(callback, onFinish) {
  if (this._closed === true) {
    return callback(new Err.ReqlDriverError('You cannot retrieve data from a cursor that is closed'));
  }
  var self = this;

  var reject = function(err) {
    if (err.message === 'No more rows in the '+self._type+'.') {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }
    else {
      callback(err);
    }
  }
  var resolve = function(data) {
    var keepGoing = callback(null, data);
    if (keepGoing === false) {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }
    else {
      if (self._closed === false) {
        self._next().then(resolve).error(function(error) {
          if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
              (error.message.match(/You cannot called `next` on a closed/) === null)) {
            reject(error);
          }
        });
      }
    }
  }

  self._next().then(resolve).error(function(error) {
    // We can silence error when the cursor is closed as this 
    if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
        (error.message.match(/You cannot called `next` on a closed/) === null)) {
      reject(error);
    }

  });
}
Cursor.prototype._makeEmitter = function() {
  this.next = function() {
    throw new Err.ReqlDriverError('You cannot called `next` once you have bound listeners on the '+this._type)
  }
  this.each = function() {
    throw new Err.ReqlDriverError('You cannot called `each` once you have bound listeners on the '+this._type)
  }
  this.toArray = function() {
    throw new Err.ReqlDriverError('You cannot called `toArray` once you have bound listeners on the '+this._type)
  }
  this._eventEmitter = new EventEmitter();
}
Cursor.prototype._eachCb = function(err, data) {
  // We should silent things if the cursor/feed is closed
  if (this._closed === false) {
    if (err) {
      this._eventEmitter.emit('error', err);
    }
    else {
      this._eventEmitter.emit('data', data);
    }
  }
}

var methods = [
  'addListener',
  'on',
  'once',
  'removeListener',
  'removeAllListeners',
  'setMaxListeners',
  'listeners',
  'emit'
];

for(var i=0; i<methods.length; i++) {
  (function(n) {
    var method = methods[n];
    Cursor.prototype[method] = function() {
      var self = this;
      if (self._eventEmitter == null) {
        self._makeEmitter();
        setImmediate(function() {
          if ((self._type === 'feed') || (self._type === 'atomFeed')) {
            self._each(self._eachCb.bind(self));
          }
          else {
            self._each(self._eachCb.bind(self), function() {
              self._eventEmitter.emit('end');
            });
          }
        });
      }
      var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
      self._eventEmitter[method].apply(self._eventEmitter, _args);
    };
  })(i);
}

module.exports = Cursor;
