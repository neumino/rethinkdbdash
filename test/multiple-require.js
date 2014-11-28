var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var r_ = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName;

It("Multiple import should not share the same pool", function* (done) {
    try {
        assert(r.getPool() !== r_.getPool());
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Multiple import should not share the same nestingLevel value", function* (done) {
    try {
        r.setNestingLevel(19);
        r_.setNestingLevel(100);
        assert(r.nestingLevel !== r_.nestingLevel);
        assert.equal(r.nestingLevel, 19);
        assert.equal(r_.nestingLevel, 100);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("Multiple import should not share the same `nextVarId`", function* (done) {
    try {
        r.expr(1).do(function(a, b, c) { return 1});
        r_.expr(2).do(function(d) { return 2});
        assert.equal(r.nextVarId, 4)
        assert.equal(r_.nextVarId, 2)
        done();
    }
    catch(e) {
        done(e);
    }
})
