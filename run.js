//var r = require('rethinkdbdash');
var r = require('./lib');
var Promise = require('bluebird');


var run = Promise.coroutine(function* () {
    var connection = yield r.connect();
    console.log('Connected');
})

run();
