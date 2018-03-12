var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var Promise = require('bluebird');

var It = util.It;
var uuid = util.uuid;

var dbName, tableName, result, pks;


It('Init for `administration.js`', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid();

    result = yield r.dbCreate(dbName).run();
    assert.equal(result.dbs_created, 1);

    result = yield r.db(dbName).tableCreate(tableName).run();
    assert.equal(result.tables_created, 1);

    result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, 100);
    pks = result.generated_keys;

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`config` should work', function* (done) {
  try {
    result = yield r.db(dbName).config().run();
    assert.equal(result.name, dbName);

    result = yield r.db(dbName).table(tableName).config().run();
    assert.equal(result.name, tableName);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`config` should throw if called with an argument', function* (done) {
  try{
    var result = yield r.db(dbName).config("hello").run();
  }
  catch(e) {
    if (e.message.match(/^`config` takes 0 argument, 1 provided after:/)) {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`status` should work', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).status().run();
    assert.equal(result.name, tableName);
    assert.notEqual(result.status, undefined);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`status` should throw if called with an argument', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).status("hello").run();
  }
  catch(e) {
    if (e.message.match(/^`status` takes 0 argument, 1 provided after:/)) {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`wait` should work', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).wait().run();
    assert.equal(result.ready, 1);

    yield r.db(dbName).table(tableName).wait({waitFor: 'ready_for_writes', timeout: 2000}).run();
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`wait` should work with options', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).wait({waitFor: 'ready_for_writes'}).run();
    assert.equal(result.ready, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})


It('`r.wait` should throw', function* (done) {
  try {
    result = yield r.wait().run();
    done(new Error('r.wait is expected to throw'));
  }
  catch(e) {
    if (e.message.match(/^`wait` can only be called on a table or a database since 2.3./)) {
      done();
    }
    else {
      done(e);
    }
  }
})

It('`wait` should throw if called with 2 arguments', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).wait("hello", "world").run();
  }
  catch(e) {
    if (e.message.match(/^`wait` takes at most 1 argument, 2 provided after:/)) {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`reconfigure` should work - 1', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).reconfigure({shards: 1, replicas: 1}).run();
    assert.equal(result.reconfigured, 1);

    done();
  }
  catch(e) {
console.log(e);
    done(e);
  }
})

It('`reconfigure` should work - 2 - dryRun', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).reconfigure({shards: 1, replicas: 1, dryRun: true}).run();
    assert.equal(result.reconfigured, 0);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`r.reconfigure` should throw', function* (done) {
  try {
    result = yield r.reconfigure().run();
    done(new Error('r.reconfigure is expected to throw'));
  }
  catch(e) {
    if (e.message.match(/^`reconfigure` can only be called on a table or a database since 2.3./)) {
      done();
    }
    else {
      done(e);
    }
  }
})

It('`reconfigure` should throw on an unrecognized key', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).reconfigure({foo: 1}).run();
    assert.equal(result.reconfigured, 0);

    done();
  }
  catch(e) {
    if (e.message.match(/^Unrecognized option `foo` in `reconfigure` after:/)) {
      done();
    }
    else{
      done(e);
    }
  }
})


It('`reconfigure` should throw on a number', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).reconfigure(1).run();

    done();
  }
  catch(e) {
    if (e.message.match(/^First argument of `reconfigure` must be an object./)) {
      done();
    }
    else{
      done(e);
    }

  }
})

It('`rebalanced` should work - 1', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).rebalance().run();
    assert.equal(result.rebalanced, 1);

    done();
  }
  catch(e) {
console.log(e);
    done(e);
  }
})

It('`r.rebalance` should throw', function* (done) {
  try {
    result = yield r.rebalance().run();
    done(new Error('r.rebalance is expected to throw'));
  }
  catch(e) {
    if (e.message.match(/^`rebalance` can only be called on a table or a database since 2.3./)) {
      done();
    }
    else {
      done(e);
    }
  }
})

It('`rebalance` should throw if an argument is provided', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).rebalance(1).run();

    done();
  }
  catch(e) {
    if (e.message.match(/^`rebalance` takes 0 argument, 1 provided after:/)) {
      done();
    }
    else{
      done(e);
    }

  }
})

