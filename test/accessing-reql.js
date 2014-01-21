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

It("Init for `cursor.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);

        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created:1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, 100);
        pks = result.generated_keys;

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`run` should take an argument", function* (done) {
    try {
        var result = yield r.expr(1).run(connection, {useOutdated: true});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {useOutdated: false});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {profile: false});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {profile: true});
        assert.equal(result.value, 1);

        result = yield r.expr(1).run(connection, {durability: false});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {durability: false});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {db: "test"});
        assert.equal(result, 1);


        done();
    }
    catch(e) {
        done(e);
    }
})


It("End for `cursor.js`", function* (done) {
    try {
        connection.close();

        done();
    }
    catch(e) {
        done(e);
    }
})


