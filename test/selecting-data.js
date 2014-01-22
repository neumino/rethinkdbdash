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
It("`table` should work with useOutdated", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName, {useOutdated: true}).run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 100)

        result = yield r.db(dbName).table(tableName, {useOutdated: false}).run(connection);
        result = yield result.toArray();
        assert.equal(result.length, 100)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`table` should throw with non valid otpions", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName, {nonValidKey: false}).run(connection);
    }
    catch(e) {
        if (e.message === 'Unrecognized option `nonValidKey` in `table` after:\nr.db("'+dbName+'")\nAvailable option is useOutdated <bool>') {
            done();
        }
        else {
            done(e);
        }
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
It("`get` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).get().run(connection);
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "First argument of `get` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
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
It("`getAll` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).getAll().run(connection);
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "First argument of `getAll` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
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
It("`between` should wrok -- all args", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).between(5, 20, {index: "fieldAddOne", leftBound: "open", rightBound: "closed"}).run(connection);
        assert(result);
        result = yield result.toArray();
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`between` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).between().run(connection);
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "First argument of `between` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
    }
})
It("`between` should throw if non valid arg", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).between(1, 2, {nonValidKey: true}).run(connection);
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === 'Unrecognized option `nonValidKey` in `between` after:\nr.db("'+dbName+'").table("'+tableName+'")\nAvailable options are index <string>, leftBound <string>, rightBound <string>') {
            done();
        }
        else{
            done(e);
        }
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

It("`filter` should work -- default false", function* (done) {
    try{
        result = yield r.expr([{a:1}, {}]).filter(r.row("a"), {default: r.error()}).run(connection);
    }
    catch(e) {
        if (e.message.match(/^No attribute `a` in object:/)) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`filter` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter().run(connection);
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "First argument of `filter` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
    }
})
It("`filter` should throw with a non valid option", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).filter(true, {nonValidKey: false}).run(connection);
    }
    catch(e) {
        if (e.message.match(/^Unrecognized option `nonValidKey` in `filter` after:/)) {
            done();
        }
        else{
            done(e);
        }
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


