var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName;
var cursor;
var numDocs = 3100;

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


        done();
    }
    catch(e) {
        done(e);
    }
})
It("Inserting batch", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(numDocs).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, numDocs);
        pks = result.generated_keys;
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`table` should return a cursor", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        assert(cursor.hasNext, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`next` should return a document", function* (done) {
    try {
        var result = yield cursor.next();
        assert(result);
        assert(result.id);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`next` should work -- testing common pattern", function* (done) {
    try {
        var cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        i=0;
        while(cursor.hasNext()) {
            result = yield cursor.next();
            assert(result);
            i++;
        }
        assert.equal(numDocs, i);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`toArray` should work", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run(connection);
        result = yield cursor.toArray();
        assert.equal(result.length, numDocs);

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


