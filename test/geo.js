var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;
var numDocs = 10;

It("Init for `geo.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).indexCreate("location", {geo: true}).run();
        result = yield r.db(dbName).table(tableName).indexWait("location").run();

        var insert_docs = [];
        for(var i=0; i<numDocs; i++) {
            insert_docs.push({location: r.point(r.random(0, 1, {float: true}), r.random(0, 1, {float: true}))})
        }
        result = yield r.db(dbName).table(tableName).insert(insert_docs).run();

        done();
    }
    catch(e) {
        done(e);
    }
})


It("`r.circle` should work - 1", function* (done) {
    try {
        var result = yield r.circle([0, 0], 2).run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "Polygon")
        assert.equal(result.coordinates[0].length, 33)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.circle` should work - 2", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0), 2).run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "Polygon")
        assert.equal(result.coordinates[0].length, 33)

        var result = yield r.circle(r.point(0, 0), 2, {numVertices: 40}).run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "Polygon")
        assert.equal(result.coordinates[0].length, 41)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.circle` should work - 3", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0), 2, {numVertices: 40, fill: false}).run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "LineString")
        assert.equal(result.coordinates.length, 41)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.circle` should work - 4", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0), 1, {unit: "km"}).eq(r.circle(r.point(0, 0), 1000, {unit: "m"})).run();
        assert(result);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`r.circle` should throw with non recognized arguments", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0), 1, {foo: "bar"}).run()
        done(new Error("Was expecting an error"));
    }
    catch(e) {
        if (e.message.match(/^Unrecognized option `foo` in `circle` after/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`r.circle` arity - 1", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0)).run()
        done(new Error("Was expecting an error"));
    }
    catch(e) {
        if (e.message.match(/^`r.circle` takes at least 2 arguments, 1 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`r.circle` arity - 2", function* (done) {
    try {
        var result = yield r.circle(0, 1, 2, 3, 4).run()
        done(new Error("Was expecting an error"));
    }
    catch(e) {
        if (e.message.match(/^`r.circle` takes at most 3 arguments, 5 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`distance` should work - 1", function* (done) {
    try {
        var result = yield r.point(0, 0).distance(r.point(1,1)).run();
        assert.equal(Math.floor(result), 156899);
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`distance` should work - 2", function* (done) {
    try {
        var result = yield r.point(0, 0).distance(r.point(1,1), {unit: "km"}).run();
        assert.equal(Math.floor(result), 156);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`distance` arity - 1", function* (done) {
    try {
        var result = yield r.point(0, 0).distance().run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`distance` takes at least 1 argument, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`distance` arity - 2", function* (done) {
    try {
        var result = yield r.point(0, 0).distance(1, 2, 3).run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`distance` takes at most 2 arguments, 3 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`fill` should work", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0), 2, {numVertices: 40, fill: false}).fill().run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "Polygon")
        assert.equal(result.coordinates[0].length, 41)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`fill` arity error", function* (done) {
    try {
        var result = yield r.circle(r.point(0, 0), 2, {numVertices: 40, fill: false}).fill(1).run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`fill` takes 0 argument, 1 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }

    }
})
It("`geojson` should work", function* (done) {
    try {
        var result = yield r.geojson( {"coordinates":[0,0],"type":"Point"} ).run()
        assert.equal(result.$reql_type$, "GEOMETRY")
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`geojson` arity error", function* (done) {
    try {
        var result = yield r.geojson(1,2,3).run()
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`r.geojson` takes 1 argument, 3 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }

    }
})
It("`toGeojson` should work", function* (done) {
    try {
        var result = yield r.geojson( {"coordinates":[0,0],"type":"Point"}).toGeojson().run()
        assert.equal(result.$reql_type$, undefined)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`toGeojson` arity error", function* (done) {
    try {
        var result = yield r.point(0, 0).toGeojson(1, 2, 3).run()
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`toGeojson` takes 0 argument, 3 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }

    }
})

It("`getIntersecting` should work", function* (done) {
    try {
        // All points are in [0,1]x[0,1]
        var result = yield r.db(dbName).table(tableName).getIntersecting(r.polygon([0, 0], [0,1], [1,1], [1,0]), {index: "location"}).count().run()
        assert.equal(result, numDocs)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`getIntersecting` arity", function* (done) {
    try {
        // All points are in [0,1]x[0,1]
        var result = yield r.db(dbName).table(tableName).getIntersecting(r.polygon([0, 0], [0,1], [1,1], [1,0])).count().run()
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`getIntersecting` takes 2 arguments, 1 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }

    }

})
It("`getNearest` should work", function* (done) {
    try {
        // All points are in [0,1]x[0,1]
        var result = yield r.db(dbName).table(tableName).getNearest(r.point(0, 0), {index: "location", maxResults: 5}).run()
        assert(result.length <= 5)
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`getNearest` arity", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).getNearest(r.point(0, 0)).count().run()
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`getNearest` takes 2 arguments, 1 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`includes` should work", function* (done) {
    try {
        var point1 = r.point(-117.220406, 32.719464);
        var point2 = r.point(-117.206201, 32.725186);
        var result = yield r.circle(point1, 2000).includes(point2).run();
        assert(result)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`includes` arity", function* (done) {
    try {
        var result = yield r.circle([0,0], 2000).includes().run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`includes` takes 1 argument, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`intersects` should work", function* (done) {
    try {
        var point1 = r.point(-117.220406, 32.719464);
        var point2 = r.point(-117.206201, 32.725186);
        r.circle(point1, 2000).intersects(r.circle(point2, 2000)).run();
        assert(result)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`intersects` arity", function* (done) {
    try {
        // All points are in [0,1]x[0,1]
        var point1 = r.point(-117.220406, 32.719464);
        var point2 = r.point(-117.206201, 32.725186);
        r.circle(point1, 2000).intersects(r.circle(point2, 2000), 2, 3).run();

        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`intersects` takes 1 argument, 3 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`r.line` should work - 1", function* (done) {
    try {
        var result = yield r.line([0, 0], [1, 2]).run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "LineString")
        assert.equal(result.coordinates[0].length, 2)
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.line` should work - 2", function* (done) {
    try {
        var result = yield r.line(r.point(0, 0), r.point(1, 2)).run();
        assert.equal(result.$reql_type$, "GEOMETRY")
        assert.equal(result.type, "LineString")
        assert.equal(result.coordinates[0].length, 2)
        done();
    }
    catch(e) {
        done(e);
    }
})


It("`r.line` arity", function* (done) {
    try {
        var result = yield r.line().run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`r.line` takes at least 2 arguments, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`r.point` should work", function* (done) {
    try {
        var result = yield r.point(0, 0).run();
        assert.equal(result.$reql_type$, "GEOMETRY");
        assert.equal(result.type, "Point");
        assert.equal(result.coordinates.length, 2);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`r.point` arity", function* (done) {
    try {
        var result = yield r.point().run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`r.point` takes 2 arguments, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`r.polygon` should work", function* (done) {
    try {
        var result = yield r.polygon([0, 0], [0, 1], [1, 1]).run();
        assert.equal(result.$reql_type$, "GEOMETRY");
        assert.equal(result.type, "Polygon");
        assert.equal(result.coordinates[0].length, 4); // The server will close the line
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`r.polygon` arity", function* (done) {
    try {
        var result = yield r.polygon().run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`r.polygon` takes at least 3 arguments, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`polygonSub` should work", function* (done) {
    try {
        var result = yield r.polygon([0, 0], [0, 1], [1, 1], [1, 0]).polygonSub(r.polygon([0.4, 0.4], [0.4, 0.5], [0.5, 0.5])).run();
        assert.equal(result.$reql_type$, "GEOMETRY");
        assert.equal(result.type, "Polygon");
        assert.equal(result.coordinates.length, 2); // The server will close the line
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`polygonSub` arity", function* (done) {
    try {
        var result = yield r.polygon([0, 0], [0, 1], [1, 1]).polygonSub().run();
        done(new Error("Was expecting an error"));
        done();
    }
    catch(e) {
        if (e.message.match(/^`polygonSub` takes 1 argument, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

