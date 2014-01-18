var Promise = require('bluebird');

var helper = require('./helper.js');
var Connection = require('./connection.js');

var Term = require('./term.js');

function r(options) {
    if (!helper.isPlainObject(options)) options = {};
    this.host = options.host || "localhost";
    this.port = options.port || 28015;
    this.authKey = options.authKey || "";
    this.nestingLevel = options.nestingLevel || 20;
};

r.prototype.connect = function(options) {
    if (!helper.isPlainObject(options)) options = {};
    options.host = options.host || "localhost";
    options.port = options.port || 28015;
    options.authKey = options.authKey || "";
    options.nestingLevel = options.nestingLevel || 20;

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
r.prototype.dbCreate = function(db) {
    return new Term().dbCreate(db);
};
r.prototype.dbDrop = function(db) {
    return new Term().dbDrop(db);
};
r.prototype.dbList = function() {
    return new Term().dbList();
};
r.prototype.row = new Term().row(); // That's safe because there is no argument in r.row().
r.prototype.count = new Term().expr({COUNT: true});
r.prototype.avg = function(field) { return new Term().expr({AVG: field}) };
r.prototype.sum = function(field) { return new Term().expr({SUM: field}) };

module.exports = new r();
