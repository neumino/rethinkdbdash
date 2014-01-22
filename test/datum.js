var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("All raws datum shoul be defined", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);

        result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        result = yield r.expr(null).run(connection);
        assert.equal(result, null);

        result = yield r.expr(false).run(connection);
        assert.equal(result, false);

        result = yield r.expr(true).run(connection);
        assert.equal(result, true);

        result = yield r.expr("Hello").run(connection);
        assert.equal(result, "Hello");

        result = yield r.expr([0, 1, 2]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1, 2]);


        result = yield r.expr({a: 0, b: 1}).run(connection);
        assert.deepEqual(result, {a: 0, b: 1});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`expr` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).expr("foo").run(connection);
    }
    catch(e) {
        if (e.message === "`expr` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`r.exprJSON` should work", function* (done) {
    try {
        assert(r.exprJSON([{}, {}])._self.type === "JSON");
        assert(r.exprJSON([{}, {a: {b: {c: "hello"}}}])._self.type === "JSON");
        assert(r.exprJSON([{}, {a: new Date()}])._self.type === "MAKE_ARRAY");
        assert(r.exprJSON([{}, {a: r.expr(1)}])._self.type === "MAKE_ARRAY");
        assert(r.exprJSON(2)._self.type === "JSON");
        assert(r.exprJSON("hello")._self.type === "JSON");
        assert(r.exprJSON(true)._self.type === "JSON");
        assert(r.exprJSON(null)._self.type === "JSON");
        assert(r.exprJSON({})._self.type === "JSON");
        assert(r.exprJSON([])._self.type === "JSON");
        assert(r.exprJSON({c: 1, a: {b: 1}})._self.type === "JSON");

        
        var result = yield r.exprJSON([{}, {}]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {}]);

        result = yield r.exprJSON([{}, {a: {b: {c: "hello"}}}]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {a: {b: {c: "hello"}}}]);

        var now = new Date()
        result = yield r.exprJSON([{}, {a: now}]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {a: now}]);

        result = yield r.exprJSON([{}, {a: r.expr(1)}]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {a: 1}]);

        result = yield r.exprJSON(2).run(connection);
        assert.deepEqual(result, 2);

        result = yield r.exprJSON("hello").run(connection);
        assert.deepEqual(result, "hello");

        result = yield r.exprJSON(true).run(connection);
        assert.deepEqual(result,true );

        result = yield r.exprJSON(null).run(connection);
        assert.deepEqual(result, null);

        result = yield r.exprJSON({}).run(connection);
        assert.deepEqual(result, {});

        result = yield r.exprJSON(r.expr({})).run(connection);
        assert.deepEqual(result,{} );

        result = yield r.exprJSON([]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, []);

        result = yield r.exprJSON({c: 1, a: {b: 1}}).run(connection);
        assert.deepEqual(result, {c: 1, a: {b: 1}});



        done();
    }
    catch(e) {
        done(e);
    }
})





/*

It("Null char in string - 1", function* (done) {
    try{
        result = yield r.expr("T\u0000EST").run(connection);
        assert.equal(result, "T\u0000EST");
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Null char in string - 2", function* (done) {
    try{
        result = yield r.json(JSON.stringify("T\u0000EST")).run(connection);
        assert.equal(result, JSON.stringify("T\u0000EST"));
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Null char in string - 3", function* (done) {
    try{
        result = yield r.json("T\u0000EST").run(connection);
        assert.equal(result, "T\u0000EST");
        done();
    }
    catch(e) {
        done(e);
    }
})
*/
