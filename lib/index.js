var Promise = require('bluebird');

var helper = require('./helper.js');
var Connection = require('./connection.js');

var Term = require('./term.js');
var Error = require('./error.js');

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
    return new Term().expr(expression);
};
r.prototype.db = function(db) {
    return new Term().db(db);
};
r.prototype.table = function(table) {
    return new Term().table(table);
};
r.prototype.js = function(jsString) {
    return new Term().js(jsString);
};
r.prototype.tableCreate = function(db) {
    return new Term().tableCreate(db);
};
r.prototype.tableDrop = function(db) {
    return new Term().tableDrop(db);
};
r.prototype.tableList = function() {
    return new Term().tableList();
};
r.prototype.dbCreate = function(db) {
    return new Term().dbCreate(db);
};
r.prototype.dbDrop = function(db) {
    return new Term().dbDrop(db);
};
r.prototype.dbList = function() {
    return new Term().dbList();
};
r.prototype.literal = function(obj) {
    return new Term().literal(obj);
};
r.prototype.desc = function(field) {
    return new Term().desc(field);
};
r.prototype.asc = function(field) {
    return new Term().asc(field);
};
r.prototype.add = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.add");
    Term.prototype._checkUndefined(args[1], "Second", "r.add");

    var term = new Term();
    return term.add.apply(term, args);
};
r.prototype.sub = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.sub");
    Term.prototype._checkUndefined(args[1], "Second", "r.sub");

    var term = new Term();
    return term.sub.apply(term, args);
};
r.prototype.div = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.div");
    Term.prototype._checkUndefined(args[1], "Second", "r.div");

    var term = new Term();
    return term.div.apply(term, args);
};
r.prototype.mul = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.mul");
    Term.prototype._checkUndefined(args[1], "Second", "r.mul");

    var term = new Term();
    return term.mul.apply(term, args);
};
r.prototype.mod = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.mod");
    Term.prototype._checkUndefined(args[1], "Second", "r.mod");
    Term.prototype._hasTooMany(args, 2, 'r.mod');

    var term = new Term();
    return term.mod.apply(term, args);
};
r.prototype.and = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.and");
    Term.prototype._checkUndefined(args[1], "Second", "r.and");

    var term = new Term();
    return term.and.apply(term, args);
};
r.prototype.or = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.or");
    Term.prototype._checkUndefined(args[1], "Second", "r.or");

    var term = new Term();
    return term.or.apply(term, args);
};
r.prototype.eq = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.eq");
    Term.prototype._checkUndefined(args[1], "Second", "r.eq");

    var term = new Term();
    return term.eq.apply(term, args);
};
r.prototype.ne = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.ne");
    Term.prototype._checkUndefined(args[1], "Second", "r.ne");

    var term = new Term();
    return term.ne.apply(term, args);
};
r.prototype.gt = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.gt");
    Term.prototype._checkUndefined(args[1], "Second", "r.gt");

    var term = new Term();
    return term.gt.apply(term, args);
};
r.prototype.ge = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.ge");
    Term.prototype._checkUndefined(args[1], "Second", "r.ge");

    var term = new Term();
    return term.ge.apply(term, args);
};
r.prototype.lt = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.lt");
    Term.prototype._checkUndefined(args[1], "Second", "r.lt");

    var term = new Term();
    return term.lt.apply(term, args);
};
r.prototype.le = function() {
    var args = helper.toArray(arguments);
    Term.prototype._checkUndefined(args[0], "First", "r.le");
    Term.prototype._checkUndefined(args[1], "Second", "r.le");

    var term = new Term();
    return term.le.apply(term, args);
};

r.prototype.now = function() {
    return new Term().now();
}
r.prototype.time = function() {
    var term = new Term();
    return term.time.apply(term, helper.toArray(arguments));
}
r.prototype.epochTime = function(epochTime) {
    return new Term().epochTime(epochTime);
}
r.prototype.ISO8601 = function(isoTime, options) {
    return new Term().ISO8601(isoTime, options);
}
r.prototype.branch = function(predicate, trueBranch, falseBranch) {
    return new Term().branch(predicate, trueBranch, falseBranch);
}
r.prototype.error = function(errorStr) {
    return new Term().error(errorStr);
}
r.prototype.exprJSON = function(json) {
    return new Term().json(json);
}
r.prototype.json = r.prototype.exprJSON;



r.prototype.row = new Term().row(); // That's safe because there is no argument in r.row().
r.prototype.count = new Term().expr({COUNT: true});
r.prototype.avg = function(field) { return new Term().expr({AVG: field}) };
r.prototype.sum = function(field) { return new Term().expr({SUM: field}) };

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
