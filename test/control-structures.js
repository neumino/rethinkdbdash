var config = require('./config.js');
var r = require('../lib')(config);
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

It("`do` should work", function* (done) {
    try {
        result = yield r.expr({a: 1}).do( function(doc) { return doc("a") }).run();
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`do` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.expr(1).do().run();
    }
    catch(e) {
        if (e.message, "First argument of `do` cannot be undefined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`branch` should work", function* (done) {
    try {
        result = yield r.branch(true, 1, 2).run();
        assert.equal(result, 1);

        result = yield r.branch(false, 1, 2).run();
        assert.equal(result, 2);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`branch` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.branch().run();
    }
    catch(e) {
        if (e.message, "First argument of `branch` cannot be undefined.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`branch` should throw if just one argument has been given", function* (done) {
    try{
        result = yield r.branch(true).run();
    }
    catch(e) {
        if (e.message, "Second argument of `branch` cannot be undefined.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`branch` should throw if just two arguments have been given", function* (done) {
    try{
        result = yield r.branch(true, true).run();
    }
    catch(e) {
        if (e.message, "Third argument of `branch` cannot be undefined.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`branch` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).branch(true, true, true).run();
    }
    catch(e) {
        if (e.message === "`branch` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`default` should work", function* (done) {
    try {
        result = yield r.expr({a:1})("b").default("Hello").run();
        assert.equal(result, "Hello");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`error` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).error("error").run();
    }
    catch(e) {
        if (e.message === "`error` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`default` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.expr({})("").default().run();
    }
    catch(e) {
        if (e.message, "First argument of `default` cannot be undefined after:\nr.expr({})(\"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`r.js` should work", function* (done) {
    try {
        result = yield r.js("1").run();
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`js` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).js("foo").run();
    }
    catch(e) {
        if (e.message === "`js` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`js` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.js().run();
    }
    catch(e) {
        if (e.message, "First argument of `js` cannot be undefined.") {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`coerceTo` should work", function* (done) {
    try {
        result = yield r.expr(1).coerceTo("STRING").run();
        assert.equal(result, "1");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`coerceTo` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.expr(1).coerceTo().run();
    }
    catch(e) {
        if (e.message, "First argument of `coerceTo` cannot be undefined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`typeOf` should work", function* (done) {
    try {
        result = yield r.expr(1).typeOf().run();
        assert.equal(result, "NUMBER");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`json` should work", function* (done) {
    try {
        result = yield r.json(JSON.stringify({a:1})).run();
        assert.deepEqual(result, {a:1});

        result = yield r.json("{}").run();
        assert.deepEqual(result, {})

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`json` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.json().run();
    }
    catch(e) {
        if (e.message, "First argument of `json` cannot be undefined.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`json` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).json("1").run();
    }
    catch(e) {
        if (e.message === "`json` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`exprJSON` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.exprJSON().run();
    }
    catch(e) {
        if (e.message, "First argument of `json` cannot be undefined.") {
            done()
        }
        else {
            done(e);
        }
    }
})
