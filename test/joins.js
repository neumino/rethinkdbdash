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

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`innerJoin` should return", function* (done) {
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


It("End for `joins.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


