var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var Promise = require('bluebird');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result, pks;


It("Init for `selecting-data.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run();
        assert.equal(result.inserted, 100);
        pks = result.generated_keys;

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`db` should work", function* (done) {
    try {
        result = yield r.db(dbName).info().run();
        assert.deepEqual(result, {name: dbName, type: "DB"});

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`table` should work", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).info().run();
        assert.deepEqual(result,  {db:{name: dbName,type:"DB"},indexes:[],name: tableName, primary_key:"id",type:"TABLE"})

        result = yield r.db(dbName).table(tableName).run();
        assert.equal(result.length, 100)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`table` should work with useOutdated", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName, {useOutdated: true}).run();
        assert.equal(result.length, 100)

        result = yield r.db(dbName).table(tableName, {useOutdated: false}).run();
        assert.equal(result.length, 100)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`table` should throw with non valid otpions", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName, {nonValidKey: false}).run();
    }
    catch(e) {
        if (e.message === 'Unrecognized option `nonValidKey` in `table` after:\nr.db("'+dbName+'")\nAvailable option is useOutdated <bool>') {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`get` should work", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).get(pks[0]).run();
        assert.deepEqual(result, {id: pks[0]})

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`get` should throw if no argument is passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).get().run();
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === '`get` takes 1 argument, 0 provided after:\nr.db("'+dbName+'").table("'+tableName+'")') {
            done();
        }
        else{
            done(e);
        }
    }
})

It("`getAll` should work with multiple values - primary key", function* (done) {
    try {
        var table = r.db(dbName).table(tableName);
        var query = table.getAll.apply(table, pks);
        result = yield query.run();
        assert.equal(result.length, 100);

        table = r.db(dbName).table(tableName);
        query = table.getAll.apply(table, pks.slice(0, 50));
        result = yield query.run();
        assert.equal(result.length, 50);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getAll` should work with multiple values - secondary index 1", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).update({field: 0}).run();
        assert.equal(result.replaced, 100);
        result = yield r.db(dbName).table(tableName).sample(20).update({field: 10}).run();
        assert.equal(result.replaced, 20);

        result = yield r.db(dbName).table(tableName).indexCreate("field").run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait("field").pluck('index', 'ready').run();
        assert.deepEqual(result, [{"index":"field","ready":true}]);

        // Yield one second -- See https://github.com/rethinkdb/rethinkdb/issues/2170
        var p = new Promise(function(resolve, reject) {
            setTimeout(function() { resolve() }, 1000)
        });
        yield p;
        result = yield r.db(dbName).table(tableName).getAll(10, {index: "field"}).run();
        assert(result);
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getAll` should return native dates (and cursor should handle them)", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).insert({field: -1, date: r.now()}).run();
        result = yield r.db(dbName).table(tableName).getAll(-1, {index: "field"}).run();
        assert(result[0].date instanceof Date);
        // Clean for later
        result = yield r.db(dbName).table(tableName).getAll(-1, {index: "field"}).delete().run();
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`getAll` should work with multiple values - secondary index 2", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).indexCreate("fieldAddOne", function(doc) { return doc("field").add(1) }).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait("fieldAddOne").pluck('index', 'ready').run();
        assert.deepEqual(result, [{"index":"fieldAddOne","ready":true}]);

        // Yield one second -- See https://github.com/rethinkdb/rethinkdb/issues/2170
        var p = new Promise(function(resolve, reject) {
            setTimeout(function() { resolve() }, 1000)
        });
        yield p;

        result = yield r.db(dbName).table(tableName).getAll(11, {index: "fieldAddOne"}).run();
        assert(result);
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getAll` should throw if no argument is passed", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).getAll().run();
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "`getAll` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
    }
})

It("`between` should wrok -- secondary index", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).between(5, 20, {index: "fieldAddOne"}).run();
        assert(result);
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`between` should wrok -- all args", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).between(5, 20, {index: "fieldAddOne", leftBound: "open", rightBound: "closed"}).run();
        assert(result);
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`between` should throw if no argument is passed", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).between().run();
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "`between` takes at least 2 arguments, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
    }
})
It("`between` should throw if non valid arg", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).between(1, 2, {nonValidKey: true}).run();
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === 'Unrecognized option `nonValidKey` in `between` after:\nr.db("'+dbName+'").table("'+tableName+'")\nAvailable options are index <string>, leftBound <string>, rightBound <string>') {
            done();
        }
        else{
            done(e);
        }
    }
})

It("`filter` should work -- with an object", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter({field: 10}).run();
        assert(result);
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`filter` should work -- with an object -- looking for an undefined field", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter({nonExistingField: 10}).run();
        assert(result);
        assert.equal(result.length, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})


It("`filter` should work -- with an anonymous function", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter(function(doc) { return doc("field").eq(10) }).run();
        assert(result);
        assert.equal(result.length, 20);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`filter` should work -- default true", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter({nonExistingField: 10}, {default: true}).run();
        assert(result);
        assert.equal(result.length, 100);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`filter` should work -- default false", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter({nonExistingField: 10}, {default: false}).run();
        assert(result);
        assert.equal(result.length, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`filter` should work -- default false", function* (done) {
    try{
        var result = yield r.expr([{a:1}, {}]).filter(r.row("a"), {default: r.error()}).run();
    }
    catch(e) {
        if (e.message.match(/^No attribute `a` in object:/)) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`filter` should throw if no argument is passed", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter().run();
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        if (e.message === "`filter` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done();
        }
        else{
            done(e);
        }
    }
})
It("`filter` should throw with a non valid option", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).filter(true, {nonValidKey: false}).run();
    }
    catch(e) {
        if (e.message.match(/^Unrecognized option `nonValidKey` in `filter` after:/)) {
            done();
        }
        else{
            done(e);
        }
    }
})
