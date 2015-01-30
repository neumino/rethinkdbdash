var config = require('./config.js');
var r = require('../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var Readable = require('stream').Readable;

var uuid = util.uuid;
var It = util.It

var dbName, tableName, tableName2, stream, result, pks, feed;

var numDocs = 100; // Number of documents in the "big table" used to test the SUCCESS_PARTIAL 
var smallNumDocs = 5; // Number of documents in the "small table"


It("Init for `stream.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid(); // Big table to test partial sequence
        tableName2 = uuid(); // small table to test success sequence

        result = yield r.dbCreate(dbName).run()
        assert.equal(result.dbs_created, 1);
        //yield r.db(dbName).wait().run()
        result = yield [r.db(dbName).tableCreate(tableName)('tables_created').run(), r.db(dbName).tableCreate(tableName2)('tables_created').run()]
        assert.deepEqual(result, [1, 1]);
        done();
    }
    catch(e) {
        console.log(e);
        done(e);
    }
})
It("Inserting batch - table 1", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(numDocs).join('{}, ')+'{}]')).run();
        assert.equal(result.inserted, numDocs);
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
        done(e);
    }
})
It("`table` should return a stream", function* (done) {
    try {
        stream = yield r.db(dbName).table(tableName).run({stream: true});
        assert(stream);
        assert(stream instanceof Readable);
        stream.close();

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`table` should return a stream - testing empty SUCCESS_COMPLETE", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        stream = yield r.db(dbName).table(tableName).run(connection, {stream: true});
        assert(stream);
        assert(stream instanceof Readable);
        stream.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


It("Test flowing - event data", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        stream = yield r.db(dbName).table(tableName).run(connection, {stream: true});
        var count = 0;
        stream.on('data', function() {
            count++;
            if (count === numDocs) {
                done();
            }
        });
    }
    catch(e) {
        done(e);
    }
})

It("Test read", function* (done) {
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        stream = yield r.db(dbName).table(tableName).run(connection, {stream: true});
        stream.once('readable', function() {
            var doc = stream.read();
            if (doc === null) {
                done(new Error("stream.read() should not return null when readable was emitted"));
            }
            var count = 1;
            stream.on('data', function(data) {
                count++;
                if (count === numDocs) {
                    done();
                }
            });
        });
    }
    catch(e) {
        done(e);
    }
})

It("Test flowing - event data", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        stream = yield r.db(dbName).table(tableName).run(connection, {stream: true});
        var count = 0;
        stream.on('data', function() {
            count++;
            if (count === numDocs) {
                done();
            }
        });
        stream.pause();
        if (count > 0) {
            done(new Error("The stream should have been paused"));
        }
        stream.resume();
    }
    catch(e) {
        done(e);
    }
})

It("Import with stream as default", function* (done) {
    var r1 = require('../lib')({stream: true, host: config.host, port: config.port, authKey: config.authKey, buffer: config.buffer, max: config.max});
    var i=0;
    try {
        stream = yield r1.db(dbName).table(tableName).run();
        assert(stream instanceof Readable);
        done();
    }
    catch(e) {
        done(e);
    }
})

