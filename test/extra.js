var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;

It('Init for `extra.js`', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid(); // Big table to test partial sequence

    result = yield r.dbCreate(dbName).run()
    assert.equal(result.dbs_created, 1);
    //yield r.db(dbName).wait().run()
    result = yield r.db(dbName).tableCreate(tableName)('tables_created').run();
    assert.deepEqual(result, 1);
    done();
  }
  catch(e) {
    console.log(e);
    done(e);
  }
})
It('Change the default database on the fly in run', function* (done) {
  try {
    result = yield r.tableList().run({db: dbName})
    assert.deepEqual(result, [tableName]);
    done();
  }
  catch(e) {
    console.log(e);
    done(e);
  }
})

It('Anonymous function should throw if they return undefined', function* (done) {
  try {
    r.expr(1).do(function() {});
  }
  catch(e) {
    if (e.message === "Anonymous function returned `undefined`. Did you forget a `return`? In:\nfunction () {}.") {
      done()
    }
    else {
      done(e);
    }
  }
})

It('toString should work', function* (done) {
  try {
    assert.equal(r.expr(1).add(2).toString(), "r.expr(1).add(2)");
    assert.equal(r.expr(1).toString(), "r.expr(1)");
    done();
  }
  catch(e) {
    done(e);
  }
})

It('yield a query should work - 1', function* (done) {
  try {
    var result = yield r.expr(1);
    assert.equal(result, 1);

    var result = yield r.expr(1).add(3);
    assert.equal(result, 4);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('yield a query should work - 2', function* (done) {
  try {
    var result = yield r.expr(1).add("foo");
    done(new Error("Was expecting an error"));
  }
  catch(e) {
    if (e.message.match(/Expected type NUMBER but found STRING/)) {
      done();
    }
    else {
      done(e);
    }
  }
})
