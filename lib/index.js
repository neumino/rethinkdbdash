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

r.prototype.connect = function() {
    var self = this;

    var p = new Promise(function(resolve, reject) {
        new Connection(self, resolve, reject);
    });
    return p;
};

//TODO Import methods from term

r.prototype.expr = function(expression) {
    return new Term(this).expr(expression);
};

module.exports = new r();
