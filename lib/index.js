var Promise = require('bluebird');
var helper = require('./helper');
var connection_1 = require('./connection');
var term_1 = require('./term');
var Err = require('./error');
var pool_master_1 = require('./pool_master');
var protodef = require('./protodef');
var termTypes = protodef.Term.TermType;
var r = (function () {
    function r(options) {
        this._profile = false;
        this._timeFormat = 'native';
        this._useOutdated = false;
        this._db = 'test';
        this._arrayLimit = 100000;
        this._nestingLevel = 100;
        this._timeoutConnect = 20;
        this._authKey = '';
        this._port = 28015;
        this._host = 'localhost';
        var self = this;
        var _r_term = function (x) { return new term_1.Term(_r_term).expr(x); };
        var _r = helper.changeProto(_r_term, this);
        _r._profile = false;
        _r._timeFormat = 'native';
        _r._useOutdated = false;
        _r._db = 'test';
        _r._arrayLimit = 100000;
        _r._nestingLevel = 100;
        _r._timeoutConnect = 20;
        _r._authKey = '';
        _r._port = 28015;
        _r._host = 'localhost';
        _r.Error = Err;
        term_1.Term.prototype._setNestingLevel(r.prototype.nestingLevel);
        term_1.Term.prototype._setArrayLimit(r.prototype.arrayLimit);
        _r.row = new term_1.Term(_r).row();
        _r.monday = new term_1.Term(_r).monday();
        _r.tuesday = new term_1.Term(_r).tuesday();
        _r.wednesday = new term_1.Term(_r).wednesday();
        _r.thursday = new term_1.Term(_r).thursday();
        _r.friday = new term_1.Term(_r).friday();
        _r.saturday = new term_1.Term(_r).saturday();
        _r.sunday = new term_1.Term(_r).sunday();
        _r.january = new term_1.Term(_r).january();
        _r.february = new term_1.Term(_r).february();
        _r.march = new term_1.Term(_r).march();
        _r.april = new term_1.Term(_r).april();
        _r.may = new term_1.Term(_r).may();
        _r.june = new term_1.Term(_r).june();
        _r.july = new term_1.Term(_r).july();
        _r.august = new term_1.Term(_r).august();
        _r.september = new term_1.Term(_r).september();
        _r.october = new term_1.Term(_r).october();
        _r.november = new term_1.Term(_r).november();
        _r.december = new term_1.Term(_r).december();
        _r.minval = new term_1.Term(_r).minval();
        _r.maxval = new term_1.Term(_r).maxval();
        _r.nextVarId = 1;
        _r._Term = term_1.Term;
        return _r;
    }
    r.prototype.getPool = function (i) {
        if (i === undefined) {
            if (this.getPoolMaster().getPools().length === 1) {
                return this.getPoolMaster().getPools()[0];
            }
            else {
                throw new Error('You have multiple pools. Use `getPool(index)` or `getPools()`');
            }
        }
        else {
            return this.getPoolMaster().getPools()[i];
        }
    };
    r.prototype.getPoolMaster = function () {
        return this._poolMaster;
    };
    r.prototype.createPools = function (options) {
        this._poolMaster = new pool_master_1.PoolMaster(this, options);
        return this;
    };
    r.prototype.connect = function (options, callback) {
        var _this = this;
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        var p = new Promise(function (resolve, reject) {
            new connection_1.Connection(_this, options, resolve, reject);
        }).nodeify(callback);
        return p;
    };
    r.prototype.setArrayLimit = function (arrayLimit) {
        if (typeof arrayLimit !== 'number')
            throw new Err.ReqlDriverError('The first argument of `setArrayLimit` must be a number.');
        this.arrayLimit = arrayLimit;
    };
    r.prototype.setNestingLevel = function (nestingLevel) {
        if (typeof nestingLevel !== 'number')
            throw new Err.ReqlDriverError('The first argument of `setNestingLevel` must be a number.');
        this.nestingLevel = nestingLevel;
    };
    r.prototype.typeOf = function (value) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.typeOf', this);
        }
        var term = new term_1.Term(this);
        return term.expr(value).typeOf();
    };
    r.prototype.map = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 1, Infinity, 'r.map', this);
        var term = new term_1.Term(this);
        return term.map.apply(term, _args);
    };
    r.prototype.rebalance = function (config) {
        if (term_1.Term.prototype._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 0, 'r.rebalance', this);
        }
        var term = new term_1.Term(this);
        return term.rebalance();
    };
    r.prototype.reconfigure = function (config) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.reconfigure', this);
        }
        var term = new term_1.Term(this);
        return term.reconfigure(config);
    };
    r.prototype.wait = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 0, 1, 'r.wait', this);
        var term = new term_1.Term(this);
        return term.wait(_args[0]);
    };
    r.prototype.range = function (start, end) {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 1, 2, 'r.range', this);
        var term = new term_1.Term(this);
        if (end !== undefined) {
            return term.range(start, end);
        }
        else {
            return term.range(start);
        }
    };
    r.prototype.geojson = function (value) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.geojson', this);
        }
        var term = new term_1.Term(this);
        return term.geojson(value);
    };
    r.prototype.circle = function (center, radius, options) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 2, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 2, 3, 'r.circle', this);
        }
        var term = new term_1.Term(this);
        if (options !== undefined) {
            return term.circle(center, radius, options);
        }
        else {
            return term.circle(center, radius);
        }
    };
    r.prototype.polygon = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 3, Infinity, 'r.polygon', this);
        var term = new term_1.Term(this);
        return term.polygon.apply(term, _args);
    };
    r.prototype.point = function (longitude, latitude) {
        if (term_1.Term.prototype._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 2, 'r.point', this);
        }
        return new term_1.Term(this).point(longitude, latitude);
    };
    r.prototype.line = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.line', this);
        var term = new term_1.Term(this);
        return term.line.apply(term, _args);
    };
    r.prototype.uuid = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 0, 1, 'r.uuid', this);
        var term = new term_1.Term(this);
        return term.uuid(_args[0]);
    };
    r.prototype.binary = function (bin) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.binary', this);
        }
        var term = new term_1.Term(this);
        return term.binary(bin);
    };
    r.prototype.do = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.do', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.do.apply(term, _args.slice(1));
    };
    r.prototype.http = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new term_1.Term(this);
        return term.http.apply(term, _args);
    };
    r.prototype.random = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new term_1.Term(this);
        return term.random.apply(term, _args);
    };
    r.prototype.args = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new term_1.Term(this);
        return term.args.apply(term, _args);
    };
    r.prototype.object = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new term_1.Term(this);
        return term.object.apply(term, _args);
    };
    r.prototype.json = function (json) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.json', this);
        }
        return new term_1.Term(this).json(json);
    };
    r.prototype.error = function (errorStr) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 0, 1, 'r.error', this);
        }
        var term = new term_1.Term(this);
        term._query.push(termTypes.ERROR);
        if (errorStr !== undefined) {
            term._query.push([new term_1.Term(this).expr(errorStr)._query]);
        }
        return term;
    };
    r.prototype.branch = function (predicate, trueBranch, falseBranch) {
        if (term_1.Term.prototype._fastArity(arguments.length, 3) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 3, 'r.branch', this);
        }
        return new term_1.Term(this).expr(predicate).branch(trueBranch, falseBranch);
    };
    r.prototype.ISO8601 = function (isoTime, options) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 1, 2, 'r.ISO8601', this);
        }
        return new term_1.Term(this).ISO8601(isoTime, options);
    };
    r.prototype.epochTime = function (epochTime) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.epochTime', this);
        }
        return new term_1.Term(this).epochTime(epochTime);
    };
    r.prototype.time = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new term_1.Term(this);
        return term.time.apply(term, _args);
    };
    r.prototype.now = function () {
        if (term_1.Term.prototype._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 0, 'now', this);
        }
        return new term_1.Term(this).now();
    };
    r.prototype.round = function (num) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.round', this);
        }
        return new term_1.Term(this).expr(num).round();
    };
    r.prototype.ceil = function (num) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.ceil', this);
        }
        return new term_1.Term(this).expr(num).ceil();
    };
    r.prototype.floor = function (num) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.floor', this);
        }
        return new term_1.Term(this).expr(num).floor();
    };
    r.prototype.not = function (bool) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.not', this);
        }
        return new term_1.Term(this).expr(bool).not();
    };
    r.prototype.le = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.le', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.le.apply(term, _args.slice(1));
    };
    r.prototype.lt = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.lt', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.lt.apply(term, _args.slice(1));
    };
    r.prototype.ge = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.ge', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.ge.apply(term, _args.slice(1));
    };
    r.prototype.gt = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.gt', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.gt.apply(term, _args.slice(1));
    };
    r.prototype.ne = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.ne', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.ne.apply(term, _args.slice(1));
    };
    r.prototype.eq = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.eq', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.eq.apply(term, _args.slice(1));
    };
    r.prototype.or = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 1, Infinity, 'r.or', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.or.apply(term, _args.slice(1));
    };
    r.prototype.and = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 1, Infinity, 'r.and', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.and.apply(term, _args.slice(1));
    };
    r.prototype.mod = function (a, b) {
        if (term_1.Term.prototype._fastArity(arguments.length, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 2, 'r.mod', this);
        }
        return new term_1.Term(this).expr(a).mod(b);
    };
    r.prototype.mul = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.mul', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.mul.apply(term, _args.slice(1));
    };
    r.prototype.div = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.div', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.div.apply(term, _args.slice(1));
    };
    r.prototype.sub = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.sub', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.sub.apply(term, _args.slice(1));
    };
    r.prototype.add = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        term_1.Term.prototype._arityRange(_args, 2, Infinity, 'r.add', this);
        var term = new term_1.Term(this).expr(_args[0]);
        return term.add.apply(term, _args.slice(1));
    };
    r.prototype.union = function () {
        var _len = arguments.length;
        var _args = new Array(_len);
        for (var _i = 0; _i < _len; _i++) {
            _args[_i] = arguments[_i];
        }
        var term = new term_1.Term(this).expr(_args[0]);
        return term.union.apply(term, _args.slice(1));
    };
    r.prototype.asc = function (field) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.asc', this);
        }
        return new term_1.Term(this).asc(field);
    };
    r.prototype.desc = function (field) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.desc', this);
        }
        return new term_1.Term(this).desc(field);
    };
    r.prototype.literal = function (obj) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 0, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 1, 2, 'r.literal', this);
        }
        if (obj === undefined) {
            return new term_1.Term(this).literal();
        }
        else {
            return new term_1.Term(this).literal(obj);
        }
    };
    r.prototype.dbList = function () {
        if (term_1.Term.prototype._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 0, 'dbList', this);
        }
        return new term_1.Term(this).dbList();
    };
    r.prototype.dbDrop = function (db) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'dbDrop', this);
        }
        return new term_1.Term(this).dbDrop(db);
    };
    r.prototype.dbCreate = function (db) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'dbCreate', this);
        }
        return new term_1.Term(this).dbCreate(db);
    };
    r.prototype.tableList = function () {
        if (term_1.Term.prototype._fastArity(arguments.length, 0) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 0, 'r.tableList', this);
        }
        return new term_1.Term(this).tableList();
    };
    r.prototype.tableDrop = function (db) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.tableDrop', this);
        }
        return new term_1.Term(this).tableDrop(db);
    };
    r.prototype.tableCreate = function (table, options) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 1, 2, 'r.tableCreate', this);
        }
        return new term_1.Term(this).tableCreate(table, options);
    };
    r.prototype.js = function (jsString, options) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 1, 2, 'r.js', this);
        }
        return new term_1.Term(this).js(jsString, options);
    };
    r.prototype.table = function (table, options) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 1, 2, 'table', this);
        }
        return new term_1.Term(this).table(table, options);
    };
    r.prototype.db = function (db) {
        if (term_1.Term.prototype._fastArity(arguments.length, 1) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arity(_args, 1, 'r.db', this);
        }
        return new term_1.Term(this).db(db);
    };
    r.prototype.expr = function (expression, nestingLevel) {
        if (term_1.Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
            var _len = arguments.length;
            var _args = new Array(_len);
            for (var _i = 0; _i < _len; _i++) {
                _args[_i] = arguments[_i];
            }
            term_1.Term.prototype._arityRange(_args, 1, 2, 'expr', this);
        }
        var _nestingLevel = nestingLevel || this.nestingLevel;
        return new term_1.Term(this).expr(expression, _nestingLevel);
    };
    return r;
})();
;
function main(options) {
    var _r = new r();
    if (!helper.isPlainObject(options))
        options = {};
    if (options.pool !== false)
        _r.createPools(options);
    _r._options = {};
    if (options.cursor === true)
        _r._options.cursor = true;
    if (options.stream === true)
        _r._options.stream = true;
    if (options.optionalRun === false) {
        delete _r._Term.prototype.then;
        delete _r._Term.prototype.error;
        delete _r._Term.prototype.catch;
        delete _r._Term.prototype.finally;
    }
    return _r;
}
module.exports = main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOlsiciIsInIuY29uc3RydWN0b3IiLCJyLmdldFBvb2wiLCJyLmdldFBvb2xNYXN0ZXIiLCJyLmNyZWF0ZVBvb2xzIiwici5jb25uZWN0Iiwici5zZXRBcnJheUxpbWl0Iiwici5zZXROZXN0aW5nTGV2ZWwiLCJyLnR5cGVPZiIsInIubWFwIiwici5yZWJhbGFuY2UiLCJyLnJlY29uZmlndXJlIiwici53YWl0Iiwici5yYW5nZSIsInIuZ2VvanNvbiIsInIuY2lyY2xlIiwici5wb2x5Z29uIiwici5wb2ludCIsInIubGluZSIsInIudXVpZCIsInIuYmluYXJ5Iiwici5kbyIsInIuaHR0cCIsInIucmFuZG9tIiwici5hcmdzIiwici5vYmplY3QiLCJyLmpzb24iLCJyLmVycm9yIiwici5icmFuY2giLCJyLklTTzg2MDEiLCJyLmVwb2NoVGltZSIsInIudGltZSIsInIubm93Iiwici5yb3VuZCIsInIuY2VpbCIsInIuZmxvb3IiLCJyLm5vdCIsInIubGUiLCJyLmx0Iiwici5nZSIsInIuZ3QiLCJyLm5lIiwici5lcSIsInIub3IiLCJyLmFuZCIsInIubW9kIiwici5tdWwiLCJyLmRpdiIsInIuc3ViIiwici5hZGQiLCJyLnVuaW9uIiwici5hc2MiLCJyLmRlc2MiLCJyLmxpdGVyYWwiLCJyLmRiTGlzdCIsInIuZGJEcm9wIiwici5kYkNyZWF0ZSIsInIudGFibGVMaXN0Iiwici50YWJsZURyb3AiLCJyLnRhYmxlQ3JlYXRlIiwici5qcyIsInIudGFibGUiLCJyLmRiIiwici5leHByIiwibWFpbiJdLCJtYXBwaW5ncyI6IkFBQUEsSUFBTyxPQUFPLFdBQVcsVUFBVSxDQUFDLENBQUM7QUFFckMsSUFBWSxNQUFNLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbkMsMkJBQXlCLGNBQWMsQ0FBQyxDQUFBO0FBQ3hDLHFCQUFtQixRQUFRLENBQUMsQ0FBQTtBQUM1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UUFDdENBLEVBQUVBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBQ2xDQSxFQUFFQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtRQUN0Q0EsRUFBRUEsQ0FBQ0EsTUFBTUEsR0FBSUEsSUFBSUEsV0FBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7UUFFbkNBLEVBQUVBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1FBQ3BDQSxFQUFFQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtRQUN0Q0EsRUFBRUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7UUFDaENBLEVBQUVBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO1FBQ2hDQSxFQUFFQSxDQUFDQSxHQUFHQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUM1QkEsRUFBRUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7UUFDOUJBLEVBQUVBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1FBQzlCQSxFQUFFQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtRQUNsQ0EsRUFBRUEsQ0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0E7UUFDeENBLEVBQUVBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1FBQ3BDQSxFQUFFQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtRQUN0Q0EsRUFBRUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7UUFDdENBLEVBQUVBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBQ2xDQSxFQUFFQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtRQUVsQ0EsRUFBRUEsQ0FBQ0EsU0FBU0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDakJBLEVBQUVBLENBQUNBLEtBQUtBLEdBQUdBLFdBQUlBLENBQUNBO1FBQ2hCQSxNQUFNQSxDQUFDQSxFQUFFQSxDQUFDQTtJQUNaQSxDQUFDQTtJQUVERCxtQkFBT0EsR0FBUEEsVUFBUUEsQ0FBQ0E7UUFDUEUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcEJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqREEsTUFBTUEsQ0FBQ0EsSUFBSUEs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LENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxVQUFVQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNwREEsQ0FBQ0E7UUFDREEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO0lBQ25DQSxDQUFDQTtJQUVEUixlQUFHQSxHQUFIQTtRQUNFUyxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFOURBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzFCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtJQUNyQ0EsQ0FBQ0E7SUFFRFQscUJBQVNBLEdBQVRBLFVBQVVBLE1BQU1BO1FBQ2RVLEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLGFBQWFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3ZEQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0E7SUFDMUJBLENBQUNBO0lBRURWLHVCQUFXQSxHQUFYQSxVQUFZQSxNQUFNQTtRQUNoQlcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsZUFBZUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDekRBLENBQUNBO1FBQ0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzFCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtJQUNsQ0EsQ0FBQ0E7SUFFRFgsZ0JBQUlBLEdBQUpBO1FBQ0VZLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUV4REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQzdCQSxDQUFDQTtJQUVEWixpQkFBS0EsR0FBTEEsVUFBTUEsS0FBS0EsRUFBRUEsR0FBR0E7UUFDZGEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRXpEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2hDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUMzQkEsQ0FBQ0E7SUFDSEEsQ0FBQ0E7SUFFRGIsbUJBQU9BLEdBQVBBLFVBQVFBLEtBQUtBO1FBQ1hjLEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFdBQVdBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3JEQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDN0JBLENBQUNBO0lBRURkLGtCQUFNQSxHQUFOQSxVQUFPQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQTtRQUM1QmUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckVBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDNURBLENBQUNBO1FBQ0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzFCQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxLQUFLQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDOUNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO1FBQ3JDQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVEZixtQkFBT0EsR0FBUEE7UUFDRWdCLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxXQUFXQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUVsRUEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO0lBQ3pDQSxDQUFDQTtJQUVEaEIsaUJBQUtBLEdBQUxBLFVBQU1BLFNBQVNBLEVBQUVBLFFBQVFBO1FBQ3ZCaUIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbkRBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLFNBQVNBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBO0lBQ25EQSxDQUFDQTtJQUVEakIsZ0JBQUlBLEdBQUpBO1FBQ0VrQixJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFL0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzFCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtJQUN0Q0EsQ0FBQ0E7SUFFRGxCLGdCQUFJQSxHQUFKQTtRQUNFbUIsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3hEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0JBLENBQUNBO0lBRURuQixrQkFBTUEsR0FBTkEsVUFBT0EsR0FBR0E7UUFDUm9CLEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3BEQSxDQUFDQTtRQUNEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFDMUJBLENBQUNBO0lBRURwQixjQUFFQSxHQUFGQTtRQUNFcUIsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRURyQixnQkFBSUEsR0FBSkE7UUFDRXNCLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDdENBLENBQUNBO0lBRUR0QixrQkFBTUEsR0FBTkE7UUFDRXVCLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDeENBLENBQUNBO0lBRUR2QixnQkFBSUEsR0FBSkE7UUFDRXdCLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDdENBLENBQUNBO0lBRUR4QixrQkFBTUEsR0FBTkE7UUFDRXlCLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7SUFDeENBLENBQUNBO0lBRUR6QixnQkFBSUEsR0FBSkEsVUFBS0EsSUFBSUE7UUFDUDBCLEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ2xEQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUNuQ0EsQ0FBQ0E7SUFFRDFCLGlCQUFLQSxHQUFMQSxVQUFNQSxRQUFRQTtRQUNaMkIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckVBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0RBLENBQUNBO1FBQ0RBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQzFCQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDM0JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO1FBQzNEQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQTtJQUVkQSxDQUFDQTtJQUVEM0Isa0JBQU1BLEdBQU5BLFVBQU9BLFNBQVNBLEVBQUVBLFVBQVVBLEVBQUVBLFdBQVdBO1FBQ3ZDNEIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDcERBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLFVBQVVBLEVBQUVBLFdBQVdBLENBQUNBLENBQUNBO0lBQ3hFQSxDQUFDQTtJQUVENUIsbUJBQU9BLEdBQVBBLFVBQVFBLE9BQU9BLEVBQUVBLE9BQU9BO1FBQ3RCNkIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckVBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsV0FBV0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDN0RBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLE9BQU9BLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO0lBQ2xEQSxDQUFDQTtJQUVEN0IscUJBQVNBLEdBQVRBLFVBQVVBLFNBQVNBO1FBQ2pCOEIsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkRBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO0lBQzdDQSxDQUFDQTtJQUVEOUIsZ0JBQUlBLEdBQUpBO1FBQ0UrQixJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUMxSEEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDMUJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO0lBQ3RDQSxDQUFDQTtJQUVEL0IsZUFBR0EsR0FBSEE7UUFDRWdDLEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQy9DQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtJQUM5QkEsQ0FBQ0E7SUFFRGhDLGlCQUFLQSxHQUFMQSxVQUFNQSxHQUFHQTtRQUNQaUMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbkRBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO0lBQzFDQSxDQUFDQTtJQUVEakMsZ0JBQUlBLEdBQUpBLFVBQUtBLEdBQUdBO1FBQ05rQyxFQUFFQSxDQUFDQSxDQUFDQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3REEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsREEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7SUFDekNBLENBQUNBO0lBRURsQyxpQkFBS0EsR0FBTEEsVUFBTUEsR0FBR0E7UUFDUG1DLEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ25EQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtJQUMxQ0EsQ0FBQ0E7SUFFRG5DLGVBQUdBLEdBQUhBLFVBQUlBLElBQUlBO1FBQ05vQyxFQUFFQSxDQUFDQSxDQUFDQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3REEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNqREEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFDekNBLENBQUNBO0lBRURwQyxjQUFFQSxHQUFGQTtRQUNFcUMsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRURyQyxjQUFFQSxHQUFGQTtRQUNFc0MsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRUR0QyxjQUFFQSxHQUFGQTtRQUNFdUMsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRUR2QyxjQUFFQSxHQUFGQTtRQUNFd0MsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRUR4QyxjQUFFQSxHQUFGQTtRQUNFeUMsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRUR6QyxjQUFFQSxHQUFGQTtRQUNFMEMsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRUQxQyxjQUFFQSxHQUFGQTtRQUNFMkMsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTdEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDN0NBLENBQUNBO0lBRUQzQyxlQUFHQSxHQUFIQTtRQUNFNEMsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFBQ0EsQ0FBQ0E7UUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFFBQVFBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBRTlEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN6Q0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDOUNBLENBQUNBO0lBRUQ1QyxlQUFHQSxHQUFIQSxVQUFJQSxDQUFDQSxFQUFFQSxDQUFDQTtRQUNONkMsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDakRBLENBQUNBO1FBRURBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQ3ZDQSxDQUFDQTtJQUVEN0MsZUFBR0EsR0FBSEE7UUFDRThDLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU5REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQzlDQSxDQUFDQTtJQUVEOUMsZUFBR0EsR0FBSEE7UUFDRStDLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU5REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQzlDQSxDQUFDQTtJQUVEL0MsZUFBR0EsR0FBSEE7UUFDRWdELElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU5REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQzlDQSxDQUFDQTtJQUVEaEQsZUFBR0EsR0FBSEE7UUFDRWlELElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1FBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1FBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO1lBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQUNBLENBQUNBO1FBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU5REEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQzlDQSxDQUFDQTtJQUVEakQsaUJBQUtBLEdBQUxBO1FBQ0VrRCxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUFDQSxDQUFDQTtRQUUxSEEsSUFBSUEsSUFBSUEsR0FBR0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQ2hEQSxDQUFDQTtJQUVEbEQsZUFBR0EsR0FBSEEsVUFBSUEsS0FBS0E7UUFDUG1ELEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ2pEQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtJQUNuQ0EsQ0FBQ0E7SUFFRG5ELGdCQUFJQSxHQUFKQSxVQUFLQSxLQUFLQTtRQUNSb0QsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbERBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO0lBQ3BDQSxDQUFDQTtJQUVEcEQsbUJBQU9BLEdBQVBBLFVBQVFBLEdBQUdBO1FBQ1RxRCxFQUFFQSxDQUFDQSxDQUFDQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNyRUEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxXQUFXQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUM3REEsQ0FBQ0E7UUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1FBQ2xDQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNyQ0EsQ0FBQ0E7SUFDSEEsQ0FBQ0E7SUFFRHJELGtCQUFNQSxHQUFOQTtRQUNFc0QsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDbERBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO0lBQ2pDQSxDQUFDQTtJQUVEdEQsa0JBQU1BLEdBQU5BLFVBQU9BLEVBQUVBO1FBQ1B1RCxFQUFFQSxDQUFDQSxDQUFDQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3REEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNsREEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7SUFDbkNBLENBQUNBO0lBRUR2RCxvQkFBUUEsR0FBUkEsVUFBU0EsRUFBRUE7UUFDVHdELEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQzdEQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3BEQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtJQUNyQ0EsQ0FBQ0E7SUFFRHhELHFCQUFTQSxHQUFUQTtRQUNFeUQsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLElBQUlBLElBQUlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO1lBQUNBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEVBQUVBLEVBQUVBLEdBQUdBLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBO2dCQUFDQSxLQUFLQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUFDQSxDQUFDQTtZQUMxSEEsV0FBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsRUFBRUEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDdkRBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLElBQUlBLFdBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLFNBQVNBLEVBQUVBLENBQUNBO0lBQ3BDQSxDQUFDQTtJQUVEekQscUJBQVNBLEdBQVRBLFVBQVVBLEVBQUVBO1FBQ1YwRCxFQUFFQSxDQUFDQSxDQUFDQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3REEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxhQUFhQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUN2REEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7SUFDdENBLENBQUNBO0lBRUQxRCx1QkFBV0EsR0FBWEEsVUFBWUEsS0FBS0EsRUFBRUEsT0FBT0E7UUFDeEIyRCxFQUFFQSxDQUFDQSxDQUFDQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxlQUFlQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNyRUEsSUFBSUEsSUFBSUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsR0FBR0EsSUFBSUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQUNBLEtBQUtBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1lBQUNBLENBQUNBO1lBQzFIQSxXQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxXQUFXQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxlQUFlQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNqRUEsQ0FBQ0E7UUFDREEsTUFBTUEsQ0FBQ0EsSUFBSUEsV0FBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7SUFDcERBLENBQUNBO0lBRUQzRCxjQUFFQSxHQUFGQSxVQUFHQSxRQUFRQSxFQUFFQSxPQUFPQTtRQUNsQjRELEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ3JFQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLE1BQU1BLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO1FBQ3hEQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxXQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxRQUFRQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUM5Q0EsQ0FBQ0E7SUFFRDVELGlCQUFLQSxHQUFMQSxVQUFNQSxLQUFLQSxFQUFFQSxPQUFPQTtRQUNsQjZELEVBQUVBLENBQUNBLENBQUNBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLGVBQWVBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1lBQ3JFQSxJQUFJQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxHQUFHQSxDQUFDQSxFQUFFQSxFQUFFQSxHQUFHQSxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFBQ0EsS0FBS0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsU0FBU0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsQ0FBQ0E7WUFDMUhBLFdBQUlBLENBQUNBLFNBQVNBLENBQUNBLFdBQVdBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEVBQUVB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