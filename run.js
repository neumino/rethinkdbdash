//var r = require('rethinkdbdash');
var r = require('./lib');
var Promise = require('bluebird');
var assert = require('assert');


function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

function guid() {
    return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
}


var run = Promise.coroutine(function* () {
    console.log("Testing datums");
    try{
        var connection = yield r.connect();
        assert(connection);
        console.log("Connected");
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Get field
    try{
        var result = yield r.expr({a: "aaa"}).getField("a").run(connection);
        assert.equal(result, "aaa");

        var result = yield r.expr({b: "bbb"})("b").run(connection);
        assert.equal(result, "bbb");
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    /*
    // Meta operations
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.dbList().run(connection);
        assert(result.length > 0);

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableList().run(connection);
        assert.deepEqual(result, [tableName]);

        var result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        var result = yield r.db(dbName).tableCreate(tableName, {cacheSize: 1024*1023}).run(connection);
        assert.deepEqual(result, {created: 1});
        var result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        var result = yield r.db(dbName).tableCreate(tableName, {primaryKey: "pk"}).run(connection);
        assert.deepEqual(result, {created: 1});
        var result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        var result = yield r.db(dbName).tableCreate(tableName, {durability: "soft"}).run(connection);
        assert.deepEqual(result, {created: 1});
        var result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        var result = yield r.dbDrop(dbName).run(connection);
        assert.deepEqual(result, {dropped: 1});

    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Index operations
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).indexCreate("field").run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).indexList().run(connection);
        assert.deepEqual(result, ["field"]);

        var result = yield r.db(dbName).table(tableName).indexWait().run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        var result = yield r.db(dbName).table(tableName).indexStatus().run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        var result = yield r.db(dbName).table(tableName).indexDrop("field").run(connection);
        assert.deepEqual(result, {dropped: 1});

        var result = yield r.db(dbName).table(tableName).indexCreate("field", function(doc) { return doc("field") }).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).indexWait('field').run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        var result = yield r.db(dbName).table(tableName).indexStatus('field').run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        var result = yield r.db(dbName).table(tableName).indexDrop("field").run(connection);
        assert.deepEqual(result, {dropped: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */


    /*
    // Datums
    try{
        var result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        var result = yield r.expr(null).run(connection);
        assert.equal(result, null);

        var result = yield r.expr("Hello").run(connection);
        assert.equal(result, "Hello");

        var result = yield r.expr([0, 1, 2]).run(connection);
        assert.deepEqual(result, [0, 1, 2]);


        var result = yield r.expr({a: 0, b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */


    /*
    // Basic chaining
    try{
        var result = yield r.expr(1).add(1).run(connection);
        assert.equal(result, 2);

        var result = yield r.expr(1).add(1).add(1).run(connection);
        assert.equal(result, 3);

        var result = yield r.expr(1).add(1, 1).run(connection);
        assert.equal(result, 3);

        var result = yield r.expr(1).sub(1).run(connection);
        assert.equal(result, 0);

        var result = yield r.expr(1).sub(1, 1).run(connection);
        assert.equal(result, -1);

        var result = yield r.expr(2).mul(3).run(connection);
        assert.equal(result, 6);

        var result = yield r.expr(2).mul(3, 4).run(connection);
        assert.equal(result, 24);

        var result = yield r.expr(24).div(2).run(connection);
        assert.equal(result, 12);

        var result = yield r.expr(24).div(2, 3).run(connection);
        assert.equal(result, 4);
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Hitting a table
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).info().run(connection);
        assert.deepEqual(result, {name: dbName, type: "DB"});
        
        var result = yield r.db(dbName).table(tableName).info().run(connection);
        assert.deepEqual(result,  {db:{name: dbName,type:"DB"},indexes:[],name: tableName, primary_key:"id",type:"TABLE"})

        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        assert.equal(result.errors, 0);

        var cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        assert.equal(cursor.hasNext(), false);

    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Writes
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        assert.equal(result.errors, 0);

        var result = yield r.db(dbName).table(tableName).insert({value: Math.floor(Math.random()*100)}).run(connection);
        assert(result);
        assert.equal(result.inserted, 1);

        var result = yield r.db(dbName).table(tableName).insert({}, {durability: "soft"}).run(connection);
        assert(result);
        assert.equal(result.inserted, 1);

        var result = yield r.db(dbName).table(tableName).insert({}, {returnVals: true}).run(connection);
        assert(result);
        assert(result.new_val);
        assert.equal(result.inserted, 1);

        var result = yield r.db(dbName).table(tableName).insert({id:1}, {upsert: true}).run(connection);
        assert(result);
        assert.equal(result.inserted, 1);

        var result = yield r.db(dbName).table(tableName).insert({id:1}, {upsert: true}).run(connection);
        assert(result);
        assert.equal(result.unchanged, 1);

        var result = yield r.db(dbName).table(tableName).insert({id:1, val: 2}, {upsert: true}).run(connection);
        assert(result);
        assert.equal(result.replaced, 1);

        try{
            var result = yield r.db(dbName).table(tableName).insert({}, {nonValidKey: "true"}).run(connection);
            console.log("Error, should have thrown");
        }
        catch(e) {
            assert(e);
        }

        var result = yield r.db(dbName).table(tableName).insert([{}, {}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 2);

        var result = yield r.db(dbName).table(tableName).update({updated: 1}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).update({updated: 2}, {durability: "soft"}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).update({updated: r.js("3")}, {nonAtomic: true}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).get(1).update({idCopy: 1}, {returnVals: true}).run(connection);
        assert(result);
        assert(result.replaced > 0);
        assert(result.new_val);
        assert(result.old_val);

        var result = yield r.db(dbName).table(tableName).update(function(doc) { return doc.merge({func: true})}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, replaced: 1}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, replaced: 2}, {durability: "soft"}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, replaced: r.js("3")}, {nonAtomic: true}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).replace(function(doc) { return doc.merge({funcReplace: true})}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        var result = yield r.db(dbName).table(tableName).sync().run(connection);
        assert.deepEqual(result, {synced: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Document manipulation
    try{
        var result = yield r.expr({a: 0}).merge({b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    // Cursor
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert(result);
        assert(result.inserted > 0);

        var cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        assert(cursor.hasNext, true);

        var result = yield cursor.next();
        assert(result);
        assert(result.id);

        var result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        assert.equal(result.errors, 0);

        var result = yield r.db(dbName).table(tableName).insert([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 80);

        var cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        var i=0;
        while(cursor.hasNext()) {
            var result = yield cursor.next();
            assert(result);
            i++;
        }
        assert.equal(80, i);

        var cursor = yield r.db(dbName).table(tableName).run(connection);
        var result = yield cursor.toArray();
        assert.equal(result.length, 80);

        var cursor = yield r.db(dbName).table(tableName).run(connection);
        cursor.close();
    }
    catch(e) {
        console.log('Error');
        console.log(e);
        throw e;
    }

    // Closing the connection
    try{
        //var confirmation = yield connection.close();
        var confirmation = yield connection.close({noReplyWait: true});
        console.log("Connection closed");
    }
    catch(e) {
        console.log(e);
        throw e;
    }
});

run();


// r.expr(1).add(1)
// term.add(1)
// term
