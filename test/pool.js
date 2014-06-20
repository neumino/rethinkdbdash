var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')({pool: false});
var util = require(__dirname+'/util.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, pks;

var options = {
    min: 2,
    max: 10,
    buffer: 2,
    host: config.host,
    port: config.port,
    authKey: config.authKey
};

It("`createPool` should create a pool and `getPool` should return it", function* (done) {
    try {
        r = r.createPool(options);
        assert(r.getPool())
        assert.equal(r.getPool().getLength(), 2)
        done();
    }
    catch(e) {
        done(e);
    }
});

//TODO try to make this tests a little more deterministic
It("`run` should work without a connection if a pool exists", function* (done) {
    try {
        var result = yield r.expr(1).run()
        assert.equal(result, 1);

        assert(r.getPool().getAvailableLength() >= 2); // This can be 2 because r.expr(1) may be run BEFORE a connection in the buffer is available
        assert(r.getPool().getAvailableLength() <= r.getPool().getLength())
        assert(r.getPool().getAvailableLength() >=2);
        done()
    }
    catch(e) {
        done(e);
    }
});
It("The pool should keep a buffer", function* (done) {
    try {
        var result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]
        assert.deepEqual(result, [1,1,1,1,1]);
        assert(r.getPool().getLength() >= options.buffer+result.length);

        setTimeout( function() {
            assert(r.getPool().getAvailableLength() >= result.length) // The connections created for the buffer may not be available yet
            assert.equal(r.getPool().getLength(), r.getPool().getLength())
            done();
        }, 500)
    }
    catch(e) {
        done(e);
    }
});
It("The pool shouldn't have more than `options.max` connections", function* (done) {
    try {
        var result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]
        assert.deepEqual(result, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
        assert.equal(r.getPool().getLength(), options.max)

        setTimeout( function() {
            assert.equal(r.getPool().getAvailableLength(), options.max)
            assert.equal(r.getPool().getAvailableLength(), r.getPool().getLength())
            done()
        }, 500)
    }
    catch(e) {
        done(e);
    }
});

It("Init for `pool.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        var result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(10000).join('{}, ')+'{}]')).run();
        assert.equal(result.inserted, 10000);
        pks = result.generated_keys;

        done();
    }
    catch(e) {
        done(e);
    }
})
It("Updating data to make it heavier", function* (done) {
    try {
        //Making bigger documents to retrieve multiple batches
        var result = yield r.db(dbName).table(tableName).update({
            "foo": uuid(),
            "fooo": uuid(),
            "foooo": uuid(),
            "fooooo": uuid(),
            "foooooo": uuid(),
            "fooooooo": uuid(),
            "foooooooo": uuid(),
            "fooooooooo": uuid(),
            "foooooooooo": uuid(),
            date: r.now()
        }).run();
        done();
    }
    catch(e) {
        done(e);
    }
})



It("The pool should release a connection only when the cursor has fetch everything or get closed", function* (done) {
    try {
        var result = yield [r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run(),r.db(dbName).table(tableName).run()];
        assert.equal(result.length, 10);
        assert.equal(r.getPool().getAvailableLength(), 0);
        yield result[0].toArray();
        assert.equal(r.getPool().getAvailableLength(), 1);
        yield result[1].toArray();
        assert.equal(r.getPool().getAvailableLength(), 2);
        yield result[2].close();
        assert.equal(r.getPool().getAvailableLength(), 3);
        yield [result[3].close(), result[4].close(), result[5].close(), result[6].close(), result[7].close(), result[8].close(), result[9].close()]
        done();
    }
    catch(e) {
        done(e);
    }
});

It("The pool should shrink if a connection is not used for some time", function* (done) {
    try{
        r.getPool().setOptions({timeoutGb: 100});

        var result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]

        assert.deepEqual(result, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])

        setTimeout(function() {
            assert.equal(r.getPool().getAvailableLength(), options.min)
            assert.equal(r.getPool().getLength(), options.min)
            done()
        },400)
    }
    catch(e) {
        done(e);
    }
});

/*
It("The pool should remove a connection if it errored", function* (done) {
    try{
        r.getPool().setOptions({timeoutGb: 60*60*1000});

        var result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]

        assert.deepEqual(result, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])

        // This query will make the error return an error -1
        var result = yield r.expr(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .run()


    }
    catch(e) {
        if ((true) || (e.message === "Client is buggy (failed to deserialize protobuf)")) {
            // We expect the connection that errored to get closed in the next second
            setTimeout(function() {
                assert.equal(r.getPool().getAvailableLength(), options.max-1)
                assert.equal(r.getPool().getLength(), options.max-1)
                done()
            }, 1000)
        }
        else {
            done(e);
        }

    }
});
*/

It("`pool.drain` should eventually remove all the connections", function* (done) {
    try{
        yield r.getPool().drain();

        assert.equal(r.getPool().getAvailableLength(), 0)
        assert.equal(r.getPool().getLength(), 0)

        done()
    }
    catch(e) {
        done(e);
    }
});


