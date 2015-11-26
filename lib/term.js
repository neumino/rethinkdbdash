var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Promise = require('bluebird');
var protodef = require('./protodef');
var termTypes = protodef.Term.TermType;
var Error = require('./error');
var helper = require('./helper');
var stream_1 = require('./stream');
var writable_stream_1 = require('./writable_stream');
var transform_stream_1 = require('./transform_stream');
var Term = (function () {
    function Term(r, value, error) {
        var self = this;
        var term_func = function (field) {
            if (Term.prototype._fastArity(arguments.length, 1) === false) {
                var _len = arguments.length;
                var _args = new Array(_len);
                for (var _i = 0; _i < _len; _i++) {
                    _args[_i] = arguments[_i];
                }
                Term.prototype._arity(_args, 1, '(...)', self);
            }
            return term.bracket(field);
        };
        var term = helper.changeProto(term_func, self);
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
    Term.prototype.indexStatus = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INDEX_STATUS);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.indexDrop = function (name) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'indexDrop', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INDEX_DROP);
        var args = [this, new Term(this._r).expr(name)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.indexCreate = function (name, fn, options) {
        var _this = this;
        if (this._fastArityRange(arguments.length, 1, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
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
        if (typeof fn !== 'undefined')
            args.push(new Term(this._r).expr(fn)._wrap());
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            // There is no need to translate here
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'multi') && (key !== 'geo')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `indexCreate`', _this._query, 'Available option is multi <bool> and geo <bool>');
                }
            });
            term._query.push(new Term(this._r).expr(options)._query);
        }
        return term;
    };
    Term.prototype.indexList = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'indexList', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INDEX_LIST);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.tableList = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'tableList', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TABLE_LIST);
        var args = [];
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            args.push(this);
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.tableDrop = function (table) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'tableDrop', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TABLE_DROP);
        var args = [];
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            args.push(this); // push db
        }
        args.push(new Term(this._r).expr(table));
        term._fillArgs(args);
        return term;
    };
    Term.prototype.tableCreate = function (table, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'tableCreate', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TABLE_CREATE);
        var args = [];
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            args.push(self); // Push db
        }
        args.push(new Term(this._r).expr(table));
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            // Check for non valid key
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'primaryKey')
                    && (key !== 'durability')
                    && (key !== 'shards')
                    && (key !== 'replicas')
                    && (key !== 'primaryReplicaTag')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `tableCreate`', _this._query, 'Available options are primaryKey <string>, durability <string>, shards <number>, replicas <number/object>, primaryReplicaTag <object>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.dbList = function () {
        this._noPrefix(this, 'dbList');
        var term = new Term(this._r);
        term._query.push(termTypes.DB_LIST);
        return term;
    };
    Term.prototype.dbDrop = function (db) {
        this._noPrefix(this, 'dbDrop');
        var term = new Term(this._r);
        term._query.push(termTypes.DB_DROP);
        var args = [new Term(this._r).expr(db)._query];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.dbCreate = function (db) {
        // Check for arity is done in r.prototype.dbCreate
        this._noPrefix(this, 'dbCreate');
        var term = new Term(this._r);
        term._query.push(termTypes.DB_CREATE);
        var args = [new Term(this._r).expr(db)._query];
        term._fillArgs(args);
        return term;
    };
    Term.prototype._toTransformStream = function (connection, options) {
        if (this._query[0] !== termTypes.TABLE) {
            throw new Error.ReqlDriverError('Cannot create a writable stream on something else than a table.');
        }
        if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
            return new transform_stream_1.TransformStream(this, options, connection);
        }
        else {
            return new transform_stream_1.TransformStream(this, connection);
        }
    };
    Term.prototype._toWritableStream = function (connection, options) {
        if (this._query[0] !== termTypes.TABLE) {
            throw new Error.ReqlDriverError('Cannot create a writable stream on something else than a table.');
        }
        if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
            return new writable_stream_1.WritableStream(this, options, connection);
        }
        else {
            return new writable_stream_1.WritableStream(this, connection);
        }
    };
    Term.prototype._toReadableStream = function (connection, options) {
        var stream;
        var _options = {};
        if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
            //toStream make sure that options is an object
            helper.loopKeys(options, function (obj, key) {
                _options[key] = obj[key];
            });
            _options.cursor = true;
            stream = new stream_1.ReadableStream(_options);
            this.run(connection, _options).then(function (cursor) {
                stream._setCursor(cursor);
            }).error(function (error) {
                stream.emit('error', error);
            });
        }
        else {
            helper.loopKeys(connection, function (obj, key) {
                _options[key] = obj[key];
            });
            _options.cursor = true;
            stream = new stream_1.ReadableStream(_options);
            this.run(_options).then(function (cursor) {
                stream._setCursor(cursor);
            }).error(function (error) {
                stream.emit('error', error);
            });
        }
        return stream;
    };
    Term.prototype.toStream = function (connection, options) {
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
    };
    Term.prototype.run = function (connection, options, callback) {
        var _this = this;
        // run([connection][, options][, callback])
        var self = this;
        if (this._error != null) {
            var error = new Error.ReqlRuntimeError(this._error, this._query, { b: this._frames });
            return Promise.reject(error);
        }
        if (helper.isPlainObject(connection) && (typeof connection._isConnection === 'function') && (connection._isConnection() === true)) {
            if (typeof options === 'function') {
                callback = options;
                options = {};
            }
            else {
                if (!helper.isPlainObject(options))
                    options = {};
            }
            if (connection._isOpen() !== true) {
                return new Promise(function (resolve, reject) {
                    reject(new Error.ReqlDriverError('`run` was called with a closed connection', _this._query).setOperational());
                });
            }
            var p = new Promise(function (resolve, reject) {
                var token = connection._getToken();
                var query = [protodef.Query.QueryType.START];
                query.push(_this._query);
                var _options = {};
                var sendOptions = false;
                if (connection.db != null) {
                    sendOptions = true;
                    _options.db = _this._r.db(connection.db)._query;
                }
                if (_this._r.arrayLimit != null) {
                    sendOptions = true;
                    _options[_this._translateArgs['arrayLimit']] = _this._r.arrayLimit;
                }
                ;
                var keepGoing = true; // we need it just to avoir calling resolve/reject multiple times
                helper.loopKeys(options, function (options, key) {
                    if (keepGoing === true) {
                        if ((key === 'readMode') || (key === 'durability') || (key === 'db') ||
                            (key === 'noreply') || (key === 'arrayLimit') || (key === 'profile') ||
                            (key === 'minBatchRows') || (key === 'maxBatchRows') || (key === 'maxBatchBytes') ||
                            (key === 'maxBatchSeconds') || (key === 'firstBatchScaledownFactor')) {
                            sendOptions = true;
                            if (key === 'db') {
                                _options[key] = _this._r.db(options[key])._query;
                            }
                            else if (_this._translateArgs.hasOwnProperty(key)) {
                                _options[_this._translateArgs[key]] = new Term(_this._r).expr(options[key])._query;
                            }
                            else {
                                _options[key] = new Term(_this._r).expr(options[key])._query;
                            }
                        }
                        else if ((key !== 'timeFormat') && (key !== 'groupFormat') &&
                            (key !== 'binaryFormat') && (key !== 'cursor') &&
                            (key !== 'readable') && (key !== 'writable') &&
                            (key !== 'transform') && (key !== 'stream') &&
                            (key !== 'highWaterMark')) {
                            reject(new Error.ReqlDriverError('Unrecognized option `' + key + '` in `run`. Available options are readMode <string>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>, binaryFormat <bool>, cursor <bool>, stream <bool>'));
                            keepGoing = false;
                        }
                    }
                });
                if (keepGoing === false) {
                    connection.emit('release');
                    return; // The promise was rejected in the loopKeys
                }
                if (sendOptions === true) {
                    query.push(_options);
                }
                connection._send(query, token, resolve, reject, _this._query, options);
            }).nodeify(callback);
        }
        else {
            var poolMaster = this._r.getPoolMaster(); // if this._r is defined, so is this._r.getPool()
            if (!poolMaster) {
                throw new Error.ReqlDriverError('`run` was called without a connection and no pool has been created', this._query);
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
                var p = new Promise(function (resolve, reject) {
                    poolMaster.getConnection().then(function (connection) {
                        var token = connection._getToken();
                        var query = [protodef.Query.QueryType.START];
                        query.push(_this._query);
                        var _options = {};
                        var sendOptions = false;
                        if (connection.db != null) {
                            sendOptions = true;
                            _options.db = _this._r.db(connection.db)._query;
                        }
                        if (_this._r.arrayLimit != null) {
                            sendOptions = true;
                            _options[_this._translateArgs['arrayLimit']] = _this._r.arrayLimit;
                        }
                        ;
                        var keepGoing = true;
                        helper.loopKeys(options, function (options, key) {
                            if (keepGoing === true) {
                                if ((key === 'readMode') || (key === 'durability') || (key === 'db') ||
                                    (key === 'noreply') || (key === 'arrayLimit') || (key === 'profile')) {
                                    sendOptions = true;
                                    if (key === 'db') {
                                        _options[key] = _this._r.db(options[key])._query;
                                    }
                                    else if (_this._translateArgs.hasOwnProperty(key)) {
                                        _options[_this._translateArgs[key]] = new Term(_this._r).expr(options[key])._query;
                                    }
                                    else {
                                        _options[key] = new Term(_this._r).expr(options[key])._query;
                                    }
                                }
                                else if ((key !== 'timeFormat') && (key !== 'groupFormat') &&
                                    (key !== 'binaryFormat') && (key !== 'cursor') &&
                                    (key !== 'readable') && (key !== 'writable') &&
                                    (key !== 'transform') && (key !== 'stream') &&
                                    (key !== 'highWaterMark')) {
                                    setTimeout(function () {
                                        reject(new Error.ReqlDriverError('Unrecognized option `' + key + '` in `run`. Available options are readMode <string>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>, binaryFormat <string>, cursor <bool>, stream <bool>'));
                                    }, 0);
                                    keepGoing = false;
                                    return false;
                                }
                            }
                        });
                        if (keepGoing === false) {
                            connection.emit('release');
                            return; // The promise was rejected in the loopKeys
                        }
                        if (sendOptions === true) {
                            query.push(_options);
                        }
                        connection._send(query, token, resolve, reject, _this._query, options);
                    }).error(function (error) {
                        reject(error);
                    });
                }).nodeify(callback);
            }
        }
        //if (options.noreply) return self; // Do not return a promise if the user ask for no reply.
        return p;
    };
    Term.prototype.setIntersection = function (other) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'setIntersection', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SET_INTERSECTION);
        var args = [this, new Term(this._r).expr(other)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.setUnion = function (other) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'setUnion', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SET_UNION);
        var args = [this, new Term(this._r).expr(other)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.setInsert = function (other) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'setInsert', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SET_INSERT);
        var args = [this, new Term(this._r).expr(other)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.difference = function (other) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'difference', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DIFFERENCE);
        var args = [this, new Term(this._r).expr(other)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.prepend = function (value) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'prepend', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.PREPEND);
        var args = [this, new Term(this._r).expr(value)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.append = function (value) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'append', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.APPEND);
        var args = [this, new Term(this._r).expr(value)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.literal = function (obj) {
        this._noPrefix(this, 'literal');
        // The test for arity is performed in r.literal
        var term = new Term(this._r);
        term._query.push(termTypes.LITERAL);
        if (arguments.length > 0) {
            var args = [new Term(this._r).expr(obj)];
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.merge = function (arg) {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'merge', this);
        var term = new Term(this._r);
        term._query.push(termTypes.MERGE);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i])._wrap());
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.without = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'without', this);
        var term = new Term(this._r);
        term._query.push(termTypes.WITHOUT);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.pluck = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'pluck', this);
        var term = new Term(this._r);
        term._query.push(termTypes.PLUCK);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.row = function () {
        this._noPrefix(this, 'row');
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'r.row', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.IMPLICIT_VAR);
        return term;
    };
    Term.prototype.max = function (field) {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'max', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.MAX);
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
    };
    Term.prototype.min = function (field) {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'min', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.MIN);
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
    };
    Term.prototype.avg = function (field) {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'avg', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.AVG);
        var args = [this];
        if (field !== undefined) {
            args.push(new Term(this._r).expr(field)._wrap());
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.sum = function (field) {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'sum', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SUM);
        var args = [this];
        if (field !== undefined) {
            args.push(new Term(this._r).expr(field)._wrap());
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.contains = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'contains', this);
        var term = new Term(this._r);
        term._query.push(termTypes.CONTAINS);
        var args = [this._query];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i])._wrap());
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.ungroup = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'ungroup', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.UNGROUP);
        var args = [this._query];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.split = function (separator, max) {
        if (this._fastArityRange(arguments.length, 0, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 2, 'split', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SPLIT);
        var args = [this];
        if (separator !== undefined) {
            args.push(new Term(this._r).expr(separator));
            if (max !== undefined) {
                args.push(new Term(this._r).expr(max));
            }
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.group = function () {
        var _this = this;
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var self = this;
        this._arityRange(_args, 1, Infinity, 'group', self);
        var term = new Term(this._r);
        term._query.push(termTypes.GROUP);
        var args = [self];
        for (var i = 0; i < _args.length - 1; i++) {
            args.push(new Term(this._r).expr(_args[i])._wrap());
        }
        if (_args.length > 0) {
            if (helper.isPlainObject(_args[_args.length - 1])) {
                helper.loopKeys(_args[_args.length - 1], function (obj, key) {
                    if ((key !== 'index')
                        && (key !== 'multi')) {
                        throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `group`', _this._query, 'Available options are index: <string>, multi <boolean>');
                    }
                });
                term._fillArgs(args);
                term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length - 1]))._query);
            }
            else {
                args.push(new Term(this._r).expr(_args[_args.length - 1])._wrap());
                term._fillArgs(args);
            }
        }
        else {
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.distinct = function (options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'distinct', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DISTINCT);
        var args = [self];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            var keepGoing = true;
            helper.loopKeys(options, function (obj, key) {
                if ((keepGoing === true) && (key !== 'index')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `distinct`', _this._query, 'Available option is index: <string>');
                    keepGoing = false;
                }
            });
            if (keepGoing === true) {
                term._query.push(new Term(this._r).expr(translateOptions(options))._query);
            }
        }
        return term;
    };
    Term.prototype.count = function (filter) {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'count', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.COUNT);
        var args = [];
        args.push(this);
        if (filter !== undefined) {
            args.push(new Term(this._r).expr(filter)._wrap());
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.reduce = function (func) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'reduce', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.REDUCE);
        var args = [this, new Term(this._r).expr(func)._wrap()];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.sample = function (size) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'sample', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SAMPLE);
        var args = [this, new Term(this._r).expr(size)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.union = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new Term(this._r);
        term._query.push(termTypes.UNION);
        var args = [];
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            args.push(this);
        }
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.isEmpty = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'isEmpty', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.IS_EMPTY);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.offsetsOf = function (predicate) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'indexesOf', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.OFFSETS_OF);
        var args = [this, new Term(this._r).expr(predicate)._wrap()];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.nth = function (value) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'nth', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.NTH);
        var args = [this._query, new Term(this._r).expr(value)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.slice = function (start, end, options) {
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
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
        else {
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.limit = function (value) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'limit', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.LIMIT);
        var args = [this, new Term(this._r).expr(value)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.skip = function (value) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'skip', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SKIP);
        var args = [this, new Term(this._r).expr(value)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.asc = function (field) {
        this._noPrefix(this, 'asc');
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'asc', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.ASC);
        var args = [new Term(this._r).expr(field)._wrap()];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.desc = function (field) {
        this._noPrefix(this, 'desc');
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'desc', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DESC);
        var args = [new Term(this._r).expr(field)._wrap()];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.orderBy = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'orderBy', this);
        var term = new Term(this._r);
        term._query.push(termTypes.ORDER_BY);
        var args = [this];
        for (var i = 0; i < _args.length - 1; i++) {
            if ((_args[i] instanceof Term) &&
                ((_args[i]._query[0] === termTypes.DESC) || (_args[i]._query[0] === termTypes.ASC))) {
                args.push(new Term(this._r).expr(_args[i]));
            }
            else {
                args.push(new Term(this._r).expr(_args[i])._wrap());
            }
        }
        // We actually don't need to make the difference here, but...
        if ((_args.length > 0) && (helper.isPlainObject(_args[_args.length - 1])) && (_args[_args.length - 1].index !== undefined)) {
            term._fillArgs(args);
            term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length - 1]))._query);
        }
        else {
            if ((_args[_args.length - 1] instanceof Term) &&
                ((_args[_args.length - 1]._query[0] === termTypes.DESC) || (_args[_args.length - 1]._query[0] === termTypes.ASC))) {
                args.push(new Term(this._r).expr(_args[_args.length - 1]));
            }
            else {
                args.push(new Term(this._r).expr(_args[_args.length - 1])._wrap());
            }
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.concatMap = function (transformation) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'concatMap', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.CONCAT_MAP);
        var args = [this];
        args.push(new Term(this._r).expr(transformation)._wrap());
        term._fillArgs(args);
        return term;
    };
    Term.prototype.withFields = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'withFields', this);
        var term = new Term(this._r);
        term._query.push(termTypes.WITH_FIELDS);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.map = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'map', this);
        var term = new Term(this._r);
        term._query.push(termTypes.MAP);
        var args = [];
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            args.push(this);
        }
        for (var i = 0; i < _args.length - 1; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        // Make sure that we don't push undefined if no argument is passed to map,
        // in which case the server will handle the case and return an error.
        if (_args.length > 0) {
            args.push(new Term(this._r).expr(_args[_args.length - 1])._wrap());
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.zip = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'zip', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.ZIP);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.eqJoin = function (rightKey, sequence, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 2, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 2, 3, 'eqJoin', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.EQ_JOIN);
        var args = [self];
        args.push(new Term(this._r).expr(rightKey)._wrap());
        args.push(new Term(this._r).expr(sequence));
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if (key !== 'index') {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `eqJoin`', _this._query, 'Available option is index <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.outerJoin = function (sequence, predicate) {
        if (this._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 2, 'outerJoin', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.OUTER_JOIN);
        var args = [this];
        args.push(new Term(this._r).expr(sequence));
        args.push(new Term(this._r).expr(predicate)._wrap());
        term._fillArgs(args);
        return term;
    };
    Term.prototype.innerJoin = function (sequence, predicate) {
        if (this._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 2, 'innerJoin', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INNER_JOIN);
        var args = [this._query];
        args.push(new Term(this._r).expr(sequence)._query);
        args.push(new Term(this._r).expr(predicate)._wrap()._query);
        term._fillArgs(args);
        return term;
    };
    Term.prototype.filter = function (filter, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'filter', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.FILTER);
        var args = [self, new Term(this._r).expr(filter)._wrap()];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if (key !== 'default') {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `filter`', _this._query, 'Available option is filter');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.maxval = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.MAXVAL);
        return term;
    };
    Term.prototype.minval = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.MINVAL);
        return term;
    };
    Term.prototype.between = function (start, end, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 2, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 2, 3, 'between', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.BETWEEN);
        var args = [self, new Term(this._r).expr(start), new Term(this._r).expr(end)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'index') && (key !== 'leftBound') && (key !== 'rightBound')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `between`', _this._query, 'Available options are index <string>, leftBound <string>, rightBound <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.getAll = function () {
        // We explicitly _args here, so fastArityRange is not useful
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'getAll', this);
        var term = new Term(this._r);
        term._query.push(termTypes.GET_ALL);
        var args = [];
        args.push(this);
        for (var i = 0; i < _args.length - 1; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        if ((_args.length > 1) && (helper.isPlainObject(_args[_args.length - 1])) && (_args[_args.length - 1].index !== undefined)) {
            term._fillArgs(args);
            term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length - 1]))._query);
        }
        else {
            args.push(new Term(this._r).expr(_args[_args.length - 1]));
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.get = function (primaryKey) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'get', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.GET);
        var args = [this, new Term(this._r).expr(primaryKey)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.table = function (table, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'table', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TABLE);
        var args = [];
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            args.push(self);
        }
        args.push(new Term(this._r).expr(table));
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if (key !== 'readMode') {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `table`', _this._query, 'Available option is readMode <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.db = function (db) {
        this._noPrefix(this, 'db');
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'db', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DB);
        var args = [new Term(this._r).expr(db)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.sync = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'sync', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SYNC);
        var args = [this._query];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.delete = function (options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'delete', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DELETE);
        var args = [self];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'returnChanges') && (key !== 'durability')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `delete`', _this._query, 'Available options are returnChanges <bool>, durability <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.replace = function (newValue, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'replace', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.REPLACE);
        var args = [self, new Term(this._r).expr(newValue)._wrap()];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'returnChanges') && (key !== 'durability') && (key !== 'nonAtomic')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `replace`', _this._query, 'Available options are returnChanges <bool>, durability <string>, nonAtomic <bool>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.update = function (newValue, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'update', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.UPDATE);
        var args = [self, new Term(this._r).expr(newValue)._wrap()];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'returnChanges') && (key !== 'durability') && (key !== 'nonAtomic')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `update`', _this._query, 'Available options are returnChanges <bool>, durability <string>, nonAtomic <bool>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.insert = function (documents, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'insert', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INSERT);
        var args = [self, new Term(this._r).expr(documents)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'returnChanges') && (key !== 'durability') && (key !== 'conflict')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `insert`', _this._query, 'Available options are returnChanges <bool>, durability <string>, conflict <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.changes = function (options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'changes', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.CHANGES);
        var args = [self];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'squash') && (key !== 'includeStates')
                    && (key !== 'includeInitial')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `changes`', _this._query, 'Available options are squash <bool>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.indexRename = function (oldName, newName, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 2, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 2, 3, 'indexRename', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INDEX_RENAME);
        var args = [this, new Term(this._r).expr(oldName), new Term(this._r).expr(newName)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if (key !== 'overwrite') {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `indexRename`', _this._query, 'Available options are overwrite <bool>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.indexWait = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INDEX_WAIT);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.default = function (expression) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'default', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DEFAULT);
        var args = [this, new Term(this._r).expr(expression)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.forEach = function (func) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'forEach', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.FOR_EACH);
        var args = [this, new Term(this._r).expr(func)._wrap()];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.branch = function (trueBranch, falseBranch) {
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 2, 3, 'branch', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.BRANCH);
        var args = [];
        args.push(this);
        args.push(new Term(this._r).expr(trueBranch));
        args.push(new Term(this._r).expr(falseBranch));
        term._fillArgs(args);
        return term;
    };
    Term.prototype.do = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'do', this);
        var term = new Term(this._r);
        term._query.push(termTypes.FUNCALL);
        var args = [new Term(this._r).expr(_args[_args.length - 1])._wrap()._query];
        args.push(this);
        for (var i = 0; i < _args.length - 1; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.args = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._noPrefix(this, 'args');
        var term = new Term(this._r);
        term._query.push(termTypes.ARGS);
        var args = [];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.december = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.DECEMBER);
        return term;
    };
    Term.prototype.november = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.NOVEMBER);
        return term;
    };
    Term.prototype.october = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.OCTOBER);
        return term;
    };
    Term.prototype.september = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.SEPTEMBER);
        return term;
    };
    Term.prototype.august = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.AUGUST);
        return term;
    };
    Term.prototype.july = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.JULY);
        return term;
    };
    Term.prototype.june = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.JUNE);
        return term;
    };
    Term.prototype.may = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.MAY);
        return term;
    };
    Term.prototype.april = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.APRIL);
        return term;
    };
    Term.prototype.march = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.MARCH);
        return term;
    };
    Term.prototype.february = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.FEBRUARY);
        return term;
    };
    Term.prototype.january = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.JANUARY);
        return term;
    };
    Term.prototype.sunday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.SUNDAY);
        return term;
    };
    Term.prototype.saturday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.SATURDAY);
        return term;
    };
    Term.prototype.friday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.FRIDAY);
        return term;
    };
    Term.prototype.thursday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.THURSDAY);
        return term;
    };
    Term.prototype.wednesday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.WEDNESDAY);
        return term;
    };
    Term.prototype.tuesday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.TUESDAY);
        return term;
    };
    Term.prototype.monday = function () {
        var term = new Term(this._r);
        term._query.push(termTypes.MONDAY);
        return term;
    };
    Term.prototype.toEpochTime = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'toEpochTime', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TO_EPOCH_TIME);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.toISO8601 = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'toISO8601', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TO_ISO8601);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.seconds = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'seconds', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SECONDS);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.minutes = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'minutes', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.MINUTES);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.hours = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'hours', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.HOURS);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.dayOfWeek = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'dayOfWeek', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DAY_OF_WEEK);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.dayOfYear = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'dayOfYear', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DAY_OF_YEAR);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.day = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'day', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DAY);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.month = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'month', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.MONTH);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.year = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'year', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.YEAR);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.timeOfDay = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'timeOfDay', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TIME_OF_DAY);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.date = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'date', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DATE);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.during = function (left, right, options) {
        if (this._fastArityRange(arguments.length, 2, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
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
    };
    Term.prototype.timezone = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'timezone', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TIMEZONE);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.inTimezone = function (timezone) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'inTimezone', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.IN_TIMEZONE);
        var args = [this, new Term(this._r).expr(timezone)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.ISO8601 = function (isoTime, options) {
        this._noPrefix(this, 'ISO8601');
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'ISO8601', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.ISO8601);
        var args = [new Term(this._r).expr(isoTime)._query];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if (key !== 'defaultTimezone') {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `ISO8601`. Available options are primaryKey <string>, durability <string>, datancenter <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
        // return new ISO8601(this._r, isoTime, options);
    };
    Term.prototype.epochTime = function (epochTime) {
        this._noPrefix(this, 'epochTime');
        var term = new Term(this._r);
        term._query.push(termTypes.EPOCH_TIME);
        var args = [new Term(this._r).expr(epochTime)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.time = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._noPrefix(this, 'time');
        // Special check for arity
        var foundArgs = false;
        for (var i = 0; i < _args.length; i++) {
            if ((_args[i] instanceof Term) && (_args[i]._query[0] === termTypes.ARGS)) {
                foundArgs = true;
                break;
            }
        }
        if (foundArgs === false) {
            if ((_args.length !== 4) && (_args.length !== 7)) {
                throw new Error.ReqlDriverError('`r.time` called with ' + _args.length + ' argument' + ((_args.length > 1) ? 's' : ''), null, '`r.time` takes 4 or 7 arguments');
            }
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TIME);
        var args = [];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.now = function () {
        this._noPrefix(this, 'now');
        var term = new Term(this._r);
        term._query.push(termTypes.NOW);
        return term;
    };
    Term.prototype.round = function () {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'round', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.ROUND);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.ceil = function () {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'ceil', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.CEIL);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.floor = function () {
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'floor', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.FLOOR);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.random = function () {
        var _this = this;
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var self = this;
        this._noPrefix(this, 'random');
        this._arityRange(_args, 0, 3, 'random', self);
        var term = new Term(this._r);
        term._query.push(termTypes.RANDOM);
        var args = [];
        for (var i = 0; i < _args.length - 1; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        if (_args.length > 0) {
            if (helper.isPlainObject(_args[_args.length - 1])) {
                helper.loopKeys(_args[_args.length - 1], function (obj, key) {
                    if (key !== 'float') {
                        throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `random`', _this._query, 'Available option is float: <boolean>');
                    }
                });
                term._fillArgs(args);
                term._query.push(new Term(this._r).expr(translateOptions(_args[_args.length - 1]))._query);
            }
            else {
                args.push(new Term(this._r).expr(_args[_args.length - 1]));
                term._fillArgs(args);
            }
        }
        else {
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.not = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'not', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.NOT);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.le = function (other) {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'le', this);
        var term = new Term(this._r);
        term._query.push(termTypes.LE);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.lt = function (other) {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'lt', this);
        var term = new Term(this._r);
        term._query.push(termTypes.LT);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.ge = function (other) {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'ge', this);
        var term = new Term(this._r);
        term._query.push(termTypes.GE);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.gt = function (other) {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'gt', this);
        var term = new Term(this._r);
        term._query.push(termTypes.GT);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.ne = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'ne', this);
        var term = new Term(this._r);
        term._query.push(termTypes.NE);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.eq = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'eq', this);
        var term = new Term(this._r);
        term._query.push(termTypes.EQ);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.or = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new Term(this._r);
        term._query.push(termTypes.OR);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.and = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new Term(this._r);
        term._query.push(termTypes.AND);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.mod = function (b) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'mod', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.MOD);
        var args = [this, new Term(this._r).expr(b)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.div = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'div', this);
        var term = new Term(this._r);
        term._query.push(termTypes.DIV);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.mul = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'mul', this);
        var term = new Term(this._r);
        term._query.push(termTypes.MUL);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.sub = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'sub', this);
        var term = new Term(this._r);
        term._query.push(termTypes.SUB);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.add = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'add', this);
        var term = new Term(this._r);
        term._query.push(termTypes.ADD);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.downcase = function (regex) {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'upcase', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DOWNCASE);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.upcase = function (regex) {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'upcase', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.UPCASE);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.match = function (regex) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'match', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.MATCH);
        var args = [this, new Term(this._r).expr(regex)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.object = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._noPrefix(this, 'object');
        this._arityRange(_args, 0, Infinity, 'object', this);
        var term = new Term(this._r);
        term._query.push(termTypes.OBJECT);
        var args = [];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.values = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'keys', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.VALUES);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.keys = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'keys', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.KEYS);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.changeAt = function (index, value) {
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'changeAt', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.CHANGE_AT);
        var args = [this];
        args.push(new Term(this._r).expr(index));
        args.push(new Term(this._r).expr(value));
        term._fillArgs(args);
        return term;
    };
    Term.prototype.deleteAt = function (start, end) {
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'deleteAt', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DELETE_AT);
        var args = [this, new Term(this._r).expr(start)];
        if (end !== undefined) {
            args.push(new Term(this._r).expr(end));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.spliceAt = function (index, array) {
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'spliceAt', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SPLICE_AT);
        var args = [this, new Term(this._r).expr(index), new Term(this._r).expr(array)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.insertAt = function (index, value) {
        if (this._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 2, 'insertAt', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INSERT_AT);
        var args = [this, new Term(this._r).expr(index), new Term(this._r).expr(value)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.hasFields = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        this._arityRange(_args, 1, Infinity, 'hasFields', this);
        var term = new Term(this._r);
        term._query.push(termTypes.HAS_FIELDS);
        var args = [this];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.bracket = function (field) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, '(...)', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.BRACKET);
        var args = [this, new Term(this._r).expr(field)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.getField = function (field) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, '(...)', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.GET_FIELD);
        var args = [this, new Term(this._r).expr(field)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.setDifference = function (other) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'setDifference', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.SET_DIFFERENCE);
        var args = [this, new Term(this._r).expr(other)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.getIntersecting = function (geometry, options) {
        var _this = this;
        if (this._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 2, 'getIntersecting', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.GET_INTERSECTING);
        var args = [this, new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if (key !== 'index') {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `distance`', _this._query, 'Available options are index <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.toGeojson = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'toGeojson', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TO_GEOJSON);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.geojson = function (geometry) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'geojson', this);
        }
        this._noPrefix(this, 'geojson');
        var term = new Term(this._r);
        term._query.push(termTypes.GEOJSON);
        var args = [new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.fill = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'fill', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.FILL);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.distance = function (geometry, options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'distance', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.DISTANCE);
        var args = [self, new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'geoSystem') && (key !== 'unit')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `distance`', _this._query, 'Available options are geoSystem <string>, unit <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.circle = function (center, radius, options) {
        var _this = this;
        var self = this;
        // Arity check is done by r.circle
        this._noPrefix(self, 'circle');
        var term = new Term(this._r);
        term._query.push(termTypes.CIRCLE);
        var args = [new Term(this._r).expr(center), new Term(this._r).expr(radius)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            // There is no need to translate here
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'numVertices') && (key !== 'geoSystem') && (key !== 'unit') && (key !== 'fill')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `circle`', _this._query, 'Available options are numVertices <number>, geoSsystem <string>, unit <string> and fill <bool>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.uuid = function (str) {
        this._noPrefix(this, 'uuid');
        var term = new Term(this._r);
        term._query.push(termTypes.UUID);
        if (str !== undefined) {
            var args = [new Term(this._r).expr(str)];
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.http = function (url, options) {
        this._noPrefix(this, 'http');
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'http', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.HTTP);
        var args = [new Term(this._r).expr(url)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'timeout')
                    && (key !== 'reattempts')
                    && (key !== 'redirects')
                    && (key !== 'verify')
                    && (key !== 'resultFormat')
                    && (key !== 'method')
                    && (key !== 'auth')
                    && (key !== 'params')
                    && (key !== 'header')
                    && (key !== 'data')
                    && (key !== 'page')
                    && (key !== 'pageLimit')
                    && (key !== '')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `http`. Available options are reattemps <number>, redirects <number>, verify <boolean>, resultFormat: <string>, method: <string>, auth: <object>, params: <object>, header: <string>, data: <string>, page: <string/function>, pageLimit: <number>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.json = function (json) {
        this._noPrefix(this, 'json');
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
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
    };
    Term.prototype.info = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'info', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INFO);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.typeOf = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'typeOf', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TYPE_OF);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.coerceTo = function (type) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'coerceTo', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.COERCE_TO);
        var args = [this, new Term(this._r).expr(type)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.js = function (arg, options) {
        this._noPrefix(this, 'js');
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'js', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.JAVASCRIPT);
        var args = [new Term(this._r).expr(arg)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.binary = function (bin) {
        this._noPrefix(this, 'binary');
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
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
            term._query.push(termTypes.BINARY);
            var args = [new Term(this._r).expr(bin)];
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.expr = function (expression, nestingLevel) {
        var _this = this;
        var self = this;
        this._noPrefix(self, 'expr');
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 1, 2, 'expr', self);
        }
        // undefined will be caught in the last else
        var ar, obj;
        if (expression === undefined) {
            var error = 'Cannot convert `undefined` with r.expr()';
            return new Term(this._r, expression, error);
        }
        var _nestingLevel = nestingLevel;
        if (_nestingLevel == null) {
            _nestingLevel = this._r.nestingLevel;
        }
        //if (nestingLevel == null) nestingLevel = this._r.nestingLevel;
        if (_nestingLevel < 0)
            throw new Error.ReqlDriverError('Nesting depth limit exceeded.\nYou probably have a circular reference somewhere');
        if (expression instanceof Term) {
            return expression;
        }
        else if (expression instanceof Function) {
            return new Func(this._r, expression);
        }
        else if (expression instanceof Date) {
            return new Term(this._r).ISO8601(expression.toISOString());
        }
        else if (Array.isArray(expression)) {
            var term = new Term(this._r);
            term._query.push(termTypes.MAKE_ARRAY);
            var args = [];
            for (var i = 0; i < expression.length; i++) {
                args.push(new Term(this._r).expr(expression[i], _nestingLevel - 1));
            }
            term._fillArgs(args);
            return term;
        }
        else if (expression instanceof Buffer) {
            return this._r.binary(expression);
        }
        else if (helper.isPlainObject(expression)) {
            var term = new Term(this._r);
            var optArgs = {};
            var foundError = false;
            helper.loopKeys(expression, function (expression, key) {
                if (expression[key] !== undefined) {
                    var optArg = new Term(_this._r).expr(expression[key], _nestingLevel - 1);
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
        else {
            if (expression === null) {
                return new Term(this._r, null, expression);
            }
            else if (typeof expression === 'string') {
                return new Term(this._r, expression);
            }
            else if (typeof expression === 'number') {
                if (expression !== expression) {
                    var error = 'Cannot convert `NaN` to JSON';
                    return new Term(this._r, expression, error);
                }
                else if (!isFinite(expression)) {
                    var error = 'Cannot convert `Infinity` to JSON';
                    return new Term(this._r, expression, error);
                }
                return new Term(this._r, expression);
            }
            else if (typeof expression === 'boolean') {
                return new Term(this._r, expression);
            }
            else {
                //TODO
                this._error = new Error.ReqlDriverError('Cannot convert `' + expression + '` to datum.');
            }
        }
        return self;
    };
    Term.prototype.finally = function (handler) {
        return this.run().finally(handler);
    };
    Term.prototype.catch = function (reject) {
        return this.run().catch(reject);
    };
    Term.prototype.error = function (reject) {
        return this.run().error(reject);
    };
    Term.prototype.then = function (resolve, reject) {
        return this.run().then(resolve, reject);
    };
    Term.prototype.rebalance = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'rebalance', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.REBALANCE);
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            var args = [this];
            term._fillArgs(args);
        }
        return term;
    };
    Term.prototype.reconfigure = function (config) {
        var _this = this;
        var self = this;
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'reconfigure', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.RECONFIGURE);
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            var args = [this];
            term._fillArgs(args);
        }
        else {
            term._query.push([]);
        }
        if (helper.isPlainObject(config)) {
            helper.loopKeys(config, function (obj, key) {
                if ((key !== 'shards') && (key !== 'replicas') &&
                    (key !== 'dryRun') && (key !== 'primaryReplicaTag') &&
                    (key !== 'nonvotingReplicaTags') && (key !== 'emergencyRepair')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `reconfigure`', _this._query, 'Available options are shards: <number>, replicas: <number>, primaryReplicaTag: <object>, dryRun <boolean>, emergencyRepair: <string>, nonvotingReplicaTags: <array<string>>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(config))._query);
        }
        else {
            throw new Error.ReqlDriverError('First argument of `reconfigure` must be an object');
        }
        return term;
    };
    Term.prototype.wait = function (options) {
        var _this = this;
        var self = this;
        if (this._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arityRange(_args, 0, 1, 'wait', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.WAIT);
        if (Array.isArray(this._query) && (this._query.length > 0)) {
            var args = [self];
            term._fillArgs(args);
        }
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'waitFor') && (key !== 'timeout')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `wait`', _this._query, 'Available options are waitFor: <string>, timeout: <number>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype.status = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'status', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.STATUS);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.config = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'config', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.CONFIG);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.toJsonString = function () {
        if (this._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 0, 'toJSON', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.TO_JSON_STRING);
        var args = [this];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.range = function (start, end) {
        this._noPrefix(this, 'range');
        if (this._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
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
    };
    Term.prototype.polygonSub = function (geometry) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'polygonSub', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.POLYGON_SUB);
        var args = [this, new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.polygon = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        // Arity check is done by r.polygon
        this._noPrefix(this, 'polygon');
        var term = new Term(this._r);
        term._query.push(termTypes.POLYGON);
        var args = [];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.point = function (longitude, latitude) {
        // Arity check is done by r.point
        this._noPrefix(this, 'point');
        var term = new Term(this._r);
        term._query.push(termTypes.POINT);
        var args = [new Term(this._r).expr(longitude), new Term(this._r).expr(latitude)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.line = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        // Arity check is done by r.line
        this._noPrefix(this, 'line');
        var term = new Term(this._r);
        term._query.push(termTypes.LINE);
        var args = [];
        for (var i = 0; i < _args.length; i++) {
            args.push(new Term(this._r).expr(_args[i]));
        }
        term._fillArgs(args);
        return term;
    };
    Term.prototype.intersects = function (geometry) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'intersects', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INTERSECTS);
        var args = [this, new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.includes = function (geometry) {
        if (this._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 1, 'includes', this);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.INCLUDES);
        var args = [this, new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        return term;
    };
    Term.prototype.getNearest = function (geometry, options) {
        var _this = this;
        var self = this;
        if (this._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            this._arity(_args, 2, 'getNearest', self);
        }
        var term = new Term(this._r);
        term._query.push(termTypes.GET_NEAREST);
        var args = [self, new Term(this._r).expr(geometry)];
        term._fillArgs(args);
        if (helper.isPlainObject(options)) {
            helper.loopKeys(options, function (obj, key) {
                if ((key !== 'index') && (key !== 'maxResults') && (key !== 'maxDist') && (key !== 'unit') && (key !== 'geoSystem')) {
                    throw new Error.ReqlDriverError('Unrecognized option `' + key + '` in `getNearest`', _this._query, 'Available options are index <string>, maxResults <number>, maxDist <number>, unit <string>, geoSystem <string>');
                }
            });
            term._query.push(new Term(this._r).expr(translateOptions(options))._query);
        }
        return term;
    };
    Term.prototype._arity = function (args, num, method, term) {
        var foundArgs = false;
        for (var i = 0; i < args.length; i++) {
            if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
                foundArgs = true;
                break;
            }
        }
        if (foundArgs === false) {
            throw new Error.ReqlDriverError('`' + method + '` takes ' + num + ' argument' + ((num > 1) ? 's' : '') + ', ' + args.length + ' provided', term._query);
        }
    };
    Term.prototype._arityRange = function (args, min, max, method, term) {
        var foundArgs = false;
        if (args.length < min) {
            for (var i = 0; i < args.length; i++) {
                if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
                    foundArgs = true;
                    break;
                }
            }
            if (foundArgs === false) {
                throw new Error.ReqlDriverError('`' + method + '` takes at least ' + min + ' argument' + ((min > 1) ? 's' : '') + ', ' + args.length + ' provided', term._query);
            }
        }
        else if (args.length > max) {
            for (var i = 0; i < args.length; i++) {
                if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
                    foundArgs = true;
                    break;
                }
            }
            if (foundArgs === false) {
                throw new Error.ReqlDriverError('`' + method + '` takes at most ' + max + ' argument' + ((max > 1) ? 's' : '') + ', ' + args.length + ' provided', term._query);
            }
        }
    };
    Term.prototype._noPrefix = function (term, method) {
        if ((!Array.isArray(term._query)) || (term._query.length > 0)) {
            throw new Error.ReqlDriverError('`' + method + '` is not defined', term._query);
        }
    };
    Term.prototype.toString = function () {
        return Error.generateBacktrace(this._query, 0, null, [], { indent: 0, extra: 0 }).str;
    };
    Term.prototype._wrap = function () {
        var self = this;
        if (helper.hasImplicit(this._query)) {
            if (this._query[0] === termTypes.ARGS) {
                throw new Error.ReqlDriverError('Implicit variable `r.row` cannot be used inside `r.args`');
            }
            //Must pass at least one variable to the function or it won't accept r.row
            return new Term(this._r).expr(function (doc) { return self; });
        }
        else {
            return self;
        }
    };
    Term.prototype._fillArgs = function (args) {
        var foundError = false;
        var internalArgs = [];
        for (var i = 0; i < args.length; i++) {
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
    };
    Term.prototype._setNestingLevel = function (nestingLevel) {
        Term.prototype._nestingLevel = nestingLevel;
    };
    Term.prototype._setArrayLimit = function (arrayLimit) {
        Term.prototype._arrayLimit = arrayLimit;
    };
    Term.prototype._fastArity = function (len, num) {
        // Cheap arity check. If it fails, return false, and then we are expected to call _arity/_arityRange
        return (len === num);
    };
    Term.prototype._fastArityRange = function (len, min, max) {
        return ((len >= min) && (len <= max));
    };
    return Term;
})();
exports.Term = Term;
Term.prototype.toJSON = Term.prototype.toJsonString;
Term.prototype.indexesOf = Term.prototype.offsetsOf;
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
    firstBatchScaledownFactor: 'first_batch_scaledown_factor'
};
function translateOptions(options) {
    var translatedOpt = {};
    helper.loopKeys(options, function (options, key) {
        var keyServer = Term.prototype._translateArgs[key] || key;
        translatedOpt[keyServer] = options[key];
    });
    return translatedOpt;
}
// Datums
var Func = (function (_super) {
    __extends(Func, _super);
    function Func(r, func) {
        // We can retrieve the names of the arguments with
        // func.toString().match(/\(([^\)]*)\)/)[1].split(/\s*,\s*/)
        var term = _super.call(this, r);
        term.nextVarId = 1;
        term._query.push(termTypes.FUNC);
        var args = [];
        var argVars = [];
        var argNums = [];
        for (var i = 0; i < func.length; i++) {
            argVars.push(new Var(r, r.nextVarId));
            argNums.push(r.nextVarId);
            if (r.nextVarId === 9007199254740992) {
                r.nextVarId = 0;
            }
            else {
                r.nextVarId++;
            }
        }
        var body = func.apply(func, argVars);
        if (body === undefined)
            throw new Error.ReqlDriverError('Annonymous function returned `undefined`. Did you forget a `return`? In:\n' + func.toString(), this._query);
        body = new Term(r).expr(body);
        args.push(new Term(r).expr(argNums));
        args.push(body);
        term._fillArgs(args);
        return term;
    }
    return Func;
})(Term);
var Var = (function (_super) {
    __extends(Var, _super);
    function Var(r, id) {
        var term = _super.call(this, r);
        term._query.push(termTypes.VAR);
        term._query.push([new Term(r).expr(id)._query]);
        return term;
    }
    return Var;
})(Term);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90ZXJtLnRzIl0sIm5hbWVzIjpbIlRlcm0iLCJUZXJtLmNvbnN0cnVjdG9yIiwiVGVybS5pbmRleFN0YXR1cyIsIlRlcm0uaW5kZXhEcm9wIiwiVGVybS5pbmRleENyZWF0ZSIsIlRlcm0uaW5kZXhMaXN0IiwiVGVybS50YWJsZUxpc3QiLCJUZXJtLnRhYmxlRHJvcCIsIlRlcm0udGFibGVDcmVhdGUiLCJUZXJtLmRiTGlzdCIsIlRlcm0uZGJEcm9wIiwiVGVybS5kYkNyZWF0ZSIsIlRlcm0uX3RvVHJhbnNmb3JtU3RyZWFtIiwiVGVybS5fdG9Xcml0YWJsZVN0cmVhbSIsIlRlcm0uX3RvUmVhZGFibGVTdHJlYW0iLCJUZXJtLnRvU3RyZWFtIiwiVGVybS5ydW4iLCJUZXJtLnNldEludGVyc2VjdGlvbiIsIlRlcm0uc2V0VW5pb24iLCJUZXJtLnNldEluc2VydCIsIlRlcm0uZGlmZmVyZW5jZSIsIlRlcm0ucHJlcGVuZCIsIlRlcm0uYXBwZW5kIiwiVGVybS5saXRlcmFsIiwiVGVybS5tZXJnZSIsIlRlcm0ud2l0aG91dCIsIlRlcm0ucGx1Y2siLCJUZXJtLnJvdyIsIlRlcm0ubWF4IiwiVGVybS5taW4iLCJUZXJtLmF2ZyIsIlRlcm0uc3VtIiwiVGVybS5jb250YWlucyIsIlRlcm0udW5ncm91cCIsIlRlcm0uc3BsaXQiLCJUZXJtLmdyb3VwIiwiVGVybS5kaXN0aW5jdCIsIlRlcm0uY291bnQiLCJUZXJtLnJlZHVjZSIsIlRlcm0uc2FtcGxlIiwiVGVybS51bmlvbiIsIlRlcm0uaXNFbXB0eSIsIlRlcm0ub2Zmc2V0c09mIiwiVGVybS5udGgiLCJUZXJtLnNsaWNlIiwiVGVybS5saW1pdCIsIlRlcm0uc2tpcCIsIlRlcm0uYXNjIiwiVGVybS5kZXNjIiwiVGVybS5vcmRlckJ5IiwiVGVybS5jb25jYXRNYXAiLCJUZXJtLndpdGhGaWVsZHMiLCJUZXJtLm1hcCIsIlRlcm0uemlwIiwiVGVybS5lcUpvaW4iLCJUZXJtLm91dGVySm9pbiIsIlRlcm0uaW5uZXJKb2luIiwiVGVybS5maWx0ZXIiLCJUZXJtLm1heHZhbCIsIlRlcm0ubWludmFsIiwiVGVybS5iZXR3ZWVuIiwiVGVybS5nZXRBbGwiLCJUZXJtLmdldCIsIlRlcm0udGFibGUiLCJUZXJtLmRiIiwiVGVybS5zeW5jIiwiVGVybS5kZWxldGUiLCJUZXJtLnJlcGxhY2UiLCJUZXJtLnVwZGF0ZSIsIlRlcm0uaW5zZXJ0IiwiVGVybS5jaGFuZ2VzIiwiVGVybS5pbmRleFJlbmFtZSIsIlRlcm0uaW5kZXhXYWl0IiwiVGVybS5kZWZhdWx0IiwiVGVybS5mb3JFYWNoIiwiVGVybS5icmFuY2giLCJUZXJtLmRvIiwiVGVybS5hcmdzIiwiVGVybS5kZWNlbWJlciIsIlRlcm0ubm92ZW1iZXIiLCJUZXJtLm9jdG9iZXIiLCJUZXJtLnNlcHRlbWJlciIsIlRlcm0uYXVndXN0IiwiVGVybS5qdWx5IiwiVGVybS5qdW5lIiwiVGVybS5tYXkiLCJUZXJtLmFwcmlsIiwiVGVybS5tYXJjaCIsIlRlcm0uZmVicnVhcnkiLCJUZXJtLmphbnVhcnkiLCJUZXJtLnN1bmRheSIsIlRlcm0uc2F0dXJkYXkiLCJUZXJtLmZyaWRheSIsIlRlcm0udGh1cnNkYXkiLCJUZXJtLndlZG5lc2RheSIsIlRlcm0udHVlc2RheSIsIlRlcm0ubW9uZGF5IiwiVGVybS50b0Vwb2NoVGltZSIsIlRlcm0udG9JU084NjAxIiwiVGVybS5zZWNvbmRzIiwiVGVybS5taW51dGVzIiwiVGVybS5ob3VycyIsIlRlcm0uZGF5T2ZXZWVrIiwiVGVybS5kYXlPZlllYXIiLCJUZXJtLmRheSIsIlRlcm0ubW9udGgiLCJUZXJtLnllYXIiLCJUZXJtLnRpbWVPZkRheSIsIlRlcm0uZGF0ZSIsIlRlcm0uZHVyaW5nIiwiVGVybS50aW1lem9uZSIsIlRlcm0uaW5UaW1lem9uZSIsIlRlcm0uSVNPODYwMSIsIlRlcm0uZXBvY2hUaW1lIiwiVGVybS50aW1lIiwiVGVybS5ub3ciLCJUZXJtLnJvdW5kIiwiVGVybS5jZWlsIiwiVGVybS5mbG9vciIsIlRlcm0ucmFuZG9tIiwiVGVybS5ub3QiLCJUZXJtLmxlIiwiVGVybS5sdCIsIlRlcm0uZ2UiLCJUZXJtLmd0IiwiVGVybS5uZSIsIlRlcm0uZXEiLCJUZXJtLm9yIiwiVGVybS5hbmQiLCJUZXJtLm1vZCIsIlRlcm0uZGl2IiwiVGVybS5tdWwiLCJUZXJtLnN1YiIsIlRlcm0uYWRkIiwiVGVybS5kb3duY2FzZSIsIlRlcm0udXBjYXNlIiwiVGVybS5tYXRjaCIsIlRlcm0ub2JqZWN0IiwiVGVybS52YWx1ZXMiLCJUZXJtLmtleXMiLCJUZXJtLmNoYW5nZUF0IiwiVGVybS5kZWxldGVBdCIsIlRlcm0uc3BsaWNlQXQiLCJUZXJtLmluc2VydEF0IiwiVGVybS5oYXNGaWVsZHMiLCJUZXJtLmJyYWNrZXQiLCJUZXJtLmdldEZpZWxkIiwiVGVybS5zZXREaWZmZXJlbmNlIiwiVGVybS5nZXRJbnRlcnNlY3RpbmciLCJUZXJtLnRvR2VvanNvbiIsIlRlcm0uZ2VvanNvbiIsIlRlcm0uZmlsbCIsIlRlcm0uZGlzdGFuY2UiLCJUZXJtLmNpcmNsZSIsIlRlcm0udXVpZCIsIlRlcm0uaHR0cCIsIlRlcm0uanNvbiIsIlRlcm0uaW5mbyIsIlRlcm0udHlwZU9mIiwiVGVybS5jb2VyY2VUbyIsIlRlcm0uanMiLCJUZXJtLmJpbmFyeSIsIlRlcm0uZXhwciIsIlRlcm0uZmluYWxseSIsIlRlcm0uY2F0Y2giLCJUZXJtLmVycm9yIiwiVGVybS50aGVuIiwiVGVybS5yZWJhbGFuY2UiLCJUZXJtLnJlY29uZmlndXJlIiwiVGVybS53YWl0IiwiVGVybS5zdGF0dXMiLCJUZXJtLmNvbmZpZyIsIlRlcm0udG9Kc29uU3RyaW5nIiwiVGVybS5yYW5nZSIsIlRlcm0ucG9seWdvblN1YiIsIlRlcm0ucG9seWdvbiIsIlRlcm0ucG9pbnQiLCJUZXJtLmxpbmUiLCJUZXJtLmludGVyc2VjdHMiLCJUZXJtLmluY2x1ZGVzIiwiVGVybS5nZXROZWFyZXN0IiwiVGVybS5fYXJpdHkiLCJUZXJtLl9hcml0eVJhbmdlIiwiVGVybS5fbm9QcmVmaXgiLCJUZXJtLnRvU3RyaW5nIiwiVGVybS5fd3JhcCIsIlRlcm0uX2ZpbGxBcmdzIiwiVGVybS5fc2V0TmVzdGluZ0xldmVsIiwiVGVybS5fc2V0QXJyYXlMaW1pdCIsIlRlcm0uX2Zhc3RBcml0eSIsIlRlcm0uX2Zhc3RBcml0eVJhbmdlIiwidHJhbnNsYXRlT3B0aW9ucyIsIkZ1bmMiLCJGdW5jLmNvbnN0cnVjdG9yIiwiVmFyIiwiVmFyLmNvbnN0cnVjdG9yIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFBLElBQU8sT0FBTyxXQUFXLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLElBQU8sUUFBUSxXQUFXLFlBQVksQ0FBQyxDQUFDO0FBQ3hDLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBRXZDLElBQVksS0FBSyxXQUFNLFNBQVMsQ0FBQyxDQUFBO0FBQ2pDLElBQVksTUFBTSxXQUFNLFVBQVUsQ0FBQyxDQUFBO0FBQ25DLHVCQUE2QixVQUFVLENBQUMsQ0FBQTtBQUN4QyxnQ0FBNkIsbUJBQW1CLENBQUMsQ0FBQTtBQUNqRCxpQ0FBOEIsb0JBQW9CLENBQUMsQ0FBQTtBQUVuRDtJQVFFQSxjQUFZQSxDQUFDQSxFQUFFQSxLQUFNQSxFQUFFQSxLQUFNQTtRQUMzQkMsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLElBQUlBLFNBQVNBLEdBQUdBLFVBQVVBLEtBQUtBO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDN0QsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztnQkFBQyxJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7b0JBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFBQyxDQUFDO2dCQUMxSCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDQTtRQUNGQSxJQUFJQSxJQUFJQSxHQUFHQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFPQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVyREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDeEJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLEVBQUVBLENBQUNBO1FBQ25CQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUN0QkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsNENBQTRDQTtRQUV6REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDeEJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLEtBQUtBLENBQUNBO1lBQ3BCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNwQkEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFREQsMEJBQVdBLEdBQVhBO1FBQ0VFLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0E7UUFDekNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVERix3QkFBU0EsR0FBVEEsVUFBVUEsSUFBSUE7UUFDWkcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDaERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVESCwwQkFBV0EsR0FBWEEsVUFBWUEsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsT0FBT0E7UUFBN0JJLGlCQTRCQ0E7UUEzQkNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLGFBQWFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JEQSxDQUFDQTtRQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNwREEsT0FBT0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDYkEsRUFBRUEsR0FBR0EsU0FBU0EsQ0FBQ0E7UUFDakJBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQTtRQUN6Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO1FBQ3hDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxFQUFFQSxLQUFLQSxXQUFXQSxDQUFDQTtZQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3RUEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxxQ0FBcUNBO1lBQ3JDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUN6Q0EsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsdUJBQXVCQSxHQUFHQSxHQUFHQSxHQUFHQSxvQkFBb0JBLEVBQUVBLEtBQUlBLENBQUNBLE1BQU1BLEVBQUVBLGlEQUFpREEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hKQSxDQUFDQTtZQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUMzREEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFREosd0JBQVNBLEdBQVRBO1FBQ0VLLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFREwsd0JBQVNBLEdBQVRBO1FBQ0VNLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7UUFFdkNBLElBQUlBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2RBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUROLHdCQUFTQSxHQUFUQSxVQUFVQSxLQUFLQTtRQUNiTyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxXQUFXQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsVUFBVUE7UUFDN0JBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3pDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRFAsMEJBQVdBLEdBQVhBLFVBQVlBLEtBQUtBLEVBQUVBLE9BQU9BO1FBQTFCUSxpQkErQkNBO1FBOUJDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckRBLENBQUNBO1FBR0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQTtRQUN6Q0EsSUFBSUEsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZEEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLFVBQVVBO1FBQzdCQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSwwQkFBMEJBO1lBQzFCQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLFlBQVlBLENBQUNBO3VCQUNyQkEsQ0FBQ0EsR0FBR0EsS0FBS0EsWUFBWUEsQ0FBQ0E7dUJBQ3RCQSxDQUFDQSxHQUFHQSxLQUFLQSxRQUFRQSxDQUFDQTt1QkFDbEJBLENBQUNBLEdBQUdBLEtBQUtBLFVBQVVBLENBQUNBO3VCQUNwQkEsQ0FBQ0EsR0FBR0EsS0FBS0EsbUJBQW1CQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkNBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsR0FBR0EsR0FBR0Esb0JBQW9CQSxFQUFFQSxLQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSx1SUFBdUlBLENBQUNBLENBQUNBO2dCQUM5T0EsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM3RUEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRFIscUJBQU1BLEdBQU5BO1FBQ0VTLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBO1FBRS9CQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURULHFCQUFNQSxHQUFOQSxVQUFPQSxFQUFFQTtRQUNQVSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUUvQkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEs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QUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUM1QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBQUEsS0FBS0E7Z0JBQ1pBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO1lBQzlCQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNMQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxVQUFVQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDbkNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzNCQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNIQSxRQUFRQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUN2QkEsTUFBTUEsR0FBR0EsSUFBSUEsdUJBQWNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFBQSxNQUFNQTtnQkFDNUJBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1lBQzVCQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFBQSxLQUFLQTtnQkFDWkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDOUJBLENBQUNBLENBQUNBLENBQUNBO1FBQ0xBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUVEZCx1QkFBUUEsR0FBUkEsVUFBU0EsVUFBVUEsRUFBRUEsT0FBT0E7UUFDMUJlLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLFVBQVVBLENBQUNBLElBQUlBLENBQUNBLE9B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QSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNqREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURqQix1QkFBUUEsR0FBUkEsVUFBU0EsS0FBS0E7UUFDWmtCLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzFDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDdENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRGxCLHdCQUFTQSxHQUFUQSxVQUFVQSxLQUFLQTtRQUNibUIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDakRBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEbkIseUJBQVVBLEdBQVZBLFVBQVdBLEtBQUtBO1FBQ2RvQixFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxZQUFZQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM1Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNqREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURwQixzQkFBT0EsR0FBUEEsVUFBUUEsS0FBS0E7UUFDWHFCLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3pDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHJCLHFCQUFNQSxHQUFOQSxVQUFPQSxLQUFLQTtRQUNWc0IsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDeENBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDakRBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdEIsc0JBQU9BLEdBQVBBLFVBQVFBLEdBQUlBO1FBQ1Z1QixJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNoQ0EsK0NBQStDQTtRQUUvQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN6QkEsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdkIsb0JBQUtBLEdBQUxBLFVBQU1BLEdBQUdBO1FBQ1B3QixJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFcERBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUN0REEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR4QixzQkFBT0EsR0FBUEE7UUFDRXlCLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUV0REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHpCLG9CQUFLQSxHQUFMQTtRQUNFMEIsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRXBEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDbENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEMUIsa0JBQUdBLEdBQUhBO1FBQ0UyQixJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUM1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDNCLGtCQUFHQSxHQUFIQSxVQUFJQSxLQUFLQTtRQUNQNEIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDN0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3hCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDaENBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNyQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUMzRUEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO2dCQUNqREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLENBQUNBO1FBQ0hBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVENUIsa0JBQUdBLEdBQUhBLFVBQUlBLEtBQUtBO1FBQ1A2QixFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM3Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDeEJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNoQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1lBQzNFQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUN2QkEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ3QixrQkFBR0EsR0FBSEEsVUFBSUEsS0FBS0E7UUFDUDhCLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzdDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDaENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN4QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDbkRBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEOUIsa0JBQUdBLEdBQUhBLFVBQUlBLEtBQUtBO1FBQ1ArQixFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM3Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDeEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO1FBQ25EQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRC9CLHVCQUFRQSxHQUFSQTtRQUNFZ0MsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRXZEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3pCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDdERBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEaEMsc0JBQU9BLEdBQVBBO1FBQ0VpQyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN6Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUN6QkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURqQyxvQkFBS0EsR0FBTEEsVUFBTUEsU0FBU0EsRUFBRUEsR0FBR0E7UUFDbEJrQyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMvQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDNUJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO1lBQzdDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1lBQ3pDQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRGxDLG9CQUFLQSxHQUFMQTtRQUFBbUMsaUJBZ0NDQTtRQS9CQ0EsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO1FBQ2hCQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVwREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDMUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElB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QUNBLFNBQVNBLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUN2QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUM3RUEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHBDLG9CQUFLQSxHQUFMQSxVQUFNQSxNQUFNQTtRQUNWcUMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDL0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsQ0EsSUFBSUEsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZEEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaEJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLEtBQUtBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3pCQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUNwREEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURyQyxxQkFBTUEsR0FBTkEsVUFBT0EsSUFBSUE7UUFDVHNDLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3hDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDbkNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO1FBQ3hEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHRDLHFCQUFNQSxHQUFOQSxVQUFPQSxJQUFJQTtRQUNUdUMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDeENBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDaERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdkMsb0JBQUtBLEdBQUxBO1FBQ0V3QyxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUUxSEEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLENBQUNBO1FBRURBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR4QyxzQkFBT0EsR0FBUEE7UUFDRXlDLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3pDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHpDLHdCQUFTQSxHQUFUQSxVQUFVQSxTQUFTQTtRQUNqQjBDLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDFDLGtCQUFHQSxHQUFIQSxVQUFJQSxLQUFLQTtRQUNQMkMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDeERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEM0Msb0JBQUtBLEdBQUxBLFVBQU1BLEtBQUtBLEVBQUVBLEdBQUdBLEVBQUVBLE9BQU9BO1FBQ3ZCNEMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDL0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUVsQ0EsSUFBSUEsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZEEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBRXpDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdkNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdFQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN4REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdkNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ3ZCQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1lBQ3pFQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDVDLG9CQUFLQSxHQUFMQSxVQUFNQSxLQUFLQTtRQUNUNkMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDakRBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEN0MsbUJBQUlBLEdBQUpBLFVBQUtBLEtBQUtBO1FBQ1I4QyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN0Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNqREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ5QyxrQkFBR0EsR0FBSEEsVUFBSUEsS0FBS0E7UUFDUCtDLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO1FBQzVCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUNuREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQvQyxtQkFBSUEsR0FBSkEsVUFBS0EsS0FBS0E7UUFDUmdELElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN0Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUNuREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURoRCxzQkFBT0EsR0FBUEE7UUFDRWlELElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUV0REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1FBRXJDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDMUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLENBQUNBO2dCQUM1QkEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RGQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM5Q0EsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO1lBQ3REQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUNEQSw2REFBNkRBO1FBQzdEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzSEEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0ZBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLENBQUNBO2dCQUMzQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BIQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3REEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO1lBQ3JFQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFFZEEsQ0FBQ0E7SUFFRGpELHdCQUFTQSxHQUFUQSxVQUFVQSxjQUFjQTtRQUN0QmtELEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUMxREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURsRCx5QkFBVUEsR0FBVkE7UUFDRW1ELElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxZQUFZQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUV6REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO1FBQ3hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRG5ELGtCQUFHQSxHQUFIQTtRQUNFb0QsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRWxEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDaENBLElBQUlBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2RBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsQ0FBQ0E7UUFDREEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDMUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSwwRUFBMEVBO1FBQzFFQSxxRUFBcUVBO1FBQ3JFQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDckVBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRXJCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEcEQsa0JBQUdBLEdBQUhBO1FBQ0VxRCxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURyRCxxQkFBTUEsR0FBTkEsVUFBT0EsUUFBUUEsRUFBRUEsUUFBUUEsRUFBRUEsT0FBT0E7UUFBbENzRCxpQkF1QkNBO1FBdEJDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtRQUNwQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO1FBQ3BEQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM1Q0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO29CQUNwQkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsdUJBQXVCQSxHQUFHQSxHQUFHQSxHQUFHQSxlQUFlQSxFQUFFQSxLQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxvQ0FBb0NBLENBQUNBLENBQUNBO2dCQUN0SUEsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM3RUEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHRELHdCQUFTQSxHQUFUQSxVQUFVQSxRQUFRQSxFQUFFQSxTQUFTQTtRQUMzQnVELEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM1Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDckRBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRXJCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdkQsd0JBQVNBLEdBQVRBLFVBQVVBLFFBQVFBLEVBQUVBLFNBQVNBO1FBQzNCd0QsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDekJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ25EQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM1REEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR4RCxxQkFBTUEsR0FBTkEsVUFBT0EsTUFBTUEsRUFBRUEsT0FBT0E7UUFBdEJ5RCxpQkFxQkNBO1FBcEJDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDMURBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRXJCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsR0FBR0EsRUFBRUEsR0FBR0E7Z0JBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdEJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsR0FBR0EsR0FBR0EsZUFBZUEsRUFBRUEsS0FBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsNEJBQTRCQSxDQUFDQSxDQUFDQTtnQkFDOUhBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLENBQUNBO1lBQ0hBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0VBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR6RCxxQkFBTUEsR0FBTkE7UUFDRTBELElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDFELHFCQUFNQSxHQUFOQTtRQUNFMkQsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ25DQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEM0Qsc0JBQU9BLEdBQVBBLFVBQVFBLEtBQUtBLEVBQUVBLEdBQUdBLEVBQUVBLE9BQU9BO1FBQTNCNEQsaUJBcUJDQTtRQXBCQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pEQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO1FBQzlFQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVyQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbENBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLE9BQU9BLEVBQUVBLFVBQUNBLEdBQUdBLEVBQUVBLEdBQUdBO2dCQUNoQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsS0FBS0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsS0FBS0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pFQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSx1QkFBdUJBLEdBQUdBLEdBQUdBLEdBQUdBLGdCQUFnQkEsRUFBRUEsS0FBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsK0VBQStFQSxDQUFDQSxDQUFDQTtnQkFDbExBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLENBQUNBO1lBQ0hBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0VBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ1RCxxQkFBTUEsR0FBTkE7UUFDRTZELDREQUE0REE7UUFDNURBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVyREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBRXBDQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNoQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDMUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzSEEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0ZBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDdELGtCQUFHQSxHQUFIQSxVQUFJQSxVQUFVQTtRQUNaOEQsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDdERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEOUQsb0JBQUtBLEdBQUxBLFVBQU1BLEtBQUtBLEVBQUVBLE9BQU9BO1FBQXBCK0QsaUJBeUJDQTtRQXhCQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQy9DQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDbENBLElBQUlBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2RBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRXJCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsR0FBR0EsRUFBRUEsR0FBR0E7Z0JBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdkJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsR0FBR0EsR0FBR0EsY0FBY0EsRUFBRUEsS0FBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsdUNBQXVDQSxDQUFDQSxDQUFDQTtnQkFDeElBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLENBQUNBO1lBQ0hBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0VBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQvRCxpQkFBRUEsR0FBRkEsVUFBR0EsRUFBRUE7UUFDSGdFLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNwQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQy9CQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN4Q0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURoRSxtQkFBSUEsR0FBSkE7UUFDRWlFLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3RDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3pCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRGpFLHFCQUFNQSxHQUFOQSxVQUFPQSxPQUFPQTtRQUFka0UsaUJBcUJDQTtRQXBCQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNB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RUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDNURBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRXJCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsR0FBR0EsRUFBRUEsR0FBR0E7Z0JBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxlQUFlQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxLQUFLQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxLQUFLQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDakZBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsR0FBR0EsR0FBR0EsZUFBZUEsRUFBRUEsS0FBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsbUZBQW1GQSxDQUFDQSxDQUFDQTtnQkFDckxBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLENBQUNBO1lBQ0hBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0VBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURwRSxxQkFBTUEsR0FBTkEsVUFBT0EsU0FBU0EsRUFBRUEsT0FBT0E7UUFBekJxRSxpQkFxQkNBO1FBcEJDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDckRBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRXJCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsR0FBR0EsRUFBRUEsR0FBR0E7Z0JBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxlQUFlQSxDQUFDQSxJQUFJQSxDQUFDQSxH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Q0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM3RUEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHRFLDBCQUFXQSxHQUFYQSxVQUFZQSxPQUFPQSxFQUFFQSxPQUFPQSxFQUFFQSxPQUFPQTtRQUFyQ3VFLGlCQXVCQ0E7UUF0QkNBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO1FBQ2hCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxhQUFhQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyREEsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBO1FBQ3pDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNwRkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBO29CQUN4QkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsdUJBQXVCQSxHQUFHQSxHQUFHQSxHQUFHQSxvQkFBb0JBLEVBQUVBLEtBQUlBLENBQUNBLE1BQU1BLEVBQUVBLHdDQUF3Q0EsQ0FBQ0EsQ0FBQ0E7Z0JBQy9JQSxDQUFDQTtZQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdFQSxDQUFDQTtRQUdEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdkUsd0JBQVNBLEdBQVRBO1FBQ0V3RSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFJRHhFLHNCQUFPQSxHQUFQQSxVQUFRQSxVQUFVQTtRQUNoQnlFLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3pDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1FBQ3REQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHpFLHNCQUFPQSxHQUFQQSxVQUFRQSxJQUFJQTtRQUNWMEUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDekNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUNyQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDeERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEMUUscUJBQU1BLEdBQU5BLFVBQU9BLFVBQVVBLEVBQUVBLFdBQVdBO1FBQzVCMkUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZEEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUMvQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQzRSxpQkFBRUEsR0FBRkE7UUFDRTRFLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVqREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM1RUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDaEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQzFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ1RSxtQkFBSUEsR0FBSkE7UUFDRTZFLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUU3QkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEN0UsdUJBQVFBLEdBQVJBO1FBQ0U4RSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ5RSx1QkFBUUEsR0FBUkE7UUFDRStFLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtR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RUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEbEcsc0JBQU9BLEdBQVBBO1FBQ0VtRyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN6Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURuRyxzQkFBT0EsR0FBUEE7UUFDRW9HLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3pDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHBHLG9CQUFLQSxHQUFMQTtRQUNFcUcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEckcsd0JBQVNBLEdBQVRBO1FBQ0VzRyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxXQUFXQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO1FBQ3hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR0Ryx3QkFBU0EsR0FBVEE7UUFDRXVHLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7UUFDeENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHZHLGtCQUFHQSxHQUFIQTtRQUNFd0csRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEeEcsb0JBQUtBLEdBQUxBO1FBQ0V5RyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR6RyxtQkFBSUEsR0FBSkE7UUFDRTBHLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3RDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDFHLHdCQUFTQSxHQUFUQTtRQUNFMkcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUN4Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEM0csbUJBQUlBLEdBQUpBO1FBQ0U0RyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN0Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ1RyxxQkFBTUEsR0FBTkEsVUFBT0EsSUFBSUEsRUFBRUEsS0FBS0EsRUFBRUEsT0FBT0E7UUFDekI2RyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNoREEsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ25DQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNoQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDeENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBRXpDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0VBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ3Ryx1QkFBUUEsR0FBUkE7UUFDRThHLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzFDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDlHLHlCQUFVQSxHQUFWQSxVQUFXQSxRQUFRQTtRQUNqQitHLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFlBQVlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzVDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7UUFDeENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO1FBQ3BEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRC9HLHNCQUFPQSxHQUFQQSxVQUFRQSxPQUFPQSxFQUFFQSxPQUFRQTtRQUN2QmdILElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1FBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNqREEsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNwREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLGlCQUFpQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzlCQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSx1QkFBdUJBLEdBQUdBLEdBQUdBLEdBQUdBLHNHQUFzR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFLQSxDQUFDQTtZQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdFQSxDQUFDQTtRQUVEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtRQUVaQSxpREFBaURBO0lBQ25EQSxDQUFDQTtJQUVEaEgsd0JBQVNBLEdBQVRBLFVBQVVBLFNBQVNBO1FBQ2pCaUgsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsV0FBV0EsQ0FBQ0EsQ0FBQ0E7UUFFbENBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDL0NBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEakgsbUJBQUlBLEdBQUpBO1FBQ0VrSCxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLDBCQUEwQkE7UUFDMUJBLElBQUlBLFNBQVNBLEdBQUdBLEtBQUtBLENBQUNBO1FBQ3RCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFFQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDakJBLEtBQUtBLENBQUNBO1lBQ1JBLENBQUNBO1FBQ0hBLENBQUNBO1FBQ0RBLEVBQUVBLENBQUNBLENBQUNBLFNBQVNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ3hCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakRBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsV0FBV0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsaUNBQWlDQSxDQUFDQSxDQUFDQTtZQUNuS0EsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEbEgsa0JBQUdBLEdBQUhBO1FBQ0VtSCxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUU1QkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEbkgsb0JBQUtBLEdBQUxBO1FBQ0VvSCxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMvQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURwSCxtQkFBSUEsR0FBSkE7UUFDRXFILEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHJILG9CQUFLQSxHQUFMQTtRQUNFc0gsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDL0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdEgscUJBQU1BLEdBQU5BO1FBQUF1SCxpQkFnQ0NBO1FBL0JDQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBO1FBQy9CQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU5Q0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBRW5DQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNkQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUMxQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3JCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbERBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLFVBQUNBLEdBQUdBLEVBQUVBLEdBQUdBO29CQUNoREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3BCQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSx1QkFBdUJBLEdBQUdBLEdBQUdBLEdBQUdBLGVBQWVBLEVBQUVBLEtBQUlBLENBQUNBLE1BQU1BLEVBQUVBLHNDQUFzQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3hJQSxDQUFDQTtnQkFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ0hBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNyQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUM3RkEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUMzREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDdkJBLENBQUNBO1FBQ0hBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdkgsa0JBQUdBLEdBQUhBO1FBQ0V3SCxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR4SCxpQkFBRUEsR0FBRkEsVUFBR0EsS0FBS0E7UUFDTnlILElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVqREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQy9CQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHpILGlCQUFFQSxHQUFGQSxVQUFHQSxLQUFLQTtRQUNOMEgsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRWpEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDL0JBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEMUgsaUJBQUVBLEdBQUZBLFVBQUdBLEtBQUtBO1FBQ04ySCxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFakRBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUMvQkEsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQzSCxpQkFBRUEsR0FBRkEsVUFBR0EsS0FBS0E7UUFDTjRILElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVqREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQy9CQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDVILGlCQUFFQSxHQUFGQTtRQUNFNkgsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRWpEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDL0JBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEN0gsaUJBQUVBLEdBQUZBO1FBQ0U4SCxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFakRBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUMvQkEsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ5SCxpQkFBRUEsR0FBRkE7UUFDRStILElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBRTFIQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDL0JBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEL0gsa0JBQUdBLEdBQUhBO1FBQ0VnSSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUUxSEEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRGhJLGtCQUFHQSxHQUFIQSxVQUFJQSxDQUFDQTtRQUNIaUksRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDN0NBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEakksa0JBQUdBLEdBQUhBO1FBQ0VrSSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFbERBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURsSSxrQkFBR0EsR0FBSEE7UUFDRW1JLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVsREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRG5JLGtCQUFHQSxHQUFIQTtRQUNFb0ksSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRWxEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDaENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN0Q0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEcEksa0JBQUdBLEdBQUhBO1FBQ0VxSSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFbERBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURySSx1QkFBUUEsR0FBUkEsVUFBU0EsS0FBS0E7UUFDWnNJLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3hDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7UUFDckNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHRJLHFCQUFNQSxHQUFOQSxVQUFPQSxLQUFLQTtRQUNWdUksRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDeENBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEdkksb0JBQUtBLEdBQUxBLFVBQU1BLEtBQUtBO1FBQ1R3SSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1FBQ2xDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNqREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR4SSxxQkFBTUEsR0FBTkE7UUFDRXlJLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUMvQkEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckRBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZEEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHpJLHFCQUFNQSxHQUFOQTtRQUNFMEksRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdENBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEMUksbUJBQUlBLEdBQUpBO1FBQ0UySSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN0Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQzSSx1QkFBUUEsR0FBUkEsVUFBU0EsS0FBS0EsRUFBRUEsS0FBS0E7UUFDbkI0SSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxVQUFVQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsREEsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1FBQ3RDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3pDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDVJLHVCQUFRQSxHQUFSQSxVQUFTQSxLQUFLQSxFQUFFQSxHQUFHQTtRQUNqQjZJLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xEQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDdENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pEQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEN0ksdUJBQVFBLEdBQVJBLFVBQVNBLEtBQUtBLEVBQUVBLEtBQUtBO1FBQ25COEksRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbERBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUN0Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDaEZBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEOUksdUJBQVFBLEdBQVJBLFVBQVNBLEtBQUtBLEVBQUVBLEtBQUtBO1FBQ25CK0ksRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDMUNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUN0Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDaEZBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEL0ksd0JBQVNBLEdBQVRBO1FBQ0VnSixJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFeERBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBRWRBLENBQUNBO0lBRURoSixzQkFBT0EsR0FBUEEsVUFBUUEsS0FBS0E7UUFDWGlKLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRGpKLHVCQUFRQSxHQUFSQSxVQUFTQSxLQUFLQTtRQUNaa0osRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUN0Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDakRBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEbEosNEJBQWFBLEdBQWJBLFVBQWNBLEtBQUtBO1FBQ2pCbUosRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsZUFBZUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDL0NBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQTtRQUMzQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFB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SUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxXQUFXQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFDREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURySixzQkFBT0EsR0FBUEEsVUFBUUEsUUFBUUE7UUFDZHNKLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3pDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNoQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR0SixtQkFBSUEsR0FBSkE7UUFDRXVKLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3RDQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHZKLHVCQUFRQSxHQUFSQSxVQUFTQSxRQUFRQSxFQUFFQSxPQUFPQTtRQUExQndKLGlCQW1CQ0E7UUFsQkNBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO1FBQ2hCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxVQUFVQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsREEsQ0FBQ0E7UUFDREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1FBQ3JDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNwREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLEdB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QUFDQTtRQUU3QkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEMUosbUJBQUlBLEdBQUpBLFVBQUtBLEdBQUdBLEVBQUVBLE9BQU9BO1FBQ2YySixJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM3QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsTUFBTUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNqQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsR0FBR0EsRUFBRUEsR0FBR0E7Z0JBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQTt1QkFDbEJBLENBQUNBLEdBQUdBLEtBQUtBLFlBQVlBLENBQUNBO3VCQUN0QkEsQ0FBQ0EsR0FBR0EsS0FBS0EsV0FBV0EsQ0FBQ0E7dUJBQ3JCQSxDQUFDQSxHQUFHQSxLQUFLQSxRQUFRQSxDQUFDQTt1QkFDbEJBLENBQUNBLEdBQUdBLEtBQUtBLGNBQWNBLENBQUNBO3VCQUN4QkEsQ0FBQ0EsR0FBR0EsS0FBS0EsUUFBUUEsQ0FBQ0E7dUJBQ2xCQSxDQUFDQSxHQUFHQSxLQUFLQSxNQUFNQSxDQUFDQTt1QkFDaEJBLENBQUNBLEdBQUdBLEtBQUtBLFFBQVFBLENBQUNBO3VCQUNsQkEsQ0FBQ0EsR0FBR0EsS0FBS0EsUUFBUUEsQ0FBQ0E7dUJBQ2xCQSxDQUFDQSxHQUFHQSxLQUFLQSxNQUFNQSxDQUFDQTt1QkFDaEJBLENBQUNBLEdBQUdBLEtBQUtBLE1BQU1BLENBQUNBO3VCQUNoQkEsQ0FBQ0EsR0FBR0EsS0FBS0EsV0FBV0EsQ0FBQ0E7dUJBQ3JCQSxDQUFDQSxHQUFHQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbEJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsR0FBR0EsR0FBR0EseVBBQXlQQSxDQUFDQSxDQUFDQTtnQkFDN1RBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLENBQUNBO1lBRUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDN0VBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQzSixtQkFBSUEsR0FBSkEsVUFBS0EsSUFBSUE7UUFDUDRKLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN0Q0EsQ0FBQ0E7UUFDREE7Ozs7VUFJRUE7UUFDRkEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBRWpDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUMxQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQ1SixtQkFBSUEsR0FBSkE7UUFDRTZKLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3RDQSxDQUFDQTtRQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakNBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRDdKLHFCQUFNQSxHQUFOQTtRQUNFOEosRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDeENBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtRQUNwQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEOUosdUJBQVFBLEdBQVJBLFVBQVNBLElBQUlBO1FBQ1grSixFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxVQUFVQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQ0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1FBQ3RDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNoREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQvSixpQkFBRUEsR0FBRkEsVUFBR0EsR0FBR0EsRUFBRUEsT0FBT0E7UUFDYmdLLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM1Q0EsQ0FBQ0E7UUFFREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFckJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxnQkFBZ0JBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdFQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEaEsscUJBQU1BLEdBQU5BLFVBQU9BLEdBQUdBO1FBQ1JpSyxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUMvQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDeENBLENBQUNBO1FBRURBLElBQUlBLElBQUlBLENBQUNBO1FBQ1RBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLFlBQVlBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO1lBQzFCQSxxRUFBcUVBO1lBQ3JFQSxxQ0FBcUNBO1lBQ3JDQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQTtnQkFDdkJBLFdBQVdBLEVBQUVBLFFBQVFBO2dCQUNyQkEsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7YUFDN0JBLENBQUNBLENBQUNBO1FBQ0xBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQ3pCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEakssbUJBQUlBLEdBQUpBLFVBQUtBLFVBQVVBLEVBQUVBLFlBQWFBO1FBQTlCa0ssaUJBMEZDQTtRQXpGQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMzREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFFREEsNENBQTRDQTtRQUM1Q0EsSUFBSUEsRUFBRUEsRUFBRUEsR0FBR0EsQ0FBQ0E7UUFFWkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLEtBQUtBLEdBQUdBLDBDQUEwQ0EsQ0FBQ0E7WUFDdkRBLE1BQU1BLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLEVBQUVBLFVBQVVBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUVEQSxJQUFJQSxhQUFhQSxHQUFHQSxZQUFZQSxDQUFDQTtRQUNqQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsYUFBYUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDMUJBLGFBQWFBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLFlBQVlBLENBQUNBO1FBQ3ZDQSxDQUFDQTtRQUNEQSxnRUFBZ0VBO1FBQ2hFQSxFQUFFQSxDQUFDQSxDQUFDQSxhQUFhQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUFDQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxpRkFBaUZBLENBQUNBLENBQUNBO1FBQzFJQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxZQUFZQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMvQkEsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0E7UUFDcEJBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLFVBQVVBLFlBQVlBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO1lBQ3hDQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtRQUN2Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsWUFBWUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLE1BQU1BLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFVBQVVBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdEQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBRXZDQSxJQUFJQSxJQUFJQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUNkQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxVQUFVQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFDM0NBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLGFBQWFBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3RFQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsWUFBWUEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdENBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3BDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxhQUFhQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLE9BQU9BLEdBQUdBLEVBQUVBLENBQUNBO1lBQ2pCQSxJQUFJQSxVQUFVQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUN2QkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsVUFBVUEsRUFBRUEsVUFBQ0EsVUFBVUEsRUFBRUEsR0FBR0E7Z0JBQzFDQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbENBLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLEtBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLGFBQWFBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO29CQUN4RUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsWUFBWUEsSUFBSUEsSUFBSUEsQ0FBQ0EsVUFBVUEsSUFBSUEsTUFBTUEsQ0FBQ0EsTUFBTUEsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ25FQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQTt3QkFDbEJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO3dCQUM1QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7b0JBQzlDQSxDQUFDQTtvQkFDREEsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7Z0JBQy9CQSxDQUFDQTtZQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNIQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxPQUFPQSxDQUFDQTtZQUN0QkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsVUFBVUEsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hCQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxJQUFJQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUM3Q0EsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsVUFBVUEsS0FBS0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hDQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUN2Q0EsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsVUFBVUEsS0FBS0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hDQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxLQUFLQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDOUJBLElBQUlBLEtBQUtBLEdBQUdBLDhCQUE4QkEsQ0FBQ0E7b0JBQzNDQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxVQUFVQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDOUNBLENBQUNBO2dCQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDL0JBLElBQUlBLEtBQUtBLEdBQUdBLG1DQUFtQ0EsQ0FBQ0E7b0JBQ2hEQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxVQUFVQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDOUNBLENBQUNBO2dCQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUN2Q0EsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsVUFBVUEsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pDQSxNQUFNQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUN2Q0EsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLE1BQU1BO2dCQUNOQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxrQkFBa0JBLEdBQUdBLFVBQVVBLEdBQUdBLGFBQWFBLENBQUNBLENBQUNBO1lBQzNGQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEbEssc0JBQU9BLEdBQVBBLFVBQVFBLE9BQU9BO1FBQ2JtSyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUNyQ0EsQ0FBQ0E7SUFFRG5LLG9CQUFLQSxHQUFMQSxVQUFNQSxNQUFNQTtRQUNWb0ssTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7SUFDbENBLENBQUNBO0lBRURwSyxvQkFBS0EsR0FBTEEsVUFBTUEsTUFBTUE7UUFDVnFLLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO0lBQ2xDQSxDQUFDQTtJQUVEckssbUJBQUlBLEdBQUpBLFVBQUtBLE9BQU9BLEVBQUVBLE1BQU1BO1FBQ2xCc0ssTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7SUFDMUNBLENBQUNBO0lBRUR0Syx3QkFBU0EsR0FBVEE7UUFDRXVLLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDdENBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUR2SywwQkFBV0EsR0FBWEEsVUFBWUEsTUFBTUE7UUFBbEJ3SyxpQkE4QkNBO1FBN0JDQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDN0NBLENBQUNBO1FBQ0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUV4Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0RBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBQ0RBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2pDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLFVBQVVBLENBQUNBO29CQUM1Q0EsQ0FBQ0EsR0FBR0EsS0FBS0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsS0FBS0EsbUJBQW1CQSxDQUFDQTtvQkFDbkRBLENBQUNBLEdBQUdBLEtBQUtBLHNCQUFzQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsS0FBS0EsaUJBQWlCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbEVBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLHVCQUF1QkEsR0FBR0EsR0FBR0EsR0FBR0Esb0JBQW9CQSxFQUFFQSxLQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSw2S0FBNktBLENBQUNBLENBQUNBO2dCQUNwUkEsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM1RUEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsbURBQW1EQSxDQUFDQSxDQUFDQTtRQUN2RkEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHhLLG1CQUFJQSxHQUFKQSxVQUFLQSxPQUFPQTtRQUFaeUssaUJBc0JDQTtRQXJCQ0EsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDaEJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBQ0RBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxHQUFHQSxFQUFFQSxHQUFHQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUMvQ0EsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsdUJBQXVCQSxHQUFHQSxHQUFHQSxHQUFHQSxhQUFhQSxFQUFFQSxLQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSw0REFBNERBLENBQUNBLENBQUNBO2dCQUM1SkEsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUM3RUEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRHpLLHFCQUFNQSxHQUFOQTtRQUNFMEssRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDeENBLENBQUNBO1FBQ0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNuQ0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEMUsscUJBQU1BLEdBQU5BO1FBQ0UySyxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN4Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ25DQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRUQzSywyQkFBWUEsR0FBWkE7UUFDRTRLLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3hDQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsQ0FBQ0E7UUFDM0NBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xCQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFJRDVLLG9CQUFLQSxHQUFMQSxVQUFNQSxLQUFLQSxFQUFFQSxHQUFJQTtRQUNmNkssSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDOUJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzNEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pEQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDbENBLElBQUlBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2RBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3pDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN0QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEN0sseUJBQVVBLEdBQVZBLFVBQVdBLFFBQVFBO1FBQ2pCOEssRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsWUFBWUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDNUNBLENBQUNBO1FBQ0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUN4Q0EsSUFBSUEsSUFBSUEsR0FBR0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDcERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUNkQSxDQUFDQTtJQUVEOUssc0JBQU9BLEdBQVBBO1FBQ0UrSyxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsbUNBQW1DQTtRQUNuQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFFaENBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzdCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtRQUVwQ0EsSUFBSUEsSUFBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7UUFDZEEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDdENBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRC9LLG9CQUFLQSxHQUFMQSxVQUFNQSxTQUFTQSxFQUFFQSxRQUFRQTtRQUN2QmdMLGlDQUFpQ0E7UUFDakNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1FBRTlCQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDbENBLElBQUlBLElBQUlBLEdBQUdBLENBQUNBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLEVBQUVBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO1FBQ2pGQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNyQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7SUFDZEEsQ0FBQ0E7SUFFRGhMLG1CQUFJQSxHQUFKQTtRQUNFaUwsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLGdDQUFnQ0E7UUFDaENBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1FBRTdCQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFakNBLElBQUlBLElBQUlBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2RBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3RDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUM5Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURqTCx5QkFBVUEsR0FBVkEsVUFBV0EsUUFBUUE7UUFDakJrTCxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuREEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxZQUFZQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM1Q0EsQ0FBQ0E7UUFDREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBQ3ZDQSxJQUFJQSxJQUFJQSxHQUFHQSxDQUFDQSxJQUFJQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNwREEsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDckJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBO0lBQ2RBLENBQUNBO0lBRURsTCx1QkFBUUEsR0FBUkEsVUFBU0EsUUFBUUE7UUFDZm1MLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQzFDQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM3QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0Es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Z0JBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzdFQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUVkQSxDQUFDQTtJQUVEcEwscUJBQU1BLEdBQU5BLFVBQU9BLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBO1FBQzVCcUwsSUFBSUEsU0FBU0EsR0FBR0EsS0FBS0EsQ0FBQ0E7UUFDdEJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ3JDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxZQUFZQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDeEVBLFNBQVNBLEdBQUdBLElBQUlBLENBQUNBO2dCQUNqQkEsS0FBS0EsQ0FBQ0E7WUFDUkEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDeEJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLEdBQUdBLEdBQUdBLE1BQU1BLEdBQUdBLFVBQVVBLEdBQUdBLEdBQUdBLEdBQUdBLFdBQVdBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLE1BQU1BLENB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