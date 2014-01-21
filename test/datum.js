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
