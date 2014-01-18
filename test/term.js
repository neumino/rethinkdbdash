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
        console.log(e);
        throw e;
    }

    // Get field
    try{
        result = yield r.expr({a: "aaa"}).getField("a").run(connection);
        assert.equal(result, "aaa");

        result = yield r.expr({b: "bbb"})("b").run(connection);
        assert.equal(result, "bbb");
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Meta operations
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.dbList().run(connection);
        assert(result.length > 0);

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableList().run(connection);
        assert.deepEqual(result, [tableName]);

        result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        result = yield r.db(dbName).tableCreate(tableName, {cacheSize: 1024*1023}).run(connection);
        assert.deepEqual(result, {created: 1});
        result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        result = yield r.db(dbName).tableCreate(tableName, {primaryKey: "pk"}).run(connection);
        assert.deepEqual(result, {created: 1});
        result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        result = yield r.db(dbName).tableCreate(tableName, {durability: "soft"}).run(connection);
        assert.deepEqual(result, {created: 1});
        result = yield r.db(dbName).tableDrop(tableName).run(connection);
        assert.deepEqual(result, {dropped: 1});

        result = yield r.dbDrop(dbName).run(connection);
        assert.deepEqual(result, {dropped: 1});

    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Index operations
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("field").run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexList().run(connection);
        assert.deepEqual(result, ["field"]);

        result = yield r.db(dbName).table(tableName).indexWait().run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexStatus().run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexDrop("field").run(connection);
        assert.deepEqual(result, {dropped: 1});

        result = yield r.db(dbName).table(tableName).indexCreate("field", function(doc) { return doc("field") }).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait('field').run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexStatus('field').run(connection);
        assert.deepEqual(result, [ { index: 'field', ready: true } ]);

        result = yield r.db(dbName).table(tableName).indexDrop("field").run(connection);
        assert.deepEqual(result, {dropped: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    // Datums
    try{
        result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        result = yield r.expr(null).run(connection);
        assert.equal(result, null);

        result = yield r.expr("Hello").run(connection);
        assert.equal(result, "Hello");

        result = yield r.expr([0, 1, 2]).run(connection);
        assert.deepEqual(result, [0, 1, 2]);


        result = yield r.expr({a: 0, b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    // Hitting a table
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).info().run(connection);
        assert.deepEqual(result, {name: dbName, type: "DB"});
        
        result = yield r.db(dbName).table(tableName).info().run(connection);
        assert.deepEqual(result,  {db:{name: dbName,type:"DB"},indexes:[],name: tableName, primary_key:"id",type:"TABLE"})

        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        assert.equal(result.errors, 0);

        cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        assert.equal(cursor.hasNext(), false);

    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Writes
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        assert.equal(result.errors, 0);

        result = yield r.db(dbName).table(tableName).insert({value: Math.floor(Math.random()*100)}).run(connection);
        assert(result);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert({}, {durability: "soft"}).run(connection);
        assert(result);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert({}, {returnVals: true}).run(connection);
        assert(result);
        assert(result.new_val);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert({id:1}, {upsert: true}).run(connection);
        assert(result);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).insert({id:1}, {upsert: true}).run(connection);
        assert(result);
        assert.equal(result.unchanged, 1);

        result = yield r.db(dbName).table(tableName).insert({id:1, val: 2}, {upsert: true}).run(connection);
        assert(result);
        assert.equal(result.replaced, 1);

        try{
            result = yield r.db(dbName).table(tableName).insert({}, {nonValidKey: "true"}).run(connection);
            console.log("Error, should have thrown");
        }
        catch(e) {
            assert(e);
        }

        result = yield r.db(dbName).table(tableName).insert([{}, {}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 2);

        result = yield r.db(dbName).table(tableName).update({updated: 1}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).update({updated: 2}, {durability: "soft"}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).update({updated: r.js("3")}, {nonAtomic: true}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).get(1).update({idCopy: 1}, {returnVals: true}).run(connection);
        assert(result);
        assert(result.replaced > 0);
        assert(result.new_val);
        assert(result.old_val);

        result = yield r.db(dbName).table(tableName).update(function(doc) { return doc.merge({func: true})}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, replaced: 1}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, replaced: 2}, {durability: "soft"}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, replaced: r.js("3")}, {nonAtomic: true}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).replace(function(doc) { return doc.merge({funcReplace: true})}).run(connection);
        assert(result);
        assert(result.replaced > 0);

        result = yield r.db(dbName).table(tableName).sync().run(connection);
        assert.deepEqual(result, {synced: 1});
    }
    catch(e) {
        console.log(e);
        throw e;
    }
        
    // Selecting data
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert([{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 100);
        pks = result.generated_keys;

        result = yield r.db(dbName).table(tableName).get(pks[0]).run(connection);
        assert(result);

        table = r.db(dbName).table(tableName);
        query = table.getAll.apply(table, pks);
        result = yield query.run(connection);
        assert.equal(result.length, 100);

        table = r.db(dbName).table(tableName);
        query = table.getAll.apply(table, pks.slice(0, 50));
        result = yield query.run(connection);
        assert.equal(result.length, 50);

        result = yield r.db(dbName).table(tableName).update({field: 0}).run(connection);
        assert.equal(result.replaced, 100);
        result = yield r.db(dbName).table(tableName).sample(20).update({field: 10}).run(connection);
        assert.equal(result.replaced, 20);


        result = yield r.db(dbName).table(tableName).indexCreate("field").run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait("field").run(connection);
        assert.deepEqual(result, [{"index":"field","ready":true}]);

        cursor = yield r.db(dbName).table(tableName).getAll(10, {index: "field"}).run(connection);
        assert(cursor);
        result = yield cursor.toArray();
        assert.equal(result.length, 20);


        result = yield r.db(dbName).table(tableName).indexCreate("fieldAddOne", function(doc) { return doc("field").add(1) }).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).indexWait("fieldAddOne").run(connection);
        assert.deepEqual(result, [{"index":"fieldAddOne","ready":true}]);

        cursor = yield r.db(dbName).table(tableName).getAll(11, {index: "fieldAddOne"}).run(connection);
        assert(cursor);
        result = yield cursor.toArray();
        assert.equal(result.length, 20);

        cursor = yield r.db(dbName).table(tableName).between(5, 20, {index: "fieldAddOne"}).run(connection);
        assert(cursor);
        result = yield cursor.toArray();
        assert.equal(result.length, 20);

        cursor = yield r.db(dbName).table(tableName).filter({field: 10}).run(connection);
        assert(cursor);
        result = yield cursor.toArray();
        assert.equal(result.length, 20);

        cursor = yield r.db(dbName).table(tableName).filter(function(doc) { return doc("field").eq(10) }).run(connection);
        assert(cursor);
        result = yield cursor.toArray();
        assert.equal(result.length, 20);
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Joins
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});
    
        result = yield r.db(dbName).table(tableName).insert([{val:1}, {val: 2}, {val: 3}]).run(connection);
        pks = result.generated_keys;
        assert.equal(result.inserted, 3)

        result = yield r.expr([1,2,3]).innerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        result = yield r.expr([1,2,3]).outerJoin(r.db(dbName).table(tableName), function(left, right) { return left.eq(right("val")) }).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        result = yield r.expr(pks).eqJoin(function(doc) { return doc; }, r.db(dbName).table(tableName)).run(connection);
        assert.equal(result.length, 3);
        assert(result[0].left);
        assert(result[0].right);
        assert(result[1].left);
        assert(result[1].right);
        assert(result[2].left);
        assert(result[2].right);

        result = yield r.expr(pks).eqJoin(r.row, r.db(dbName).table(tableName)).run(connection);
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

    // Transformations
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert([{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 100);
        pks = result.generated_keys;

        result = yield r.expr([1,2,3]).map(r.row).run(connection);
        assert.deepEqual(result, [1,2,3]);

        result = yield r.expr([1,2,3]).map(r.row.add(1)).run(connection);
        assert.deepEqual(result, [2, 3, 4]);

        result = yield r.expr([1,2,3]).map(function(doc) { return doc.add(2)}).run(connection);
        assert.deepEqual(result, [3, 4, 5]);

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a").run(connection);
        assert.deepEqual(result, [{a: 0}, {a: 4}, {a: 9}]);

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a", "c").run(connection);
        assert.deepEqual(result, [{a: 0, c: 2}, {a: 4, c: 5}, {a:9, c:0}]);

        result = yield r.expr([[1], [2], [3]]).concatMap(function(doc) { return doc}).run(connection);
        assert.deepEqual(result, [1, 2, 3]);

        result = yield r.expr([[1], [2], [3]]).concatMap(r.row).run(connection);
        assert.deepEqual(result, [1, 2, 3]);

        result = yield r.expr([{a:23}, {a:10}, {a:0}, {a:100}]).orderBy(r.row("a")).run(connection);
        assert.deepEqual(result, [{a:0}, {a:10}, {a:23}, {a:100}]);

        result = yield r.db(dbName).table(tableName).orderBy({index: "id"}).run(connection);
        for(i=0; i<result.length-1; i++) {
            assert(result[i].id < result[i+1].id);
        }

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).skip(3).run(connection);
        assert.deepEqual(result, [3, 4, 5, 6, 7, 8, 9]);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).limit(3).run(connection);
        assert.deepEqual(result, [0, 1, 2]);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(3, 5).run(connection);
        assert.deepEqual(result, [3, 4]);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).nth(3).run(connection);
        assert.deepEqual(result, 3);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(3).run(connection);
        assert.equal(result, 3);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(r.row.eq(3)).run(connection);
        assert.equal(result, 3);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(function(doc) { return doc.eq(3)}).run(connection);
        assert.equal(result, 3);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).isEmpty().run(connection);
        assert.equal(result, false);

        result = yield r.expr([]).isEmpty().run(connection);
        assert.equal(result, true);

        result = yield r.expr([0, 1, 2]).union([3, 4, 5]).run(connection);
        assert.deepEqual(result, [0, 1, 2, 3, 4, 5]);

        result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).sample(2).run(connection);
        assert.equal(result.length, 2);
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Aggregations
    try{
        result = yield r.expr([0, 1, 2, 3, 4, 5]).reduce( function(left, right) { return left.add(right) }).run(connection);
        assert.equal(result, 15);

        result = yield r.expr([0, 1, 2, 3, 4, 5]).reduce( function(left, right) { return left.add(right) }, 11).run(connection);
        assert(result > 25);

        result = yield r.expr([0, 1, 2, 3, 4, 5]).count().run(connection);
        assert.equal(result, 6);

        result = yield r.expr([0, 1, 2, 3, 4, 5]).count(function(doc) { return doc.eq(2) }).run(connection);
        assert.equal(result, 1);

        result = yield r.expr([0, 1, 2, 2, 1, 2, 1, 0, 2, 1]).distinct().count().run(connection);
        assert.equal(result, 3);

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }).orderBy("group").run(connection);
        assert.deepEqual(result, [{group: 0, reduction: 5}, {group: 1, reduction: 30}, {group: 2, reduction: 3}])

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupedMapReduce(
                function(doc) { return doc("g") },
                function(doc) { return doc("val") },
                function(left, right) { return left.add(right) }, 10).orderBy("group").run(connection);
        assert(result[0].reduction > 5);
        assert(result[1].reduction > 30);
        assert(result[2].reduction > 3);

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.count).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2 }, {group: {g: 1 }, reduction: 2}, {group: {g: 2 }, reduction: 1}]);

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.sum("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:5 }, {group: {g: 1 }, reduction: 30}, {group: {g: 2 }, reduction: 3}]);

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.avg("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2.5 }, {group: {g: 1 }, reduction: 15}, {group: {g: 2 }, reduction: 3}]);

        result = yield r.expr([1,2,3]).contains(2).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(1, 2).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(1, 5).run(connection);
        assert.equal(result, false);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(2)).run(connection);
        assert.equal(result, true);

        result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(5)).run(connection);
        assert.equal(result, false);
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Aggregators
    try{
        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.count).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2 }, {group: {g: 1 }, reduction: 2}, {group: {g: 2 }, reduction: 1}]);

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.sum("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:5 }, {group: {g: 1 }, reduction: 30}, {group: {g: 2 }, reduction: 3}]);

        result = yield r.expr([{g: 0, val: 2}, {g: 0, val: 3}, {g: 1, val: 10}, {g: 1, val: 20}, {g:2, val: 3}]).groupBy("g", r.avg("val")).orderBy("g").run(connection);
        assert.deepEqual(result, [{group: {g: 0}, reduction:2.5 }, {group: {g: 1 }, reduction: 15}, {group: {g: 2 }, reduction: 3}]);
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Document manipulation
    try{

        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert.equal(result.inserted, 1);

        result = yield r.db(dbName).table(tableName).update({idCopyUpdate: r.row("id")}).run(connection);
        assert.equal(result.replaced, 1);

        result = yield r.db(dbName).table(tableName).replace(r.row).run(connection);
        assert.equal(result.replaced, 0);

        result = yield r.db(dbName).table(tableName).replace(r.row.merge({idCopyReplace: r.row("id")})).run(connection);
        assert.equal(result.replaced, 1);
 
        result = yield r.expr({a: 0, b: 1, c: 2}).pluck("a", "b").run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}]).pluck("a", "b").run(connection);
        assert.deepEqual(result, [{a: 0, b: 1}, {a: 0, b: 10}]);

        result = yield r.expr({a: 0, b: 1, c: 2}).without("c").run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}]).without("a", "c").run(connection);
        assert.deepEqual(result, [{b: 1}, {b: 10}]);

        result = yield r.expr({a: 0}).merge({b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        result = yield r.expr({a: {b: 1}}).merge({a: r.literal({c: 2})}).run(connection);
        assert.deepEqual(result, {a: {c: 2}});

        result = yield r.expr([{a: 0}, {a: 1}, {a: 2}]).merge({b: 1}).run(connection);
        assert.deepEqual(result, [{a: 0, b: 1}, {a: 1, b: 1}, {a: 2, b: 1}]);

        result = yield r.expr([1,2,3]).append(4).run(connection);
        assert.deepEqual(result, [1,2,3,4]);

        result = yield r.expr([1,2,3]).prepend(4).run(connection);
        assert.deepEqual(result, [4,1,2,3]);

        result = yield r.expr([1,2,3]).difference([4,2]).run(connection);
        assert.deepEqual(result, [1, 3]);

        result = yield r.expr([1,2,3]).setInsert(4).run(connection);
        assert.deepEqual(result, [1,2,3,4]);

        result = yield r.expr([1,2,3]).setInsert(2).run(connection);
        assert.deepEqual(result, [1,2,3]);

        result = yield r.expr([1,2,3]).setUnion([2,4]).run(connection);
        assert.deepEqual(result, [1,2,3,4]);

        result = yield r.expr([1,2,3]).setIntersection([2,4]).run(connection);
        assert.deepEqual(result, [2]);

        result = yield r.expr([1,2,3]).setDifference([2,4]).run(connection);
        assert.deepEqual(result, [1,3]);

        result = yield r.expr({a:0, b:1})("a").run(connection);
        assert.equal(result, 0);

        result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}, {b:1, c:3}]).hasFields("a", "c").run(connection);
        assert.deepEqual(result, [{a: 0, b: 1, c: 2}, {a: 0, b: 10, c: 20}]);

        result = yield r.expr([1,2,3,4]).insertAt(0, 2).run(connection);
        assert.deepEqual(result, [2,1,2,3,4]);

        result = yield r.expr([1,2,3,4]).spliceAt(1, [9, 9]).run(connection);
        assert.deepEqual(result, [1,9,9,2,3,4]);

        result = yield r.expr([1,2,3,4]).deleteAt(1).run(connection);
        assert.deepEqual(result, [1,3,4]);

        result = yield r.expr([1,2,3,4]).deleteAt(1, 3).run(connection);
        assert.deepEqual(result, [1,4]);

        result = yield r.expr([1,2,3,4]).changeAt(1, 3).run(connection);
        assert.deepEqual(result, [1,3,3,4]);

        result = yield r.expr({a:0, b:1, c:2}).keys().orderBy(r.row).run(connection);
        assert.deepEqual(result, ["a", "b", "c"]);
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    try{
        result = yield r.expr("abc").match("^(ab)").run(connection);
        assert.equal(result.str, 'ab');
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    // Basic chaining
    try{
        result = yield r.expr(1).add(1).run(connection);
        assert.equal(result, 2);

        result = yield r.expr(1).add(1).add(1).run(connection);
        assert.equal(result, 3);

        result = yield r.expr(1).sub(1).run(connection);
        assert.equal(result, 0);

        result = yield r.expr(2).mul(3).run(connection);
        assert.equal(result, 6);

        result = yield r.expr(24).div(2).run(connection);
        assert.equal(result, 12);

        result = yield r.expr(24).mod(7).run(connection);
        assert.equal(result, 3);

        result = yield r.expr(true).and(false).run(connection);
        assert.equal(result, false);

        result = yield r.expr(true).and(true).run(connection);
        assert.equal(result, true);

        result = yield r.expr(true).or(false).run(connection);
        assert.equal(result, true);

        result = yield r.expr(false).or(false).run(connection);
        assert.equal(result, false);

        result = yield r.expr(1).eq(1).run(connection);
        assert.equal(result, true);

        result = yield r.expr(1).eq(2).run(connection);
        assert.equal(result, false);

        result = yield r.expr(1).ne(1).run(connection);
        assert.equal(result, false);

        result = yield r.expr(1).ne(2).run(connection);
        assert.equal(result, true);

        result = yield r.expr(1).gt(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(2).gt(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(3).gt(2).run(connection);
        assert.equal(result, true);

        result = yield r.expr(1).ge(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(2).ge(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(3).ge(2).run(connection);
        assert.equal(result, true);

        result = yield r.expr(1).lt(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(2).lt(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(3).lt(2).run(connection);
        assert.equal(result, false);

        result = yield r.expr(1).le(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(2).le(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(3).le(2).run(connection);
        assert.equal(result, false);

        result = yield r.expr(true).not().run(connection);
        assert.equal(result, false);
        result = yield r.expr(false).not().run(connection);
        assert.equal(result, true);
    }
    catch(e) {
        console.log(e);
        throw e;
    }


    try{
        result = yield r.now().run(connection);
        assert.equal(result instanceof Date, true)
        assert.equal((new Date()-result)<1000, true)

        result = yield r.time(1986, 11, 3, 12, 0, 0, 'Z').run(connection);
        assert.equal(result instanceof Date, true)
        //Main author is living in California. Blame JavaScript's date for the +8
        //Month in JS starts with 0
        assert.deepEqual(new Date(1986, 10, 3, (12-8)), result)

        result = yield r.time(1986, 11, 3, 'Z').run(connection);
        result2 = yield r.time(1986, 11, 3, 0, 0, 0, 'Z').run(connection);
        assert.equal(result instanceof Date, true)


        now = new Date();
        result = yield r.epochTime(now.getTime()/1000).run(connection);
        assert.deepEqual(now, result);

        result = yield r.ISO8601("1986-11-03T08:30:00-08:00").run(connection);
        assert(result, new Date(1986, 11, 3, 8, 30, 0, -8));

        result = yield r.ISO8601("1986-11-03T08:30:00", {defaultTimezone: "-08:00"}).run(connection);
        assert(result, new Date(1986, 11, 3, 8, 30, 0, -8));
        
        result = yield r.now().inTimezone('-08:00').hours().run(connection);
        assert(result, (new Date()).getHours());

        result = yield r.ISO8601("1986-11-03T08:30:00-08:00").timezone().run(connection);
        assert(result, "-08:00");
        
        result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now().add(1000)).run(connection);
        assert.equal(result, true);

        result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now(), {leftBound: "closed", rightBound: "closed"}).run(connection);
        assert.equal(result, true);

        result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now(), {leftBound: "closed", rightBound: "open"}).run(connection);
        assert.equal(result, false);

        result = yield r.now().date().hours().run(connection);
        assert.equal(result, 0);
        result = yield r.now().date().minutes().run(connection);
        assert.equal(result, 0);
        result = yield r.now().date().seconds().run(connection);
        assert.equal(result, 0);

        result = yield r.now().timeOfDay().run(connection);
        assert(result>0);

        result = yield r.now().year().run(connection);
        assert.equal(result, new Date().getFullYear());

        result = yield r.now().month().run(connection);
        assert.equal(result, new Date().getMonth()+1);

        result = yield r.now().day().run(connection);
        assert.equal(result, new Date().getUTCDate());

        result = yield r.now().dayOfYear().run(connection);
        assert(result > (new Date()).getMonth()*28+(new Date()).getUTCDate()-1);

        result = yield r.now().dayOfWeek().run(connection);
        assert.equal(result, new Date().getDay());

        result = yield r.now().toISO8601().run(connection);
        assert.equal(typeof result, "string");

        result = yield r.now().toEpochTime().run(connection);
        assert.equal(typeof result, "number");
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    // Control structures

    try{
        result = yield r.expr({a: 1}).do( function(doc) { return doc("a") }).run(connection);
        assert.equal(result, 1);

        result = yield r.branch(true, 1, 2).run(connection);
        assert.equal(result, 1);

        result = yield r.branch(false, 1, 2).run(connection);
        assert.equal(result, 2);

        result = yield r.expr({a:1})("b").default("Hello").run(connection);
        assert.equal(result, "Hello");

        result = yield r.js("1").run(connection);
        assert.equal(result, 1);

        result = yield r.expr(1).coerceTo("STRING").run(connection);
        assert.equal(result, "1");

        result = yield r.expr(1).typeOf().run(connection);
        assert.equal(result, "NUMBER");

        result = yield r.json('{"a":1}').run(connection);
        assert.deepEqual(result, {a:1});

    }
    catch(e) {
        console.log(e);
        throw e;
    }

    try{
        result = yield r.error("Custom error").run(connection);
        console.log("Error: `r.error` should have thrown");
    }
    catch(e) {
    }

    // Cursor
    try{
        dbName = guid();
        tableName = guid();

        result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert({}).run(connection);
        assert(result);
        assert(result.inserted > 0);

        cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        assert(cursor.hasNext, true);

        result = yield cursor.next();
        assert(result);
        assert(result.id);

        result = yield r.db(dbName).table(tableName).delete().run(connection);
        assert(result);
        assert.equal(result.errors, 0);

        result = yield r.db(dbName).table(tableName).insert([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}]).run(connection);
        assert(result);
        assert.equal(result.inserted, 80);

        cursor = yield r.db(dbName).table(tableName).run(connection);
        assert(cursor);
        i=0;
        while(cursor.hasNext()) {
            result = yield cursor.next();
            assert(result);
            i++;
        }
        assert.equal(80, i);

        cursor = yield r.db(dbName).table(tableName).run(connection);
        result = yield cursor.toArray();
        assert.equal(result.length, 80);

        cursor = yield r.db(dbName).table(tableName).run(connection);
        cursor.close();
    }
    catch(e) {
        console.log('Error');
        console.log(e);
        throw e;
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
