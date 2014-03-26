var Promise = require('bluebird');
var r = require(__dirname+'/../lib')();
var util = require(__dirname+'/../test/util');
var assert = require('assert');



var dbName = util.uuid()
var tableName = util.uuid()

var query;
query = 'r.expr(1).do(function(v) { return r.object("a") })'

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
        console.log('        if (e.message === '+JSON.stringify(e.message).replace('\\"'+dbName+'\\"', '\\""+dbName+"\\"').replace('\\"'+tableName+'\\"', '\\""+tableName+"\\"')+') {');
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
