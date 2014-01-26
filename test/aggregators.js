var config = require('./config.js');
var r = require('../lib')(config);
var util = require('./util.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var dbName, tableName;

It("Init for `aggregators.js`", function* (done) {
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

It("`r.count` should count", function* (done) {
    try {
        var result = yield r.expr([{foo:1},{foo:1},{foo:1},{foo:1},{foo:1}]).groupBy("foo", r.count).run()
        result = yield result.toArray();
        assert.deepEqual(result, [{"group":{"foo":1},"reduction":5}]);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.sum` should count", function* (done) {
    try {
        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.sum("val")).orderBy("g").run();
        result = yield result.toArray();
        assert.deepEqual(result, [{group: {g: 0}, reduction:5 }, {group: {g: 1 }, reduction: 30}, {group: {g: 2 }, reduction: 3}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.avg` should count", function* (done) {
    try {
        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.avg("val")).orderBy("g").run();
        result = yield result.toArray();
        assert.deepEqual(result, [{group: {g: 0}, reduction:2.5 }, {group: {g: 1 }, reduction: 15}, {group: {g: 2 }, reduction: 3}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.sum` should throw if too many arguments", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).groupBy("g", r.sum("val", "foo")).run();
    }
    catch(e) {
        if (e.message === "`r.sum` takes 1 argument, 2 provided.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`r.avg` should throw if too many arguments", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).groupBy("g", r.avg("val", "foo")).run();
    }
    catch(e) {
        if (e.message === "`r.avg` takes 1 argument, 2 provided.") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`r.sum` should throw if no arg", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).groupBy("g", r.sum()).run();
    }
    catch(e) {
        if (e.message === "`r.sum` takes 1 argument, 0 provided.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`r.avg` should throw if no arg", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).groupBy("g", r.avg()).run();
    }
    catch(e) {
        if (e.message === "`r.avg` takes 1 argument, 0 provided.") {
            done()
        }
        else {
            done(e);
        }
    }
})
