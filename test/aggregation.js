var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName;


It("Init for `aggregation.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        var result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`reduce` should work -- no base ", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).reduce(function(left, right) { return left.add(right) }).run();
        assert.equal(result, 6);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`reduce` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).reduce().run();
    }
    catch(e) {
        if (e.message === "`reduce` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`count` should work -- no arg ", function* (done) {
    try {
        result = yield r.expr([0, 1, 2, 3, 4, 5]).count().run();
        assert.equal(result, 6);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`count` should work -- filter ", function* (done) {
    try {
        result = yield r.expr([0, 1, 2, 3, 4, 5]).count(r.row.eq(2)).run();
        assert.equal(result, 1);

        result = yield r.expr([0, 1, 2, 3, 4, 5]).count(function(doc) { return doc.eq(2) }).run();
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`contains` should work ", function* (done) {
    try{
        result = yield r.expr([1,2,3]).contains(2).run();
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(1, 2).run();
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(1, 5).run();
        assert.equal(result, false);

        result = yield r.expr([1,2,3]).contains(function(doc) { return doc.eq(1) }).run();
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1)).run();
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(2)).run();
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(5)).run();
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`contains` should throw if called without arguments", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).contains().run();
    }
    catch(e) {
        if (e.message === "`contains` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
