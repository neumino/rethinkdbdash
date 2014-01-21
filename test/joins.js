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

It("Init for `joins.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);

        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created:1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert([{val:1}, {val: 2}, {val: 3}]).run(connection);
        pks = result.generated_keys;
        assert.equal(result.inserted, 3)

        result = yield r.db(dbName).table(tableName).indexCreate("val").run(connection);
        result = yield r.db(dbName).table(tableName).indexWait("val").run(connection);
        result = yield result.toArray();
        assert(result);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`innerJoin` should return -- array-array", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).innerJoin(r.expr([1,2,3]), function(left, right) { return left.eq(right) }).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{left:1, right:1}, {left:2, right: 2}, {left:3, right: 3}]);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`innerJoin` should return -- array-stream", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).innerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        result = yield result.toArray();
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
        var result = yield r.db(dbName).table(tableName).innerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right) }).run(connection);
        result = yield result.toArray();
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

It("`outerJoin` should return -- array-array", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).outerJoin(r.expr([1,2,3]), function(left, right) { return left.eq(right) }).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{left:1, right:1}, {left:2, right: 2}, {left:3, right: 3}]);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`outerJoin` should return -- array-stream - 1", function* (done) {
    try {
        var result = yield r.expr([1,2,3,4]).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        result = yield result.toArray();
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
        var result = yield r.expr([1,2,3,4]).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        result = yield result.toArray();
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
        var result = yield r.db(dbName).table(tableName).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right) }).run(connection);
        result = yield result.toArray();
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

It("`eqJoin` should return -- pk -- array-stream - function", function* (done) {
    try {
        result = yield r.expr(pks).eqJoin(function(doc) { return doc; }, r.db(dbName).table(tableName)).run(connection);
        result = yield result.toArray();
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
        result = yield r.expr(pks).eqJoin(r.row, r.db(dbName).table(tableName)).run(connection);
        result = yield result.toArray();
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
        result = yield r.expr([1,2,3]).eqJoin(r.row, r.db(dbName).table(tableName), {index: "val"}).run(connection);
        result = yield result.toArray();
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



It("`zip` should zip stuff", function* (done) {
    try {
        result = yield r.expr(pks).eqJoin(function(doc) { return doc; }, r.db(dbName).table(tableName)).zip().run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 3);
        assert.equal(result[0].left, undefined);

        done();
    }
    catch(e) {
        done(e);
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


