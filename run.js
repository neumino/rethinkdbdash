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
    // Selecting data
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).insert([{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 100);
        var pks = result.generated_keys;

        var result = yield r.db(dbName).table(tableName).get(pks[0]).run(connection);
        assert(result);

        var table = r.db(dbName).table(tableName);
        var query = table.getAll.apply(table, pks);
        var result = yield query.run(connection);
        assert.equal(result.length, 100);

        var table = r.db(dbName).table(tableName);
        var query = table.getAll.apply(table, pks.slice(0, 50));
        var result = yield query.run(connection);
        assert.equal(result.length, 50);

        var result = yield r.db(dbName).table(tableName).update({field: 0}).run(connection);
        assert.equal(result.replaced, 100);
        var result = yield r.db(dbName).table(tableName).sample(20).update({field: 10}).run(connection);
        assert.equal(result.replaced, 20);


        var result = yield r.db(dbName).table(tableName).indexCreate("field").run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).indexWait("field").run(connection);
        assert.deepEqual(result, [{"index":"field","ready":true}]);

        var cursor = yield r.db(dbName).table(tableName).getAll(10, {index: "field"}).run(connection);
        assert(cursor);
        var result = yield cursor.toArray();
        assert.equal(result.length, 20);


        var result = yield r.db(dbName).table(tableName).indexCreate("fieldAddOne", function(doc) { return doc("field").add(1) }).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).indexWait("fieldAddOne").run(connection);
        assert.deepEqual(result, [{"index":"fieldAddOne","ready":true}]);

        var cursor = yield r.db(dbName).table(tableName).getAll(11, {index: "fieldAddOne"}).run(connection);
        assert(cursor);
        var result = yield cursor.toArray();
        assert.equal(result.length, 20);

        var cursor = yield r.db(dbName).table(tableName).between(5, 20, {index: "fieldAddOne"}).run(connection);
        assert(cursor);
        var result = yield cursor.toArray();
        assert.equal(result.length, 20);

        var cursor = yield r.db(dbName).table(tableName).filter({field: 10}).run(connection);
        assert(cursor);
        var result = yield cursor.toArray();
        assert.equal(result.length, 20);

        var cursor = yield r.db(dbName).table(tableName).filter(function(doc) { return doc("field").eq(10) }).run(connection);
        assert(cursor);
        var result = yield cursor.toArray();
        assert.equal(result.length, 20);
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Joins
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});
    
        var result = yield r.db(dbName).table(tableName).insert([{val:1}, {val: 2}, {val: 3}]).run(connection);
        var pks = result.generated_keys;
        assert.equal(result.inserted, 3)

        var result = yield r.expr([1,2,3]).innerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        var result = yield r.expr([1,2,3]).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        var result = yield r.expr(pks).eqJoin(function(doc) { return doc; }, r.db(dbName).table(tableName)).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        var result = yield r.expr(pks).eqJoin(r.row, r.db(dbName).table(tableName)).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Transformations
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).insert([{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 100);
        var pks = result.generated_keys;

        var result = yield r.expr([1,2,3]).map(r.row).run(connection);
        assert.deepEqual(result, [1,2,3]);

        var result = yield r.expr([1,2,3]).map(r.row.add(1)).run(connection);
        assert.deepEqual(result, [2, 3, 4]);

        var result = yield r.expr([1,2,3]).map(function(doc) { return doc.add(2)}).run(connection);
        assert.deepEqual(result, [3, 4, 5]);

        var result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a").run(connection);
        assert.deepEqual(result, [{a: 0}, {a: 4}, {a: 9}]);

        var result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a", "c").run(connection);
        assert.deepEqual(result, [{a: 0, c: 2}, {a: 4, c: 5}, {a:9, c:0}]);

        var result = yield r.expr([[1], [2], [3]]).concatMap(function(doc) { return doc}).run(connection);
        assert.deepEqual(result, [1, 2, 3]);

        var result = yield r.expr([[1], [2], [3]]).concatMap(r.row).run(connection);
        assert.deepEqual(result, [1, 2, 3]);

        var result = yield r.expr([{a:23}, {a:10}, {a:0}, {a:100}]).orderBy(r.row("a")).run(connection);
        assert.deepEqual(result, [{a:0}, {a:10}, {a:23}, {a:100}]);

        var result = yield r.db(dbName).table(tableName).orderBy({index: "id"}).run(connection);
        for(var i=0; i<result.length-1; i++) {
            assert(result[i].id < result[i+1].id);
        }

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).skip(3).run(connection);
        assert.deepEqual(result, [3, 4, 5, 6, 7, 8, 9]);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).limit(3).run(connection);
        assert.deepEqual(result, [0, 1, 2]);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(3, 5).run(connection);
        assert.deepEqual(result, [3, 4]);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).nth(3).run(connection);
        assert.deepEqual(result, 3);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(3).run(connection);
        assert.equal(result, 3);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(r.row.eq(3)).run(connection);
        assert.equal(result, 3);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(function(doc) { return doc.eq(3)}).run(connection);
        assert.equal(result, 3);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).isEmpty().run(connection);
        assert.equal(result, false);

        var result = yield r.expr([]).isEmpty().run(connection);
        assert.equal(result, true);

        var result = yield r.expr([0, 1, 2]).union([3, 4, 5]).run(connection);
        assert.deepEqual(result, [0, 1, 2, 3, 4, 5]);

        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).sample(2).run(connection);
        assert.equal(result.length, 2);
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Aggregations
    try{
        var result = yield r.expr([0, 1, 2, 3, 4, 5]).reduce( function(left, right) { return left.add(right) }).run(connection);
        assert.equal(result, 15);

        var result = yield r.expr([0, 1, 2, 3, 4, 5]).reduce( function(left, right) { return left.add(right) }, 11).run(connection);
        assert(result > 25);

        var result = yield r.expr([0, 1, 2, 3, 4, 5]).count().run(connection);
        assert.equal(result, 6);

        var result = yield r.expr([0, 1, 2, 3, 4, 5]).count(function(doc) { return doc.eq(2) }).run(connection);
        assert.equal(result, 1);

        var result = yield r.expr([0, 1, 2, 2, 1, 2, 1, 0, 2, 1]).distinct().count().run(connection);
        assert.equal(result, 3);

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }).orderBy("group").run(connection);
        assert.deepEqual(result, [{group: 0, reduction: 5}, {group: 1, reduction: 30}, {group: 2, reduction: 3}])

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }, 10).orderBy("group").run(connection);
        assert(result[0].reduction > 5);
        assert(result[1].reduction > 30);
        assert(result[2].reduction > 3);

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.count).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2 }, {group: {g: 1 }, reduction: 2}, {group: {g: 2 }, reduction: 1}]);

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.sum("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:5 }, {group: {g: 1 }, reduction: 30}, {group: {g: 2 }, reduction: 3}]);

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.avg("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2.5 }, {group: {g: 1 }, reduction: 15}, {group: {g: 2 }, reduction: 3}]);

        var result = yield r.expr([1,2,3]).contains(2).run(connection);
        assert.equal(result, true);

        var result = yield r.expr([1,2,3]).contains(1, 2).run(connection);
        assert.equal(result, true);

        var result = yield r.expr([1,2,3]).contains(1, 5).run(connection);
        assert.equal(result, false);

        var result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(2)).run(connection);
        assert.equal(result, true);

        var result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(5)).run(connection);
        assert.equal(result, false);
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Aggregators
    try{
        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.count).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2 }, {group: {g: 1 }, reduction: 2}, {group: {g: 2 }, reduction: 1}]);

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.sum("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:5 }, {group: {g: 1 }, reduction: 30}, {group: {g: 2 }, reduction: 3}]);

        var result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.avg("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2.5 }, {group: {g: 1 }, reduction: 15}, {group: {g: 2 }, reduction: 3}]);
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
    // Document manipulation
    try{
        var dbName = guid();
        var tableName = guid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        var result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert.equal(result.inserted, 1);

        var result = yield r.db(dbName).table(tableName).update({idCopyUpdate: r.row("id")}).run(connection);
        assert.equal(result.replaced, 1);

        var result = yield r.db(dbName).table(tableName).replace(r.row).run(connection);
        assert.equal(result.replaced, 0);

        var result = yield r.db(dbName).table(tableName).replace(r.row.merge({idCopyReplace: r.row("id")})).run(connection);
        assert.equal(result.replaced, 1);

 
        var result = yield r.expr({a: 0}).merge({b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }
    */

    /*
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
    */

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
