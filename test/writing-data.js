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

It("Init for `writing-data.js`", function* (done) {
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

It("`insert` should work - single insert`", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, 100);


        done();
    }
    catch(e) {
        done(e);
    }
})


It("`insert` should work - batch insert 1`", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert([{}, {}]).run(connection);
        assert.equal(result.inserted, 2);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`insert` should work - batch insert 2`", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, 100);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`insert` should work - with returnVals true`", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert({}, {returnVals: true}).run(connection);
        assert.equal(result.inserted, 1);
        assert(result.new_val);
        assert.equal(result.old_val, null);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`insert` should work - with returnVals false`", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert({}, {returnVals: false}).run(connection);
        assert.equal(result.inserted, 1);
        assert.equal(result.new_val, undefined);
        assert.equal(result.old_val, undefined);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`insert` should work - with durability soft`", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert({}, {durability: "soft"}).run(connection);
        assert.equal(result.inserted, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`insert` should work - with durability hard`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).insert({}, {durability: "hard"}).run(connection);
        assert.equal(result.inserted, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`insert` should work - testing upsert true`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).insert({}, {upsert: true}).run(connection);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert({id: result.generated_keys[0], val:1}, {upsert: true}).run(connection);
        assert.equal(result.replaced, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`insert` should work - testing upsert false`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).insert({}, {upsert: false}).run(connection);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert({id: result.generated_keys[0], val:1}, {upsert: false}).run(connection);
        assert.equal(result.errors, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`replace` should throw if no argument is given", function* (done) {
    try{
        result = yield r.db(dbName).table(tableName).replace().run(connection);
    }
    catch(e) {
        if (e.message === "First argument of `replace` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`delete` should work`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result.deleted > 0);

        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert.equal(result.deleted, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`delete` should work -- soft durability`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).delete({durability: "soft"}).run(connection);
        assert.equal(result.deleted, 1);


        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert.equal(result.deleted, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})



It("`delete` should work -- hard durability`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).delete({durability: "hard"}).run(connection);
        assert.equal(result.deleted, 1);

        
        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert.equal(result.deleted, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`update` should work - point update`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`update` should work - range update`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert([{id: 1}, {id: 2}]).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).update({foo: "bar"}).run(connection);
        assert.equal(result.replaced, 2);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});
        result = yield r.db(dbName).table(tableName).get(2).run(connection);
        assert.deepEqual(result, {id: 2, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`update` should work - soft durability`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {durability: "soft"}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`update` should work - hard durability`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {durability: "hard"}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`update` should work - returnVals true", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {returnVals: true}).run(connection);
        assert.equal(result.replaced, 1);
        assert.deepEqual(result.new_val, {id: 1, foo: "bar"});
        assert.deepEqual(result.old_val, {id: 1});

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`update` should work - returnVals false`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {returnVals: false}).run(connection);
        assert.equal(result.replaced, 1);
        assert.equal(result.new_val, undefined);
        assert.equal(result.old_val, undefined);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`update` should throw if no argument is given", function* (done) {
    try{
        result = yield r.db(dbName).table(tableName).update().run(connection);
    }
    catch(e) {
        if (e.message === "First argument of `update` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`replace` should work - point replace`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`replace` should work - range replace`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert([{id: 1}, {id: 2}]).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).replace(r.row.merge({foo: "bar"})).run(connection);
        assert.equal(result.replaced, 2);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});
        result = yield r.db(dbName).table(tableName).get(2).run(connection);
        assert.deepEqual(result, {id: 2, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`replace` should work - soft durability`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {durability: "soft"}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`replace` should work - hard durability`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {durability: "hard"}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`replace` should work - returnVals true", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {returnVals: true}).run(connection);
        assert.equal(result.replaced, 1);
        assert.deepEqual(result.new_val, {id: 1, foo: "bar"});
        assert.deepEqual(result.old_val, {id: 1});

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`replace` should work - returnVals false`", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        result = yield r.db(dbName).table(tableName).insert({id: 1}).run(connection);
        assert(result);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {returnVals: false}).run(connection);
        assert.equal(result.replaced, 1);
        assert.equal(result.new_val, undefined);
        assert.equal(result.old_val, undefined);

        result = yield r.db(dbName).table(tableName).get(1).run(connection);
        assert.deepEqual(result, {id: 1, foo: "bar"});

        done();
    }
    catch(e) {
        done(e);
    }
})






It("End for `writing-data.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


