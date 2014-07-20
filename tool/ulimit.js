var assert = require('assert');

// Set ulimit -n 50 for this test
var maxOpenFiles = 50;

var r = require('../lib/')({
    min: maxOpenFiles-20,
    max: 2*maxOpenFiles
});


var Promise = require('bluebird');


(function() {

    var promises = [];
    for(var i=0; i<70;i++) {
        promises.push(r.expr(1).run());
    }

    setTimeout(function() {
        Promise.all(promises).then(function() {
            console.log('Sending second batch');
            console.log(r.getPool().getLength());
            assert(r.getPool().getLength() < maxOpenFiles);


            promises = [];
            for(var i=0; i<70;i++) {
                promises.push(r.expr(1).run());
            }
            return Promise.all(promises);
        }).then(function() {
            console.log("test done");
        }).error(function(err) {
            console.log("Error");
            console.log(err);
        });
    }, 10000)
    setTimeout(function() {
        Promise.all(promises).then(function() {
            console.log('Sending second batch');
            console.log(r.getPool().getLength());
            assert(r.getPool().getLength() < maxOpenFiles);


            promises = [];
            for(var i=0; i<70;i++) {
                promises.push(r.expr(1).run());
            }
            return Promise.all(promises);
        }).then(function() {
            console.log("test done");
        }).error(function(err) {
            console.log("Error");
            console.log(err);
        });
    }, 20000)

})();
