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

r.prototype.expr = function(expression) {
    return new Term(this).expr(expression);
};
r.prototype.db = function(db) {
    return new Term(this).db(db);
};
r.prototype.table = function(table) {
    return new Term(this).table(table);
};
r.prototype.js = function(jsString) {
    return new Term(this).js(jsString);
};




module.exports = new r();
