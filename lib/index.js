var Promise = require("bluebird");

var helper = require(__dirname+"/helper.js");
var Connection = require(__dirname+"/connection.js");
var Term = require(__dirname+"/term.js");
var Error = require(__dirname+"/error.js");
var Pool = require(__dirname+"/pool.js");

function r(options) {
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

    _r.nextVarId = 1;
    return _r;
};
r.prototype._host = "localhost";
r.prototype._port = 28015;
r.prototype._authKey = "";
r.prototype._timeoutConnect = 20;

r.prototype._nestingLevel = 100;
r.prototype._arrayLimit = 100000;
r.prototype._db = "test";
r.prototype._useOutdated = false;
r.prototype._timeFormat = 'native';
r.prototype._profile = false;


r.prototype.setNestingLevel = function(nestingLevel) {
    if (typeof nestingLevel !== "number") throw new Error.ReqlDriverError("The first argument of `setNestingLevel` must be a number.")
    this.nestingLevel = nestingLevel;
}
r.prototype.setArrayLimit = function(arrayLimit) {
    if (typeof arrayLimit !== "number") throw new Error.ReqlDriverError("The first argument of `setArrayLimit` must be a number.")
    this.arrayLimit = arrayLimit;
}

r.prototype.connect = function(options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    var self = this;

    var p = new Promise(function(resolve, reject) {
        new Connection(self, options, resolve, reject);
    }).nodeify(callback);
    return p;
};

r.prototype.createPool = function(options) {
    this._pool = new Pool(this, options);

    return this;
}
r.prototype.getPool = function() {
    return this._pool;
}

r.prototype.expr = function(expression, nestingLevel) {
    Term.prototype._arityRange(arguments, 1, 2, 'expr', this);
    nestingLevel = nestingLevel || this.nestingLevel;
    return new Term(this).expr(expression, nestingLevel);
};
r.prototype.db = function(db) {
    Term.prototype._arity(arguments, 1, 'r.db', this);
    return new Term(this).db(db);
};
r.prototype.table = function(table, options) {
    Term.prototype._arityRange(arguments, 1, 2, 'table', this);
    return new Term(this).table(table, options);
};
r.prototype.js = function(jsString) {
    Term.prototype._arity(arguments, 1, 'r.js', this);
    return new Term(this).js(jsString);
};
r.prototype.tableCreate = function(table, options) {
    Term.prototype._arityRange(arguments, 1, 2, 'r.tableCreate', this);
    return new Term(this).tableCreate(table, options);
};
r.prototype.tableDrop = function(db) {
    Term.prototype._arity(arguments, 1, 'r.tableDrop', this);
    return new Term(this).tableDrop(db);
};
r.prototype.tableList = function() {
    Term.prototype._arity(arguments, 0, 'r.tableList', this);
    return new Term(this).tableList();
};
r.prototype.dbCreate = function(db) {
    Term.prototype._arity(arguments, 1, 'dbCreate', this);
    return new Term(this).dbCreate(db);
};
r.prototype.dbDrop = function(db) {
    Term.prototype._arity(arguments, 1, 'dbDrop', this);
    return new Term(this).dbDrop(db);
};
r.prototype.dbList = function() {
    Term.prototype._arity(arguments, 0, 'dbList', this);
    return new Term(this).dbList();
};
r.prototype.literal = function(obj) {
    Term.prototype._arity(arguments, 1, 'r.literal', this);
    return new Term(this).literal(obj);
};
r.prototype.desc = function(field) {
    Term.prototype._arity(arguments, 1, 'r.desc', this);
    return new Term(this).desc(field);
};
r.prototype.asc = function(field) {
    Term.prototype._arity(arguments, 1, 'r.asc', this);
    return new Term(this).asc(field);
};
r.prototype.add = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.add', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.add.apply(term, args.slice(1));
};
r.prototype.sub = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.sub', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.sub.apply(term, args.slice(1));
};
r.prototype.div = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.div', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.div.apply(term, args.slice(1));
};
r.prototype.mul = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.mul', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.mul.apply(term, args.slice(1));
};
r.prototype.mod = function(a, b) {
    Term.prototype._arity(arguments, 2, 'r.mod', this);

    return new Term(this).expr(a).mod(b);
};
r.prototype.and = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.and', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.and.apply(term, args.slice(1));
};
r.prototype.or = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.or', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.or.apply(term, args.slice(1));
};
r.prototype.eq = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.eq', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.eq.apply(term, args.slice(1));
};
r.prototype.ne = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.ne', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.ne.apply(term, args.slice(1));
};
r.prototype.gt = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.gt', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.gt.apply(term, args.slice(1));
};
r.prototype.ge = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.ge', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.ge.apply(term, args.slice(1));
};
r.prototype.lt = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.lt', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.lt.apply(term, args.slice(1));
};
r.prototype.le = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.le', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.le.apply(term, args.slice(1));
};
r.prototype.not = function(bool) {
    Term.prototype._arity(arguments, 1, 'r.not', this);
    return new Term(this).expr(bool).not();
}


r.prototype.now = function() {
    Term.prototype._arity(arguments, 0, 'now', this);
    return new Term(this).now();
}
r.prototype.time = function() {
    var term = new Term(this);
    return term.time.apply(term, helper.toArray(arguments));
}
r.prototype.epochTime = function(epochTime) {
    Term.prototype._arity(arguments, 1, 'r.epochTime', this);
    return new Term(this).epochTime(epochTime);
}
r.prototype.ISO8601 = function(isoTime, options) {
    Term.prototype._arityRange(arguments, 1, 2, 'r.ISO8601', this);
    return new Term(this).ISO8601(isoTime, options);
}
r.prototype.branch = function(predicate, trueBranch, falseBranch) {
    Term.prototype._arity(arguments, 3, 'r.branch', this);
    return new Term(this).branch(predicate, trueBranch, falseBranch);
}
r.prototype.error = function(errorStr) {
    Term.prototype._arityRange(arguments, 0, 1, 'r.error', this);
    return new Term(this).error(errorStr);
}
r.prototype.json = function(json) {
    Term.prototype._arity(arguments, 1, 'r.json', this);
    return new Term(this).json(json);
}

r.prototype.object = function() {
    var term = new Term(this);
    return term.object.apply(term, helper.toArray(arguments));
}
r.prototype.args = function() {
    var term = new Term(this);
    return term.args.apply(term, helper.toArray(arguments));
}
r.prototype.random = function() {
    var term = new Term(this);
    return term.random.apply(term, helper.toArray(arguments));
}
r.prototype.http = function() {
    var term = new Term(this);
    return term.http.apply(term, helper.toArray(arguments));
}
r.prototype.do = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.do', this);
    var args = helper.toArray(arguments);

    var term = new Term(this).expr(args[0]);
    return term.do.apply(term, args.slice(1));
}
r.prototype.binary = function() {
    Term.prototype._arity(arguments, 1, 'r.binary', this);
    var term = new Term(this);
    return term.binary.call(term, arguments[0]);
}
r.prototype.uuid = function() {
    Term.prototype._arity(arguments, 0, 'uuid', this);
    return new Term(this).uuid();
}

r.prototype.line = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.line', this);
    var term = new Term(this);
    return term.line.apply(term, helper.toArray(arguments));
}
r.prototype.point = function() {
    Term.prototype._arity(arguments, 2, 'r.point', this);
    var term = new Term(this);
    return term.point.apply(term, helper.toArray(arguments));
}
r.prototype.polygon = function() {
    Term.prototype._arityRange(arguments, 3, Infinity, 'r.polygon', this);
    var term = new Term(this);
    return term.polygon.apply(term, helper.toArray(arguments));
}
r.prototype.circle = function() {
    Term.prototype._arityRange(arguments, 2, 3, 'r.circle', this);
    var term = new Term(this);
    return term.circle.apply(term, helper.toArray(arguments));
}
r.prototype.geojson = function() {
    Term.prototype._arity(arguments, 1, 'r.geojson', this);
    var term = new Term(this);
    return term.geojson.call(term, arguments[0]);
}


r.prototype.Error = Error;


function main (options) {
    var _r = new r();

    if (!helper.isPlainObject(options)) options = {};
    if (options.pool !== false) _r.createPool(options);
    return _r;
}
module.exports = main;
