var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, pks, result;

It('Init for backtraces', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid();

    result = yield r.dbCreate(dbName).run();
    assert.equal(result.dbs_created, 1);

    result = yield r.db(dbName).tableCreate(tableName).run();
    assert.equal(result.tables_created, 1);

    result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, 100);

    done();
  }
  catch(e) {
    console.log(e.message); done(e);
  }
})



/*
Frames:
[ 1, 1, 1 ]

Error:
Cannot convert `NaN` to JSON in:
r.db("af552fefa372998f05c1dff2fa4c293c").table("89865145147d850616fcbe93011b1d5e")
    .map(function(var_1) {
        return var_1("key").add(NaN)
                                ^^^ 
    })
*/
It('Test backtrace for r.db(dbName).table(tableName).map(function(doc) { return doc("key").add(NaN)})', function* (done) {
    try {
        r.nextVarId=1;
        yield r.db(dbName).table(tableName).map(function(doc) { return doc("key").add(NaN)}).run()
        done(new Error("Should have thrown an error"))
    }
    catch(e) {
        if (e.message === "Cannot convert `NaN` to JSON in:\nr.db(\""+dbName+"\").table(\""+tableName+"\")\n    .map(function(var_1) {\n        return var_1(\"key\").add(NaN)\n                                ^^^ \n    })\n") {
            done()
        }
        else {
            done(e);
        }
    }
})



/*
Frames:
[ 1, 1, 1 ]

Error:
Cannot convert `Infinity` to JSON in:
r.db("dd054a14db348f5bcb99bbf14615955c").table("2f66694bbfa2a7bd2f0b0ef0460e7178")
    .map(function(var_1) {
        return var_1("key").add(Infinity)
                                ^^^^^^^^ 
    })
*/
It('Test backtrace for r.db(dbName).table(tableName).map(function(doc) { return doc("key").add(Infinity)})', function* (done) {
    try {
        r.nextVarId=1;
        yield r.db(dbName).table(tableName).map(function(doc) { return doc("key").add(Infinity)}).run()
        done(new Error("Should have thrown an error"))
    }
    catch(e) {
        if (e.message === "Cannot convert `Infinity` to JSON in:\nr.db(\""+dbName+"\").table(\""+tableName+"\")\n    .map(function(var_1) {\n        return var_1(\"key\").add(Infinity)\n                                ^^^^^^^^ \n    })\n") {
            done()
        }
        else {
            done(e);
        }
    }
})


/*
Frames:
[ 1, 1, 1 ]

Error:
Cannot convert `undefined` with r.expr() in:
r.db("28f1684f7a5927ce592bc1641bc0f9ac").table("55e82a8517599394fd96d8fb1acfcdef")
    .map(function(var_1) {
        return var_1("key").add(undefined)
                                ^^^^^^^^^ 
    })
*/
It('Test backtrace for r.db(dbName).table(tableName).map(function(doc) { return doc("key").add(undefined)})', function* (done) {
    try {
        r.nextVarId=1;
        yield r.db(dbName).table(tableName).map(function(doc) { return doc("key").add(undefined)}).run()
        done(new Error("Should have thrown an error"))
    }
    catch(e) {
        if (e.message === "Cannot convert `undefined` with r.expr() in:\nr.db(\""+dbName+"\").table(\""+tableName+"\")\n    .map(function(var_1) {\n        return var_1(\"key\").add(undefined)\n                                ^^^^^^^^^ \n    })\n") {
            done()
        }
        else {
            done(e);
        }
    }
})



/*
Frames:
[ 1, 1, 1, 'adult', 1 ]

Error:
Cannot convert `NaN` to JSON in:
r.db("aa802b7a7ec470632ddb3c515e7ab30b").table("fe82af2d2203e8fbed96e0cbbc29e936")
    .merge(function(var_1) {
        return r.branch(var_1("location").eq("US"), {
            adult: var_1("age").gt(NaN)
                                   ^^^ 
        }, {
            radult: var_1("age").gt(18)
        })
    })
*/
It('Test backtrace for r.db(dbName).table(tableName).merge(function(user) { return r.branch( user("location").eq("US"), { adult: user("age").gt(NaN) }, {radult: user("age").gt(18) }) })', function* (done) {
    try {
        r.nextVarId=1;
        yield r.db(dbName).table(tableName).merge(function(user) { return r.branch( user("location").eq("US"), { adult: user("age").gt(NaN) }, {radult: user("age").gt(18) }) }).run()
        done(new Error("Should have thrown an error"))
    }
    catch(e) {
        if (e.message === "Cannot convert `NaN` to JSON in:\nr.db(\""+dbName+"\").table(\""+tableName+"\")\n    .merge(function(var_1) {\n        return r.branch(var_1(\"location\").eq(\"US\"), {\n            adult: var_1(\"age\").gt(NaN)\n                                   ^^^ \n        }, {\n            radult: var_1(\"age\").gt(18)\n        })\n    })\n") {
            done()
        }
        else {
            done(e);
        }
    }
})

