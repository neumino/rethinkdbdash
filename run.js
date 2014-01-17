//var r = require('rethinkdbdash');
var r = require('./lib');
var Promise = require('bluebird');
var assert = require('assert');



var run = Promise.coroutine(function* () {
    console.log("Testing datums");
    try{
        var connection = yield r.connect();
        assert(connection);
        console.log("Connected");

        var result = yield r.expr(1).run(connection);
        assert.equal(result, 1);
        console.log(result);

        var result = yield r.expr(null).run(connection);
        assert.equal(result, null);
        console.log(result);

        var result = yield r.expr("Hello").run(connection);
        assert.equal(result, "Hello");
        console.log(result);

        var result = yield r.expr([0, 1, 2]).run(connection);
        assert.equal(result.length, 3);
        assert.equal(result[0], 0);
        assert.equal(result[1], 1);
        assert.equal(result[2], 2);
        console.log(result);


        var result = yield r.expr({a: 0, b: 1}).run(connection);
        assert.equal(result.a, 0);
        assert.equal(result.b, 1);
        console.log(result);


    }
    catch(e) {
        console.log(e);
        throw e;
    }


    console.log("Testing add/sub/mul/div");
    try{
        var result = yield r.expr(1).add(1).run(connection);
        assert.equal(result, 2);
        console.log(result);

        var result = yield r.expr(1).add(1).add(1).run(connection);
        assert.equal(result, 3);
        console.log(result);

        var result = yield r.expr(1).add(1, 1).run(connection);
        assert.equal(result, 3);
        console.log(result);

        var result = yield r.expr(1).sub(1).run(connection);
        assert.equal(result, 0);
        console.log(result);

        var result = yield r.expr(1).sub(1, 1).run(connection);
        assert.equal(result, -1);
        console.log(result);

        var result = yield r.expr(2).mul(3).run(connection);
        assert.equal(result, 6);
        console.log(result);

        var result = yield r.expr(2).mul(3, 4).run(connection);
        assert.equal(result, 24);
        console.log(result);

        var result = yield r.expr(24).div(2).run(connection);
        assert.equal(result, 12);
        console.log(result);

        var result = yield r.expr(24).div(2, 3).run(connection);
        assert.equal(result, 4);
        console.log(result);
    }
    catch(e) {
        console.log(e);
        throw e;
    }

    console.log("Trying sequence");
    try{
        var result = yield r.db("test").info().run(connection);
        console.log(result);

        var result = yield r.db("test").table("test").info().run(connection);
        console.log(result);

        /*
        var result = yield r.db("test").table("test").run(connection);
        console.log(result);
        */



    }
    catch(e) {
        console.log('Error');
        console.log(e);
        throw e;
    }



    console.log("Closing connection");
    try{
        //var confirmation = yield connection.close();
        var confirmation = yield connection.close({noReplyWait: true});
        console.log("Connection closed");
    }
    catch(e) {
        console.log(e);
        throw e;
    }
})

run();


// r.expr(1).add(1)
// term.add(1)
// term
