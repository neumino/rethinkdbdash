var config = require('./config.js');
var r = require('../lib')();
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
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
        dbName = uuid();
        tableName = uuid(); // Big table to test partial sequence
        tableName2 = uuid(); // small table to test success sequence

        var result = yield [r.dbCreate(dbName).run(), r.db(dbName).tableCreate(tableName).run(), r.db(dbName).tableCreate(tableName2).run()]
        assert.deepEqual(result, [{created:1}, {created:1}, {created:1}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("Inserting batch - table 1", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(numDocs).join('{}, ')+'{}]')).run();
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
        result = yield r.db(dbName).table(tableName2).insert(eval('['+new Array(smallNumDocs).join('{}, ')+'{}]')).run();
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
        }).run();
        done();
    }
    catch(e) {
        console.log(e.message);
        done(e);
    }
})
It("`table` should return a cursor", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run();
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
        var cursor = yield r.db(dbName).table(tableName).run();
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
        var result = yield r.db(dbName).table(tableName).run({profile: true, timeFormat: 'raw'});
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
        cursor = yield r.db(dbName).table(tableName).run();
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
        result = yield r.db(dbName).table(tableName).run({profile: true});
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
        cursor = yield r.db(dbName).table(tableName2).run();
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
        var cursor = yield r.db(dbName).table(tableName2).run();
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
        cursor = yield r.db(dbName).table(tableName2).run();
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
        cursor = yield r.db(dbName).table(tableName2).run();
        yield cursor.close();
        done();
    }
    catch(e) {
        done(e);
    }
})
It("cursor shouldn't throw if the user try to serialize it in JSON", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run();
        cursor2 = yield r.db(dbName).table(tableName2).run();
        assert.deepEqual(JSON.stringify("You cannot serialize to JSON a cursor. Retrieve data from the cursor with `toArray` or `next`."), JSON.stringify(cursor));
        assert.deepEqual(JSON.stringify("You cannot serialize to JSON a cursor. Retrieve data from the cursor with `toArray` or `next`."), JSON.stringify(cursor2));
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
        result = yield r.db(dbName).table(tableName).update({val: 1}).run();
        //assert.equal(result.replaced, numDocs);

        result = yield r.db(dbName).table(tableName)
            .orderBy({index: r.desc("id")}).limit(5).replace(r.row.without("val"))
            //.sample(1).replace(r.row.without("val"))
            .run();
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
        connection = yield r.connect({batch_conf: 10});
        assert(connection);

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
            connection.close();
            done()
        }
        else {
            done(e);
        }
    }
})
