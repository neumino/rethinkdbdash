var config = require('./config.js');
var r = require('../lib')();
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var dbName;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("All raws datum shoul be defined", function* (done) {
    try {
        result = yield r.expr(1).run();
        assert.equal(result, 1);

        result = yield r.expr(null).run();
        assert.equal(result, null);

        result = yield r.expr(false).run();
        assert.equal(result, false);

        result = yield r.expr(true).run();
        assert.equal(result, true);

        result = yield r.expr("Hello").run();
        assert.equal(result, "Hello");

        result = yield r.expr([0, 1, 2]).run();
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1, 2]);


        result = yield r.expr({a: 0, b: 1}).run();
        assert.deepEqual(result, {a: 0, b: 1});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`expr` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).expr("foo").run();
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

        
        var result = yield r.exprJSON([{}, {}]).run();
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {}]);

        result = yield r.exprJSON([{}, {a: {b: {c: "hello"}}}]).run();
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {a: {b: {c: "hello"}}}]);

        var now = new Date()
        result = yield r.exprJSON([{}, {a: now}]).run();
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {a: now}]);

        result = yield r.exprJSON([{}, {a: r.expr(1)}]).run();
        result = yield result.toArray();
        assert.deepEqual(result, [{}, {a: 1}]);

        result = yield r.exprJSON(2).run();
        assert.deepEqual(result, 2);

        result = yield r.exprJSON("hello").run();
        assert.deepEqual(result, "hello");

        result = yield r.exprJSON(true).run();
        assert.deepEqual(result,true );

        result = yield r.exprJSON(null).run();
        assert.deepEqual(result, null);

        result = yield r.exprJSON({}).run();
        assert.deepEqual(result, {});

        result = yield r.exprJSON(r.expr({})).run();
        assert.deepEqual(result,{} );

        result = yield r.exprJSON([]).run();
        result = yield result.toArray();
        assert.deepEqual(result, []);

        result = yield r.exprJSON({c: 1, a: {b: 1}}).run();
        assert.deepEqual(result, {c: 1, a: {b: 1}});

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.expr` should take a nestingLevel value and throw if the nesting level is reached", function* (done) {
    try {
        r.expr({a :{b: {c: {d: 1}}}}, 2)
    }
    catch(e) {
        if (e.message === "Nesting depth limit exceeded.\nYou probably have a circular reference somewhere.") {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`r.exprJSON` should take a nestingLevel value and throw if the nesting level is reached", function* (done) {
    try {
        r.exprJSON({a :{b: {c: {d: 1}}}}, 2)
    }
    catch(e) {
        if (e.message === "Nesting depth limit exceeded.\nYou probably have a circular reference somewhere.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`r.exprJSON` should throw when r.setNestingLevel is used with a small value", function* (done) {
    try {
        r.setNestingLevel(2);
        r.exprJSON({a :{b: {c: {d: 1}}}})
    }
    catch(e) {
        if (e.message === "Nesting depth limit exceeded.\nYou probably have a circular reference somewhere.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`r.expr` should work when setNestingLevel set back the value to 100", function* (done) {
    try {
        r.setNestingLevel(100);
        var result = yield r.expr({a :{b: {c: {d: 1}}}}).run();
        assert.deepEqual(result, {a :{b: {c: {d: 1}}}})
        done();
    }
    catch(e) {
        console.log(e.message);
        done(e);
    }
})




/*

It("Null char in string - 1", function* (done) {
    try{
        result = yield r.expr("T\u0000EST").run();
        assert.equal(result, "T\u0000EST");
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Null char in string - 2", function* (done) {
    try{
        result = yield r.json(JSON.stringify("T\u0000EST")).run();
        assert.equal(result, JSON.stringify("T\u0000EST"));
        done();
    }
    catch(e) {
        done(e);
    }
})
It("Null char in string - 3", function* (done) {
    try{
        result = yield r.json("T\u0000EST").run();
        assert.equal(result, "T\u0000EST");
        done();
    }
    catch(e) {
        done(e);
    }
})
*/
