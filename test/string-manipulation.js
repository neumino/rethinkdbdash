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

It("Init for `document-manipulation.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`match` should work", function* (done) {
    try {
        var result = yield r.expr("hello").match("hello").run(connection)
        assert.deepEqual(result, {"end":5,"groups":[],"start":0,"str":"hello"});
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`match` should throw if no arguement has been passed", function* (done) {
    try {
        result = yield r.expr("foo").match().run(connection);
    }
    catch(e) {
        if (e.message === "`match` takes 1 argument, 0 provided after:\nr.expr(\"foo\")") {
            done();
        }
        else {
            done(e);
        }
    }
})


It("End for `document-manipulation.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


