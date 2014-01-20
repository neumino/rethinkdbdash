//Quick test for all the terms

//var r = require('rethinkdbdash');
var r = require('../lib');
var Promise = require('bluebird');
var assert = require('assert');


function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};

function guid() {
    return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
}


var run = Promise.coroutine(function* () {
    var connection, result, dbName, tableName, cursor, i, confirmation, pks, table, query, now

    try{
        connection = yield r.connect();
        assert(connection);
        console.log("Connected");
    }
    catch(e) {
        throw e;
    }

    // Meta operations
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});
    }
    catch(e) {
        throw e;
    }

    try{
        result = yield r.dbCreate().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `dbCreate` cannot be undefined.");
    }

    try{
        result = yield r.dbDrop().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `dbDrop` cannot be undefined.");
    }

    try{
        result = yield r.db(dbName).tableCreate().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `tableCreate` cannot be undefined after:\nr.db(\""+dbName+"\")");
    }

    try{
        result = yield r.db(dbName).tableDrop().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `tableDrop` cannot be undefined after:\nr.db(\""+dbName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).indexCreate().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `indexCreate` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).indexDrop().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `indexDrop` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).insert().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `insert` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).update().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `update` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).replace().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `replace` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db().table(tableName).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `db` cannot be undefined.");
    }

    try{
        result = yield r.db(dbName).table().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `table` cannot be undefined after:\nr.db(\""+dbName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).get().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `get` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).getAll().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `getAll` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).between().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `between` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).between(1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `between` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).innerJoin().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `innerJoin` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).innerJoin(r.expr([1,2,3])).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `innerJoin` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).outerJoin().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `outerJoin` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).outerJoin(r.expr([1,2,3])).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `outerJoin` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).eqJoin().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `eqJoin` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).eqJoin("id").run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `eqJoin` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).map().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `map` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).withFields().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `withFields` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).concatMap().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `concatMap` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).orderBy().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `orderBy` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).skip().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `skip` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).limit().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `limit` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).slice().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `slice` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).nth().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `nth` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).indexesOf().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `indexesOf` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).union().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `union` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).sample().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `sample` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).reduce().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `reduce` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }
    try{
        result = yield r.db(dbName).table(tableName).groupedMapReduce().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `groupedMapReduce` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }
    
    try{
        result = yield r.db(dbName).table(tableName).groupedMapReduce(function() { return 1 }).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `groupedMapReduce` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).groupedMapReduce(function() { return 1 }, function() { return 1}).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Third argument of `groupedMapReduce` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).groupBy().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `groupBy` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).groupBy("foo").run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `groupBy` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).contains().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `contains` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).pluck().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `pluck` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).without().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `without` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).merge().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `merge` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).literal().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `literal` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).append().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `append` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).prepend().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `prepend` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).difference().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `difference` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).setInsert().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `setInsert` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).setUnion().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `setUnion` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).setIntersection().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `setIntersection` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).setDifference().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `setDifference` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName)().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `(...)` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).hasFields().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `hasFields` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).insertAt().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `insertAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).insertAt(1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `insertAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).spliceAt().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `spliceAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).spliceAt(1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `spliceAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).deleteAt().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `deleteAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).changeAt().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `changeAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).changeAt(1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `changeAt` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.db(dbName).table(tableName).match().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `match` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")");
    }

    try{
        result = yield r.expr(1).add().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `add` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).sub().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `sub` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).mul().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `mul` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).div().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `div` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).mod().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `mod` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).and().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `and` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).or().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `or` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).eq().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `eq` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).ne().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `ne` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).gt().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `gt` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).ge().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `ge` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).lt().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `lt` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.expr(1).le().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `le` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.time().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `time` cannot be undefined.");
    }

    try{
        result = yield r.time(2000).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `time` cannot be undefined.");
    }

    try{
        result = yield r.time(2000, 1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Third argument of `time` cannot be undefined.");
    }

    try{
        result = yield r.time(2000, 1, 1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Fourth argument of `time` cannot be undefined.");
    }

    try{
        result = yield r.epochTime().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `epochTime` cannot be undefined.");
    }

    try{
        result = yield r.ISO8601().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `ISO8601` cannot be undefined.");
    }

    try{
        result = yield r.now().inTimezone().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `inTimezone` cannot be undefined after:\nr.now()");
    }

    try{
        result = yield r.now().during().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `during` cannot be undefined after:\nr.now()");
    }

    try{
        result = yield r.now().during(1).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `during` cannot be undefined after:\nr.now()");
    }

    try{
        result = yield r.expr(1).do().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `do` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.branch().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `branch` cannot be undefined.");
    }

    try{
        result = yield r.branch(true).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Second argument of `branch` cannot be undefined.");
    }

    try{
        result = yield r.branch(true, false).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Third argument of `branch` cannot be undefined.");
    }

    try{
        result = yield r.branch(true, false).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Third argument of `branch` cannot be undefined.");
    }

    try{
        result = yield r.expr([]).forEach().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `forEach` cannot be undefined after:\nr.expr([])");
    }

    try{
        result = yield r.error().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `error` cannot be undefined.");
    }

    try{
        result = yield r.expr({})("").default().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `default` cannot be undefined after:\nr.expr({})(\"\")");
    }

    try{
        result = yield r.expr().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "Cannot convert `undefined` with r.expr().");
    }

    try{
        result = yield r.js().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `js` cannot be undefined.");
    }

    try{
        result = yield r.expr(1).coerceTo().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `coerceTo` cannot be undefined after:\nr.expr(1)");
    }

    try{
        result = yield r.json().run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "First argument of `json` cannot be undefined.");
    }

    try{
        result = yield r.db(dbName).table(tableName).map(function(x) {}).run(connection);
        throw new Error("An error should have been thrown before.");
    }
    catch(e) {
        assert(e instanceof r.Error.ReqlDriverError);
        assert(e instanceof Error);
        assert.equal(e.message, "An anonymous returned `undefined`. You may have forgotten a `return`.");
    }




    // Closing the connection
    try{
        confirmation = yield connection.close({noReplyWait: true});
        console.log("Connection closed");
    }
    catch(e) {
        console.log(e);
        throw e;
    }
});

run();
