var Promise = require('bluebird');

var helper = require(__dirname+'/helper.js');
var Connection = require(__dirname+'/connection.js');
var Term = require(__dirname+'/term.js');
var Error = require(__dirname+'/error.js');
var PoolMaster = require(__dirname+'/pool_master.js');
var termTypes = require(__dirname+'/protodef.js').Term.TermType;

function r() {
  var self = this;
  var _r = function(x) {
    return new Term(_r).expr(x);
  }
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
};
r.prototype._host = 'localhost';
r.prototype._port = 28015;
r.prototype._authKey = '';
r.prototype._user = 'admin';
r.prototype._password = '';
r.prototype._timeoutConnect = 20; // seconds
r.prototype._pingInterval = -1; // seconds

r.prototype._nestingLevel = 100;
r.prototype._arrayLimit = 100000;
r.prototype._db = 'test';
r.prototype._useOutdated = false;
r.prototype._timeFormat = 'native';
r.prototype._profile = false;


r.prototype.setNestingLevel = function(nestingLevel) {
  if (typeof nestingLevel !== 'number') throw new Error.ReqlDriverError('The first argument of `setNestingLevel` must be a number.')
  this.nestingLevel = nestingLevel;
}
r.prototype.setArrayLimit = function(arrayLimit) {
  if (typeof arrayLimit !== 'number') throw new Error.ReqlDriverError('The first argument of `setArrayLimit` must be a number.')
  this.arrayLimit = arrayLimit;
}

r.prototype.connect = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  var self = this;

  var p = new Promise(function(resolve, reject) {
    new Connection(self, options, resolve, reject);
  }).nodeify(callback);
  return p;
};

r.prototype.createPools = function(options) {
  this._poolMaster = new PoolMaster(this, options);
  return this;
}

r.prototype.getPoolMaster = function() {
  return this._poolMaster;
}
r.prototype.getPool = function(i) {
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

r.prototype.expr = function(expression, nestingLevel) {
  if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 1, 2, 'expr', this);
  }
  var _nestingLevel = nestingLevel || this.nestingLevel;
  return new Term(this).expr(expression, _nestingLevel);
};
r.prototype.db = function(db) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.db', this);
  }
  return new Term(this).db(db);
};
r.prototype.table = function(table, options) {
  if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 1, 2, 'table', this);
  }
  return new Term(this).table(table, options);
};
r.prototype.js = function(jsString, options) {
  if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 1, 2, 'r.js', this);
  }
  return new Term(this).js(jsString, options);
};
r.prototype.tableCreate = function(table, options) {
  if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 1, 2, 'r.tableCreate', this);
  }
  return new Term(this).tableCreate(table, options);
};
r.prototype.tableDrop = function(db) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.tableDrop', this);
  }
  return new Term(this).tableDrop(db);
};
r.prototype.tableList = function() {
  if (Term.prototype._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 0, 'r.tableList', this);
  }
  return new Term(this).tableList();
};
r.prototype.dbCreate = function(db) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'dbCreate', this);
  }
  return new Term(this).dbCreate(db);
};
r.prototype.dbDrop = function(db) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'dbDrop', this);
  }
  return new Term(this).dbDrop(db);
};
r.prototype.dbList = function() {
  if (Term.prototype._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 0, 'dbList', this);
  }
  return new Term(this).dbList();
};
r.prototype.literal = function(obj) {
  if (Term.prototype._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 1, 2, 'r.literal', this);
  }
  if (obj === undefined) {
    return new Term(this).literal();
  }
  else {
    return new Term(this).literal(obj);
  }
};
r.prototype.desc = function(field) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.desc', this);
  }
  return new Term(this).desc(field);
};
r.prototype.asc = function(field) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.asc', this);
  }
  return new Term(this).asc(field);
};
r.prototype.union = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this).expr(_args[0]);
  return term.union.apply(term, _args.slice(1));
};
r.prototype.add = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.add', this);

  var term = new Term(this).expr(_args[0]);
  return term.add.apply(term, _args.slice(1));
};
r.prototype.sub = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.sub', this);

  var term = new Term(this).expr(_args[0]);
  return term.sub.apply(term, _args.slice(1));
};
r.prototype.div = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.div', this);

  var term = new Term(this).expr(_args[0]);
  return term.div.apply(term, _args.slice(1));
};
r.prototype.mul = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.mul', this);

  var term = new Term(this).expr(_args[0]);
  return term.mul.apply(term, _args.slice(1));
};
r.prototype.mod = function(a, b) {
  if (Term.prototype._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 2, 'r.mod', this);
  }

  return new Term(this).expr(a).mod(b);
};
r.prototype.and = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this);
  return term.and.apply(term, _args);
};
r.prototype.or = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}

  var term = new Term(this);
  return term.or.apply(term, _args);
};
r.prototype.eq = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.eq', this);

  var term = new Term(this).expr(_args[0]);
  return term.eq.apply(term, _args.slice(1));
};
r.prototype.ne = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.ne', this);

  var term = new Term(this).expr(_args[0]);
  return term.ne.apply(term, _args.slice(1));
};
r.prototype.gt = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.gt', this);

  var term = new Term(this).expr(_args[0]);
  return term.gt.apply(term, _args.slice(1));
};
r.prototype.ge = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.ge', this);

  var term = new Term(this).expr(_args[0]);
  return term.ge.apply(term, _args.slice(1));
};
r.prototype.lt = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.lt', this);

  var term = new Term(this).expr(_args[0]);
  return term.lt.apply(term, _args.slice(1));
};
r.prototype.le = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.le', this);

  var term = new Term(this).expr(_args[0]);
  return term.le.apply(term, _args.slice(1));
};
r.prototype.not = function(bool) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.not', this);
  }
  return new Term(this).expr(bool).not();
}
r.prototype.floor = function(num) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.floor', this);
  }
  return new Term(this).expr(num).floor();
}
r.prototype.ceil = function(num) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.ceil', this);
  }
  return new Term(this).expr(num).ceil();
}
r.prototype.round = function(num) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.round', this);
  }
  return new Term(this).expr(num).round();
}


r.prototype.now = function() {
  if (Term.prototype._fastArity(arguments.length, 0) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 0, 'now', this);
  }
  return new Term(this).now();
}
r.prototype.time = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this);
  return term.time.apply(term, _args);
}
r.prototype.epochTime = function(epochTime) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.epochTime', this);
  }
  return new Term(this).epochTime(epochTime);
}
r.prototype.ISO8601 = function(isoTime, options) {
  if (Term.prototype._fastArityRange(arguments.length, 1, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 1, 2, 'r.ISO8601', this);
  }
  return new Term(this).ISO8601(isoTime, options);
}
r.prototype.branch = function(predicate, trueBranch, falseBranch) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 3, Infinity, 'r.branch', this);

  var term = new Term(this).expr(predicate);
  return term.branch.apply(term, _args.slice(1));
}
r.prototype.error = function(errorStr) {
  if (Term.prototype._fastArityRange(arguments.length, 0, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arityRange(_args, 0, 1, 'r.error', this);
  }
  var term = new Term(this);
  term._query.push(termTypes.ERROR);
  if (errorStr !== undefined) {
    term._query.push([new Term(this).expr(errorStr)._query]);
  }
  return term;

}
r.prototype.json = function(json) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.json', this);
  }
  return new Term(this).json(json);
}

r.prototype.object = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this);
  return term.object.apply(term, _args);
}
r.prototype.args = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this);
  return term.args.apply(term, _args);
}
r.prototype.random = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this);
  return term.random.apply(term, _args);
}
r.prototype.http = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  var term = new Term(this);
  return term.http.apply(term, _args);
}
r.prototype.do = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.do', this);

  var term = new Term(this).expr(_args[0]);
  return term.do.apply(term, _args.slice(1));
}
r.prototype.binary = function(bin) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.binary', this);
  }
  var term = new Term(this);
  return term.binary(bin);
}
r.prototype.uuid = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 0, 1, 'r.uuid', this);
  var term = new Term(this);
  return term.uuid(_args[0]);
}

r.prototype.line = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, Infinity, 'r.line', this);

  var term = new Term(this);
  return term.line.apply(term, _args);
}
r.prototype.point = function(longitude, latitude) {
  if (Term.prototype._fastArity(arguments.length, 2) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 2, 'r.point', this);
  }
  return new Term(this).point(longitude, latitude);
}
r.prototype.polygon = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 3, Infinity, 'r.polygon', this);

  var term = new Term(this);
  return term.polygon.apply(term, _args);
}
r.prototype.circle = function(center, radius, options) {
  if (Term.prototype._fastArityRange(arguments.length, 2, 3) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
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
r.prototype.geojson = function(value) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.geojson', this);
  }
  var term = new Term(this);
  return term.geojson(value);
}
r.prototype.distance = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 2, 3, 'r.add', this);

  var term = new Term(this).expr(_args[0]);
  return term.distance.apply(term, _args.slice(1));
};

r.prototype.range = function(start, end) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, 2, 'r.range', this);

  var term = new Term(this);
  if (end !== undefined) {
    return term.range(start, end);
  }
  else {
    return term.range(start);
  }
}
r.prototype.wait = function() {
  // `wait` on the top level has been removed in 2.3.
  throw new Error.ReqlDriverError('`wait` can only be called on a table or a database since 2.3');
}
r.prototype.reconfigure = function(config) {
  // `reconfigure` on the top level has been removed in 2.3.
  throw new Error.ReqlDriverError('`reconfigure` can only be called on a table or a database since 2.3');
}
r.prototype.rebalance = function(config) {
  // `rebalance` on the top level has been removed in 2.3.
  throw new Error.ReqlDriverError('`rebalance` can only be called on a table or a database since 2.3');
}
r.prototype.map = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.map', this);

  var term = new Term(this);
  return term.map.apply(term, _args);
};
r.prototype.typeOf = function(value) {
  if (Term.prototype._fastArity(arguments.length, 1) === false) {
    var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
    Term.prototype._arity(_args, 1, 'r.typeOf', this);
  }
  var term = new Term(this);
  return term.expr(value).typeOf();
}
r.prototype.min = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.min', this);
  var term = new Term(this).expr(_args[0]);
  return term.min.apply(term, _args.slice(1));
}
r.prototype.max = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.max', this);
  var term = new Term(this).expr(_args[0]);
  return term.max.apply(term, _args.slice(1));
}
r.prototype.sum = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.sum', this);
  var term = new Term(this).expr(_args[0]);
  return term.sum.apply(term, _args.slice(1));
}
r.prototype.avg = function() {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.avg', this);
  var term = new Term(this).expr(_args[0]);
  return term.avg.apply(term, _args.slice(1));
}
r.prototype.distinct = function(value) {
  var _len = arguments.length;var _args = new Array(_len); for(var _i = 0; _i < _len; _i++) {_args[_i] = arguments[_i];}
  Term.prototype._arityRange(_args, 1, Infinity, 'r.distinct', this);
  var term = new Term(this).expr(_args[0]);
  return term.distinct.apply(term, _args.slice(1));
}


r.prototype.Error = Error;


function main(options) {
  var _r = new r();

  if (!helper.isPlainObject(options)) options = {};
  if (options.pool !== false) _r.createPools(options);
  _r._options = {};
  if (options.cursor === true) _r._options.cursor = true;
  if (options.stream === true) _r._options.stream = true;
  if (options.optionalRun === false) {
    delete _r._Term.prototype.then
    delete _r._Term.prototype.error
    delete _r._Term.prototype.catch
    delete _r._Term.prototype.finally
  }
  return _r;
}
module.exports = main;
