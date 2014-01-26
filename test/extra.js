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

It("Anonymous function should throw if they return undefined", function* (done) {
    try {
        r.expr(1).do(function() {});
    }
    catch(e) {
        if (e.message === "Annonymous function returned `undefined`. Did you forget a `return`?") {
            done()
        }
        else {
            done(e);
        }
    }
})
