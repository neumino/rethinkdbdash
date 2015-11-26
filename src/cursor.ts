import * as helper from './helper';
import Promise = require('bluebird');
import * as Err from './error';
import {EventEmitter} from 'events';

export class Cursor {
  _eventEmitter;
  _setIncludesStates;
  _type;
  _closed;
  _pendingPromises;
  _canFetch;
  _fetching;
  _data;
  _index;
  next;
  eachAsync;
  each;
  options;
  token;
  connection;

  _eachCb(err, data) {
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

  _makeEmitter() {
    this.next = () => {
      throw new Err.ReqlDriverError('You cannot call `next` once you have bound listeners on the ' + this._type);
    };
    this.each = () => {
      throw new Err.ReqlDriverError('You cannot call `each` once you have bound listeners on the ' + this._type);
    };
    this.eachAsync = () => {
      throw new Err.ReqlDriverError('You cannot call `eachAsync` once you have bound listeners on the ' + this._type);
    };
    this.toArray = () => {
      throw new Err.ReqlDriverError('You cannot call `toArray` once you have bound listeners on the ' + this._type);
    };
    this._eventEmitter = new EventEmitter();
  }

  close(callback) {
    var self = this;

    this._closed = true;

    var p = new Promise<any>((resolve, reject) => {
      if ((this._canFetch === false) && (this._fetching === false)) {
        resolve();
      }
      else { // since v0_4 (RethinkDB 2.0) we can (must) force a STOP request even if a CONTINUE query is pending
        this.connection._end(this.token, resolve, reject);
      }
    }).nodeify(callback);
    return p;
  }

  _set(ar) {
    this._fetching = false;
    this._canFetch = false;
    if (ar.length > 0) {
      this._data.push(ar);
    }
    this._flush();
  }

  _done() {
    this._canFetch = false;
  }

  _pushError(error) {
    this._data.push([error]);
    this._flush();
  }

  _flush() {
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
        reject(new Err.ReqlDriverError('No more rows in the ' + this._type.toLowerCase()).setOperational());
      }
    }
  }

  _push(data) {
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

  _fetch() {
    this._fetching = true;

    var p = new Promise((resolve, reject) => {
      this.connection._continue(this.token, resolve, reject);
    }).then(response => {
      this._push(response);
    }).error(error => {
      this._fetching = false;
      this._canFetch = false;
      this._pushError(error);
    });
  }

  hasNext() {
    throw new Error('The `hasNext` command has been removed in 1.13, please use `next`.');
  }

  toJSON() {
    if (this._type === 'Cursor') {
      throw new Err.ReqlDriverError('You cannot serialize a Cursor to JSON. Retrieve data from the cursor with `toArray` or `next`');
    }
    else {
      throw new Err.ReqlDriverError('You cannot serialize a ' + this._type + ' to JSON. Retrieve data from the cursor with `each` or `next`');
    }
  }

  getType() {
    return this._type;
  }

  includesStates() {
    return this._setIncludesStates;
  }

  setIncludesStates() {
    this._setIncludesStates = true;
  }

  toString() {
    return '[object ' + this._type + ']';
  }

  constructor(connection, token, options, type) {
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
      this.toArray = () => {
        throw new Error('The `toArray` method is not available on feeds.');
      };
    }
    this.each = this._each;
    this.eachAsync = this._eachAsync;
    this.next = this._next;
  }

  _eachAsync(callback, onFinish) {
    if (this._closed === true) {
      return callback(new Err.ReqlDriverError('You cannot retrieve data from a cursor that is closed').setOperational());
    }
    var self = this;

    var reject = err => {
      if (err.message === 'No more rows in the ' + this._type.toLowerCase() + '.') {
        if (typeof onFinish === 'function') {
          onFinish();
        }
      }
      else {
        callback(err);
      }
    };
    var resolve = data => callback(data).then(() => {
      if (this._closed === false) {
        return this._next().then(resolve).error(error => {
          if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
            (error.message.match(/You cannot call `next` on a closed/) === null)) {
            reject(error);
          }
        });
      }
      return null;
    });
    return this._next().then(resolve).error(error => {
      // We can silence error when the cursor is closed as this 
      if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
        (error.message.match(/You cannot call `next` on a closed/) === null)) {
        reject(error);
      }
    });
  }

  _each(callback, onFinish) {
    if (this._closed === true) {
      return callback(new Err.ReqlDriverError('You cannot retrieve data from a cursor that is closed').setOperational());
    }
    var self = this;

    var reject = err => {
      if (err.message === 'No more rows in the ' + this._type.toLowerCase() + '.') {
        if (typeof onFinish === 'function') {
          onFinish();
        }
      }
      else {
        callback(err);
      }
    };
    var resolve = data => {
      var keepGoing = callback(null, data);
      if (keepGoing === false) {
        if (typeof onFinish === 'function') {
          onFinish();
        }
      }
      else {
        if (this._closed === false) {
          this._next().then(resolve).error(error => {
            if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
              (error.message.match(/You cannot call `next` on a closed/) === null)) {
              reject(error);
            }
          });
        }
      }
      return null;
    };
    this._next().then(resolve).error(error => {
      // We can silence error when the cursor is closed as this 
      if ((error.message !== 'You cannot retrieve data from a cursor that is closed.') &&
        (error.message.match(/You cannot call `next` on a closed/) === null)) {
        reject(error);
      }
    });
  }

  toArray(callback) {
    var p = new Promise((resolve, reject) => {
      var result = [];
      var i = 0;
      this._each((err, data) => {
        if (err) {
          reject(err);
        }
        else {
          result.push(data);
        }
      }, () => {
        resolve(result);
      });
    }).nodeify(callback);
    return p;
  }

  _next(callback?:(err: any, value?: any) => void) {
    var self = this;
    var p = new Promise<any|Error>(function(resolve, reject) {
      if (self._closed === true) {
        reject(new Err.ReqlDriverError('You cannot call `next` on a closed '+this._type));
      }
      else if ((self._data.length === 0) && (self._canFetch === false)) {
        reject(new Err.ReqlDriverError('No more rows in the '+self._type.toLowerCase()).setOperational());
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
