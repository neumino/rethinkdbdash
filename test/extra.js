var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName;

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

It("toString should work", function* (done) {
    try {
        assert.equal(r.expr(1).add(2).toString(), "r.expr(1).add(2)");
        assert.equal(r.expr(1).toString(), "r.expr(1)");
        done();
    }
    catch(e) {
        done(e);
    }
})

It("yield a query should work - 1", function* (done) {
    try {
        var result = yield r.expr(1);
        assert.equal(result, 1);

        var result = yield r.expr(1).add(3);
        assert.equal(result, 4);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("yield a query should work - 2", function* (done) {
    try {
        var result = yield r.expr(1).add("foo");
        done(new Error("Was expecting an error"));
    }
    catch(e) {
        if (e.message.match(/Expected type NUMBER but found STRING/)) {
            done();
        }
        else {
            done(e);
        }
    }
})
