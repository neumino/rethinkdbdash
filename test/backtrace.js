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

    console.log("Testing datums");
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

    // First test
    try{
        result = yield r.expr(1).add(r.expr([2, 3, 4, r.expr([5, 6, r.expr("a").add(7)])])).run(connection);
        console.log("Should have thrown an error");
    }
    catch(e) {
        //console.log(JSON.stringify(e.query, null, 2));
        //console.log(JSON.stringify(e.frames, null, 2));
        console.log(e.message);
    } 

    try{
        result = yield r.dbCreate(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.dbDrop(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 


    try{
        result = yield r.dbList().do(function(x) { return x.add("a") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 


    try{
        result = yield r.expr(2).do(function(x) { return x.add("a") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).tableCreate(tableName).run(connection);
    }
    catch(e) {
        console.log(e.message);
    }

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).tableDrop("nonExistingTable").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }

    try{
        result = yield r.db(dbName).tableList().do(function(x) { return x.add("a") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).table(tableName).indexCreate("foo").run(connection);
        result = yield r.db(dbName).table(tableName).indexCreate("foo").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).table(tableName).indexDrop("nonExistingIndex").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }

    try{
        result = yield r.db(dbName).table(tableName).indexList().do(function(x) { return x.add("a") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).indexWait().do(function(x) { return x.add("a") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).table(tableName).indexWait("foo", "bar").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).indexStatus().and( r.expr(1).add("a")).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).table(tableName).indexStatus("foo", "bar").do(function(x) { return x.add("a") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").insert({foo: "bar", yolo: "swag"}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").update({foo: "bar"}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").update(function(doc) { return doc("foo") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").replace({foo: "bar"}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").replace(function(doc) { return doc("foo") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").delete().run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table("nonExistingTable").sync().run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db("nonExistingDb").table("nonExistingTable").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report broken on the server
    try{
        result = yield r.db(dbName).table("nonExistingTable").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).get(1).do(function(x) { return x.add(3) }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).getAll(1, 2, 3).do(function(x) { return x.add(3) }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).getAll(1, 2, 3, { index: "foo"}).do(function(x) { return x.add(3) }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).between(2, 3, { index: "foo"}).do(function(x) { return x.add(3) }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).filter({foo: "bar"}).do(function(x) { return x.add(3) }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).innerJoin( function(left, right) { return left.eq(right("bar").add(1)) }, r.db(dbName).table(tableName)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).innerJoin(r.expr([1,2,3]), function(left, right) { return r.expr(1).add("str").add(left.eq(right("bar").add(1))) }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 


    try{
        result = yield r.expr([1,2,3]).outerJoin( function(left, right) { return left.eq(right("bar").add(1)) }, r.db(dbName).table(tableName)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).eqJoin('id', r.db(dbName).table(tableName)).add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).eqJoin('id', r.db(dbName).table(tableName)).zip().add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report broken on the server
    try{
        result = yield r.expr([1,2,3]).map(function(v) { return v}).add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report message error broken -- mention has_fields instead of with_fields
    try{
        result = yield r.expr([1,2,3]).withFields("foo", "bar").add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).concatMap(function(v) { return v}).add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report orderBy breaks if a field is missing
    try{
        result = yield r.expr([1,2,3]).orderBy("foo").add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).skip("foo").add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).limit("foo").add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).slice("foo", "bar").add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).nth("bar").add(1).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 


    try{
        result = yield r.expr([1,2,3]).indexesOf("bar").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).isEmpty().add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).union([5,6]).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).sample("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).reduce(function(left, right) { return left.add(right) }).add(2).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).count(function() { return true}).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).distinct().add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).groupedMapReduce(
            function(foo) { return foo("group") },
            function(bar) { return bar("val") },
            function(left, right) { return left.add(right) }
        ).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report python backtrace broken -- group_by(["foo", "bar"], ...) instead of group_by("foo", "bar", ...)
    try{
        result = yield r.expr([1,2,3]).groupBy("foo", r.count).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).groupBy("foo", "bar", r.count).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).groupBy("foo", "bar", r.sum("Word")).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).groupBy("foo", "bar", r.avg("Word")).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report could improve error message
    try{
        result = yield r.expr([1,2,3]).contains("foo", "bar").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).update(r.row("foo")).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).pluck("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).without("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).merge("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).append("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).prepend("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).difference("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).setInsert("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).setUnion("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).setIntersection("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3])("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).hasFields("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Backtrace could be improved -- report argument instead of the whole insertAt
    try{
        result = yield r.expr([1,2,3]).insertAt("foo", 2).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Backtrace could be improved -- report argument instead of the whole insertAt
    try{
        result = yield r.expr([1,2,3]).spliceAt("foo", 2).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Backtrace could be improved -- report argument instead of the whole insertAt
    try{
        result = yield r.expr([1,2,3]).deleteAt("foo", 2).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Backtrace could be improved -- report argument instead of the whole insertAt
    try{
        result = yield r.expr([1,2,3]).changeAt("foo", 2).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).keys("foo", 2).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).match("foo").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).sub("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).mul("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).div("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).mod("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).and(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr("hello").add(2).or("foo").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).eq(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).ne(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).gt(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).ge(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).lt(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).le(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr([1,2,3]).not().add(r.expr("Hello").add(2)).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.time(1023, 11, 3, 'Z').add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.epochTime(12132131).add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.ISO8601("UnvalidISO961String").add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    //TODO Report server - Could be more precise -- underline arg and not everything
    try{
        result = yield r.now().inTimezone('noTimezone').add("Hello").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().timezone().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().during(r.now(), r.now()).add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().timeOfDay().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().year().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 
    
    try{
        result = yield r.now().month().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().day().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().dayOfWeek().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().dayOfYear().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().hours().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().seconds().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().toISO8601().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.now().toEpochTime().add(true).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr(1).do(function(boo) { return boo("bah").add(3); }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.branch(
            r.expr(1).add("hello"),
            "Hello",
            "World").run(connection)
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr(1).forEach(function(foo) { return foo("bar") }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.error("foo").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr({a:1})("b").default("bar").add(2).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr({a:1}).add(2).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr({a:1}).add(r.js("2")).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr(2).coerceTo("ARRAY").run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr(2).add("foo").typeOf().run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr(2).add("foo").info().run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr(2).add(r.json("foo")).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.db(dbName).table(tableName).replace({a:1}, {nonValid:true}).run(connection);
    }
    catch(e) {
        console.log(e.message);
        //console.log(e.query);
        //console.log(e.frames);
    } 


    try{
        result = yield r.db(dbName).table(tableName).replace({a:1}, {durability: "softt"}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 


    try{
        result = yield r.expr([1,2]).map(r.row.add('eh')).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.table("foo").add(1).add(1).add("hello-super-long-string").add("another-long-string").add("one-last-string").map( function(doc) {
            return r.expr([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]).map(function(test) {
                return test("b").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").mul(test("b")).merge({
                    firstName: "xxxxxx",
                    lastName: "yyyy",
                    email: "xxxxx@yyyy.com",
                    phone: "xxx-xxx-xxxx"
                });
            }).add(2).map(function(doc) {
                return doc.add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string")
            });
        }).run(connection);
    }
    catch(e) {
        console.log(e.message);
    } 

    try{
        result = yield r.expr({a:1, b:r.expr(1).add("eh")}).run(connection);
    }
    catch(e) {
        console.log(e.message);
        //console.log(e.frames);
        //console.log(e);
        //console.log(e.query);
    }
    try{
        result = yield r.db(dbName).table(tableName).replace({a:1}, {durability:"soft"}).add(2).run(connection);
    }
    catch(e) {
        console.log(e.message);
        //console.log(e.frames);
        //console.log(e);
        //console.log(e.query);
    }

    try{
        result = yield r.db(dbName).table(tableName).replace({a:1}, {durability:r.expr(1).add("heloo")}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    }
    try{
        result = yield r.db("test").tableCreate("test").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }

    try{
        result = yield r.table("test").insert({}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    }

    try{
        result = yield r.table("test").replace({a:1}, {durability:r.expr(1).add("heloo")}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    }



    try{
        result = yield r.expr(1).add("eh").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }
    try{
        result = yield r.expr({a:r.expr(1).add("eh"), b: 2}).run(connection);
    }
    catch(e) {
        console.log(e.message);
    }
    try{
        result = yield r.expr([1,2,3]).add("eh").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }
    try{
        result = yield r.expr({a:1}).add("eh").run(connection);
    }
    catch(e) {
        console.log(e.message);
    }
    try{
        result = yield r.table("test").map( function(doc) { return r.expr(1).add("eh")}).run(connection);
    }
    catch(e) {
        console.log(e.message);
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


// r.expr(1).add(1)
// term.add(1)
// term
