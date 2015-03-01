var Promise = require('bluebird');
var config = require(__dirname+'/../test/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/../test/util/common.js');
var assert = require('assert');




var dbName = util.uuid()
var tableName = util.uuid()

var query; // without `.run()`
//query = 'r.table("foo").add(1).add(1).add("hello-super-long-string").add("another-long-string").add("one-last-string").map( function(doc) { return r.expr([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]).map(function(test) { return test("b").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").mul(test("b")).merge({ firstName: "xxxxxx", lastName: "yyyy", email: "xxxxx@yyyy.com", phone: "xxx-xxx-xxxx" }); }).add(2).map(function(doc) { return doc.add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string").add("hello-super-long-string").add("another-long-string").add("one-last-string") }); })';
query = 'r.expr({a: r.wednesday}).add([1])';
Promise.coroutine(function* () {
    try {
        yield r.dbCreate(dbName).run();
        yield r.db(dbName).tableCreate(tableName).run();

        var result = yield eval(query).run();
        throw new Error("Should have thrown an error");
    }
    catch(e) {
        console.log(e.message);
        console.log('')
        console.log('')
        console.log('')
        console.log('/*');
        console.log('Frames:');
        console.log(e.frames);
        console.log('');
        console.log('Error:');
        console.log(e.message.trim());
        console.log('*/');
        console.log('It(\'Test backtrace for '+query+'\', function* (done) {')
        console.log('    try {');
        console.log('        r.nextVarId=1;');
        console.log('        yield '+query+'.run()');
        console.log('        done(new Error("Should have thrown an error"))');
        console.log('    }');
        console.log('    catch(e) {');
        //console.log('        if (e.message.replace(/var_[0-9]+/, "VAR") === '+JSON.stringify(e.message.replace(/var_[0-9]+/, "VAR")).replace('\\"'+dbName+'\\"', '\\""+dbName+"\\"').replace('\\"'+tableName+'\\"', '"+tableName+"')+') {');
        console.log('        if (e.message === '+JSON.stringify(e.message).replace(new RegExp(dbName, "g"), '"+dbName+"').replace(new RegExp(tableName, "g"), '"+tableName+"')+') {');
        console.log('            done()');
        console.log('        }');
        console.log('        else {');
        console.log('            done(e);');
        console.log('        }');
        console.log('    }');
        console.log('})');

        r.getPool().drain();
    }
})()
