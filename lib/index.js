var Promise = require("bluebird");

var helper = require(__dirname+"/helper.js");
var Connection = require(__dirname+"/connection.js");
var Term = require(__dirname+"/term.js");
var Error = require(__dirname+"/error.js");

function r() {
    var self = this;
    var _r = function(x) {
        return new Term().expr(x);
    }
    _r.__proto__ = self.__proto__;
    return _r;

};
r.prototype.host = "localhost";
r.prototype.port = 28015;
r.prototype.authKey = "";

r.prototype.nestingLevel = 100;
r.prototype.db = "test";
r.prototype.useOutdated = false;
r.prototype.timeFormat = 'native';
r.prototype.profile = false;


r.prototype.connect = function(options) {
    var self = this;

    var p = new Promise(function(resolve, reject) {
        new Connection(self, options, resolve, reject);
    });
    return p;
};

//TODO Import methods from term

/*
for(var key in Term.prototype){
    if (Term.prototype.hasOwnProperty(key)) {
        if ((typeof Term.prototype[key] === 'function') && (key[0] !== '_')) {
            r.prototype[key] = function() {
                var term = new Term();
                return Term.prototype[key].apply(term, [this, helper.toArray(arguments)]);
            }
        }
    }
}
*/


r.prototype.expr = function(expression) {
    Term.prototype._arity(arguments, 1, 'expr', this); 
    return new Term().expr(expression);
};
r.prototype.db = function(db) {
    Term.prototype._arity(arguments, 1, 'db', this); 
    return new Term().db(db);
};
r.prototype.table = function(table, options) {
    Term.prototype._arityRange(arguments, 1, 2, 'table', this); 
    return new Term().table(table, options);
};
r.prototype.js = function(jsString) {
    Term.prototype._arity(arguments, 1, 'js', this); 
    return new Term().js(jsString);
};
r.prototype.tableCreate = function(table, options) {
    Term.prototype._arityRange(arguments, 1, 2, 'r.tableCreate', this); 
    return new Term().tableCreate(table, options);
};
r.prototype.tableDrop = function(db) {
    Term.prototype._arity(arguments, 1, 'r.tableDrop', this); 
    return new Term().tableDrop(db);
};
r.prototype.tableList = function() {
    Term.prototype._arity(arguments, 0, 'r.tableList', this); 
    return new Term().tableList();
};
r.prototype.dbCreate = function(db) {
    Term.prototype._arity(arguments, 1, 'dbCreate', this); 
    return new Term().dbCreate(db);
};
r.prototype.dbDrop = function(db) {
    Term.prototype._arity(arguments, 1, 'dbDrop', this); 
    return new Term().dbDrop(db);
};
r.prototype.dbList = function() {
    Term.prototype._arity(arguments, 0, 'dbList', this); 
    return new Term().dbList();
};
r.prototype.literal = function(obj) {
    Term.prototype._arity(arguments, 1, 'literal', this); 
    return new Term().literal(obj);
};
r.prototype.desc = function(field) {
    Term.prototype._arity(arguments, 1, 'desc', this); 
    return new Term().desc(field);
};
r.prototype.asc = function(field) {
    Term.prototype._arity(arguments, 1, 'asc', this); 
    return new Term().asc(field);
};
r.prototype.add = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.add', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.add.apply(term, args);
};
r.prototype.sub = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.sub', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.sub.apply(term, args);
};
r.prototype.div = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.div', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.div.apply(term, args);
};
r.prototype.mul = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.mul', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.mul.apply(term, args);
};
r.prototype.mod = function(a, b) {
    Term.prototype._arity(arguments, 2, 'r.mod', this); 

    return new Term().expr(a).mod(b);
};
r.prototype.and = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.and', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.and.apply(term, args);
};
r.prototype.or = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.or', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.or.apply(term, args);
};
r.prototype.eq = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.eq', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.eq.apply(term, args);
};
r.prototype.ne = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.ne', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.ne.apply(term, args);
};
r.prototype.gt = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.gt', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.gt.apply(term, args);
};
r.prototype.ge = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.ge', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.ge.apply(term, args);
};
r.prototype.lt = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.lt', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.lt.apply(term, args);
};
r.prototype.le = function() {
    Term.prototype._arityRange(arguments, 2, Infinity, 'r.le', this); 
    var args = helper.toArray(arguments);

    var term = new Term();
    return term.le.apply(term, args);
};

r.prototype.now = function() {
    Term.prototype._arity(arguments, 0, 'now', this); 
    return new Term().now();
}
r.prototype.time = function() {
    if ((arguments.length !== 4) && (arguments.length !== 7)) throw new Error.ReqlDriverError("`r.time` called with "+arguments.length+" argument"+((arguments.length>1)?"s":""), this, "`r.time` takes 4 or 7 arguments");

    var term = new Term();
    return term.time.apply(term, helper.toArray(arguments));
}
r.prototype.epochTime = function(epochTime) {
    Term.prototype._arity(arguments, 1, 'r.epochTime', this); 
    return new Term().epochTime(epochTime);
}
r.prototype.ISO8601 = function(isoTime, options) {
    Term.prototype._arityRange(arguments, 1, 2, 'r.ISO8601', this); 
    return new Term().ISO8601(isoTime, options);
}
r.prototype.branch = function(predicate, trueBranch, falseBranch) {
    Term.prototype._arity(arguments, 3, 'r.branch', this); 
    return new Term().branch(predicate, trueBranch, falseBranch);
}
r.prototype.error = function(errorStr) {
    Term.prototype._arityRange(arguments, 0, 1, 'r.error', this); 
    return new Term().error(errorStr);
}
r.prototype.exprJSON = function(json) {
    //Not yet public
    Term.prototype._arity(arguments, 1, 'r.exprJSON', this); 
    return new Term().exprJSON(json);
}
r.prototype.json = function(json) {
    Term.prototype._arity(arguments, 1, 'r.json', this); 
    return new Term().json(json);
}


r.prototype.row = new Term().row(); // That's safe because there is no argument in r.row().
r.prototype.count = new Term().expr({COUNT: true});
r.prototype.avg = function(field) {
    Term.prototype._arity(arguments, 1, 'r.avg', this); 
    return new Term().expr({AVG: field})
};
r.prototype.sum = function(field) {
    Term.prototype._arity(arguments, 1, 'r.sum', this); 
    return new Term().expr({SUM: field})
};

r.prototype.Error = Error;
r.prototype.monday = new Term().monday();
r.prototype.tuesday = new Term().tuesday();
r.prototype.wednesday = new Term().wednesday();
r.prototype.thursday = new Term().thursday();
r.prototype.friday = new Term().friday();
r.prototype.saturday = new Term().saturday();
r.prototype.sunday =  new Term().sunday();

r.prototype.january = new Term().january();
r.prototype.february = new Term().february();
r.prototype.march = new Term().march();
r.prototype.april = new Term().april();
r.prototype.may = new Term().may();
r.prototype.june = new Term().june();
r.prototype.july = new Term().july();
r.prototype.august = new Term().august();
r.prototype.september = new Term().september();
r.prototype.october = new Term().october();
r.prototype.november = new Term().november();
r.prototype.december = new Term().december();


module.exports = new r();
