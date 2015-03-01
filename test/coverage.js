var util = require(__dirname+'/util/common.js');
var It = util.It;

var protodef = require(__dirname+'/../lib/protodef.js');
var keys = Object.keys(protodef.Term.TermType);

var fs = require('fs');

// Test that the term appears somewhere in the file, which find terms that were not implemented
It("All terms should be present in term.js", function* (done) {
    var str = fs.readFileSync(__dirname+'/../lib/term.js', 'utf8');
    var ignoredKeys = { // not implemented since we use the JSON protocol
        DATUM: true,
        MAKE_OBJ: true
    }
    var missing = [];
    for(var i=0; i<keys.length; i++) {
        if (ignoredKeys[keys[i]] === true) {
            continue;
        }
        if (str.match(new RegExp(keys[i])) === null) {
            missing.push(keys[i]);
        }
    }

    if (missing.length > 0) {
        done(new Error('Some terms were not found: '+JSON.stringify(missing)));
    }
    else {
        done();
    }

})
It("All terms should be present in error.js", function* (done) {
    var str = fs.readFileSync(__dirname+'/../lib/error.js', 'utf8');
    var ignoredKeys = {
        DATUM: true,
        MAKE_OBJ: true
    }
    var missing = [];
    for(var i=0; i<keys.length; i++) {
        if (ignoredKeys[keys[i]] === true) {
            continue;
        }
        if (str.match(new RegExp(keys[i])) === null) {
            missing.push(keys[i]);
        }
    }

    if (missing.length > 0) {
        done(new Error('Some terms were not found: '+JSON.stringify(missing)));
    }
    else {
        done();
    }

})

