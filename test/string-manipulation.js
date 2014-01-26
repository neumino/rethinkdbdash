var config = require('./config.js');
var r = require('../lib')(config);
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var dbName;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("`match` should work", function* (done) {
    try {
        var result = yield r.expr("hello").match("hello").run()
        assert.deepEqual(result, {"end":5,"groups":[],"start":0,"str":"hello"});
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`match` should throw if no arguement has been passed", function* (done) {
    try {
        result = yield r.expr("foo").match().run();
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
