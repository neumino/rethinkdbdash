var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;


It("All raws datum shoul be defined", function* (done) {
    try {
        var result = yield r.expr(1).run();
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
        result = yield r.expr(1).expr("foo").run();
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
It("`r.expr` should throw when setNestingLevel is too small", function* (done) {
    try {
        r.setNestingLevel(2);
        var result = yield r.expr({a :{b: {c: {d: 1}}}}).run();
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
        done(e);
    }
})

It("`r.expr` should throw when ArrayLimit is too small", function* (done) {
    try {
        var result = yield r.expr([0,1,2,3,4,5,6,8,9]).run({arrayLimit: 2});
        done(new Error("Was expecting an error"))
    }
    catch(e) {
        if (e.message.match(/^Array over size limit `2` in/)) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`r.expr` should throw when ArrayLimit is too small - options in run take precedence", function* (done) {
    try {
        r.setArrayLimit(100);
        var result = yield r.expr([0,1,2,3,4,5,6,8,9]).run({arrayLimit: 2});
        done(new Error("Was expecting an error"))
    }
    catch(e) {
        if (e.message.match(/^Array over size limit `2` in/)) {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`r.expr` should throw when setArrayLimit is too small", function* (done) {
    try {
        r.setArrayLimit(2);
        var result = yield r.expr([0,1,2,3,4,5,6,8,9]).run();
        done(new Error("Was expecting an error"))
    }
    catch(e) {
        if (e.message.match(/^Array over size limit `2` in/)) {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`r.expr` should work when setArrayLimit set back the value to 100000", function* (done) {
    try {
        r.setArrayLimit(100000);
        var result = yield r.expr([0,1,2,3,4,5,6,8,9]).run();
        assert.deepEqual(result, [0,1,2,3,4,5,6,8,9])
        done();
    }
    catch(e) {
        console.log(e);
        done(e);
    }
})

It("`r.expr` should fail with NaN", function* (done) {
    try {
        var result = yield r.expr(NaN).run();
        done(new Error("NaN should throw an error"));
    }
    catch(e) {
        if (e.message === "Cannot convert `NaN` to JSON.") {
            done();
        }
        else {
            console.log(e.message);
            done(e);
        }
    }
})
It("`r.expr` should fail with Infinity", function* (done) {
    try {
        var result = yield r.expr(Infinity).run();
        done(new Error("Infinity should throw an error"));
    }
    catch(e) {
        if (e.message === "Cannot convert `Infinity` to JSON.") {
            done();
        }
        else {
            console.log(e.message);
            done(e);
        }
    }
})

It("`r.expr` should work with high unicode char", function* (done) {
    try {
        var result = yield r.expr('“').run();
        assert.equal(result, '“')
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.binary` should work - with a buffer", function* (done) {
    try {
        var result = yield r.binary(new Buffer([1,2,3,4,5,6])).run();
        assert(result instanceof Buffer);
        assert.deepEqual(result.toJSON().data, [1,2,3,4,5,6]);
        done();
    }
    catch(e) {
        console.log(e);
        done(e);
    }
})
It("`r.binary` should work - with a ReQL term", function* (done) {
    try {
        var result = yield r.binary(r.expr("foo")).run();
        assert(result instanceof Buffer);
        result = yield r.expr(result).coerceTo("STRING").run();
        assert.equal(result, "foo");
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`r.expr` should work with binaries", function* (done) {
    try {
        var result = yield r.expr(new Buffer([1,2,3,4,5,6])).run();
        assert(result instanceof Buffer);
        assert.deepEqual(result.toJSON().data, [1,2,3,4,5,6]);
        done();
    }
    catch(e) {
        console.log(e);
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
