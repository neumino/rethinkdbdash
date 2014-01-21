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

It("Init for `document-manipulation.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`add` should work", function* (done) {
    try {
        var result = yield r.expr(1).add(1).run(connection);
        assert.equal(result, 2);

        result = yield r.expr(1).add(1).add(1).run(connection);
        assert.equal(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`sub` should work", function* (done) {
    try {
        result = yield r.expr(1).sub(1).run(connection);
        assert.equal(result, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`mul` should work", function* (done) {
    try {
        result = yield r.expr(2).mul(3).run(connection);
        assert.equal(result, 6);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`div` should work", function* (done) {
    try {
        result = yield r.expr(24).div(2).run(connection);
        assert.equal(result, 12);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`mod` should work", function* (done) {
    try {
        result = yield r.expr(24).mod(7).run(connection);
        assert.equal(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`and` should work", function* (done) {
    try {
        result = yield r.expr(true).and(false).run(connection);
        assert.equal(result, false);

        result = yield r.expr(true).and(true).run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`or` should work", function* (done) {
    try {
        result = yield r.expr(true).or(false).run(connection);
        assert.equal(result, true);

        result = yield r.expr(false).or(false).run(connection);
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`eq` should work", function* (done) {
    try {
        result = yield r.expr(1).eq(1).run(connection);
        assert.equal(result, true);

        result = yield r.expr(1).eq(2).run(connection);
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`ne` should work", function* (done) {
    try {
        result = yield r.expr(1).ne(1).run(connection);
        assert.equal(result, false);

        result = yield r.expr(1).ne(2).run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`gt` should work", function* (done) {
    try {
        result = yield r.expr(1).gt(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(2).gt(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(3).gt(2).run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`ge` should work", function* (done) {
    try {
        result = yield r.expr(1).ge(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(2).ge(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(3).ge(2).run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`lt` should work", function* (done) {
    try {
        result = yield r.expr(1).lt(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(2).lt(2).run(connection);
        assert.equal(result, false);
        result = yield r.expr(3).lt(2).run(connection);
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`le` should work", function* (done) {
    try {
        result = yield r.expr(1).le(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(2).le(2).run(connection);
        assert.equal(result, true);
        result = yield r.expr(3).le(2).run(connection);
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`not` should work", function* (done) {
    try {
        result = yield r.expr(true).not().run(connection);
        assert.equal(result, false);
        result = yield r.expr(false).not().run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})


It("End for `document-manipulation.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


