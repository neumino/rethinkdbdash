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
It("`reduce` should work -- base ", function* (done) {
    try {
        result = yield r.expr([0, 1, 2, 3, 4, 5]).reduce( function(left, right) { return left.add(right) }, 11).run();
        assert(result > 25);

        result = yield r.expr([1]).reduce( function(left, right) { return left.add(right) }, 11).run();
        assert.equal(result, 12);

        result = yield r.expr([]).reduce( function(left, right) { return left.add(right) }, 11).run();
        assert.equal(result, 11);

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

It("`groupedMapReduce` should work -- no base ", function* (done) {
    try {
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }).orderBy("group").run();
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
                function(left, right) { return left.add(right) }, 10).orderBy("group").run();
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
It("`groupedMapReduce` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).groupedMapReduce().run();
    }
    catch(e) {
        if (e.message === "`groupedMapReduce` takes at least 3 arguments, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`groupedMapReduce` should throw if just one argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).groupedMapReduce(r.row).run();
    }
    catch(e) {
        if (e.message === "`groupedMapReduce` takes at least 3 arguments, 1 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`groupedMapReduce` should throw if just two argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).groupedMapReduce(r.row, r.row).run();
    }
    catch(e) {
        if (e.message === "`groupedMapReduce` takes at least 3 arguments, 2 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`groupBy` should work -- single field ", function* (done) {
    try{
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.count).orderBy("g").run();
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
        result = yield r.expr([{g: 0, gg: 0, val: 2}, {g: 0, gg: 0, val: 3}, {g: 1, gg: 0, val: 10}, {g: 1, gg: 1, val: 20}, {g:2, gg: 3, val: 3}]).groupBy("g", "gg", r.count).orderBy("g").run();
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
        result = yield r.expr([{g: 0, gg: 0, optionalField: true, val: 2}, {g: 0, gg: 0, val: 3}, {g: 1, gg: 0, val: 10}, {g: 1, gg: 1, val: 20}, {g:2, gg: 3, val: 3}]).groupBy("g", "optionalField", r.count).orderBy("g").run();
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
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", "g", r.count).orderBy("g").run();
        result = yield result.toArray();
        assert.deepEqual(result, [{group: {g: 0}, reduction:2 }, {group: {g: 1 }, reduction: 2}, {group: {g: 2 }, reduction: 1}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`groupBy` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).groupBy().run();
    }
    catch(e) {
        if (e.message === "`groupBy` takes at least 2 arguments, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`groupBy` should throw if no aggregator has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).groupBy("foo").run();
    }
    catch(e) {
        if (e.message === "`groupBy` takes at least 2 arguments, 1 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
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
