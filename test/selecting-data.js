var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName;
var pks;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("Init for `selecting-data.js`", function* (done) {
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

It("`db` should work", function* (done) {
    try {
        var result = yield r.db(dbName).info().run(connection);
        assert.deepEqual(result, {name: dbName, type: "DB"});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`table` should work", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).info().run(connection);
        assert.deepEqual(result,  {db:{name: dbName,type:"DB"},indexes:[],name: tableName, primary_key:"id",type:"TABLE"})

        result = yield r.db(dbName).table(tableName).run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 100)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`get` should work", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).get(pks[0]).run(connection);
        assert.deepEqual(result, {id: pks[0]})

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getAll` should work with multiple values - primary key", function* (done) {
    try {
        var table = r.db(dbName).table(tableName);
        query = table.getAll.apply(table, pks);
        result = yield query.run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 100);

        table = r.db(dbName).table(tableName);
        query = table.getAll.apply(table, pks.slice(0, 50));
        result = yield query.run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 50);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getAll` should work with multiple values - secondary index 1", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).update({field: 0}).run(connection);
        assert.equal(result.replaced, 100);
        result = yield r.db(dbName).table(tableName).sample(20).update({field: 10}).run(connection);
        assert.equal(result.replaced, 20);

        result = yield r.db(dbName).table(tableName).indexCreate("field").run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait("field").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{"index":"field","ready":true}]);

        result = yield r.db(dbName).table(tableName).getAll(10, {index: "field"}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getAll` should work with multiple values - secondary index 2", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexCreate("fieldAddOne", function(doc) { return doc("field").add(1) }).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait("fieldAddOne").run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{"index":"fieldAddOne","ready":true}]);

        result = yield r.db(dbName).table(tableName).getAll(11, {index: "fieldAddOne"}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`between` should wrok -- secondary index", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).between(5, 20, {index: "fieldAddOne"}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`filter` should work -- with an object", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter({field: 10}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`filter` should work -- with an object -- looking for an undefined field", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter({nonExistingField: 10}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})


It("`filter` should work -- with an anonymous function", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter(function(doc) { return doc("field").eq(10) }).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`filter` should work -- default true", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter({nonExistingField: 10}, {default: true}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 100);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`filter` should work -- default false", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter({nonExistingField: 10}, {default: false}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})








It("End for `selecting-data.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


