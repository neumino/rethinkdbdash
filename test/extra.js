var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("Init for `extra.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("Anonymous function should throw if they return undefined", function* (done) {
    try {
        r.expr(1).do(function() {});
    }
    catch(e) {
        if (e.message === "Annonymous function returned `undefined`. Did you forget a `return`?") {
            done()
        }
        else {
            done(e);
        }
    }
})



It("End for `joins.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


