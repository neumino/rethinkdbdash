import Promise = require('bluebird');

import * as helper from './helper';
import {Connection} from './connection';
import {Term} from './term';
import * as Error from './error';
import {PoolMaster} from './pool_master';

import protodef from './protodef';
var termTypes = protodef.Term.TermType;

class r {
  _profile = false;
  _timeFormat = 'native';
  _useOutdated = false;
  _db = 'test';
  _arrayLimit = 100000;
  _nestingLevel = 100;
  _timeoutConnect = 20;
  _authKey = '';
  _port = 28015;
  _host = 'localhost';
  Error = Error;
  _poolMaster;
  nestingLevel;
  arrayLimit;

  getPool(i) {
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
  }

  getPoolMaster() {
    return this._poolMaster;
  }

  createPools(options) {
    this._poolMaster = new PoolMaster(this, options);
    return this;
  }

  connect(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    var p = new Promise((resolve, reject) => {
      new Connection(this, options, resolve, reject);
    }).nodeify(callback);
    return p;
  }

  setArrayLimit(arrayLimit) {
    if (typeof arrayLimit !== 'number') throw new Error.ReqlDriverError('The first argument of `setArrayLimit` must be a number.');
    this.arrayLimit = arrayLimit;
  }

  setNestingLevel(nestingLevel) {
    if (typeof nestingLevel !== 'number') throw new Error.ReqlDriverError('The first argument of `setNestingLevel` must be a number.');
    this.nestingLevel = nestingLevel;
  }

  getHandle(options) {
    var self = this;
    var _r = x => new Term(_r).expr(x);
    helper.changeProto(_r, self);

    Term.prototype._setNestingLevel(r.prototype.nestingLevel);
    Term.prototype._setArrayLimit(r.prototype.arrayLimit);

    _r.row = new Term(_r).row();

    _r.monday = new Term(_r).monday();
    _r.tuesday = new Term(_r).tuesday();
    _r.wednesday = new Term(_r).wednesday();
    _r.thursday = new Term(_r).thursday();
    _r.friday = new Term(_r).friday();
    _r.saturday = new Term(_r).saturday();
    _r.sunday =  new Term(_r).sunday();

    _r.january = new Term(_r).january();
    _r.february = new Term(_r).february();
    _r.march = new Term(_r).march();
    _r.april = new Term(_r).april();
    _r.may = new Term(_r).may();
    _r.june = new Term(_r).june();
    _r.july = new Term(_r).july();
    _r.august = new Term(_r).august();
    _r.september = new Term(_r).september();
    _r.october = new Term(_r).october();
    _r.november = new Term(_r).november();
    _r.december = new Term(_r).december();
    _r.minval = new Term(_r).minval();
    _r.maxval = new Term(_r).maxval();

    _r.nextVarId = 1;
    _r._Term = Term;
    return _r;
  }

  typeOf(value) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.typeOf', this);
    }
    var term = new Term(this);
    return term.expr(value).typeOf();
  }

  map() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 1, Infinity, 'r.map', this);

    var term = new Term(this);
    return term.map.apply(term, _args);
  }

  rebalance(config) {
    if (Term.prototype._fastArity(arguments.length, 0) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 0, 'r.rebalance', this);
    }
    var term = new Term(this);
    return term.rebalance();
  }

  reconfigure(config) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.reconfigure', this);
    }
    var term = new Term(this);
    return term.reconfigure(config);
  }

  wait() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 0, 1, 'r.wait', this);

    var term = new Term(this);
    return term.wait(_args[0]);
  }

  range(start, end) {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 1, 2, 'r.range', this);

    var term = new Term(this);
    if (end !== undefined) {
      return term.range(start, end);
    }
    else {
      return term.range(start);
    }
  }

  geojson(value) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.geojson', this);
    }
    var term = new Term(this);
    return term.geojson(value);
  }

  circle(center, radius, options) {
    if (Term.prototype._fastArityRange(arguments.length, 2, 3) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 2, 3, 'r.circle', this);
    }
    var term = new Term(this);
    if (options !== undefined) {
      return term.circle(center, radius, options);
    }
    else {
      return term.circle(center, radius);
    }
  }

  polygon() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 3, Infinity, 'r.polygon', this);

    var term = new Term(this);
    return term.polygon.apply(term, _args);
  }

  point(longitude, latitude) {
    if (Term.prototype._fastArity(arguments.length, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 2, 'r.point', this);
    }
    return new Term(this).point(longitude, latitude);
  }

  line() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.line', this);

    var term = new Term(this);
    return term.line.apply(term, _args);
  }

  uuid() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 0, 1, 'r.uuid', this);
    var term = new Term(this);
    return term.uuid(_args[0]);
  }

  binary(bin) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.binary', this);
    }
    var term = new Term(this);
    return term.binary(bin);
  }

  do() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.do', this);

    var term = new Term(this).expr(_args[0]);
    return term.do.apply(term, _args.slice(1));
  }

  http() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    var term = new Term(this);
    return term.http.apply(term, _args);
  }

  random() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    var term = new Term(this);
    return term.random.apply(term, _args);
  }

  args() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    var term = new Term(this);
    return term.args.apply(term, _args);
  }

  object() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    var term = new Term(this);
    return term.object.apply(term, _args);
  }

  json(json) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.json', this);
    }
    return new Term(this).json(json);
  }

  error(errorStr) {
    if (Term.prototype._fastArityRange(arguments.length, 0, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 0, 1, 'r.error', this);
    }
    var term = new Term(this);
    term._query.push(termTypes.ERROR);
    if (errorStr !== undefined) {
      term._query.push([new Term(this).expr(errorStr)._query]);
    }
    return term;

  }

  branch(predicate, trueBranch, falseBranch) {
    if (Term.prototype._fastArity(arguments.length, 3) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 3, 'r.branch', this);
    }
    return new Term(this).expr(predicate).branch(trueBranch, falseBranch);
  }

  ISO8601(isoTime, options) {
    if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 1, 2, 'r.ISO8601', this);
    }
    return new Term(this).ISO8601(isoTime, options);
  }

  epochTime(epochTime) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.epochTime', this);
    }
    return new Term(this).epochTime(epochTime);
  }

  time() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    var term = new Term(this);
    return term.time.apply(term, _args);
  }

  now() {
    if (Term.prototype._fastArity(arguments.length, 0) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 0, 'now', this);
    }
    return new Term(this).now();
  }

  round(num) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.round', this);
    }
    return new Term(this).expr(num).round();
  }

  ceil(num) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.ceil', this);
    }
    return new Term(this).expr(num).ceil();
  }

  floor(num) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.floor', this);
    }
    return new Term(this).expr(num).floor();
  }

  not(bool) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.not', this);
    }
    return new Term(this).expr(bool).not();
  }

  le() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.le', this);

    var term = new Term(this).expr(_args[0]);
    return term.le.apply(term, _args.slice(1));
  }

  lt() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.lt', this);

    var term = new Term(this).expr(_args[0]);
    return term.lt.apply(term, _args.slice(1));
  }

  ge() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.ge', this);

    var term = new Term(this).expr(_args[0]);
    return term.ge.apply(term, _args.slice(1));
  }

  gt() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.gt', this);

    var term = new Term(this).expr(_args[0]);
    return term.gt.apply(term, _args.slice(1));
  }

  ne() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.ne', this);

    var term = new Term(this).expr(_args[0]);
    return term.ne.apply(term, _args.slice(1));
  }

  eq() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.eq', this);

    var term = new Term(this).expr(_args[0]);
    return term.eq.apply(term, _args.slice(1));
  }

  or() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 1, Infinity, 'r.or', this);

    var term = new Term(this).expr(_args[0]);
    return term.or.apply(term, _args.slice(1));
  }

  and() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 1, Infinity, 'r.and', this);

    var term = new Term(this).expr(_args[0]);
    return term.and.apply(term, _args.slice(1));
  }

  mod(a, b) {
    if (Term.prototype._fastArity(arguments.length, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 2, 'r.mod', this);
    }

    return new Term(this).expr(a).mod(b);
  }

  mul() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.mul', this);

    var term = new Term(this).expr(_args[0]);
    return term.mul.apply(term, _args.slice(1));
  }

  div() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.div', this);

    var term = new Term(this).expr(_args[0]);
    return term.div.apply(term, _args.slice(1));
  }

  sub() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.sub', this);

    var term = new Term(this).expr(_args[0]);
    return term.sub.apply(term, _args.slice(1));
  }

  add() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
    Term.prototype._arityRange(_args, 2, Infinity, 'r.add', this);

    var term = new Term(this).expr(_args[0]);
    return term.add.apply(term, _args.slice(1));
  }

  union() {
    var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }

    var term = new Term(this).expr(_args[0]);
    return term.union.apply(term, _args.slice(1));
  }

  asc(field) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.asc', this);
    }
    return new Term(this).asc(field);
  }

  desc(field) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.desc', this);
    }
    return new Term(this).desc(field);
  }

  literal(obj) {
    if (Term.prototype._fastArityRange(arguments.length, 0, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 1, 2, 'r.literal', this);
    }
    if (obj === undefined) {
      return new Term(this).literal();
    }
    else {
      return new Term(this).literal(obj);
    }
  }

  dbList() {
    if (Term.prototype._fastArity(arguments.length, 0) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 0, 'dbList', this);
    }
    return new Term(this).dbList();
  }

  dbDrop(db) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'dbDrop', this);
    }
    return new Term(this).dbDrop(db);
  }

  dbCreate(db) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'dbCreate', this);
    }
    return new Term(this).dbCreate(db);
  }

  tableList() {
    if (Term.prototype._fastArity(arguments.length, 0) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 0, 'r.tableList', this);
    }
    return new Term(this).tableList();
  }

  tableDrop(db) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.tableDrop', this);
    }
    return new Term(this).tableDrop(db);
  }

  tableCreate(table, options) {
    if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 1, 2, 'r.tableCreate', this);
    }
    return new Term(this).tableCreate(table, options);
  }

  js(jsString, options) {
    if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 1, 2, 'r.js', this);
    }
    return new Term(this).js(jsString, options);
  }

  table(table, options) {
    if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 1, 2, 'table', this);
    }
    return new Term(this).table(table, options);
  }

  db(db) {
    if (Term.prototype._fastArity(arguments.length, 1) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arity(_args, 1, 'r.db', this);
    }
    return new Term(this).db(db);
  }

  expr(expression, nestingLevel) {
    if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
      var _len = arguments.length; var _args = new Array(_len); for (var _i = 0; _i < _len; _i++) { _args[_i] = arguments[_i]; }
      Term.prototype._arityRange(_args, 1, 2, 'expr', this);
    }
    var _nestingLevel = nestingLevel || this.nestingLevel;
    return new Term(this).expr(expression, _nestingLevel);
  }
};

function main(options) {
  var _r = new r();

  if (!helper.isPlainObject(options)) options = {};
  if (options.pool !== false) _r.createPools(options);
  _r._options = {};
  if (options.cursor === true) _r._options.cursor = true;
  if (options.stream === true) _r._options.stream = true;
  if (options.optionalRun === false) {
    delete _r._Term.prototype.then;
    delete _r._Term.prototype.error;
    delete _r._Term.prototype.catch;
    delete _r._Term.prototype.finally;
  }
  return _r;
}
export default main;