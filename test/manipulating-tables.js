var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName;


It("Init for `manipulating-tables.js`", function* (done) {
    try {
        dbName = uuid(); // export to the global scope
        result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tableList` should return a cursor", function* (done) {
    try {
        var result = yield r.db(dbName).tableList().run();
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

        var result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableList().run();
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

        var result = yield r.db(dbName).tableCreate(tableName).run();
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

        var result = yield r.db(dbName).tableCreate(tableName, {primaryKey: "foo"}).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).info().run();
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

        var result = yield r.db(dbName).tableCreate(tableName, {durability: "soft", primaryKey: "foo"}).run();
        assert.deepEqual(result, {created:1}); // We can't really check other parameters...

        result = yield r.db(dbName).table(tableName).info().run();
        assert(result.primary_key, "foo");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("'`tableCreate` should throw -- non valid args'", function* (done) {
    try {
        tableName = uuid();

        var result = yield r.db(dbName).tableCreate(tableName, {nonValidArg: true}).run();
    }
    catch(e) {
        if (e.message === 'Unrecognized option `nonValidArg` in `tableCreate`. Available options are primaryKey <string>, durability <string>, datancenter <string>.') {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`tableCreate` should throw if no argument is given", function* (done) {
    try {
        var result = yield r.db(dbName).tableCreate().run();
    }
    catch(e) {
        if (e.message === '`tableCreate` takes at least 1 argument, 0 provided after:\nr.db("'+dbName+'")') {
            done()
        }
        else {
            done(e)
        }
    }
})
It("'`tableCreate` should throw is the name contains special char'", function* (done) {
    try {
        var result = yield r.db(dbName).tableCreate("-_-").run();
    }
    catch(e) {
        if (e.message.match(/Table name `-_-` invalid \(Use A-Za-z0-9_ only\)/)) { done(); }
        else { done(e); }
    }
})



It("`tableDrop` should drop a table", function* (done) {
    try {
        tableName = uuid();

        var result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableList().run();
        result = yield result.toArray();

        result = yield r.db(dbName).tableDrop(tableName).run();
        assert.deepEqual(result, {dropped:1});

        result = yield r.db(dbName).tableList().run();
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
        var result = yield r.db(dbName).tableDrop().run();
    }
    catch(e) {
        if (e.message === '`tableDrop` takes 1 argument, 0 provided after:\nr.db("'+dbName+'")') {
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

        var result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("newField").run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexList().run();
        result = yield result.toArray();
        assert.deepEqual(result, ["newField"]);

        result = yield r.db(dbName).table(tableName).indexWait().run();
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'newField', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexStatus().run();
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'newField', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexDrop("newField").run();
        assert.deepEqual(result, {dropped: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("field1", function(doc) { return doc("field1") }).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait('field1').run();
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'field1', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexStatus('field1').run();
        result = yield result.toArray();
        assert.deepEqual(result, [ { index: 'field1', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexDrop("field1").run();
        assert.deepEqual(result, {dropped: 1});

        done();
    }
    catch(e) {
        done(e)
    }
})


It("`indexCreate` should work with options", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexCreate("foo", {multi: true}).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("foo1", r.row("foo"), {multi: true}).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("foo2", function(doc) { return doc("foo")}, {multi: true}).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert({foo: ["bar1", "bar2"]}).run()
        assert.equal(result.inserted, 1); 
        result = yield r.db(dbName).table(tableName).insert({foo: ["bar1", "bar3"]}).run()
        assert.equal(result.inserted, 1); 

        result = yield r.db(dbName).table(tableName).getAll("bar1", {index: "foo"}).count().run()
        assert.equal(result, 2)
        result = yield r.db(dbName).table(tableName).getAll("bar1", {index: "foo1"}).count().run()
        assert.equal(result, 2)
        result = yield r.db(dbName).table(tableName).getAll("bar1", {index: "foo2"}).count().run()
        assert.equal(result, 2)

        result = yield r.db(dbName).table(tableName).getAll("bar2", {index: "foo"}).count().run()
        assert.equal(result, 1)
        result = yield r.db(dbName).table(tableName).getAll("bar2", {index: "foo1"}).count().run()
        assert.equal(result, 1)
        result = yield r.db(dbName).table(tableName).getAll("bar2", {index: "foo2"}).count().run()
        assert.equal(result, 1)

        result = yield r.db(dbName).table(tableName).getAll("bar3", {index: "foo"}).count().run()
        assert.equal(result, 1)
        result = yield r.db(dbName).table(tableName).getAll("bar3", {index: "foo1"}).count().run()
        assert.equal(result, 1)
        result = yield r.db(dbName).table(tableName).getAll("bar3", {index: "foo2"}).count().run()
        assert.equal(result, 1)

        done()

    }
    catch(e) {
        done(e)
    }

})

It("`indexCreate` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexCreate().run();
    }
    catch(e) {
        if (e.message === '`indexCreate` takes at least 1 argument, 0 provided after:\nr.db("'+dbName+'").table("'+tableName+'")') {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`indexDrop` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexDrop().run();
    }
    catch(e) {
        if (e.message === '`indexDrop` takes 1 argument, 0 provided after:\nr.db("'+dbName+'").table("'+tableName+'")') {
            done();
        }
        else {
            done(e);
        }
    }
})
