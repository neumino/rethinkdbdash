//var r = require('rethinkdbdash');
var r = require('./lib');
var Promise = require('bluebird');
var assert = require('assert');


var run = Promise.coroutine(function* () {

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

        /*
        var result = yield r.expr({a: 0, b: 1}).run(connection);
        assert.equal(result.a, 0);
        assert.equal(result.b, 1);
        */


        console.log("Tests for datum done.");



    }
    catch(e) {
        throw e;
    }

    /*
    yield connection.close();
    console.log("Connection closed");
    */
})

run();


// r.expr(1).add(1)
// term.add(1)
// term
