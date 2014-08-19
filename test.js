var r = require('./lib')({
    host: "notahost",
    min: 1,
    max: 2
});
var Promise = require('bluebird');
var util = require('util');
var limit=20;

//setTimeout(function() {

Promise.coroutine(function*() {
    var cursor = yield r.db('test').table('test').run();
    cursor.each(function(err, row) {
        if (err) console.log('err: %j', err);
        console.log('got row: %j', row);
        return true;
    }, function() {
        console.log('done');
    })
})();

//}, 1000);
