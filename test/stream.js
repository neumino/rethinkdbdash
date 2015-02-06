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
        dumpTable = uuid(); // dump table

        result = yield r.dbCreate(dbName).run()
        assert.equal(result.dbs_created, 1);
        //yield r.db(dbName).wait().run()
        result = yield [
          r.db(dbName).tableCreate(tableName)('tables_created').run(),
          r.db(dbName).tableCreate(tableName2)('tables_created').run(),
          r.db(dbName).tableCreate(dumpTable)('tables_created').run()]
        assert.deepEqual(result, [1, 1, 1]);
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
/*
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
It("Arrays should return a stream", function* (done) {
    try {
        var data = [10, 11, 12, 13, 14, 15, 16];
        stream = yield r.expr(data).run({stream: true});
        assert(stream);
        assert(stream instanceof Readable);

        var count = 0;
        stream.on('data', function() {
            count++;
            if (count === data.length) {
                done();
            }
        });
    }
    catch(e) {
        done(e);
    }
})

It("changes() should return a stream", function* (done) {
    try {
        var data = [{}, {}, {}, {}];
        stream = yield r.db(dbName).table(tableName).changes().run({stream: true});
        assert(stream);
        assert(stream instanceof Readable);

        var count = 0;
        stream.on('data', function() {
            count++;
            if (count === data.length) {
                done();
                stream.close();
            }
        });
        yield r.db(dbName).table(tableName).insert(data).run();
    }
    catch(e) {
        done(e);
    }
})

It("get().changes() should return a stream", function* (done) {
    try {
        stream = yield r.db(dbName).table(tableName).get(1).changes().run({stream: true});
        assert(stream);
        assert(stream instanceof Readable);

        var count = 0;
        stream.on('data', function() {
            count++;
            if (count === 3) {
                done();
                stream.close();
            }
        });
        yield r.db(dbName).table(tableName).insert({id: 1}).run();
        yield r.db(dbName).table(tableName).get(1).update({update: 1}).run();
        yield r.db(dbName).table(tableName).get(1).update({update: 2}).run();
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

It("Test read with null value", function* (done) {
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        stream = yield r.db(dbName).table(tableName).limit(10).union([null]).union(r.db(dbName).table(tableName).limit(10)).run(connection, {stream: true});
        stream.once('readable', function() {
            var count = 0;
            stream.on('data', function(data) {
                count++;
                if (count === 20) {
                    done();
                }
                else if (count > 20) {
                    done(new Error("Should not get null"))
                }
            });
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
            stream.close().then(function() {
                done();
            }).error(function(error) {
                done(error);
            });

        });
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

It("toStream", function* (done) {
    try {
        stream = r.db(dbName).table(tableName).toStream();
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
It("toStream - with grouped data", function* (done) {
    try {
        stream = r.db(dbName).table(tableName).group({index: 'id'}).toStream();
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
*/

It("pipe should work with a writable stream - 200-200", function* (done) {
    var r1 = require('../lib')({buffer:1, max: 2});

    r1.db(dbName).table(tableName).toStream({highWaterMark: 200})
        .pipe(r1.db(dbName).table(dumpTable).toWritableStream({highWaterMark: 200}))
        .on('finish', function() {
            r.expr([
                r1.db(dbName).table(tableName).count(),
                r1.db(dbName).table(dumpTable).count()
            ]).run().then(function(result) {
                if (result[0] !== result[1]) {
                    done(new Error('All the data should have been streamed'));
                }
                return r1.db(dbName).table(dumpTable).delete()
            }).then(function() {
                r1.getPool().drain();
                done();
            }).error(done);
        });
})
It("pipe should work with a writable stream - 200-20", function* (done) {
    var r1 = require('../lib')({buffer:1, max: 2});

    r1.db(dbName).table(tableName).toStream({highWaterMark: 200})
        .pipe(r1.db(dbName).table(dumpTable).toWritableStream({highWaterMark: 20}))
        .on('finish', function() {
            r.expr([
                r1.db(dbName).table(tableName).count(),
                r1.db(dbName).table(dumpTable).count()
            ]).run().then(function(result) {
                if (result[0] !== result[1]) {
                    done(new Error('All the data should have been streamed'));
                }
                return r1.db(dbName).table(dumpTable).delete()
            }).then(function() {
                r1.getPool().drain();
                done();
            }).error(done);
        });
})
It("pipe should work with a writable stream - 20-200", function* (done) {
    var r1 = require('../lib')({buffer:1, max: 2});

    r1.db(dbName).table(tableName).toStream({highWaterMark: 20})
        .pipe(r1.db(dbName).table(dumpTable).toWritableStream({highWaterMark: 200}))
        .on('finish', function() {
            r.expr([
                r1.db(dbName).table(tableName).count(),
                r1.db(dbName).table(dumpTable).count()
            ]).run().then(function(result) {
                if (result[0] !== result[1]) {
                    done(new Error('All the data should have been streamed'));
                }
                return r1.db(dbName).table(dumpTable).delete()
            }).then(function() {
                r1.getPool().drain();
                done();
            }).error(done);
        });
})
It("pipe should work with a writable stream - 50-50", function* (done) {
    var r1 = require('../lib')({buffer:1, max: 2});

    r1.db(dbName).table(tableName).toStream({highWaterMark: 50})
        .pipe(r1.db(dbName).table(dumpTable).toWritableStream({highWaterMark: 50}))
        .on('finish', function() {
            r.expr([
                r1.db(dbName).table(tableName).count(),
                r1.db(dbName).table(dumpTable).count()
            ]).run().then(function(result) {
                if (result[0] !== result[1]) {
                    done(new Error('All the data should have been streamed'));
                }
                return r1.db(dbName).table(dumpTable).delete()
            }).then(function() {
                r1.getPool().drain();
                done();
            }).error(done);
        });
})
It("toWritableStream should handle options", function* (done) {
    var r1 = require('../lib')({buffer:1, max: 2});

    var stream = r1.db(dbName).table(dumpTable).toWritableStream({highWaterMark: 50, conflict: 'replace'});
    stream.write({id: 1, foo: 1});
    stream.write({id: 1, foo: 2});
    stream.end({id: 1, foo: 3});
    stream.on('finish', function() {
        r1.db(dbName).table(dumpTable).count().then(function(result) {
            assert.equal(result, 1);
            return r1.db(dbName).table(dumpTable).get(1)
        }).then(function(result) {
            assert.deepEqual(result, {id: 1, foo: 3});
            done();
        }).error(done);
    });
})

