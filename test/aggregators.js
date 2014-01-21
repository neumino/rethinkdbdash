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

It("Init for `aggregators.js`", function* (done) {
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

It("`r.count` should count", function* (done) {
    try {
        var result = yield r.expr([{foo:1},{foo:1},{foo:1},{foo:1},{foo:1}]).groupBy("foo", r.count).run(connection)
        result = yield result.toArray();
        assert.deepEqual(result, [{"group":{"foo":1},"reduction":5}]);
        done();
    }
    catch(e) {
        done(e);
    }
})


It("End for `aggregators.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


