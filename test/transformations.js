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

It("Init for `transformations.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);

        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, 100);

        result = yield r.db(dbName).table(tableName).update({val: r.js("Math.random()")}, {nonAtomic: true}).run(connection);
        result = yield r.db(dbName).table(tableName).indexCreate('val').run(connection);
        result = yield r.db(dbName).table(tableName).indexWait('val').run(connection);

        pks = result.generated_keys;

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`map` should work on array -- r.row", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).map(r.row).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3]);
        done();

        result = yield r.expr([1,2,3]).map(r.row.add(1)).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [2, 3, 4]);

    }
    catch(e) {
        done(e);
    }
})
It("`map` should work on array -- function", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).map(function(doc) { return doc }).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3]);

        result = yield r.expr([1,2,3]).map(function(doc) { return doc.add(2)}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [3, 4, 5]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`withFields` should work on array -- single field", function* (done) {
    try {
        var result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0}, {a: 4}, {a: 9}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`withFields` should work on array -- multiple field", function* (done) {
    try {
        var result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a", "c").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0, c: 2}, {a: 4, c: 5}, {a:9, c:0}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`concatMap` should work on array -- function", function* (done) {
    try {
        var result = yield r.expr([[1, 2], [3], [4]]).concatMap(function(doc) { return doc}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1, 2, 3, 4]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`concatMap` should work on array -- r.row", function* (done) {
    try {
        var result = yield r.expr([[1, 2], [3], [4]]).concatMap(r.row).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1, 2, 3, 4]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`orderBy` should work on array -- string", function* (done) {
    try {
        var result = yield r.expr([{a:23}, {a:10}, {a:0}, {a:100}]).orderBy("a").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a:0}, {a:10}, {a:23}, {a:100}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`orderBy` should work on array -- r.row", function* (done) {
    try {
        var result = yield r.expr([{a:23}, {a:10}, {a:0}, {a:100}]).orderBy(r.row("a")).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{a:0}, {a:10}, {a:23}, {a:100}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`orderBy` should work on a table -- pk", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).orderBy({index: "id"}).run(connection);
        result = yield result.toArray();
        for(i=0; i<result.length-1; i++) {
            assert(result[i].id < result[i+1].id);
        }

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`orderBy` should work on a table -- secondary", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).orderBy({index: "val"}).run(connection);
        result = yield result.toArray();
        for(i=0; i<result.length-1; i++) {
            assert(result[i].val < result[i+1].val);
        }

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`orderBy` should work on a two fields", function* (done) {
    try {
        var dbName = uuid();
        var tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert([{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")}]).run(connection);
        assert.deepEqual(result.inserted, 98);

        result = yield r.db(dbName).table(tableName).orderBy("id", "a").run(connection);
        result = yield result.toArray();
        assert(Array.isArray(result));
        assert(result[0].id<result[1].id);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`skip` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).skip(3).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [3, 4, 5, 6, 7, 8, 9]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`limit` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).limit(3).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1, 2]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`slice` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(3, 5).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [3, 4]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`slice` should work -- with options", function* (done) {
    try {
        var result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {rightBound:'closed'}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9, 10]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {rightBound:'open'}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {leftBound:'open'}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [6, 7, 8, 9]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {leftBound:'closed'}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {leftBound:'closed', rightBound: 'closed'}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9, 10]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`nth` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).nth(3).run(connection);
        assert(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`indexesOf` should work - datum", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).nth(3).run(connection);
        assert(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`indexesOf` should work - r.row", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(r.row.eq(3)).run(connection);
        result = yield result.toArray();
        assert.equal(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`indexesOf` should work - function", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(function(doc) { return doc.eq(3)}).run(connection);
        result = yield result.toArray();
        assert.equal(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`isEmpty` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).isEmpty().run(connection);
        assert.equal(result, false);

        result = yield r.expr([]).isEmpty().run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`union` should work", function* (done) {
    try{
        var result = yield r.expr([0, 1, 2]).union([3, 4, 5]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1, 2, 3, 4, 5]);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`sample` should work", function* (done) {
    try{
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).sample(2).run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 2);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`sample` should throw if given -1", function* (done) {
    try{
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).sample(-1).run(connection);
    }
    catch(e) {
        if (e.message.match("Number of items to sample must be non-negative, got `-1`")) {
            done()
        }
        else {
            done(e);
        }
    }
})








It("End for `transformations.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


