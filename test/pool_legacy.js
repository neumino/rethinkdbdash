var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')({pool: false, silent: true});
var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var Promise = require('bluebird');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result, pks;

var options = {
  max: 10,
  buffer: 2,
  host: config.host,
  port: config.port,
  authKey: config.authKey,
  discovery: false,
  silent: true
};

It('`createPool` should create a PoolMaster and `getPoolMaster` should return it', function* (done) {
  try {
    r = r.createPools(options);
    assert(r.getPoolMaster(config));
    assert.equal(r.getPoolMaster().getPools().length, 1)
    done();
  }
  catch(e) {
    done(e);
  }
});

//TODO try to make this tests a little more deterministic
It('`run` should work without a connection if a pool exists', function* (done) {
  try {
    result = yield r.expr(1).run()
    assert.equal(result, 1);
    done()
  }
  catch(e) {
    done(e);
  }
});
It('The pool should keep a buffer', function* (done) {
  try {
    result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]
    assert.deepEqual(result, [1,1,1,1,1]);
    assert(r.getPool(0).getLength() >= options.buffer+result.length);

    setTimeout( function() {
      assert(r.getPool(0).getAvailableLength() >= result.length) // The connections created for the buffer may not be available yet
      assert.equal(r.getPool(0).getLength(), r.getPool(0).getLength())
      done();
    }, 500)
  }
  catch(e) {
    done(e);
  }
});
It('A noreply query should release the connection', function* (done) {
  try {
    var numConnections = r.getPool(0).getLength();
    yield r.expr(1).run({noreply: true})
    assert.equal(r.getPool(0).getLength(), numConnections);
    done();
  }
  catch(e) {
    console.log(e)
    done(e);
  }
});
It('The pool should not have more than `options.max` connections', function* (done) {
  try {
    result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]
    assert.deepEqual(result, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1])
    assert.equal(r.getPool(0).getLength(), options.max)

    setTimeout( function() {
      assert.equal(r.getPool(0).getAvailableLength(), options.max)
      assert.equal(r.getPool(0).getAvailableLength(), r.getPool(0).getLength())
      done()
    }, 500)
  }
  catch(e) {
    done(e);
  }
});

It('Init for `pool.js`', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid();

    result = yield r.dbCreate(dbName).run();
    assert.equal(result.dbs_created, 1);

    result = yield r.db(dbName).tableCreate(tableName).run();
    assert.equal(result.tables_created, 1);

    result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(10000).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, 10000);
    pks = result.generated_keys;

    done();
  }
  catch(e) {
    done(e);
  }
})
It('Updating data to make it heavier', function* (done) {
  try {
    //Making bigger documents to retrieve multiple batches
    var result = yield r.db(dbName).table(tableName).update({
      "foo": uuid(),
      "fooo": uuid(),
      "foooo": uuid(),
      "fooooo": uuid(),
      "foooooo": uuid(),
      "fooooooo": uuid(),
      "foooooooo": uuid(),
      "fooooooooo": uuid(),
      "foooooooooo": uuid(),
      date: r.now()
    }).run();
    done();
  }
  catch(e) {
    done(e);
  }
})



It('The pool should release a connection only when the cursor has fetch everything or get closed', function* (done) {
  try {
    result = yield [r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true}),r.db(dbName).table(tableName).run({cursor: true})];
    assert.equal(result.length, 10);
    assert.equal(r.getPool(0).getAvailableLength(), 0);
    yield result[0].toArray();
    assert.equal(r.getPool(0).getAvailableLength(), 1);
    yield result[1].toArray();
    assert.equal(r.getPool(0).getAvailableLength(), 2);
    yield result[2].close();
    assert.equal(r.getPool(0).getAvailableLength(), 3);
    yield [result[3].close(), result[4].close(), result[5].close(), result[6].close(), result[7].close(), result[8].close(), result[9].close()]
    done();
  }
  catch(e) {
    done(e);
  }
});

It('The pool should shrink if a connection is not used for some time', function* (done) {
  try{
    r.getPool(0).setOptions({timeoutGb: 100});

    result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]

    assert.deepEqual(result, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])

    setTimeout(function() {
      assert.equal(r.getPool(0).getAvailableLength(), options.buffer)
      assert.equal(r.getPool(0).getLength(), options.buffer)
      done()
    },1000)
  }
  catch(e) {
    done(e);
  }
});

It('`poolMaster.drain` should eventually remove all the connections', function* (done) {
  try{
    yield r.getPoolMaster().drain();

    assert.equal(r.getPool(0).getAvailableLength(), 0)
    assert.equal(r.getPool(0).getLength(), 0)

    done()
  }
  catch(e) {
    done(e);
  }
});
It('If the pool cannot create a connection, it should reject queries', function* (done) {
  try {
    var r = require(__dirname+'/../lib')({host: "notarealhost", buffer: 1, max: 2, silent: true});
    yield r.expr(1).run()
    done(new Error("Was expecting an error"));
  }
  catch(e) {
    if (e.message === "None of the pools have an opened connection and failed to open a new one.") {
      done()
    }
    else {
      done(e);
    }
  }
});
It('If the pool cannot create a connection, it should reject queries - timeout', function* (done) {
  try {
    var r = require(__dirname+'/../lib')({host: "notarealhost", buffer: 1, max: 2, silent: true});
    yield new Promise(function(resolve, reject) { setTimeout(resolve, 1000) });
    yield r.expr(1).run()
    done(new Error("Was expecting an error"));
  }
  catch(e) {
    if (e.message === "None of the pools have an opened connection and failed to open a new one.") {
      done()
    }
    else {
      done(e);
    }
  }
});


It('If the pool is drained, it should reject queries - 1', function* (done) {
  try {
    var r = require(__dirname+'/../lib')({buffer: 1, max: 2, silent: true});

    r.getPoolMaster().drain();
    var result = yield r.expr(1).run();
    done(new Error("Was expecting an error"));
  }
  catch(e) {
    if (e.message === "None of the pools have an opened connection and failed to open a new one.") {
      done()
    }
    else {
      done(e);
    }
  }
});

It('If the pool is drained, it should reject queries - 2', function* (done) {
  try {
    var r = require(__dirname+'/../lib')({buffer: 1, max: 2, silent: true});

    yield r.getPoolMaster().drain();
    var result = yield r.expr(1).run();
    done(new Error("Was expecting an error"));
  }
  catch(e) {
    if (e.message === "None of the pools have an opened connection and failed to open a new one.") {
      done()
    }
    else {
      done(e);
    }
  }
});

It('`drain` should work in case of failures', function* (done) {
  try {
    r = r.createPools({
      port: 80, // non valid port
      silent: true,
      timeoutError: 100
    });
    var pool = r.getPool(0);
    // Sleep 1 sec
    yield new Promise(function(resolve, reject) { setTimeout(resolve, 150) });
    pool.drain();

    // timeoutReconnect should have been canceled
    assert.equal(pool.timeoutReconnect, null);
    pool.options.silent = false;
    yield new Promise(function(resolve, reject) { setTimeout(resolve, 1000) });
    done();
  }
  catch(e) {
    done(e);
  }
});


/*
// This doesn't work anymore because since the JSON protocol was introduced.
It('The pool should remove a connection if it errored', function* (done) {
  try{
    r.getPool(0).setOptions({timeoutGb: 60*60*1000});

    result = yield [r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run(), r.expr(1).run()]

    assert.deepEqual(result, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1])

    // This query will make the error return an error -1
    result = yield r.expr(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
      .run()


  }
  catch(e) {
    if ((true) || (e.message === "Client is buggy (failed to deserialize protobuf)")) {
      // We expect the connection that errored to get closed in the next second
      setTimeout(function() {
        assert.equal(r.getPool().getAvailableLength(), options.max-1)
        assert.equal(r.getPool().getLength(), options.max-1)
        done()
      }, 1000)
    }
    else {
      done(e);
    }

  }
});
*/
