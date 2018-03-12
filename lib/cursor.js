var Promise = require('bluebird');
var Err = require(__dirname+'/error.js');
var helper = require(__dirname+'/helper.js');
var EventEmitter = require('events').EventEmitter;

var MAX_CALL_STACK = 1000;

function Cursor(connection, token, options, type) {
  this.connection = connection;
  this.token = token;

  this._stackSize = 0; // Estimation of our call stack.
  this._index = 0; // Position in this._data[0]
  this._data = []; // Array of non empty arrays
  this._fetching = false; // Are we fetching data
  this._canFetch = true; // Can we fetch more data?
  this._pendingPromises = []; // Pending promises' resolve/reject
  this.options = options || {};
  this._closed = false;
  this._closingPromise = null; // Promise returned by close
  this._type = type;
  this._setIncludesStates = false;
  if ((type === 'feed') || (type === 'atomFeed')) {
    this.toArray = _unsupportedToArray;
  }
  this._emittedEnd = false;
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
  if (self._closed === true) {
    return Promise.reject(new Err.ReqlDriverError(
      'You cannot call `next` on a closed '+self._type).setOperational()
    ).nodeify(callback);
  }
  else if ((self._data.length === 0) && (self._canFetch === false)) {
    return Promise.reject(new Err.ReqlDriverError(
      'No more rows in the '+self._type.toLowerCase()).setOperational()
    ).nodeify(callback);
  }
  else {
    if ((self._data.length > 0) && (self._data[0].length > self._index)) {
      var result = self._data[0][self._index++];
      if (result instanceof Error) {
        return Promise.reject(result).nodeify(callback);
      }
      else {
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
        return Promise.resolve(result).nodeify(callback);
      }
    }
    else {
      return new Promise(function(resolve, reject) {
        self._pendingPromises.push({resolve: resolve, reject: reject});
      }).nodeify(callback);
    }
  }
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
    return null;
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
      reject(new Err.ReqlDriverError('No more rows in the '+this._type.toLowerCase()).setOperational())
    }
  }
}
Cursor.prototype._pushError = function(error) {
  this._data.push([error]);
  this._flush();
}

Cursor.prototype._done = function() {
  this._canFetch = false;
  if (this._eventEmitter) {
    this._eventEmitter.emit('end');
  }
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
  if (self._closed === true) {
    return self._closingPromise.nodeify(callback);
  }
  self._closed = true;

  self._closingPromise = new Promise(function(resolve, reject) {
    if ((self._canFetch === false) && (self._fetching === false)) {
      resolve()
    }
    else { // since v0_4 (RethinkDB 2.0) we can (must) force a STOP request even if a CONTINUE query is pending
      var endCallback = function() {
        if (self._eventEmitter && (self._emittedEnd === false)) {
          self._emittedEnd = true;
          self._eventEmitter.emit('end');
        }
        resolve();
      }
      self.connection._end(self.token, endCallback, reject);
    }
  }).nodeify(callback);
  return self._closingPromise;
}
Cursor.prototype._each = function(callback, onFinish) {
  if (this._closed === true) {
    return callback(new Err.ReqlDriverError('You cannot retrieve data from a cursor that is closed').setOperational());
  }
  var self = this;

  var reject = function(err) {
    if (err.message === 'No more rows in the '+self._type.toLowerCase()+'.') {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }
    else {
      callback(err);
    }
    return null;
  }
  var resolve = function(data) {
    self._stackSize++;
    var keepGoing = callback(null, data);
    if (keepGoing === false) {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }
    else {
      if (self._closed === false) {
        if (self._stackSize <= MAX_CALL_STACK) {
          self._next().then(resolve).error(function(error) {
            if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
                (error.message.match(/You cannot call `next` on a closed/) === null)) {
              reject(error);
            }
          });
        }
        else {
          setTimeout(function() {
            self._stackSize = 0;
            self._next().then(resolve).error(function(error) {
              if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
                  (error.message.match(/You cannot call `next` on a closed/) === null)) {
                reject(error);
              }
            });
          }, 0);
        }
      }
    }
    return null;
  }

  self._next().then(resolve).error(function(error) {
    // We can silence error when the cursor is closed as this
    if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
        (error.message.match(/You cannot call `next` on a closed/) === null)) {
      reject(error);
    }
  });
  return null;
}
Cursor.prototype._eachAsync = function(callback) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._eachAsyncInternal(callback, resolve, reject)
  });
}
Cursor.prototype._eachAsyncInternal = function(callback, finalResolve, finalReject) {
  if (this._closed === true) {
    finalReject(new Err.ReqlDriverError('You cannot retrieve data from a cursor that is closed').setOperational());
    return;
  }
  var self = this;

  var nextCb = function() {
    self._stackSize++;
    self._next().then(function(row) {
      if (self._stackSize <= MAX_CALL_STACK) {
        if (callback.length <= 1) {
          Promise.resolve(callback(row)).then(nextCb)
          return null;
        }
        else {
          new Promise(function(resolve, reject) {
            return callback(row, resolve)
          }).then(nextCb);
          return null;
        }
      }
      else {
        new Promise(function(resolve, reject) {
          setTimeout(function() {
            self._stackSize = 0;
            if (callback.length <= 1) {
              Promise.resolve(callback(row)).then(resolve).catch(reject);
            }
            else {
              new Promise(function(resolve, reject) {
                return callback(row, resolve)
              }).then(resolve).catch(reject);
              return null;
            }
          }, 0)
        }).then(nextCb);
        return null;
      }
    }).error(function(error) {
      if ((error.message === 'No more rows in the '+self._type.toLowerCase()+'.') ||
          (error.message === 'You cannot retrieve data from a cursor that is closed.') ||
          (error.message.match(/You cannot call `next` on a closed/) !== null)) {
        return finalResolve();
      }
      return finalReject(Err.setOperational(error));
    });
  }
  nextCb();
}
Cursor.prototype.eachAsync = Cursor.prototype._eachAsync;
Cursor.prototype.next = Cursor.prototype._next;
Cursor.prototype.each = Cursor.prototype._each;
Cursor.prototype._unsupportedToArray = function() {
  throw new Error('The `toArray` method is not available on feeds.')
}

Cursor.prototype._makeEmitter = function() {
  this.next = function() {
    throw new Err.ReqlDriverError('You cannot call `next` once you have bound listeners on the '+this._type)
  }
  this.each = function() {
    throw new Err.ReqlDriverError('You cannot call `each` once you have bound listeners on the '+this._type)
  }
  this.eachAsync = function() {
    throw new Err.ReqlDriverError('You cannot call `eachAsync` once you have bound listeners on the '+this._type)
  }
  this.toArray = function() {
    throw new Err.ReqlDriverError('You cannot call `toArray` once you have bound listeners on the '+this._type)
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
          self._each(self._eachCb.bind(self), function() {
            if (self._emittedEnd === false) {
              self._emittedEnd = true;
              self._eventEmitter.emit('end');
            }
          });
        });
      }
      var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
      self._eventEmitter[method].apply(self._eventEmitter, _args);
    };
  })(i);
}

module.exports = Cursor;
