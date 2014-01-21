var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName, tableName;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("Init for `manipulating-tables.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);

        dbName = uuid(); // export to the global scope
        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created:1});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tableList` should return a cursor", function* (done) {
    try {
        var result = yield r.db(dbName).tableList().run(connection);
        var result = yield result.toArray();
        assert(Array.isArray(result));
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tableList` should show the table we created", function* (done) {
    try {
        tableName = uuid(); // export to the global scope

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableList().run(connection);
        result = yield result.toArray();
        assert(Array.isArray(result));

        var found = false;
        for(var i=0; i<result.length; i++) {
            if (result[i] === tableName) {
                found = true; 
                break;
            }
        };

        if (found === false) {
            done(new Error("Previously created table not found."))
        }
        else {
            done();
        }
    }
    catch(e) {
        done(e);
    }
})


It("'`tableCreate` should create a table'", function* (done) {
    try {
        tableName = uuid(); // export to the global scope

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("'`tableCreate` should create a table -- primaryKey'", function* (done) {
    try {
        tableName = uuid();

        var result = yield r.db(dbName).tableCreate(tableName, {primaryKey: "foo"}).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).info().run(connection);
        assert(result.primary_key, "foo");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("'`tableCreate` should create a table -- all args'", function* (done) {
    try {
        tableName = uuid();

        var result = yield r.db(dbName).tableCreate(tableName, {cacheSize: 1024*1024*1024, durability: "soft", primaryKey: "foo"}).run(connection);
        assert.deepEqual(result, {created:1}); // We can't really check other parameters...

        result = yield r.db(dbName).table(tableName).info().run(connection);
        assert(result.primary_key, "foo");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("'`tableCreate` should create a table -- non valid args'", function* (done) {
    try {
        tableName = uuid();

        var result = yield r.db(dbName).tableCreate(tableName, {nonValidArg: true}).run(connection);
        assert.deepEqual(result, {created:1}); // We can't really check other parameters...

        result = yield r.db(dbName).table(tableName).info().run(connection);
        assert(result.primary_key, "foo");

        done();
    }
    catch(e) {
        if (e.message === 'Unrecognized optional argument `nonValidArg`.') {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`tableCreate` should throw if no argument is given", function* (done) {
    try {
        var result = yield r.db(dbName).tableCreate().run(connection);
    }
    catch(e) {
        if (e.message === 'First argument of `tableCreate` cannot be undefined after:\nr.db("'+dbName+'")') {
            done()
        }
        else {
            done(e)
        }
    }
})
It("'`tableCreate` should throw is the name contains special char'", function* (done) {
    try {
        var result = yield r.db(dbName).tableCreate("-_-").run(connection);
    }
    catch(e) {
        if (e.message.match(/Database name `-_-` invalid \(Use A-Za-z0-9_ only\)/)) { done(); }
        else { done(e); }
    }
})



It("`tableDrop` should drop a table", function* (done) {
    try {
        tableName = uuid();

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableList().run(connection);
        result = yield result.toArray();

        result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped:1});

        result = yield r.db(dbName).tableList().run(connection);
        result = yield result.toArray();
        assert(Array.isArray(result));

        var found = false;
        for(var i=0; i<result.length; i++) {
            if (result[i] === tableName) {
                found = true; 
                break;
            }
        };

        if (found === true) done(new Error("Previously dropped table found."));
        else done();
    }
    catch(e) {
        done(e);
    }
})

It("`tableDrop` should throw if no argument is given", function* (done) {
    try {
        var result = yield r.db(dbName).tableDrop().run(connection);
    }
    catch(e) {
        if (e.message === 'First argument of `tableDrop` cannot be undefined after:\nr.db("'+dbName+'")') {
            done()
        }
        else {
            done(e)
        }
    }
})


It("index operations", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("newField").run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, ["newField"]);

        result = yield r.db(dbName).table(tableName).indexWait().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'newField', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexStatus().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'newField', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexDrop("newField").run(connection);
        assert.deepEqual(result, {dropped: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("field1", function(doc) { return doc("field1") }).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait('field1').run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'field1', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexStatus('field1').run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'field1', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexDrop("field1").run(connection);
        assert.deepEqual(result, {dropped: 1});

        done();
    }
    catch(e) {
        done(e)
    }
})


It("`indexCreate` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexCreate().run(connection);
    }
    catch(e) {
        if (e.message === "First argument of `indexCreate` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`indexDrop` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexDrop().run(connection);
    }
    catch(e) {
        if (e.message === "First argument of `indexDrop` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else {
            done(e);
        }
    }
})


