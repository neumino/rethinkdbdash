var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')({pool: false});
var r_ = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var connection; // global connection
var dbName, tableName, result;

It("Testing valid syntax for `run` - 1", function* (done) {
    try {
        connection = yield r.connect(config);
        assert(connection);

        result = r.expr(1).run(connection, function(err, result) {
            assert.equal(err, null);
            assert.equal(result, 1);
            done();
        });
    }
    catch(e) {
        done(e);
    }
})
It("Testing valid syntax for `run` - 2", function* (done) {
    try {
        connection = yield r.connect(config);
        assert(connection);

        result = yield r.now().run(connection, {timeFormat: "raw"})
        assert.equal(result.$reql_type$, "TIME");
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Testing valid syntax for `run` - 3", function* (done) {
    try {
        connection = yield r.connect(config);
        assert(connection);

        result = r.now().run(connection, {timeFormat: "raw"}, function(err, result) {
            assert.equal(err, null);
            assert.equal(result.$reql_type$, "TIME");
            done();
        });
    }
    catch(e) {
        done(e);
    }
})
It("Testing valid syntax for `run` - 4", function* (done) {
    try {
        result = yield r_.now().run({timeFormat: "raw"})
        assert.equal(result.$reql_type$, "TIME");
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Testing valid syntax for `run` - 5", function* (done) {
    try {
        result = yield r_.now().run(function(err, result) {
            assert.equal(err, null);
            assert(result instanceof Date);
            done();
        })
    }
    catch(e) {
        done(e);
    }
})
It("Testing valid syntax for `run` - 6", function* (done) {
    try {
        result = yield r_.now().run({timeFormat: "raw"}, function(err, result) {
            assert.equal(err, null);
            assert.equal(result.$reql_type$, "TIME");
            done();
        })
    }
    catch(e) {
        done(e);
    }
})


It("Testing r.connect with a callback - 1", function* (done) {
    r.connect(config, function(err, conn) {
        assert.equal(err, null);
        conn.close();
        done()
    })
})
It("Testing r.connect with a callback - 2", function* (done) {
    r.connect(function(err, conn) {
        // This may or may not succeed, depending on the config file
        done()
    })
})
It("Testing conn.reconnect with a callback", function* (done) {
    r.connect(config, function(err, conn) {
        assert.equal(err, null);
        conn.reconnect(function(err, conn) {
            // This may or may not succeed, depending on the config file
            done()
        });
    })
})
It("Testing conn.close with a callback - 1", function* (done) {
    r.connect(config, function(err, conn) {
        assert.equal(err, null);
        conn.close(function(err, conn) {
            // This may or may not succeed, depending on the config file
            done()
        });
    })
})
It("Testing conn.close with a callback - 2", function* (done) {
    r.connect(config, function(err, conn) {
        assert.equal(err, null);
        conn.close({noreplyWait: true}, function(err, conn) {
            // This may or may not succeed, depending on the config file
            done()
        });
    })
})
It("Testing conn.noreplyWait with a callback", function* (done) {
    r.connect(config, function(err, conn) {
        assert.equal(err, null);
        conn.noreplyWait(function(err, conn) {
            // This may or may not succeed, depending on the config file
            done()
        });
    })
})
It("Testing cursor.toArray with a callback", function* (done) {
    r_.expr([1,2,3]).run({cursor: true}, function(err, cursor) {
        assert.equal(err, null);
        cursor.toArray(function(err, result) {
            assert.equal(err, null);
            assert.deepEqual(result, [1,2,3]);
            done();
        });
    })
})
It("Testing cursor.next with a callback", function* (done) {
    r_.expr([1,2,3]).run({cursor: true}, function(err, cursor) {
        assert.equal(err, null);
        cursor.next(function(err, result) {
            assert.equal(err, null);
            assert.deepEqual(result, 1);
            cursor.close();
            done();
        });
    })
})
It("Testing cursor.close with a callback", function* (done) {
    r_.expr([1,2,3]).run({cursor: true}, function(err, cursor) {
        assert.equal(err, null);
        cursor.close(function(err, result) {
            done();
        });
    })
})
