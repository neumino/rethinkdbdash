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
    var connection, result, dbName, tableName, cursor, i, confirmation, pks, table, query, now, ar

    console.log("Connecting");
    try{
        connection = yield r.connect();
        assert(connection);
        console.log("Connected");
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    // First test
    try{
        result = yield r.expr([1,2,3]).sample(-1).run(connection);
    }
    catch(e) {
        assert(e.message.match("Number of items to sample must be non-negative, got `-1`"))
    }

    try{
        result = yield r.expr([{a:1}, {}]).filter(r.row("a"), {default: true}).run(connection);
        result = yield result.toArray();

        assert.deepEqual(result, [{a:1}, {}]);
    }
    catch(e) {
        console.log(e);
    }
    try{
        result = yield r.expr([{a:1}, {}]).filter(r.row("a"), {default: r.error()}).run(connection);
    }
    catch(e) {
        assert(e.message.match(/^No attribute `a` in object:/))
    }

    try{
        result = yield r.json("{}").run(connection);
        assert.deepEqual(result, {})
    }
    catch(e) {
        console.log(e);
    }

    try{
        result = yield r(1).run(connection);
        assert.deepEqual(result, 1)
    }
    catch(e) {
        console.log(e);
    }

    try{
        result = yield r.now().run(connection);
        assert(result instanceof Date);
    }
    catch(e) {
        console.log(e);
    }

    try{
        result = yield r.now().run(connection, {timeFormat: 'native'});
        assert(result instanceof Date);
    }
    catch(e){
        console.log(e);
    }

    try{
        result = yield r.now().run(connection, {timeFormat: 'raw'});
        assert.equal(result.$reql_type$, "TIME")
    }
    catch(e){
        console.log(e);
    }

    try{
        result = yield r.expr(true).run(connection, {useOutdated: 'raw'});
        assert(result)
    }
    catch(e){
        console.log(e);
    }
    try{
        result = yield r.expr(true).run(connection, {profile: false});
        assert(result)
    }
    catch(e){
        console.log(e);
    }
    try{
        result = yield r.expr(true).run(connection, {profile: true});
        assert(result.profile)
        assert.equal(result.value, true)
    }
    catch(e){
        console.log(e);
    }
    try{
        result = yield r.expr(true).run(connection, {profile: false});
        assert.equal(result, true)
    }
    catch(e){
        console.log(e);
    }

    try{
        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {rightBound:'closed'}).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9, 10]);
    }
    catch(e) {
        console.log(e);
    }

    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert([{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")}]).run(connection);
        assert.deepEqual(result.inserted, 98);

        result = yield r.db(dbName).table(tableName).orderBy("id", "a").run(connection);
        result = yield result.toArray();
        assert(Array.isArray(result));
        assert(result[0].id<result[1].id);
    }
    catch(e) {
        console.log(e);
    }
    try{
        tableName = guid();
        result = yield r.tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});
    }
    catch(e) {
        console.log(e);
    }

    try{
        result = yield r.tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});
    }
    catch(e) {
        console.log(e);
    }

    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        connection.close();

        connection = yield r.connect({db: dbName});
        assert(connection);

        result = yield r.tableList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [tableName])
    }
    catch(e) {
        console.log(e);
    }

    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        connection.use(dbName);

        result = yield r.tableList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [tableName])
    }
    catch(e) {
        console.log(e);
    }

    try{
        result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        connection.close();

        assert(connection);
        connection = yield connection.reconnect();
        assert(connection);


        result = yield r.tableList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [tableName])
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    try{
        result = yield r.expr([1,2,3]).run(connection);
        ar = yield result.toArray();
        assert.deepEqual(ar, [1,2,3]);

        result = yield r.expr([1,2,3]).run(connection);
        ar = [];
        while(result.hasNext()) {
            value = yield result.next();
            ar.push(value);
        }
        assert.deepEqual(ar, [1,2,3]);

    }
    catch(e) {
        console.log(e);
    }


    console.log("Closing connection");
    // Closing the connection
    try{
        confirmation = yield connection.close({noReplyWait: true});
        console.log("Connection closed");
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    console.log("Tests done.");
});

run();


// r.expr(1).add(1)
// term.add(1)
// term
