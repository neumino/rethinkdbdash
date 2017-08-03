var Promise = require('bluebird');
var protodef = require(__dirname+'/protodef.js');
var termTypes = protodef.Term.TermType;

var Error = require(__dirname+'/error.js');
var helper = require(__dirname+'/helper.js');
var ReadableStream = require(__dirname+'/stream.js');
var WritableStream = require(__dirname+'/writable_stream.js');
var TransformStream = require(__dirname+'/transform_stream.js');

function Term(r, value, error) {
  var self = this;
  var term = function(field) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
      Term.prototype._arity(_args, 1, '(...)', self);
    }
    return term.bracket(field);
  }
  helper.changeProto(term, self);

  if (value === undefined) {
    term._query = [];
  }
  else {
    term._query = value;
  }
  term._r = r; // Keep a reference to r for global settings

  if (error !== undefined) {
    term._error = error;
    term._frames = [];
  }

  return term;
}

// run([connection][, options][, callback])
Term.prototype.run = function(connection, options, callback) {
  var self = this;

  if (self._error != null) {
    var error = new Error.ReqlRuntimeError(self._error, self._query, {b: self._frames});
    return Promise.reject(error);
  }

  if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    else {
      if (!helper.isPlainObject(options)) options = {};
    }

    if (connection._isOpen() !== true) {
      return new Promise(function(resolve, reject) {
        reject(new Error.ReqlDriverError('`run` was called with a closed connection', self._query).setOperational());
      });
    }
    var p = new Promise(function(resolve, reject) {
      var token = connection._getToken();

      var query = [protodef.Query.QueryType.START];
      query.push(self._query);

      var _options = {};
      var sendOptions = false;
      if (connection.db != null) {
        sendOptions = true;
        _options.db = self._r.db(connection.db)._query;
      }

      if (self._r.arrayLimit != null) {
        sendOptions = true;
        _options[self._translateArgs['arrayLimit']] = self._r.arrayLimit;
      };


      var keepGoing = true; // we need it just to avoir calling resolve/reject multiple times
      helper.loopKeys(options, function(options, key) {
        if (keepGoing === true) {
          if ((key === 'readMode') || (key === 'durability') || (key === 'db') ||
            (key === 'noreply') || (key === 'arrayLimit') || (key === 'profile') ||
            (key === 'minBatchRows') || (key === 'maxBatchRows') || (key === 'maxBatchBytes') ||
            (key === 'maxBatchSeconds') || (key === 'firstBatchScaledownFactor')) {

            sendOptions = true;
            if (key === 'db') {
              _options[key] = self._r.db(options[key])._query;
            }
            else if (self._translateArgs.hasOwnProperty(key)) {
              _options[self._translateArgs[key]] = new Term(self._r).expr(options[key])._query;
            }
            else {
              _options[key] = new Term(self._r).expr(options[key])._query;
            }
          }
          else if ((key !== 'timeFormat') && (key !== 'groupFormat') &&
              (key !== 'binaryFormat') && (key !== 'cursor') &&
              (key !== 'readable') && (key !== 'writable') &&
              (key !== 'transform') && (key !== 'stream') &&
              (key !== 'highWaterMark')) {
            reject(new Error.ReqlDriverError('Unrecognized option `'+key+'` in `run`. Available options are readMode <string>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>, binaryFormat <bool>, cursor <bool>, stream <bool>'));
            keepGoing = false;
          }
        }
      });

      if (keepGoing === false) {
        connection.emit('release');
        return // The promise was rejected in the loopKeys
      }

      if (sendOptions === true) {
        query.push(_options);
      }
      connection._send(query, token, resolve, reject, self._query, options);
    }).nodeify(callback);
  }
  else {
    var poolMaster = self._r.getPoolMaster(); // if self._r is defined, so is self._r.getPool()
    if (!poolMaster) {
      throw new Error.ReqlDriverError('`run` was called without a connection and no pool has been created', self._query);
    }
    else {
      if (typeof connection === 'function') {
        // run(callback);
        callback = connection;
        options = {};
      }
      else if (helper.isPlainObject(connection)) {
        // run(options[, callback])
        callback = options;
        options = connection;
      }
      else {
        options = {};
      }


      var p = new Promise(function(resolve, reject) {
        poolMaster.getConnection().then(function(connection) {
          var token = connection._getToken();
          var query = [protodef.Query.QueryType.START];
          query.push(self._query);

          var _options = {};
          var sendOptions = false;
          if (connection.db != null) {
            sendOptions = true;
            _options.db = self._r.db(connection.db)._query;
          }
          if (self._r.arrayLimit != null) {
            sendOptions = true;
            _options[self._translateArgs['arrayLimit']] = self._r.arrayLimit;
          };

          var keepGoing = true;
          helper.loopKeys(options, function(options, key) {
            if (keepGoing === true) {
              if ((key === 'readMode') || (key === 'durability') || (key === 'db') ||
                  (key === 'noreply') || (key === 'arrayLimit') || (key === 'profile') ||
                  (key === 'minBatchRows') || (key === 'maxBatchRows') || (key === 'maxBatchBytes') ||
                  (key === 'maxBatchSeconds') || (key === 'firstBatchScaledownFactor')) {


                sendOptions = true;
                if (key === 'db') {
                  _options[key] = self._r.db(options[key])._query;
                }
                else if (self._translateArgs.hasOwnProperty(key)) {
                  _options[self._translateArgs[key]] = new Term(self._r).expr(options[key])._query
                }
                else {
                  _options[key] = new Term(self._r).expr(options[key])._query
                }
              }
              else if ((key !== 'timeFormat') && (key !== 'groupFormat') &&
                  (key !== 'binaryFormat') && (key !== 'cursor') &&
                  (key !== 'readable') && (key !== 'writable') &&
                  (key !== 'transform') && (key !== 'stream') &&
                  (key !== 'highWaterMark')) {

                setTimeout( function() {
                  reject(new Error.ReqlDriverError('Unrecognized option `'+key+'` in `run`. Available options are readMode <string>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>, binaryFormat <string>, cursor <bool>, stream <bool>'));
                }, 0);
                keepGoing = false;
                return false;
              }
            }
          });

          if (keepGoing === false) {
            connection.emit('release');
            return // The promise was rejected in the loopKeys
          }

          if (sendOptions === true) {
            query.push(_options);
          }
          connection._send(query, token, resolve, reject, self._query, options);
        }).error(function(error) {
          reject(error);
        });
      }).nodeify(callback);
    }
  }

  //if (options.noreply) return self; // Do not return a promise if the user ask for no reply.

  return p;
}

Term.prototype.toStream = function(connection, options) {
  if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
    if (helper.isPlainObject(options) === false) {
      options = {};
    }
    if (options.readable === true) {
      return this._toReadableStream(connection, options);
    }
    else if (options.writable === true) {
      return this._toWritableStream(connection, options);
    }
    else if (options.transform === true) {
      return this._toTransformStream(connection, options);
    }
    else {
      return this._toReadableStream(connection, options);
    }
  }
  else {
    options = connection;
    if (helper.isPlainObject(options) === false) {
      options = {};
    }
    if (options.readable === true) {
      return this._toReadableStream(options);
    }
    else if (options.writable === true) {
      return this._toWritableStream(options);
    }
    else if (options.transform === true) {
      return this._toTransformStream(options);
    }
    else {
      return this._toReadableStream(options);
    }
  }
}

Term.prototype._toReadableStream = function(connection, options) {
  var stream;

  var _options = {};
  if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
    //toStream make sure that options is an object
    helper.loopKeys(options, function(obj, key) {
      _options[key] = obj[key];
    });
    _options.cursor = true;
    stream = new ReadableStream(_options);
    this.run(connection, _options).then(function(cursor) {
      stream._setCursor(cursor);
      return null;
    }).error(function(error) {
      stream.emit('error', error);
    });
  }
  else {
    helper.loopKeys(connection, function(obj, key) {
      _options[key] = obj[key];
    });
    _options.cursor = true;
    stream = new ReadableStream(_options);
    this.run(_options).then(function(cursor) {
      stream._setCursor(cursor);
      return null;
    }).error(function(error) {
      stream.emit('error', error);
    });
  }
  return stream;
}

Term.prototype._toWritableStream = function(connection, options) {
  if (this._query[0] !== termTypes.TABLE) {
    throw new Error.ReqlDriverError('Cannot create a writable stream on something else than a table.');
  }

  if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
    return new WritableStream(this, options, connection);
  }
  else {
    return new WritableStream(this, connection);
  }
}
Term.prototype._toTransformStream = function(connection, options) {
  if (this._query[0] !== termTypes.TABLE) {
    throw new Error.ReqlDriverError('Cannot create a writable stream on something else than a table.');
  }

  if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
    return new TransformStream(this, options, connection);
  }
  else {
    return new TransformStream(this, connection);
  }
}


// Manipulating databases
Term.prototype.dbCreate = function(db) {
  // Check for arity is done in r.prototype.dbCreate
  this._noPrefix(this, 'dbCreate');

  var term = new Term(this._r);
  term._query.push(termTypes.DB_CREATE);
  var args = [new Term(this._r).expr(db)._query]
  term._fillArgs(args);
  return term;
}
Term.prototype.dbDrop = function(db) {
  this._noPrefix(this, 'dbDrop');

  var term = new Term(this._r);
  term._query.push(termTypes.DB_DROP);
  var args = [new Term(this._r).expr(db)._query]
  term._fillArgs(args);
  return term;
}
Term.prototype.dbList = function() {
  this._noPrefix(this, 'dbList');

  var term = new Term(this._r);
  term._query.push(termTypes.DB_LIST)
  return term;
}

// Manipulating Tables
Term.prototype.tableCreate = function(table, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'tableCreate', self);
  }


  var term = new Term(self._r);
  term._query.push(termTypes.TABLE_CREATE)

  var args = [];
  if (Array.isArray(self._query) && (self._query.length > 0)) {
    args.push(self); // Push db
  }
  args.push(new Term(self._r).expr(table))
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    // Check for non valid key
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'primaryKey')
          && (key !== 'durability')
          && (key !== 'shards')
          && (key !== 'replicas')
          && (key !== 'primaryReplicaTag')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `tableCreate`', self._query, 'Available options are primaryKey <string>, durability <string>, shards <number>, replicas <number/object>, primaryReplicaTag <object>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}

Term.prototype.tableDrop = function(table) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'tableDrop', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TABLE_DROP)

  var args = [];
  if (!Array.isArray(this._query) || (this._query.length > 0)) {
    args.push(this); // push db
  }
  args.push(new Term(this._r).expr(table))
  term._fillArgs(args);
  return term;
}
Term.prototype.tableList = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'tableList', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TABLE_LIST);

  var args = [];
  if (!Array.isArray(this._query) || (this._query.length > 0)) {
    args.push(this);
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.indexList = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'indexList', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INDEX_LIST);
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.indexCreate = function(name, fn, options) {
  if (this._fastArityRange(arguments.length, 1, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 3, 'indexCreate', this);
  }

  if ((options == null) && (helper.isPlainObject(fn))) {
    options = fn;
    fn = undefined;
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INDEX_CREATE);
  var args = [this];
  args.push(new Term(this._r).expr(name));
  if (typeof fn !== 'undefined') args.push(new Term(this._r).expr(fn)._wrap());
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    // There is no need to translate here
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'multi') && (key !== 'geo')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `indexCreate`', self._query, 'Available option is multi <bool> and geo <bool>');
      }
    });
    term._query.push(new Term(this._r).expr(options)._query);
  }
  return term;
}
Term.prototype.indexDrop = function(name) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'indexDrop', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INDEX_DROP);
  var args = [this, new Term(this._r).expr(name)];
  term._fillArgs(args);
  return term;
}

Term.prototype.indexStatus = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this._r);
  term._query.push(termTypes.INDEX_STATUS);
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.indexWait = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this._r);
  term._query.push(termTypes.INDEX_WAIT);
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.indexRename = function(oldName, newName, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 2, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 2, 3, 'indexRename', self);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INDEX_RENAME);
  var args = [this, new Term(this._r).expr(oldName), new Term(this._r).expr(newName)];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if (key !== 'overwrite') {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `indexRename`', self._query, 'Available options are overwrite <bool>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }


  return term;
}
Term.prototype.changes = function(options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 0, 1, 'changes', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.CHANGES);
  var args = [self];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'squash') && (key !== 'includeStates') && (key !== 'includeTypes')
          && (key !== 'includeInitial') && (key !== 'includeOffsets')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `changes`', self._query,
            'Available options are squash <bool>, includeInitial <bool>, includeStates <bool>, includeOffsets <bool>, includeTypes <bool>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}

// Writing data
Term.prototype.insert = function(documents, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'insert', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.INSERT);
  var args = [self, new Term(self._r).expr(documents)];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'returnChanges') && (key !== 'durability') && (key !== 'conflict')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `insert`', self._query, 'Available options are returnChanges <bool>, durability <string>, conflict <string>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.update = function(newValue, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'update', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.UPDATE);
  var args = [self, new Term(self._r).expr(newValue)._wrap()];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'returnChanges') && (key !== 'durability') && (key !== 'nonAtomic')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `update`', self._query, 'Available options are returnChanges <bool>, durability <string>, nonAtomic <bool>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.replace = function(newValue, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'replace', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.REPLACE);
  var args = [self, new Term(self._r).expr(newValue)._wrap()];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'returnChanges') && (key !== 'durability') && (key !== 'nonAtomic')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `replace`', self._query, 'Available options are returnChanges <bool>, durability <string>, nonAtomic <bool>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.delete = function(options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 0, 1, 'delete', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.DELETE);
  var args = [self];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'returnChanges') && (key !== 'durability')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `delete`', self._query, 'Available options are returnChanges <bool>, durability <string>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.sync = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'sync', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SYNC)
  var args = [this._query];
  term._fillArgs(args);
  return term;
}

// Selecting data
Term.prototype.db = function(db) {
  this._noPrefix(this, 'db');
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'db', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DB)
  var args = [new Term(this._r).expr(db)];
  term._fillArgs(args);
  return term;
}
Term.prototype.table = function(table, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'table', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.TABLE)

  var args = [];
  if (Array.isArray(self._query) && (self._query.length > 0)) {
    args.push(self);
  }
  args.push(new Term(self._r).expr(table))
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if (key !== 'readMode') {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `table`', self._query, 'Available option is readMode <string>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.get = function(primaryKey) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'get', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.GET);
  var args = [this, new Term(this._r).expr(primaryKey)]
  term._fillArgs(args);
  return term;
}
Term.prototype.getAll = function() {
  // We explicitly _args here, so fastArityRange is not useful
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this._r);
  term._query.push(termTypes.GET_ALL);

  var args = [];
  args.push(this);
  for(var i=0; i<_args.length-1; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  if ((_args.length > 0) && (helper.isPlainObject(_args[_args.length-1])) && (_args[_args.length-1].index !== undefined)) {
    term._fillArgs(args);
    term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length-1]))._query);
  }
  else if (_args.length > 0) {
    args.push(new Term(this._r).expr(_args[_args.length-1]))
    term._fillArgs(args);
  } else {
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.between = function(start, end, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 2, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 2, 3, 'between', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.BETWEEN);
  var args = [self, new Term(self._r).expr(start), new Term(self._r).expr(end)]
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'index') && (key !== 'leftBound') && (key !== 'rightBound')){
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `between`', self._query, 'Available options are index <string>, leftBound <string>, rightBound <string>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.minval = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.MINVAL);
  return term;
}
Term.prototype.maxval = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.MAXVAL);
  return term;
}

Term.prototype.filter = function(filter, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'filter', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.FILTER);
  var args = [self, new Term(self._r).expr(filter)._wrap()]
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if (key !== 'default') {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `filter`', self._query, 'Available option is filter');
      }
    })
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}

// Joins
Term.prototype.innerJoin = function(sequence, predicate) {
  if (this._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 2, 'innerJoin', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INNER_JOIN);
  var args = [this._query];
  args.push(new Term(this._r).expr(sequence)._query);
  args.push(new Term(this._r).expr(predicate)._wrap()._query);
  term._fillArgs(args);

  return term;
}
Term.prototype.outerJoin = function(sequence, predicate) {
  if (this._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 2, 'outerJoin', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.OUTER_JOIN);
  var args = [this];
  args.push(new Term(this._r).expr(sequence));
  args.push(new Term(this._r).expr(predicate)._wrap());
  term._fillArgs(args);

  return term;
}
Term.prototype.eqJoin = function(rightKey, sequence, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 2, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 2, 3, 'eqJoin', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.EQ_JOIN);
  var args = [self];
  args.push(new Term(self._r).expr(rightKey)._wrap());
  args.push(new Term(self._r).expr(sequence));
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'index') && (key !== 'ordered')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `eqJoin`', self._query, 'Available options are index <string>, ordered <boolean>');
      }
    })
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.zip = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'zip', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.ZIP);
  var args = [this];
  term._fillArgs(args);
  return term;
}



// Transformation
Term.prototype.map = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'map', this);

  var term = new Term(this._r);
  term._query.push(termTypes.MAP);
  var args = [];
  if (!Array.isArray(this._query) || (this._query.length > 0)) {
    args.push(this);
  }
  for(var i=0; i<_args.length-1; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  // Make sure that we don't push undefined if no argument is passed to map,
  // in which case the server will handle the case and return an error.
  if (_args.length> 0) {
    args.push(new Term(this._r).expr(_args[_args.length-1])._wrap())
  }
  term._fillArgs(args);

  return term;
}
Term.prototype.withFields = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'withFields', this);

  var term = new Term(this._r);
  term._query.push(termTypes.WITH_FIELDS);
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);

  return term;
}
Term.prototype.concatMap = function(transformation) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'concatMap', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.CONCAT_MAP);
  var args = [this];
  args.push(new Term(this._r).expr(transformation)._wrap())
  term._fillArgs(args);

  return term;
}
Term.prototype.orderBy = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'orderBy', this);

  var term = new Term(this._r);
  term._query.push(termTypes.ORDER_BY);

  var args = [this];
  for(var i=0; i<_args.length-1; i++) {
    if ((_args[i] instanceof Term) &&
        ((_args[i]._query[0] === termTypes.DESC) || (_args[i]._query[0] === termTypes.ASC))) {
      args.push(new Term(this._r).expr(_args[i]))
    }
    else {
      args.push(new Term(this._r).expr(_args[i])._wrap())
    }
  }
  // We actually don't need to make the difference here, but...
  if ((_args.length > 0) && (helper.isPlainObject(_args[_args.length-1])) && (_args[_args.length-1].index !== undefined)) {
    term._fillArgs(args);
    term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length-1]))._query);
  }
  else {
    if ((_args[_args.length-1] instanceof Term) &&
      ((_args[_args.length-1]._query[0] === termTypes.DESC) || (_args[_args.length-1]._query[0] === termTypes.ASC))) {
      args.push(new Term(this._r).expr(_args[_args.length-1]))
    }
    else {
      args.push(new Term(this._r).expr(_args[_args.length-1])._wrap())
    }
    term._fillArgs(args);
  }
  return term;

}
Term.prototype.desc = function(field) {
  this._noPrefix(this, 'desc');
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'desc', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DESC)
  var args = [new Term(this._r).expr(field)._wrap()];
  term._fillArgs(args);
  return term;
}
Term.prototype.asc = function(field) {
  this._noPrefix(this, 'asc');
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'asc', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.ASC)
  var args = [new Term(this._r).expr(field)._wrap()];
  term._fillArgs(args);
  return term;
}
Term.prototype.skip = function(value) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'skip', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SKIP)
  var args = [this, new Term(this._r).expr(value)]
  term._fillArgs(args);
  return term;
}
Term.prototype.limit = function(value) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'limit', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.LIMIT)
  var args = [this, new Term(this._r).expr(value)]
  term._fillArgs(args);
  return term;
}
Term.prototype.slice = function(start, end, options) {
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 3, 'slice', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SLICE);

  var args = [];
  args.push(this);
  args.push(new Term(this._r).expr(start));

  if ((end !== undefined) && (options !== undefined)) {
    args.push(new Term(this._r).expr(end));
    term._fillArgs(args);
    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }
  else if ((end !== undefined) && (options === undefined)) {
    if (helper.isPlainObject(end) === false) {
      args.push(new Term(this._r).expr(end));
      term._fillArgs(args);
    }
    else {
      term._fillArgs(args);
      term._query.push(new Term(this._r).expr(translateOptions(end))._query);
    }
  }
  else { // end and options are both undefined
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.nth = function(value) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'nth', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.NTH)
  var args = [this._query, new Term(this._r).expr(value)]
  term._fillArgs(args);
  return term;
}
Term.prototype.offsetsOf = function(predicate) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'indexesOf', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.OFFSETS_OF)
  var args = [this, new Term(this._r).expr(predicate)._wrap()];
  term._fillArgs(args);
  return term;
}
Term.prototype.indexesOf = Term.prototype.offsetsOf;

Term.prototype.isEmpty = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'isEmpty', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.IS_EMPTY)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.union = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this._r);
  term._query.push(termTypes.UNION)
  var args = [];
  if (!Array.isArray(this._query) || (this._query.length > 0)) {
    args.push(this);
  }
  for(var i=0; i<_args.length-1; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  if ((_args.length > 1) && (helper.isPlainObject(_args[_args.length-1])) && (_args[_args.length-1].interleave !== undefined)) {
    term._fillArgs(args);
    term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length-1]))._query);
  }
  else if (_args.length > 0) {
    args.push(new Term(this._r).expr(_args[_args.length-1]))
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.sample = function(size) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'sample', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SAMPLE)
  var args = [this, new Term(this._r).expr(size)];
  term._fillArgs(args);
  return term;
}

// Aggregations
Term.prototype.reduce = function(func) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'reduce', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.REDUCE)
  var args = [this, new Term(this._r).expr(func)._wrap()];
  term._fillArgs(args);
  return term;
}
Term.prototype.count = function(filter) {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'count', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.COUNT);
  var args = [];
  args.push(this);
  if (filter !== undefined) {
    args.push(new Term(this._r).expr(filter)._wrap())
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.distinct = function(options) {
  var self= this;
  if (self._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 0, 1, 'distinct', self);
  }

  var term = new Term(self._r);
  term._query.push(termTypes.DISTINCT)
  var args = [self];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    var keepGoing = true;
    helper.loopKeys(options, function(obj, key) {
      if ((keepGoing === true) && (key !== 'index')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `distinct`', self._query, 'Available option is index: <string>');
        keepGoing = false;
      }
    });
    if (keepGoing === true) {
      term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
  }

  return term;
}
Term.prototype.group = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var self = this;
  self._arityRange(_args, 1, Infinity, 'group', self);

  var term = new Term(self._r);
  term._query.push(termTypes.GROUP);
  var args = [self];
  for(var i=0; i<_args.length-1; i++) {
    args.push(new Term(self._r).expr(_args[i])._wrap())
  }
  if (_args.length > 0) {
    if (helper.isPlainObject(_args[_args.length-1])) {
      helper.loopKeys(_args[_args.length-1], function(obj, key) {
         if ((key !== 'index')
        && (key !==  'multi')) {
          throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `group`', self._query, 'Available options are index: <string>, multi <boolean>');
        }
      });
      term._fillArgs(args);
      term._query.push(new Term(self._r).expr(translateOptions(_args[_args.length-1]))._query);
    }
    else {
      args.push(new Term(self._r).expr(_args[_args.length-1])._wrap())
      term._fillArgs(args);
    }
  }
  else {
    term._fillArgs(args);
  }

  return term;
}
Term.prototype.split = function(separator, max) {
  if (this._fastArityRange(arguments.length, 0, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 2, 'split', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SPLIT)
  var args = [this];
  if (separator !== undefined) {
    args.push(new Term(this._r).expr(separator))
    if (max !== undefined) {
      args.push(new Term(this._r).expr(max))
    }
  }
  term._fillArgs(args);

  return term;
}

Term.prototype.ungroup = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'ungroup', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.UNGROUP)
  var args = [this._query];
  term._fillArgs(args);
  return term;
}
Term.prototype.contains = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'contains', this);

  var term = new Term(this._r);
  term._query.push(termTypes.CONTAINS)
  var args = [this._query];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i])._wrap())
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.sum = function(field) {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'sum', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SUM);
  var args = [this];
  if (field !== undefined) {
    args.push(new Term(this._r).expr(field)._wrap())
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.avg = function(field) {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'avg', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.AVG)
  var args = [this];
  if (field !== undefined) {
    args.push(new Term(this._r).expr(field)._wrap())
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.min = function(field) {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'min', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.MIN)
  var args = [this];
  if (field !== undefined) {
    if (helper.isPlainObject(field)) {
      term._fillArgs(args);
      term._query.push(new Term(this._r).expr(translateOptions(field))._query);
    }
    else {
      args.push(new Term(this._r).expr(field)._wrap());
      term._fillArgs(args);
    }
  }
  else {
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.max = function(field) {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'max', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.MAX)
  var args = [this];
  if (field !== undefined) {
    if (helper.isPlainObject(field)) {
      term._fillArgs(args);
      term._query.push(new Term(this._r).expr(translateOptions(field))._query);
    }
    else {
      args.push(new Term(this._r).expr(field)._wrap())
      term._fillArgs(args);
    }
  }
  else {
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.fold = function(base, func, options) {
  if (this._fastArityRange(arguments.length, 2, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 2, 3, 'range', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.FOLD)
  var args = [this, new Term(this._r).expr(base), new Term(this._r).expr(func)._wrap()];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'emit') && (key !== 'finalEmit')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `fold`. Available options are emit <function>, finalEmit <function>');
      }
    });
    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }
  return term;
}



// Document manipulation
Term.prototype.row = function() {
  this._noPrefix(this, 'row');
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'r.row', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.IMPLICIT_VAR)
  return term;
}
Term.prototype.pluck = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'pluck', this);

  var term = new Term(this._r);
  term._query.push(termTypes.PLUCK)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.without = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'without', this);

  var term = new Term(this._r);
  term._query.push(termTypes.WITHOUT)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.merge = function(arg) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'merge', this);

  var term = new Term(this._r);
  term._query.push(termTypes.MERGE)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i])._wrap())
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.literal = function(obj) {
  this._noPrefix(this, 'literal');
  // The test for arity is performed in r.literal

  var term = new Term(this._r);
  term._query.push(termTypes.LITERAL);
  if (arguments.length > 0) {
    var args = [new Term(this._r).expr(obj)];
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.append = function(value) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'append', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.APPEND)
  var args = [this, new Term(this._r).expr(value)];
  term._fillArgs(args);
  return term;
}
Term.prototype.prepend = function(value) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'prepend', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.PREPEND)
  var args = [this, new Term(this._r).expr(value)];
  term._fillArgs(args);
  return term;
}
Term.prototype.difference = function(other) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'difference', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DIFFERENCE)
  var args = [this, new Term(this._r).expr(other)];
  term._fillArgs(args);
  return term;
}
Term.prototype.setInsert = function(other) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'setInsert', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SET_INSERT)
  var args = [this, new Term(this._r).expr(other)];
  term._fillArgs(args);
  return term;
}
Term.prototype.setUnion = function(other) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'setUnion', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SET_UNION)
  var args = [this, new Term(this._r).expr(other)];
  term._fillArgs(args);
  return term;
}
Term.prototype.setIntersection = function(other) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'setIntersection', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SET_INTERSECTION)
  var args = [this, new Term(this._r).expr(other)];
  term._fillArgs(args);
  return term;
}
Term.prototype.setDifference = function(other) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'setDifference', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SET_DIFFERENCE)
  var args = [this, new Term(this._r).expr(other)];
  term._fillArgs(args);
  return term;
}
Term.prototype.getField = function(field) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, '(...)', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.GET_FIELD)
  var args = [this, new Term(this._r).expr(field)];
  term._fillArgs(args);
  return term;
}
Term.prototype.bracket = function(field) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, '(...)', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.BRACKET)
  var args = [this, new Term(this._r).expr(field)];
  term._fillArgs(args);
  return term;
}

Term.prototype.hasFields = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'hasFields', this);

  var term = new Term(this._r);
  term._query.push(termTypes.HAS_FIELDS)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;

}
Term.prototype.insertAt = function(index, value) {
  if (this._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 2, 'insertAt', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INSERT_AT)
  var args = [this, new Term(this._r).expr(index), new Term(this._r).expr(value)];
  term._fillArgs(args);
  return term;
}
Term.prototype.spliceAt = function(index, array) {
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'spliceAt', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SPLICE_AT)
  var args = [this, new Term(this._r).expr(index), new Term(this._r).expr(array)];
  term._fillArgs(args);
  return term;
}
Term.prototype.deleteAt = function(start, end) {
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'deleteAt', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DELETE_AT);
  var args = [this, new Term(this._r).expr(start)];
  if (end !== undefined) {
    args.push(new Term(this._r).expr(end))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.changeAt = function(index, value) {
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'changeAt', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.CHANGE_AT);
  var args = [this];
  args.push(new Term(this._r).expr(index))
  args.push(new Term(this._r).expr(value))
  term._fillArgs(args);
  return term;
}
Term.prototype.keys = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'keys', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.KEYS)
  var args = [this];
  term._fillArgs(args);
  return term;
}

Term.prototype.values = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'keys', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.VALUES)
  var args = [this];
  term._fillArgs(args);
  return term;
}

Term.prototype.object = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._noPrefix(this, 'object');
  this._arityRange(_args, 0, Infinity, 'object', this);

  var term = new Term(this._r);
  term._query.push(termTypes.OBJECT)
  var args = [];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}



// String
Term.prototype.match = function(regex) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'match', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.MATCH)
  var args = [this, new Term(this._r).expr(regex)];
  term._fillArgs(args);
  return term;
}
Term.prototype.upcase = function(regex) {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'upcase', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.UPCASE)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.downcase = function(regex) {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'upcase', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DOWNCASE)
  var args = [this];
  term._fillArgs(args);
  return term;
}




// Math and Logic
Term.prototype.add = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'add', this);

  var term = new Term(this._r);
  term._query.push(termTypes.ADD)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.sub = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'sub', this);

  var term = new Term(this._r);
  term._query.push(termTypes.SUB)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.mul = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'mul', this);

  var term = new Term(this._r);
  term._query.push(termTypes.MUL)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.div = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'div', this);

  var term = new Term(this._r);
  term._query.push(termTypes.DIV)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.mod = function(b) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'mod', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.MOD)
  var args = [this, new Term(this._r).expr(b)];
  term._fillArgs(args);
  return term;
}
Term.prototype.and = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this._r);
  term._query.push(termTypes.AND)
  var args = [];
  if (!Array.isArray(this._query) || (this._query.length > 0)) {
    args.push(this);
  }
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.or = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this._r);
  term._query.push(termTypes.OR)
  var args = [];
  if (!Array.isArray(this._query) || (this._query.length > 0)) {
    args.push(this);
  }
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.eq = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'eq', this);

  var term = new Term(this._r);
  term._query.push(termTypes.EQ)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.ne = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'ne', this);

  var term = new Term(this._r);
  term._query.push(termTypes.NE)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.gt = function(other) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'gt', this);

  var term = new Term(this._r);
  term._query.push(termTypes.GT)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.ge = function(other) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'ge', this);

  var term = new Term(this._r);
  term._query.push(termTypes.GE)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.lt = function(other) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'lt', this);

  var term = new Term(this._r);
  term._query.push(termTypes.LT)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.le = function(other) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 1, Infinity, 'le', this);

  var term = new Term(this._r);
  term._query.push(termTypes.LE)
  var args = [this];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.not = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'not', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.NOT)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.random = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var self = this;
  self._noPrefix(this, 'random');
  self._arityRange(_args, 0, 3, 'random', self);

  var term = new Term(self._r);
  term._query.push(termTypes.RANDOM);

  var args = [];
  for(var i=0; i<_args.length-1; i++) {
    args.push(new Term(self._r).expr(_args[i]))
  }
  if (_args.length > 0) {
    if (helper.isPlainObject(_args[_args.length-1])) {
      helper.loopKeys(_args[_args.length-1], function(obj, key) {
        if (key !== 'float') {
          throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `random`', self._query, 'Available option is float: <boolean>');
        }
      });
      term._fillArgs(args);
      term._query.push(new Term(self._r).expr(translateOptions(_args[_args.length-1]))._query);
    }
    else {
      args.push(new Term(self._r).expr(_args[_args.length-1]))
      term._fillArgs(args);
    }
  }
  else {
    term._fillArgs(args);
  }
  return term;
}
Term.prototype.floor = function() {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'floor', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.FLOOR)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.ceil = function() {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'ceil', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.CEIL)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.round = function() {
  if (this._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 0, 1, 'round', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.ROUND)
  var args = [this];
  term._fillArgs(args);
  return term;
}

// Dates and times
Term.prototype.now = function() {
  this._noPrefix(this, 'now');

  var term = new Term(this._r);
  term._query.push(termTypes.NOW)
  return term;
}
Term.prototype.time = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._noPrefix(this, 'time');
  // Special check for arity
  var foundArgs = false;
  for(var i=0; i<_args.length; i++) {
    if ((_args[i] instanceof Term) && (_args[i]._query[0] === termTypes.ARGS)) {
      foundArgs = true;
      break;
    }
  }
  if (foundArgs === false) {
    if ((_args.length !== 4) && (_args.length !== 7)) {
      throw new Error.ReqlDriverError('`r.time` called with '+_args.length+' argument'+((_args.length>1)?'s':''), null, '`r.time` takes 4 or 7 arguments');
    }
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TIME)
  var args = [];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.epochTime = function(epochTime) {
  this._noPrefix(this, 'epochTime');

  var term = new Term(this._r);
  term._query.push(termTypes.EPOCH_TIME)
  var args = [new Term(this._r).expr(epochTime)];
  term._fillArgs(args);
  return term;
}
Term.prototype.ISO8601 = function(isoTime, options) {
  this._noPrefix(this, 'ISO8601');
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'ISO8601', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.ISO8601)
  var args = [new Term(this._r).expr(isoTime)._query];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if (key !== 'defaultTimezone') {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `ISO8601`. Available options are primaryKey <string>, durability <string>, datancenter <string>');
      }
    });
    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }

  return term;
}
Term.prototype.inTimezone = function(timezone) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'inTimezone', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.IN_TIMEZONE)
  var args = [this, new Term(this._r).expr(timezone)];
  term._fillArgs(args);
  return term;
}
Term.prototype.timezone = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'timezone', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TIMEZONE)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.during = function(left, right, options) {
  if (this._fastArityRange(arguments.length, 2, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 2, 3, 'during', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DURING);
  var args = [];
  args.push(this);
  args.push(new Term(this._r).expr(left));
  args.push(new Term(this._r).expr(right));

  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.date = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'date', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DATE)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.timeOfDay = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'timeOfDay', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TIME_OF_DAY)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.year = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'year', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.YEAR)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.month = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'month', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.MONTH)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.day = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'day', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DAY)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.dayOfYear = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'dayOfYear', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DAY_OF_YEAR)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.dayOfWeek = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'dayOfWeek', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DAY_OF_WEEK)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.hours = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'hours', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.HOURS)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.minutes = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'minutes', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.MINUTES)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.seconds = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'seconds', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.SECONDS)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.toISO8601 = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'toISO8601', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TO_ISO8601)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.toEpochTime = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'toEpochTime', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TO_EPOCH_TIME)
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.monday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.MONDAY);
  return term;
}
Term.prototype.tuesday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.TUESDAY);
  return term;
}
Term.prototype.wednesday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.WEDNESDAY);
  return term;
}
Term.prototype.thursday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.THURSDAY);
  return term;
}
Term.prototype.friday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.FRIDAY);
  return term;
}
Term.prototype.saturday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.SATURDAY);
  return term;
}
Term.prototype.sunday = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.SUNDAY);
  return term;
}

Term.prototype.january = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.JANUARY);
  return term;
}
Term.prototype.february = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.FEBRUARY);
  return term;
}
Term.prototype.march = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.MARCH);
  return term;
}
Term.prototype.april = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.APRIL);
  return term;
}
Term.prototype.may = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.MAY);
  return term;
}
Term.prototype.june = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.JUNE);
  return term;
}
Term.prototype.july = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.JULY);
  return term;
}
Term.prototype.august = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.AUGUST);
  return term;
}
Term.prototype.september = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.SEPTEMBER);
  return term;
}
Term.prototype.october = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.OCTOBER);
  return term;
}
Term.prototype.november = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.NOVEMBER);
  return term;
}
Term.prototype.december = function() {
  var term = new Term(this._r);
  term._query.push(termTypes.DECEMBER);
  return term;
}


Term.prototype.args = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._noPrefix(this, 'args');

  var term = new Term(this._r);
  term._query.push(termTypes.ARGS);
  var args = [];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.do = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this._r);
  term._query.push(termTypes.FUNCALL);
  var args = [];
  if (_args.length > 0) {
    args.push(new Term(this._r).expr(_args[_args.length-1])._wrap()._query);
  }
  args.push(this);
  for(var i=0; i<_args.length-1; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}


Term.prototype.branch = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  this._arityRange(_args, 2, Infinity, '', this);

  var term = new Term(this._r);
  term._query.push(termTypes.BRANCH)
  var args = [];
  args.push(this);
  for(var i=0; i<_len; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.forEach = function(func) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'forEach', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.FOR_EACH);
  var args = [this, new Term(this._r).expr(func)._wrap()];
  term._fillArgs(args);
  return term;
}
Term.prototype.default = function(expression) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'default', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.DEFAULT);
  var args = [this, new Term(this._r).expr(expression)];
  term._fillArgs(args);
  return term;
}
Term.prototype.expr = function(expression, nestingLevel) {
  var self = this;
  self._noPrefix(self, 'expr');
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'expr', self);
  }

  // undefined will be caught in the last else
  var ar, obj;

  if (expression === undefined) {
    var error = 'Cannot convert `undefined` with r.expr()';
    return new Term(self._r, expression, error);
  }

  var _nestingLevel = nestingLevel;
  if (_nestingLevel == null) {
    _nestingLevel = self._r.nestingLevel;
  }
  //if (nestingLevel == null) nestingLevel = self._r.nestingLevel;
  if (_nestingLevel < 0) throw new Error.ReqlDriverError('Nesting depth limit exceeded.\nYou probably have a circular reference somewhere')

  if (expression instanceof Term) {
    return expression;
  }
  else if (expression instanceof Function) {
    return new Func(self._r, expression);
  }
  else if (expression instanceof Date) {
    return new Term(self._r).ISO8601(expression.toISOString())
  }
  else if (Array.isArray(expression)) {
    var term = new Term(self._r);
    term._query.push(termTypes.MAKE_ARRAY);

    var args = [];
    for(var i=0; i<expression.length; i++) {
      args.push(new Term(self._r).expr(expression[i], _nestingLevel-1))
    }
    term._fillArgs(args);
    return term;
  }
  else if (expression instanceof Buffer) {
    return self._r.binary(expression);
  }
  else if (helper.isPlainObject(expression)) {
    var term = new Term(self._r);
    var optArgs = {};
    var foundError = false;
    helper.loopKeys(expression, function(expression, key) {
      if (expression[key] !== undefined) {
        var optArg = new Term(self._r).expr(expression[key], _nestingLevel-1);
        if (optArg instanceof Term && !foundError && optArg._error != null) {
          foundError = true;
          term._error = optArg._error;
          term._frames = [key].concat(optArg._frames);
        }
        optArgs[key] = optArg._query;
      }
    });
    term._query = optArgs;
    return term;
  }
  else { // Primitive
    if (expression === null) {
      return new Term(self._r, null, expression);
    }
    else if (typeof expression === 'string') {
      return new Term(self._r, expression);
    }
    else if (typeof expression === 'number') {
      if (expression !== expression) {
        var error = 'Cannot convert `NaN` to JSON';
        return new Term(self._r, expression, error);
      }
      else if (!isFinite(expression)) {
        var error = 'Cannot convert `Infinity` to JSON';
        return new Term(self._r, expression, error);
      }
      return new Term(self._r, expression);
    }
    else if (typeof expression === 'boolean') {
      return new Term(self._r, expression);
    }
    else {
      self._error = new Error.ReqlDriverError('Cannot convert `'+expression+'` to datum.');
      self._frames = [];
    }
  }
  return self;
}

Term.prototype.binary = function(bin) {
  this._noPrefix(this, 'binary');
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'binary', this);
  }

  var term;
  if (bin instanceof Buffer) {
    // We could use BINARY, and coerce `bin` to an ASCII string, but that
    // will break if there is a null char
    term = new Term(this._r, {
      $reql_type$: 'BINARY',
      data: bin.toString('base64')
    });
  }
  else {
    term = new Term(this._r);
    term._query.push(termTypes.BINARY)
    var args = [new Term(this._r).expr(bin)];
    term._fillArgs(args);
  }
  return term;
}

Term.prototype.js = function(arg, options) {
  this._noPrefix(this, 'js');
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'js', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.JAVASCRIPT)
  var args = [new Term(this._r).expr(arg)];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.coerceTo = function(type) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'coerceTo', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.COERCE_TO)
  var args = [this, new Term(this._r).expr(type)];
  term._fillArgs(args);
  return term;
}
Term.prototype.typeOf = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'typeOf', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.TYPE_OF);
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.info = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'info', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.INFO);
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.json = function(json) {
  this._noPrefix(this, 'json');
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'info', this);
  }
  /*
  if ((/\\u0000/.test(json)) || (/\0/.test(json))) {
    this._error = new Error.ReqlDriverError('The null character is currently not supported by RethinkDB');
  }
  */
  var term = new Term(this._r);
  term._query.push(termTypes.JSON);

  var args = [new Term(this._r).expr(json)];
  term._fillArgs(args);
  return term;
}
Term.prototype.http = function(url, options) {
  this._noPrefix(this, 'http');
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'http', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.HTTP);
  var args = [new Term(this._r).expr(url)];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'timeout')
        && (key !==  'attempts')
        && (key !==  'redirects')
        && (key !==  'verify')
        && (key !==  'resultFormat')
        && (key !==  'method')
        && (key !==  'auth')
        && (key !==  'params')
        && (key !==  'header')
        && (key !==  'data')
        && (key !==  'page')
        && (key !==  'pageLimit')
        && (key !==  '')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `http`. Available options are attempts <number>, redirects <number>, verify <boolean>, resultFormat: <string>, method: <string>, auth: <object>, params: <object>, header: <string>, data: <string>, page: <string/function>, pageLimit: <number>');
      }
    });

    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.uuid = function(str) {
  this._noPrefix(this, 'uuid');

  var term = new Term(this._r);
  term._query.push(termTypes.UUID)

  if (str !== undefined) {
    var args = [new Term(this._r).expr(str)];
    term._fillArgs(args);
  }
  return term;
}


Term.prototype.circle = function(center, radius, options) {
  var self = this;

  // Arity check is done by r.circle
  self._noPrefix(self, 'circle');
  var term = new Term(self._r);
  term._query.push(termTypes.CIRCLE);
  var args = [new Term(self._r).expr(center), new Term(self._r).expr(radius)];
  term._fillArgs(args);

  if (helper.isPlainObject(options)) {
    // There is no need to translate here
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'numVertices') && (key !== 'geoSystem') && (key !== 'unit') && (key !== 'fill')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `circle`', self._query, 'Available options are numVertices <number>, geoSsystem <string>, unit <string> and fill <bool>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }

  return term;
}
Term.prototype.distance = function(geometry, options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 1, 2, 'distance', self);
  }
  var term = new Term(self._r);
  term._query.push(termTypes.DISTANCE);
  var args = [self, new Term(self._r).expr(geometry)];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'geoSystem') && (key !== 'unit')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `distance`', self._query, 'Available options are geoSystem <string>, unit <string>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;
}
Term.prototype.fill = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'fill', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.FILL);
  var args = [this];
  term._fillArgs(args);
  return term;
}

Term.prototype.geojson = function(geometry) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'geojson', this);
  }
  this._noPrefix(this, 'geojson');
  var term = new Term(this._r);
  term._query.push(termTypes.GEOJSON);
  var args = [new Term(this._r).expr(geometry)];
  term._fillArgs(args);
  return term;
}

Term.prototype.toGeojson = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'toGeojson', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.TO_GEOJSON);
  var args = [this];
  term._fillArgs(args);
  return term;
}

Term.prototype.getIntersecting = function(geometry, options) {
  if (this._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 2, 'getIntersecting', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.GET_INTERSECTING);
  var args = [this, new Term(this._r).expr(geometry)];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if (key !== 'index') {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `distance`', self._query, 'Available options are index <string>');
      }
    });
    term._query.push(new Term(this._r).expr(translateOptions(options))._query);
  }
  return term;
}

Term.prototype.getNearest = function(geometry, options) {
  var self = this;
  if (self._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arity(_args, 2, 'getNearest', self);
  }
  var term = new Term(self._r);
  term._query.push(termTypes.GET_NEAREST);
  var args = [self, new Term(self._r).expr(geometry)];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'index') && (key !== 'maxResults') && (key !== 'maxDist') && (key !== 'unit') && (key !== 'geoSystem')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `getNearest`', self._query, 'Available options are index <string>, maxResults <number>, maxDist <number>, unit <string>, geoSystem <string>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }
  return term;

}

Term.prototype.includes = function(geometry) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'includes', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.INCLUDES);
  var args = [this, new Term(this._r).expr(geometry)];
  term._fillArgs(args);
  return term;
}

Term.prototype.intersects = function(geometry) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'intersects', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.INTERSECTS);
  var args = [this, new Term(this._r).expr(geometry)];
  term._fillArgs(args);
  return term;
}

Term.prototype.line = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  // Arity check is done by r.line
  this._noPrefix(this, 'line');

  var term = new Term(this._r);
  term._query.push(termTypes.LINE);

  var args = [];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);
  return term;
}

Term.prototype.point = function(longitude, latitude) {
  // Arity check is done by r.point
  this._noPrefix(this, 'point');

  var term = new Term(this._r);
  term._query.push(termTypes.POINT);
  var args = [new Term(this._r).expr(longitude), new Term(this._r).expr(latitude)];
  term._fillArgs(args);
  return term;
}

Term.prototype.polygon = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  // Arity check is done by r.polygon
  this._noPrefix(this, 'polygon');

  var term = new Term(this._r);
  term._query.push(termTypes.POLYGON);

  var args = [];
  for(var i=0; i<_args.length; i++) {
    args.push(new Term(this._r).expr(_args[i]))
  }
  term._fillArgs(args);

  return term;
}

Term.prototype.polygonSub = function(geometry) {
  if (this._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 1, 'polygonSub', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.POLYGON_SUB);
  var args = [this, new Term(this._r).expr(geometry)];
  term._fillArgs(args);
  return term;
}

Term.prototype.range = function(start, end) {
  this._noPrefix(this, 'range');
  if (this._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arityRange(_args, 1, 2, 'r.range', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.RANGE);
  var args = [];
  args.push(new Term(this._r).expr(start));
  if (end !== undefined) {
    args.push(new Term(this._r).expr(end));
  }
  term._fillArgs(args);
  return term;
}
Term.prototype.toJsonString = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'toJSON', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.TO_JSON_STRING);
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.toJSON = Term.prototype.toJsonString;

Term.prototype.config = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'config', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.CONFIG);
  var args = [this];
  term._fillArgs(args);
  return term;
}

Term.prototype.status = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'status', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.STATUS);
  var args = [this];
  term._fillArgs(args);
  return term;
}

Term.prototype.wait = function(options) {
  var self = this;
  if (self._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arityRange(_args, 0, 1, 'wait', self);
  }
  var term = new Term(self._r);
  term._query.push(termTypes.WAIT);
  var args = [self];
  term._fillArgs(args);
  if (helper.isPlainObject(options)) {
    helper.loopKeys(options, function(obj, key) {
      if ((key !== 'waitFor') && (key !== 'timeout')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `wait`', self._query, 'Available options are waitFor: <string>, timeout: <number>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(options))._query);
  }

  return term;
}

Term.prototype.reconfigure = function(config) {
  var self = this;
  if (self._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    self._arity(_args, 1, 'reconfigure', self);
  }
  var term = new Term(self._r);
  term._query.push(termTypes.RECONFIGURE);

  var args = [this];
  term._fillArgs(args);
  if (helper.isPlainObject(config)) {
    helper.loopKeys(config, function(obj, key) {
      if ((key !== 'shards') && (key !== 'replicas') &&
        (key !== 'dryRun') && (key !== 'primaryReplicaTag') &&
        (key !== 'nonvotingReplicaTags') && (key !== 'emergencyRepair')) {
        throw new Error.ReqlDriverError('Unrecognized option `'+key+'` in `reconfigure`', self._query, 'Available options are shards: <number>, replicas: <number>, primaryReplicaTag: <object>, dryRun <boolean>, emergencyRepair: <string>, nonvotingReplicaTags: <array<string>>');
      }
    });
    term._query.push(new Term(self._r).expr(translateOptions(config))._query);
  }
  else {
    throw new Error.ReqlDriverError('First argument of `reconfigure` must be an object');
  }
  return term;
}

Term.prototype.rebalance = function() {
  if (this._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 0, 'rebalance', this);
  }
  var term = new Term(this._r);
  term._query.push(termTypes.REBALANCE);
  var args = [this];
  term._fillArgs(args);
  return term;
}
Term.prototype.grant = function(name, access) {
  if (this._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    this._arity(_args, 2, 'grant', this);
  }

  var term = new Term(this._r);
  term._query.push(termTypes.GRANT)
  var args = [this, new Term(this._r).expr(name), new Term(this._r).expr(access)];
  term._fillArgs(args);
  return term;
}


Term.prototype.then = function(resolve, reject) {
  return this.run().then(resolve, reject);
}
Term.prototype.error = function(reject) {
  return this.run().error(reject);
}
Term.prototype.catch = function(reject) {
  return this.run().catch(reject);
}
Term.prototype.finally = function(handler) {
  return this.run().finally(handler);
}
Term.prototype.delay = function(msecs) {
  return this.run().delay(msecs);
}

Term.prototype.toString = function() {
  return Error.generateBacktrace(this._query, 0, null, [], {indent: 0, extra: 0}).str;
}

Term.prototype._wrap = function() {
  var self = this;
  if (helper.hasImplicit(this._query)) {
    if (this._query[0] === termTypes.ARGS) {
      throw new Error.ReqlDriverError('Implicit variable `r.row` cannot be used inside `r.args`')
    }
    //Must pass at least one variable to the function or it won't accept r.row
    return new Term(this._r).expr(function(doc) { return self; })
  }
  else {
    return self;
  }
}

Term.prototype._fillArgs = function(args) {
  var foundError = false;
  var internalArgs = [];
  for(var i=0; i<args.length; i++) {
  if (args[i] instanceof Term) {
    internalArgs.push(args[i]._query);
    if (!foundError && (args[i]._error != null)) {
    this._error = args[i]._error;
    this._frames = args[i]._frames;
    this._frames.unshift(i);
    foundError = true;
    }
  }
  else {
    internalArgs.push(args[i]);
  }
  }
  this._query.push(internalArgs);
  return this;
}

Term.prototype._translateArgs = {
  returnChanges: 'return_changes',
  includeInitial: 'include_initial',
  primaryKey: 'primary_key',
  readMode: 'read_mode',
  nonAtomic: 'non_atomic',
  leftBound: 'left_bound',
  rightBound: 'right_bound',
  defaultTimezone: 'default_timezone',
  noReply: 'noreply',
  resultFormat: 'result_format',
  pageLimit: 'page_limit',
  arrayLimit: 'array_limit',
  numVertices: 'num_vertices',
  geoSystem: 'geo_system',
  maxResults: 'max_results',
  maxDist: 'max_dist',
  dryRun: 'dry_run',
  waitFor: 'wait_for',
  includeStates: 'include_states',
  primaryReplicaTag: 'primary_replica_tag',
  emergencyRepair: 'emergency_repair',
  minBatchRows: 'min_batch_rows',
  maxBatchRows: 'max_batch_rows',
  maxBatchBytes: 'max_batch_bytes',
  maxBatchSeconds: 'max_batch_seconds',
  firstBatchScaledownFactor: 'first_batch_scaledown_factor',
  includeOffsets: 'include_offsets',
  includeTypes: 'include_types',
  finalEmit: 'final_emit'
}
function translateOptions(options) {
  var translatedOpt = {};
  helper.loopKeys(options, function(options, key) {
    var keyServer = Term.prototype._translateArgs[key] || key;
    translatedOpt[keyServer] = options[key];
  });
  return translatedOpt;
}
Term.prototype._setNestingLevel = function(nestingLevel) {
  Term.prototype._nestingLevel = nestingLevel;
}
Term.prototype._setArrayLimit = function(arrayLimit) {
  Term.prototype._arrayLimit = arrayLimit;
}


Term.prototype._noPrefix = function(term, method) {
  if ((!Array.isArray(term._query)) || (term._query.length > 0)) {
    throw new Error.ReqlDriverError('`'+method+'` is not defined', term._query);
  }
}
Term.prototype._arityRange = function(args, min, max, method, term) {
  var foundArgs = false;
  if (args.length < min) {
    for(var i=0; i<args.length; i++) {
      if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
        foundArgs = true;
        break;
      }
    }
    if (foundArgs === false) {
      throw new Error.ReqlDriverError('`'+method+'` takes at least '+min+' argument'+((min>1)?'s':'')+', '+args.length+' provided', term._query);
    }
  }
  else if (args.length > max) {
    for(var i=0; i<args.length; i++) {
      if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
        foundArgs = true;
        break;
      }
    }
    if (foundArgs === false) {
      throw new Error.ReqlDriverError('`'+method+'` takes at most '+max+' argument'+((max>1)?'s':'')+', '+args.length+' provided', term._query);
    }
  }
}
Term.prototype._arity = function(args, num, method, term) {
  var foundArgs = false;
  for(var i=0; i<args.length; i++) {
    if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
      foundArgs = true;
      break;
    }
  }
  if (foundArgs === false) {
    throw new Error.ReqlDriverError('`'+method+'` takes '+num+' argument'+((num>1)?'s':'')+', '+args.length+' provided', term._query);
  }
}
// Cheap arity check. If it fails, return false, and then we are expected to call _arity/_arityRange
Term.prototype._fastArity = function(len, num) {
  return (len === num);
}
Term.prototype._fastArityRange = function(len, min, max) {
  return ((len >= min) && (len <= max));
}


// Datums
function Func(r, func) {
  // We can retrieve the names of the arguments with
  // func.toString().match(/\(([^\)]*)\)/)[1].split(/\s*,\s*/)

  var term = new Term(r);
  term._query.push(termTypes.FUNC);
  var args = [];
  var argVars = [];
  var argNums = [];

  for(var i=0; i<func.length; i++) {
    argVars.push(new Var(r, r.nextVarId));
    argNums.push(r.nextVarId);

    if (r.nextVarId === 9007199254740992) { // That seems like overdoing it... but well maybe...
      r.nextVarId = 0;
    }
    else {
      r.nextVarId++;
    }
  }

  var body = func.apply(func, argVars)
  if (body === undefined) throw new Error.ReqlDriverError('Anonymous function returned `undefined`. Did you forget a `return`? In:\n'+func.toString(), this._query);
  body = new Term(r).expr(body);
  args.push(new Term(r).expr(argNums));
  args.push(body);

  term._fillArgs(args);

  return term;
}
Func.prototype.nextVarId = 1;

function Var(r, id) {
  var term = new Term(r);
  term._query.push(termTypes.VAR)
  term._query.push([new Term(r).expr(id)._query])
  return term;
}

module.exports = Term;
