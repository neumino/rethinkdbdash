var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName;
var tableName, tableName2
var cursor;
var numDocs = 100;
var smallNumDocs = 5;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("Init for `cursor.js`", function* (done) {
    try {
        connection = yield r.connect({batch_conf: 10});
        assert(connection);

        dbName = uuid();
        tableName = uuid(); // Big table to test partial sequence
        tableName2 = uuid(); // small table to test success sequence

        var result = yield [r.dbCreate(dbName).run(connection), r.db(dbName).tableCreate(tableName).run(connection), r.db(dbName).tableCreate(tableName2).run(connection)]
        assert.deepEqual(result, [{created:1}, {created:1}, {created:1}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("Inserting batch - table 1", function* (done) {
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
It("Inserting batch - table 2", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName2).insert(eval('['+new Array(smallNumDocs).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, smallNumDocs);
        pks = result.generated_keys;
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Inserting batch", function* (done) {
    try {
        // Add a date
        result = yield r.db(dbName).table(tableName).update({
            date: r.now()
        }).run(connection);
        done();
    }
    catch(e) {
        console.log(e.message);
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
It("A cursor should keep the options and use them", function* (done) {
    var i = 0;
    try {
        var result = yield r.db(dbName).table(tableName).run(connection, {profile: true, timeFormat: 'raw'});
        assert(result);
        assert(result.profile);
        var cursor = result.result;
        while(cursor.hasNext()) {
            result = yield cursor.next();
            assert(result);
            assert(result.date.$reql_type$);
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
It("`toArray` should work -- with a profile", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).run(connection, {profile: true});
        result = yield result.result.toArray();
        assert.equal(result.length, numDocs);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`table` should return a cursor - 2", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName2).run(connection);
        assert(cursor);
        assert(cursor.hasNext, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`next` should return a document - 2", function* (done) {
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
It("`next` should work -- testing common pattern - 2", function* (done) {
    try {
        var cursor = yield r.db(dbName).table(tableName2).run(connection);
        assert(cursor);
        i=0;
        while(cursor.hasNext()) {
            result = yield cursor.next();
            assert(result);
            i++;
        }
        assert.equal(smallNumDocs, i);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`toArray` should work - 2", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName2).run(connection);
        result = yield cursor.toArray();
        assert.equal(result.length, smallNumDocs);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`cursor.close` should return a promise", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName2).run(connection);
        yield cursor.close();
        done();
    }
    catch(e) {
        done(e);
    }
})
It("cursor shouldn't have circular reference", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run(connection);
        cursor2 = yield r.db(dbName).table(tableName2).run(connection);
        JSON.stringify(cursor);
        JSON.stringify(cursor2);
        yield cursor.close();
        yield cursor2.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


// This test is not working for now -- need more data? Server bug?
It("Remove the field `val` in some docs", function* (done) {
    var i=0;
    try {
        result = yield r.db(dbName).table(tableName).update({val: 1}).run(connection);
        //assert.equal(result.replaced, numDocs);

        result = yield r.db(dbName).table(tableName)
            .orderBy({index: r.desc("id")}).limit(5).replace(r.row.without("val"))
            //.sample(1).replace(r.row.without("val"))
            .run(connection);
        assert.equal(result.replaced, 5);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`next` should error when hitting an error -- not on the first batch", function* (done) {
    var i=0;
    try {
        cursor = yield r.db(dbName).table(tableName)
            .orderBy({index: "id"})
            .map(r.row("val").add(1))
            .run(connection);

        assert(cursor);
        while(cursor.hasNext()) {
            result = yield cursor.next();
            i++;
        }
    }
    catch(e) {
        if ((i > 0) && (e.message.match(/^No attribute `val` in object/))) {
            done()
        }
        else {
            done(e);
        }
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


