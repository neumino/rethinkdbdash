var config = require('./config.js');
var r = require('../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It

var dbName, tableName, tableName2, cursor, result, pks, feed;

var numDocs = 100; // Number of documents in the "big table" used to test the SUCCESS_PARTIAL 
var smallNumDocs = 5; // Number of documents in the "small table"

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

        result = yield r.dbCreate(dbName).run()
        assert.deepEqual(result, {created:1});
        result = yield [r.db(dbName).tableCreate(tableName).run(), r.db(dbName).tableCreate(tableName2).run()]
        assert.deepEqual(result, [{created:1}, {created:1}]);
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
It("`table` should return a cursor", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run({cursor: true});
        assert(cursor);
        assert.equal(cursor.toString(), '[object Cursor]');

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`next` should return a document", function* (done) {
    try {
        result = yield cursor.next();
        assert(result);
        assert(result.id);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`each` should work", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run({cursor: true});
        assert(cursor);
        var count = 0;
        cursor.each(function(err, result) {
            count++;
            if (count === numDocs) {
                done();
            }
        })
    }
    catch(e) {
        done(e);
    }
})
It("`each` should work - onFinish - reach end", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run({cursor: true});
        assert(cursor);
        var count = 0;
        cursor.each(function(err, result) {
        }, done)
    }
    catch(e) {
        done(e);
    }
})
It("`each` should work - onFinish - return false", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run({cursor: true});
        assert(cursor);
        var count = 0;
        cursor.each(function(err, result) {
            count++
            return false
        }, function() {
            assert.equal(count, 1);
            done();
        })
    }
    catch(e) {
        done(e);
    }
})


It("`toArray` should work", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName).run({cursor: true});
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
        result = yield r.db(dbName).table(tableName).run({cursor: true, profile: true});
        result = yield result.result.toArray();
        assert.equal(result.length, numDocs);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`toArray` should work with a datum", function* (done) {
    try {
        cursor = yield r.expr([1,2,3]).run({cursor: true});
        result = yield cursor.toArray();
        assert.deepEqual(result, [1,2,3]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`table` should return a cursor - 2", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
        assert(cursor);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`next` should return a document - 2", function* (done) {
    try {
        result = yield cursor.next();
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
        cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
        assert(cursor);
        var i=0;
        while(true) {
            try{
                result = yield cursor.next();
                assert(result);
                i++;
            }
            catch(e) {
                if (e.message === "No more rows in the cursor.") {
                    assert.equal(smallNumDocs, i);
                    done();
                    break;
                }
                else {
                    done(e);
                    break;
                }
            }
        }
    }
    catch(e) {
        done(e);
    }
})
It("`toArray` should work - 2", function* (done) {
    try {
        var cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
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
        var cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
        yield cursor.close();
        done();
    }
    catch(e) {
        done(e);
    }
})
It("cursor shouldn't throw if the user try to serialize it in JSON", function* (done) {
    try {
        var cursor = yield r.db(dbName).table(tableName).run({cursor: true});
        var cursor2 = yield r.db(dbName).table(tableName2).run({cursor: true});
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
            .run({cursor: true});
        assert.equal(result.replaced, 5);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`toArray` with multiple batches - testing empty SUCCESS_COMPLETE", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        cursor = yield r.db(dbName).table(tableName).run(connection, {cursor: true});

        assert(cursor);
        result = yield cursor.toArray();
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Automatic coercion from cursor to table with multiple batches", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 1, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        result = yield r.db(dbName).table(tableName).run(connection);
        assert(result.length > 0);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`next` with multiple batches", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 10, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        cursor = yield r.db(dbName).table(tableName).run(connection, {cursor: true});

        assert(cursor);
        while(true) {
            try {
                result = yield cursor.next();
                i++;
            }
            catch(e) {
                if ((i > 0) && (e.message === "No more rows in the cursor.")) {
                    connection.close();
                    done()
                }
                else {
                    done(e);
                }
                break;
            }
        }
    }
    catch(e) {
        done(e);
    }
})
It("`next` should error when hitting an error -- not on the first batch", function* (done) {
    var i=0;
    try {
        var connection = yield r.connect({max_batch_rows: 10, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        var cursor = yield r.db(dbName).table(tableName)
            .orderBy({index: "id"})
            .map(r.row("val").add(1))
            .run(connection, {cursor: true});

        assert(cursor);
        while(true) {
            try {
                result = yield cursor.next();
                i++;
            }
            catch(e) {
                if ((i > 0) && (e.message.match(/^No attribute `val` in object/))) {
                    connection.close();
                    done()
                }
                else {
                    done(e);
                }
                break;
            }
        }
    }
    catch(e) {
        done(e);
    }
})

It("`changes` should return a feed", function* (done) {
    try {
        feed = yield r.db(dbName).table(tableName).changes().run();
        assert(feed);
        assert.equal(feed.toString(), '[object Feed]');

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`next` should work on feed", function* (done) {
    try {
        feed = yield r.db(dbName).table(tableName2).changes().run();
        setImmediate(function() {
            r.db(dbName).table(tableName2).update({foo: r.now()}).run();
        })
        assert(feed);
        var i=0;
        while(true) {
            result = yield feed.next();
            assert(result);
            i++;
            if (i === smallNumDocs) {
                done();
                break;
            }
        }
    }
    catch(e) {
        done(e);
    }
})
It("`close` should work on feed", function* (done) {
    try {
        feed = yield r.db(dbName).table(tableName2).changes().run();
        setTimeout(function() {
            feed.close().then(function() {
                done();
            });
        }, 1000)
        assert(feed);
    }
    catch(e) {
        done(e);
    }
})

It("`close` should work on feed with events", function* (done) {
    try {
        feed = yield r.db(dbName).table(tableName2).changes().run();
        setTimeout(function() {
            feed.close();
        }, 1000)
        assert(feed);
        feed.on('error', function() {
            // Ignore the error
        });
        feed.on('end', function() {
            done();
        });
    }
    catch(e) {
        done(e);
    }
})
It("`on` should work on feed", function* (done) {
    try {
        feed = yield r.db(dbName).table(tableName2).changes().run();
        setImmediate(function() {
            r.db(dbName).table(tableName2).update({foo: r.now()}).run();
        })
        var i=0;
        feed.on('data', function() {
            i++;
            if (i === smallNumDocs) {
                done();
            }
        });
        feed.on('error', function(e) {
            done(e)
        })
    }
    catch(e) {
        done(e);
    }
})
It("`on` should work on cursor - a 'end' event shoul be eventually emitted on a cursor", function* (done) {
    try {
        cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
        setImmediate(function() {
            r.db(dbName).table(tableName2).update({foo: r.now()}).run();
        })
        cursor.on('end', function() {
            done()
        });
        cursor.on('error', function(e) {
            done(e)
        })
    }
    catch(e) {
        done(e);
    }
})

It("`next`, `each`, `toArray` should be deactivated if the EventEmitter interface is used", function* (done) {
    try {
        feed = yield r.db(dbName).table(tableName2).changes().run();
        setImmediate(function() {
            r.db(dbName).table(tableName2).update({foo: r.now()}).run();
        })
        feed.on('data', function() {
        });
        assert.throws(function() {
            feed.next();
        }, function(e) {
            if (e.message === 'You cannot called `next` once you have bound listeners on the feed.') {
                done();
            }
            else {
                done(e);
            }
            return true;
        })
    }
    catch(e) {
        done(e);
    }
})
