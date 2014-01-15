var Promise = require('bluebird');
var fs = require('fs');

var p = require("node-protobuf").Protobuf;
var pb = new p(fs.readFileSync("./lib/ql2.desc"));

var helper = require('./helper.js');
var Connection = require('./connection.js');

function r(options) {
    if (!helper.isPlainObject(options)) options = {};
    this.host = options.host || "localhost";
    this.port = options.port || 28015;
    this.authKey = options.authKey || "";
};

r.prototype.connect = function() {
    var self = this;

    var p = new Promise(function(resolve, reject) {
        new Connection(self, resolve, reject);
    });
    return p;
};

module.exports = new r();
