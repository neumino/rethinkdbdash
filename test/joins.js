var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result, pks;


It("Init for `joins.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert([{val:1}, {val: 2}, {val: 3}]).run();
        pks = result.generated_keys;
        assert.equal(result.inserted, 3)

        result = yield r.db(dbName).table(tableName).indexCreate("val").run();
        result = yield r.db(dbName).table(tableName).indexWait("val").run();
        assert(result);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`innerJoin` should return -- array-array", function* (done) {
    try {
        result = yield r.expr([1,2,3]).innerJoin(r.expr([1,2,3]), function(left, right) { return left.eq(right) }).run();
        assert.deepEqual(result, [{left:1, right:1}, {left:2, right: 2}, {left:3, right: 3}]);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`innerJoin` should return -- array-stream", function* (done) {
    try {
        result = yield r.expr([1,2,3]).innerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run();
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`innerJoin` should return -- stream-stream", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).innerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right) }).run();
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`innerJoin` should throw if no sequence", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).innerJoin().run();
    }
    catch(e) {
        if (e.message === "`innerJoin` takes 2 arguments, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`innerJoin` should throw if no predicate", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).innerJoin(r.expr([1,2,3])).run();
    }
    catch(e) {
        if (e.message === "`innerJoin` takes 2 arguments, 1 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})


It("`outerJoin` should return -- array-array", function* (done) {
    try {
        result = yield r.expr([1,2,3]).outerJoin(r.expr([1,2,3]), function(left, right) { return left.eq(right) }).run();
        assert.deepEqual(result, [{left:1, right:1}, {left:2, right: 2}, {left:3, right: 3}]);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`outerJoin` should return -- array-stream - 1", function* (done) {
    try {
        result = yield r.expr([1,2,3,4]).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run();
        assert.equal(result.length, 4);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`outerJoin` should return -- array-stream - 2", function* (done) {
    try {
        result = yield r.expr([1,2,3,4]).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run();
        assert.equal(result.length, 4);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);
        assert(result[3].left);
        assert.equal(result[3].right, undefined);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`outerJoin` should return -- stream-stream", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right) }).run();
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`outerJoin` should throw if no sequence", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).outerJoin().run();
    }
    catch(e) {
        if (e.message === "`outerJoin` takes 2 arguments, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`outerJoin` should throw if no predicate", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).outerJoin(r.expr([1,2,3])).run();
    }
    catch(e) {
        if (e.message === "`outerJoin` takes 2 arguments, 1 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})


It("`eqJoin` should return -- pk -- array-stream - function", function* (done) {
    try {
        var result = yield r.expr(pks).eqJoin(function(doc) { return doc; }, r.db(dbName).table(tableName)).run();
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`eqJoin` should return -- pk -- array-stream - r.row", function* (done) {
    try {
        var result = yield r.expr(pks).eqJoin(r.row, r.db(dbName).table(tableName)).run();
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`eqJoin` should return -- secondary index -- array-stream - r.row", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).eqJoin(r.row, r.db(dbName).table(tableName), {index: "val"}).run();
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`eqJoin` should throw if no argument", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).eqJoin().run();
    }
    catch(e) {
        if (e.message === "`eqJoin` takes at least 2 arguments, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`eqJoin` should throw with a non valid key", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).eqJoin(r.row, r.db(dbName).table(tableName), {nonValidKey: "val"}).run();
    }
    catch(e) {
        if (e.message === "Unrecognized option `nonValidKey` in `eqJoin` after:\nr.expr([1, 2, 3])\nAvailable option is index <string>") {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`eqJoin` should throw if no sequence", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).eqJoin("id").run();
    }
    catch(e) {
        if (e.message === "`eqJoin` takes at least 2 arguments, 1 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`eqJoin` should throw if too many arguments", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).eqJoin(1, 1, 1, 1, 1).run();
    }
    catch(e) {
        if (e.message === "`eqJoin` takes at most 3 arguments, 5 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})



It("`zip` should zip stuff", function* (done) {
    try {
        var result = yield r.expr(pks).eqJoin(function(doc) { return doc; }, r.db(dbName).table(tableName)).zip().run();
        assert.equal(result.length, 3);
        assert.equal(result[0].left, undefined);

        done();
    }
    catch(e) {
        done(e);
    }
})
