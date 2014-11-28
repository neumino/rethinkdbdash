var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;


It("`match` should work", function* (done) {
    try {
        result = yield r.expr("hello").match("hello").run()
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
It("`upcase` should work", function* (done) {
    try {
        result = yield r.expr("helLo").upcase().run();
        assert.equal(result, "HELLO");
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`downcase` should work", function* (done) {
    try {
        result = yield r.expr("HElLo").downcase().run();
        assert.equal(result, "hello");
        done();
    }
    catch(e) {
        done(e);
    }
})

