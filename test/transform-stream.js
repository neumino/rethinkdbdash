var config = require('./config.js');
var r = require('../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var Readable = require('stream').Readable;
var _util = require('util');
var devnull = require('dev-null');

var uuid = util.uuid;
var It = util.It

var dbName, tableName, tableName2, stream, result, pks, feed;

var numDocs = 100; // Number of documents in the "big table" used to test the SUCCESS_PARTIAL 


It("Init for `transform-stream.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid(); // Big table to test partial sequence
        dumpTable = uuid(); // dump table

        result = yield r.dbCreate(dbName).run()
        assert.equal(result.dbs_created, 1);
        //yield r.db(dbName).wait().run()
        result = yield [
          r.db(dbName).tableCreate(tableName)('tables_created').run(),
          r.db(dbName).tableCreate(dumpTable)('tables_created').run()]
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

It("test pipe transform - fast input", function* (done) {
    var stream = new Readable({objectMode: true});
    var size = 35;
    var value = uuid();
    for(var i=0; i<size; i++) {
        stream.push({field: value});
    }
    stream.push(null);
    var table = r.db(dbName).table(dumpTable).toStream({transform: true, debug: true, highWaterMark: 10});
    stream.pipe(table)
        .on('error', done)
        .on('end', function() {
            r.db(dbName).table(dumpTable).filter({field: stream._value}).count().run().then(function(result) {
                assert.deepEqual(result, size);
                assert.deepEqual(table._sequence, [10, 10, 10, 5])
                done();
            });
        }).pipe(devnull({objectMode: true}));
})

It("test pipe transform - slow input - 1", function* (done) {
    var stream = new Readable({objectMode: true});
    var size = 10;
    var values = [uuid(), uuid()];
    var table = r.db(dbName).table(dumpTable).toStream({transform: true, debug: true, highWaterMark: 5});

    var i = 0;
    stream._read = function() {
        var self = this;
        i++;
        if (i <= 3) {
            self.push({field: values[0]});
        }
        else if (i === 4) {
            setTimeout(function() {
                self.push({field: values[1]});
            }, 3000)
        }
        else if (i <= 10) {
            self.push({field: values[1]});
        }
        else {
            self.push(null);
        }
    }

    stream.pipe(table)
        .on('error', done)
        .on('end', function() {
            r.expr([
                r.db(dbName).table(dumpTable).filter({field: values[0]}).count(),
                r.db(dbName).table(dumpTable).filter({field: values[1]}).count()
            ]).run().then(function(result) {
                assert.deepEqual(result, [3, 7]);
                assert.deepEqual(table._sequence, [3, 5, 2])
                done();
            });
        }).pipe(devnull({objectMode: true}));
})
It("test pipe transform - slow input - 2", function* (done) {
    var stream = new Readable({objectMode: true});
    var size = 10;
    var values = [uuid(), uuid()];
    var table = r.db(dbName).table(dumpTable).toStream({transform: true, debug: true, highWaterMark: 5});

    var i = 0;
    stream._read = function() {
        var self = this;
        i++;
        if (i <= 5) {
            self.push({field: values[0]});
        }
        else if (i === 6) {
            setTimeout(function() {
                self.push({field: values[1]});
            }, 3000)
        }
        else if (i <= 10) {
            self.push({field: values[1]});
        }
        else {
            self.push(null);
        }
    }

    stream.pipe(table)
        .on('error', done)
        .on('end', function() {
            r.expr([
                r.db(dbName).table(dumpTable).filter({field: values[0]}).count(),
                r.db(dbName).table(dumpTable).filter({field: values[1]}).count()
            ]).run().then(function(result) {
                assert.deepEqual(result, [5, 5]);
                assert.deepEqual(table._sequence, [5, 5])
                done();
            });
        }).pipe(devnull({objectMode: true}));
})
It("test pipe transform - single insert", function* (done) {
    // Create a transform stream that will convert data to a string
    //var stream = new Input();
    var stream = new Readable({objectMode: true});
    var size = 10;
    var value = uuid();
    var table = r.db(dbName).table(dumpTable).toStream({transform: true, debug: true, highWaterMark: 5});

    var i = 0;
    stream._read = function() {
        i++;
        if (i > 10) {
            this.push(null);
        }
        else {
            var self = this;
            setTimeout(function() {
                self.push({field: value});
            }, 100); // suppose that each insert take less than 100 ms
        }
    }

    stream.pipe(table)
        .on('error', done)
        .on('end', function() {
            r.expr(r.db(dbName).table(dumpTable).filter({field: value}).count()).run().then(function(result) {
                assert.deepEqual(result, 10);
                assert.deepEqual(table._sequence, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
                done();
            });
        }).pipe(devnull({objectMode: true}));
})
