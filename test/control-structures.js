var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var dbName, tableName, result;

It("`do` should work", function* (done) {
    try {
        var result = yield r.expr({a: 1}).do( function(doc) { return doc("a") }).run();
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.do` should work", function* (done) {
    try {
        result = yield r.do(1, 2, function(a, b) { return a }).run();
        assert.equal(result, 1);

        result = yield r.do(1, 2, function(a, b) { return b }).run();
        assert.equal(result, 2);

        done();
    }
    catch(e) {
        console.log(e)
        done(e);
    }
})


It("`do` should throw if no argument has been given", function* (done) {
    try{
        var result = yield r.expr(1).do().run();
    }
    catch(e) {
        if (e.message.match(/^`do` takes at least 1 argument, 0 provided after:/)) {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`branch` should work", function* (done) {
    try {
        var result = yield r.branch(true, 1, 2).run();
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
        var result = yield r.branch().run();
    }
    catch(e) {
        if (e.message.match(/^`r.branch` takes 3 arguments, 0 provided/)) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`branch` should throw if just one argument has been given", function* (done) {
    try{
        var result = yield r.branch(true).run();
    }
    catch(e) {
        if (e.message.match(/^`r.branch` takes 3 arguments, 1 provided/)) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`branch` should throw if just two arguments have been given", function* (done) {
    try{
        var result = yield r.branch(true, true).run();
    }
    catch(e) {
        if (e.message.match(/^`r.branch` takes 3 arguments, 2 provided/)) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`branch` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).branch(true, true, true).run();
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
It("`forEach` should work", function* (done) {
    try{
        var dbName = uuid();
        var tableName = uuid();

        result = yield r.dbCreate(dbName).run();
        assert.equal(result.dbs_created, 1) 

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.equal(result.tables_created, 1) 

        result = yield r.expr([{foo: "bar"}, {foo: "foo"}]).forEach(function(doc) {
            return r.db(dbName).table(tableName).insert(doc)
        }).run();
        assert.equal(result.inserted, 2);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`forEach` should throw if not given a function", function* (done) {
    try{
        result = yield r.expr([{foo: "bar"}, {foo: "foo"}]).forEach().run();
    }
    catch(e) {
        if (e.message.match(/^`forEach` takes 1 argument, 0 provided after/)) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`r.range(x)` should work", function* (done) {
    try {
        var result = yield r.range(10).run();
        assert.deepEqual(result, [0,1,2,3,4,5,6,7,8,9]);

        done();
    }
    catch(e) {
        console.log(e);
        done(e);
    }
})
It("`r.range(x, y)` should work", function* (done) {
    try {
        var result = yield r.range(3,10).run();
        assert.deepEqual(result, [3,4,5,6,7,8,9]);

        done();
    }
    catch(e) {
        console.log(e);
        done(e);
    }
})
It("`r.range(1,2,3)` should throw - arity", function* (done) {
    try {
        var result = yield r.range(1,2,3).run()
        done(new Error("Was expecting an error"));
    }
    catch(e) {
        if (e.message.match(/^`r.range` takes at most 2 arguments, 3 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`r.range()` should throw - arity", function* (done) {
    try {
        var result = yield r.range().run()
        done(new Error("Was expecting an error"));
    }
    catch(e) {
        if (e.message.match(/^`r.range` takes at least 1 argument, 0 provided/) !== null) {
            done();
        }
        else {
            done(e);
        }
    }
})

It("`default` should work", function* (done) {
    try {
        var result = yield r.expr({a:1})("b").default("Hello").run();
        assert.equal(result, "Hello");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`default` should throw if no argument has been given", function* (done) {
    try{
        var result = yield r.expr({})("").default().run();
    }
    catch(e) {
        if (e.message.match(/^`default` takes 1 argument, 0 provided after/)) {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`r.js` should work", function* (done) {
    try {
        var result = yield r.js("1").run();
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`js` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).js("foo").run();
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
        var result = yield r.js().run();
    }
    catch(e) {
        if (e.message.match(/^`r.js` takes 1 argument, 0 provided/)) {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`coerceTo` should work", function* (done) {
    try {
        var result = yield r.expr(1).coerceTo("STRING").run();
        assert.equal(result, "1");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`coerceTo` should throw if no argument has been given", function* (done) {
    try{
        var result = yield r.expr(1).coerceTo().run();
    }
    catch(e) {
        if (e.message.match(/^`coerceTo` takes 1 argument, 0 provided/)) {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`typeOf` should work", function* (done) {
    try {
        var result = yield r.expr(1).typeOf().run();
        assert.equal(result, "NUMBER");

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`json` should work", function* (done) {
    try {
        var result = yield r.json(JSON.stringify({a:1})).run();
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
        var result = yield r.json().run();
    }
    catch(e) {
        if (e.message === "`r.json` takes 1 argument, 0 provided.") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`json` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).json("1").run();
    }
    catch(e) {
        if (e.message.match(/^`json` is not defined after/)) {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`toJSON` and `toJsonString` should work", function* (done) {
    try {
        var result = yield r.expr({a:1}).toJSON().run();
        assert.equal(result, '{"a":1}');

        var result = yield r.expr({a:1}).toJsonString().run();
        assert.equal(result, '{"a":1}');

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`toJSON` should throw if an argument is provided", function* (done) {
    try {
        var result = yield r.expr({a:1}).toJSON('foo').run();
        done(new Error("Expecting error..."));
    }
    catch(e) {
        if (e.message.match(/^`toJSON` takes 0 argument, 1 provided/) !== null) {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`args` should work", function* (done) {
    try {
        var result = yield r.args([10, 20, 30]).run();
        assert.deepEqual(result, [10, 20, 30]);

        result = yield r.expr({foo: 1, bar: 2, buzz: 3}).pluck(r.args(["foo", "buzz"])).run()
        assert.deepEqual(result, {foo: 1, buzz: 3});

        done();
    }
    catch(e) {
        console.log(e)
        done(e)
    }
})
It("`args` should throw if an implicit var is passed inside", function* (done) {
    try {
        var cursor = yield r.table("foo").eqJoin(r.args([r.row, r.table("bar")])).run();
        done();
    }
    catch(e) {
        if (e.message === 'Implicit variable `r.row` cannot be used inside `r.args`.') {
            done();
        }
        else {
            done(e);
        }
    }
})
It("`http` should work", function* (done) {
    try {
        var result = yield r.http('http://google.com').run();
        assert.equal(typeof result, 'string');

        done();
    }
    catch(e) {
        done(e)
    }
})
It("`http` should work with options", function* (done) {
    try {
        var result = yield r.http('http://google.com', {timeout: 60}).run();
        assert.equal(typeof result, 'string');

        done();
    }
    catch(e) {
        done(e)
    }
})
It("`http` should throw with an unrecognized option", function* (done) {
    try {
        var result = yield r.http('http://google.com', {foo: 60}).run();
        done(new Error("Expecting error..."));
    }
    catch(e) {
        if (e.message === "Unrecognized option `foo` in `http`. Available options are reattemps <number>, redirects <number>, verify <boolean>, resultFormat: <string>, method: <string>, auth: <object>, params: <object>, header: <string>, data: <string>, page: <string/function>, pageLimit: <number>.") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`r.uuid` should work", function* (done) {
    try {
        var result = yield r.uuid().run();
        assert.equal(typeof result, 'string');

        done();
    }
    catch(e) {
        done(e)
    }
})

