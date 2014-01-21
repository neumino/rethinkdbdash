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

It("Init for `aggregation.js`", function* (done) {
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

It("`reduce` should work -- no base ", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).reduce(function(left, right) { return left.add(right) }).run(connection);
        assert.equal(result, 6);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`reduce` should work -- base ", function* (done) {
    try {
        result = yield r.expr([0, 1, 2, 3, 4, 5]).reduce( function(left, right) { return left.add(right) }, 11).run(connection);
        assert(result > 25);

        result = yield r.expr([1]).reduce( function(left, right) { return left.add(right) }, 11).run(connection);
        assert.equal(result, 12);

        result = yield r.expr([]).reduce( function(left, right) { return left.add(right) }, 11).run(connection);
        assert.equal(result, 11);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`count` should work -- no arg ", function* (done) {
    try {
        result = yield r.expr([0, 1, 2, 3, 4, 5]).count().run(connection);
        assert.equal(result, 6);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`count` should work -- filter ", function* (done) {
    try {
        result = yield r.expr([0, 1, 2, 3, 4, 5]).count(r.row.eq(2)).run(connection);
        assert.equal(result, 1);

        result = yield r.expr([0, 1, 2, 3, 4, 5]).count(function(doc) { return doc.eq(2) }).run(connection);
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`groupedMapReduce` should work -- no base ", function* (done) {
    try {
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }).orderBy("group").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{group: 0, reduction: 5}, {group: 1, reduction: 30}, {group: 2, reduction: 3}])

        done()
    }
    catch(e) {
        done(e);
    }
})

It("`groupedMapReduce` should work -- base ", function* (done) {
    try {
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }, 10).orderBy("group").run(connection);
        result = yield result.toArray();
        assert(result[0].reduction > 5);
        assert(result[1].reduction > 30);
        assert(result[2].reduction > 3);

        done()
    }
    catch(e) {
        done(e);
    }
})

It("`groupBy` should work -- single field ", function* (done) {
    try{
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.count).orderBy("g").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [
            {group: {g: 0}, reduction:2 },
            {group: {g: 1 }, reduction: 2},
            {group: {g: 2 }, reduction: 1}
        ]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`groupBy` should work -- multiple fields ", function* (done) {
    try{
        result = yield r.expr([{g: 0, gg: 0, val: 2}, {g: 0, gg: 0, val: 3}, {g: 1, gg: 0, val: 10}, {g: 1, gg: 1, val: 20}, {g:2, gg: 3, val: 3}]).groupBy("g", "gg", r.count).orderBy("g").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [
            {"group": {"g": 0,"gg": 0},"reduction": 2},
            {"group": {"g": 1,"gg": 0},"reduction": 1},
            {"group": {"g": 1,"gg": 1},"reduction": 1},
            {"group": {"g": 2,"gg": 3},"reduction": 1}
        ])

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`groupBy` should work -- with a field sometimes undefined ", function* (done) {
    try{
        result = yield r.expr([{g: 0, gg: 0, optionalField: true, val: 2}, {g: 0, gg: 0, val: 3}, {g: 1, gg: 0, val: 10}, {g: 1, gg: 1, val: 20}, {g:2, gg: 3, val: 3}]).groupBy("g", "optionalField", r.count).orderBy("g").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [
            {"group": {"g": 0}, "reduction": 1},
            {"group": {"g": 0, "optionalField": true}, "reduction": 1},
            {"group": {"g": 1}, "reduction": 2},
            {"group": {"g": 2}, "reduction": 1}
        ])

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`groupBy` should work -- same field multiple times ", function* (done) {
    try{
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", "g", r.count).orderBy("g").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{group: {g: 0}, reduction:2 }, {group: {g: 1 }, reduction: 2}, {group: {g: 2 }, reduction: 1}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`contains` should work ", function* (done) {
    try{
        result = yield r.expr([1,2,3]).contains(2).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(1, 2).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(1, 5).run(connection);
        assert.equal(result, false);

        result = yield r.expr([1,2,3]).contains(function(doc) { return doc.eq(1) }).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1)).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(2)).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(5)).run(connection);
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})






It("End for `aggregations.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


