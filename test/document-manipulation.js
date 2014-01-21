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

        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created:1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`r.row` should work", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).map(r.row).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3]);

        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).update({idCopyUpdate: r.row("id")}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).replace(r.row).run(connection);
        assert.equal(result.replaced, 0);

        result = yield r.db(dbName).table(tableName).replace(r.row.merge({idCopyReplace: r.row("id")})).run(connection);
        assert.equal(result.replaced, 1);
        
        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert.equal(result.deleted, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`pluck` should work", function* (done) {
    try {
        result = yield r.expr({a: 0, b: 1, c: 2}).pluck("a", "b").run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}]).pluck("a", "b").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0, b: 1}, {a: 0, b: 10}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`without` should work", function* (done) {
    try {
        result = yield r.expr({a: 0, b: 1, c: 2}).without("c").run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}]).without("a", "c").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{b: 1}, {b: 10}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`merge` should work", function* (done) {
    try {
        result = yield r.expr({a: 0}).merge({b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        result = yield r.expr({a: {b: 1}}).merge({a: r.literal({c: 2})}).run(connection);
        assert.deepEqual(result, {a: {c: 2}});

        result = yield r.expr([{a: 0}, {a: 1}, {a: 2}]).merge({b: 1}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0, b: 1}, {a: 1, b: 1}, {a: 2, b: 1}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`append` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).append(4).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3,4]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`prepend` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).prepend(4).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [4,1,2,3]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`difference` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).prepend(4).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [4,1,2,3]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`setInsert` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).setInsert(4).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3,4]);

        result = yield r.expr([1,2,3]).setInsert(2).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`setUnion` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).setUnion([2,4]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3,4]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`setIntersection` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).setIntersection([2,4]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [2]);

        done()
    }
    catch(e) {
        done(e);
    }
})

 It("`setDifference` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3]).setDifference([2,4]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,3]);

        done()
    }
    catch(e) {
        done(e);
    }
})

 It("`getField` should work", function* (done) {
    try {
        result = yield r.expr({a:0, b:1})("a").run(connection);
        assert.equal(result, 0);

        result = yield r.expr({a:0, b:1}).getField("a").run(connection);
        assert.equal(result, 0);

        result = yield r.expr([{a:0, b:1}, {a:1}])("a").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1]);

        done()
    }
    catch(e) {
        done(e);
    }
})

 It("`hasFields` should work", function* (done) {
    try {
        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}, {b:1, c:3}]).hasFields("a", "c").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}]);

        done()
    }
    catch(e) {
        done(e);
    }
})

 It("`insertAt` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3,4]).insertAt(0, 2).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [2,1,2,3,4]);

        result = yield r.expr([1,2,3,4]).insertAt(3, 2).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3,2,4]);

        done()
    }
    catch(e) {
        done(e);
    }
})

 It("`spliceAt` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3,4]).spliceAt(1, [9, 9]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,9,9,2,3,4]);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`deleteAt` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3,4]).deleteAt(1).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,3,4]);

        result = yield r.expr([1,2,3,4]).deleteAt(1, 3).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,4]);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`changeAt` should work", function* (done) {
    try {
        result = yield r.expr([1,2,3,4]).changeAt(1, 3).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,3,3,4]);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`keys` should work", function* (done) {
    try {
        result = yield r.expr({a:0, b:1, c:2}).keys().orderBy(r.row).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, ["a", "b", "c"]);

        done()
    }
    catch(e) {
        done(e);
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


