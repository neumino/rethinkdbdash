var config = require('./config.js');
var r = require('../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It

var dbName, tableName, tableName2, cursor, result, pks, feed;

var numDocs = 100; // Number of documents in the "big table" used to test the SUCCESS_PARTIAL 
var smallNumDocs = 5; // Number of documents in the "small table"

It('Init for `cursor.js`', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid(); // Big table to test partial sequence
    tableName2 = uuid(); // small table to test success sequence

    result = yield r.dbCreate(dbName).run()
    assert.equal(result.dbs_created, 1);
    result = yield [r.db(dbName).tableCreate(tableName)('tables_created').run(), r.db(dbName).tableCreate(tableName2)('tables_created').run()]
    assert.deepEqual(result, [1, 1]);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('Inserting batch - table 1', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(numDocs).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, numDocs);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('Inserting batch - table 2', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName2).insert(eval('['+new Array(smallNumDocs).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, smallNumDocs);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('Updating batch', function* (done) {
  try {
    // Add a date
    result = yield r.db(dbName).table(tableName).update({
      date: r.now().sub(r.random().mul(1000000)),
      value: r.random()
    }, {nonAtomic: true}).run();
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`table` should return a cursor', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    assert(cursor);
    assert.equal(cursor.toString(), '[object Cursor]');

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`next` should return a document', function* (done) {
  try {
    result = yield cursor.next();
    assert(result);
    assert(result.id);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`each` should work', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    assert(cursor);
    var count = 0;
    cursor.each(function(err, result) {
      count++;
      if (count === numDocs) {
        done();
      }
    })
  }
  catch(e) {
    done(e);
  }
})
It('`eachAsync` should work', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    assert(cursor);
    var history = [];
    var count = 0;
    var promisesWait = 0;
    cursor.eachAsync(function(result) {
      history.push(count);
      count++;
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          history.push(promisesWait);
          promisesWait--;

          if (count === numDocs) {
            var expected = [];
            for(var i=0; i<numDocs; i++) {
              expected.push(i);
              expected.push(-1*i);
            }
            assert.deepEqual(history, expected)
          }
          resolve();
        }, 1);
      });
    }).then(done);
  }
  catch(e) {
    done(e);
  }
})

It('`eachAsync` should work - callback style', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    assert(cursor);
    var count = 0;
    var now = Date.now();
    var timeout = 10;
    cursor.eachAsync(function(result, onRowFinished) {
      count++;
      setTimeout(function() {
        onRowFinished();
      }, timeout)
    }).then(function() {
      var elapsed = Date.now()-now;
      assert(elapsed >= timeout*count);
      done();
    });
  }
  catch(e) {
    done(e);
  }
})

It('`each` should work - onFinish - reach end', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    assert(cursor);
    var count = 0;
    cursor.each(function(err, result) {
    }, done)
  }
  catch(e) {
    done(e);
  }
})
It('`each` should work - onFinish - return false', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    assert(cursor);
    var count = 0;
    cursor.each(function(err, result) {
      count++
      return false
    }, function() {
      assert.equal(count, 1);
      done();
    })
  }
  catch(e) {
    done(e);
  }
})


It('`toArray` should work', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    result = yield cursor.toArray();
    assert.equal(result.length, numDocs);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`toArray` should work -- with a profile', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).run({cursor: true, profile: true});
    result = yield result.result.toArray();
    assert.equal(result.length, numDocs);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`toArray` should work with a datum', function* (done) {
  try {
    cursor = yield r.expr([1,2,3]).run({cursor: true});
    result = yield cursor.toArray();
    assert.deepEqual(result, [1,2,3]);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`table` should return a cursor - 2', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
    assert(cursor);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`next` should return a document - 2', function* (done) {
  try {
    result = yield cursor.next();
    assert(result);
    assert(result.id);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`next` should work -- testing common pattern', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
    assert(cursor);
    var i=0;
    while(true) {
      try{
        result = yield cursor.next();
        assert(result);
        i++;
      }
      catch(e) {
        if (e.message === "No more rows in the cursor.") {
          assert.equal(smallNumDocs, i);
          done();
          break;
        }
        else {
          done(e);
          break;
        }
      }
    }
  }
  catch(e) {
    done(e);
  }
})
It('`toArray` should work - 2', function* (done) {
  try {
    var cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
    result = yield cursor.toArray();
    assert.equal(result.length, smallNumDocs);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`cursor.close` should return a promise', function* (done) {
  try {
    var cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
    yield cursor.close();
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`cursor.close` should still return a promise if the cursor was closed', function* (done) {
  try {
    var cursor = yield r.db(dbName).table(tableName2).changes().run();
    yield cursor.close();
    yield cursor.close();
    done();
  }
  catch(e) {
    done(e);
  }
})

It('cursor shouldn\'t throw if the user try to serialize it in JSON', function* (done) {
  try {
    var cursor = yield r.db(dbName).table(tableName).run({cursor: true});
    cursor.toJSON()
    done(new Error('Was expecting an error'));
  }
  catch(e) {
    assert.equal(e.message, "You cannot serialize a Cursor to JSON. Retrieve data from the cursor with `toArray` or `next`.");
    done();
  }
})

// This test is not working for now -- need more data? Server bug?
It('Remove the field `val` in some docs', function* (done) {
  var i=0;
  try {
    result = yield r.db(dbName).table(tableName).update({val: 1}).run();
    //assert.equal(result.replaced, numDocs);

    result = yield r.db(dbName).table(tableName)
      .orderBy({index: r.desc("id")}).limit(5).replace(r.row.without("val"))
      //.sample(1).replace(r.row.without("val"))
      .run({cursor: true});
    assert.equal(result.replaced, 5);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`toArray` with multiple batches - testing empty SUCCESS_COMPLETE', function* (done) {
  var i=0;
  try {
    var connection = yield r.connect({host: config.host, port: config.port, authKey: config.authKey});
    assert(connection);

    cursor = yield r.db(dbName).table(tableName).run(connection, {cursor: true, maxBatchRows: 1});

    assert(cursor);
    result = yield cursor.toArray();
    done();
  }
  catch(e) {
    done(e);
  }
})
It('Automatic coercion from cursor to table with multiple batches', function* (done) {
  var i=0;
  try {
    var connection = yield r.connect({host: config.host, port: config.port, authKey: config.authKey});
    assert(connection);

    result = yield r.db(dbName).table(tableName).run(connection, {maxBatchRows: 1});
    assert(result.length > 0);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`next` with multiple batches', function* (done) {
  var i=0;
  try {
    var connection = yield r.connect({host: config.host, port: config.port, authKey: config.authKey});
    assert(connection);

    cursor = yield r.db(dbName).table(tableName).run(connection, {cursor: true, maxBatchRows: 1});

    assert(cursor);
    while(true) {
      try {
        result = yield cursor.next();
        i++;
      }
      catch(e) {
        if ((i > 0) && (e.message === "No more rows in the cursor.")) {
          connection.close();
          done()
        }
        else {
          done(e);
        }
        break;
      }
    }
  }
  catch(e) {
    done(e);
  }
})
It('`next` should error when hitting an error -- not on the first batch', function* (done) {
  var i=0;
  try {
    var connection = yield r.connect({host: config.host, port: config.port, authKey: config.authKey});
    assert(connection);

    var cursor = yield r.db(dbName).table(tableName)
      .orderBy({index: "id"})
      .map(r.row("val").add(1))
      .run(connection, {cursor: true, maxBatchRows: 10});

    assert(cursor);
    while(true) {
      try {
        result = yield cursor.next();
        i++;
      }
      catch(e) {
        if ((i > 0) && (e.message.match(/^No attribute `val` in object/))) {
          connection.close();
          done()
        }
        else {
          done(e);
        }
        break;
      }
    }
  }
  catch(e) {
    done(e);
  }
})

It('`changes` should return a feed', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).changes().run();
    assert(feed);
    assert.equal(feed.toString(), '[object Feed]');
    yield feed.close();
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`changes` should work with squash: true', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).changes({squash: true}).run();
    assert(feed);
    assert.equal(feed.toString(), '[object Feed]');
    yield feed.close();
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`get.changes` should return a feed', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).get(1).changes().run();
    assert(feed);
    assert.equal(feed.toString(), '[object AtomFeed]');
    yield feed.close();
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`orderBy.limit.changes` should return a feed', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).orderBy({index: 'id'}).limit(2).changes().run();
    assert(feed);
    assert.equal(feed.toString(), '[object OrderByLimitFeed]');
    yield feed.close();
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`changes` with `includeOffsets` should work', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).orderBy({index: 'id'}).limit(2).changes({
      includeOffsets: true,
      includeInitial: true
    }).run();

    var counter = 0;
    feed.each(function(error, change) {
      assert(typeof change.new_offset === 'number');
      if (counter >= 2) {
        assert(typeof change.old_offset === 'number');
        feed.close().then(function() {
          done();
        }).error(done);
      }
      counter++;
    });

    yield r.db(dbName).table(tableName).insert({id: 0});

    //done();
  }
  catch(e) {
    done(e);
  }
})

It('`changes` with `includeTypes` should work', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).orderBy({index: 'id'}).limit(2).changes({
      includeTypes: true,
      includeInitial: true
    }).run();

    var counter = 0;
    feed.each(function(error, change) {
      assert(typeof change.type === 'string');
      if (counter > 0) {
        feed.close().then(function() {
          done();
        }).error(done);
      }
      counter++;
    });

    yield r.db(dbName).table(tableName).insert({id: 0});

    //done();
  }
  catch(e) {
    done(e);
  }
})


It('`next` should work on a feed', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).update({foo: r.now()}).run();
    }, 100)
    assert(feed);
    var i=0;
    while(true) {
      result = yield feed.next();
      assert(result);
      i++;
      if (i === smallNumDocs) {
        yield feed.close();
        done();
        break;
      }
    }
  }
  catch(e) {
    done(e);
  }
})
It('`next` should work on an atom feed', function* (done) {
  try {
    var idValue = uuid();
    feed = yield r.db(dbName).table(tableName2).get(idValue).changes({includeInitial: true}).run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).insert({id: idValue}).run();
    }, 100)
    assert(feed);
    var i=0;
    var change = yield feed.next();
    assert.deepEqual(change, {new_val: null});
    change = yield feed.next();
    assert.deepEqual(change, {new_val: {id: idValue}, old_val: null});
    yield feed.close();

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`close` should work on feed', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      feed.close().then(function() {
        done();
      });
    }, 1000)
    assert(feed);
  }
  catch(e) {
    done(e);
  }
})

It('`close` should work on feed with events', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      feed.close();
    }, 1000)
    assert(feed);
    feed.on('error', function() {
      // Ignore the error
    });
    feed.on('end', function() {
      done();
    });
  }
  catch(e) {
    done(e);
  }
})
It('`on` should work on feed', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).update({foo: r.now()}).run();
    }, 100)
    var i=0;
    feed.on('data', function() {
      i++;
      if (i === smallNumDocs) {
        feed.close().then(function() {
          done();
        }).error(function(error) {
          done(error);
        });
      }
    });
    feed.on('error', function(e) {
      done(e)
    })
  }
  catch(e) {
    done(e);
  }
})
It('`on` should work on cursor - a `end` event shoul be eventually emitted on a cursor', function* (done) {
  try {
    cursor = yield r.db(dbName).table(tableName2).run({cursor: true});
    setTimeout(function() {
      r.db(dbName).table(tableName2).update({foo: r.now()}).run();
    }, 100)
    cursor.on('end', function() {
      done()
    });
    cursor.on('error', function(e) {
      done(e)
    })
  }
  catch(e) {
    done(e);
  }
})

It('`next`, `each`, `toArray` should be deactivated if the EventEmitter interface is used', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).update({foo: r.now()}).run();
    }, 100)
    feed.on('data', function() { });
    feed.on('error', function(error) {
      done(error);
    });
    assert.throws(function() {
      feed.next();
    }, function(e) {
      if (e.message === 'You cannot call `next` once you have bound listeners on the Feed.') {
        feed.close().then(function() {
          done();
        }).error(function(error) {
          done(error);
        });
      }
      else {
        done(e);
      }
      return true;
    })
  }
  catch(e) {
    done(e);
  }
})

It('Import with cursor as default', function* (done) {
  yield util.sleep(1000);
  var r1 = require('../lib')({cursor: true, host: config.host, port: config.port, authKey: config.authKey, buffer: config.buffer, max: config.max, silent: true});
  var i=0;
  try {
    cursor = yield r1.db(dbName).table(tableName).run();
    assert.equal(cursor.toString(), '[object Cursor]');
    yield cursor.close();
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`each` should not return an error if the feed is closed - 1', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).limit(2).update({foo: r.now()}).run();
    }, 100)
    var count = 0;
    feed.each(function(err, result) {
      if (result.new_val.foo instanceof Date) {
        count++;
      }
      if (count === 1) {
        setTimeout(function() {
          feed.close().then(function() {
            done();
          }).error(done);
        }, 100);
      }
    });
  }
  catch(e) {
    done(e);
  }
})
It('`each` should not return an error if the feed is closed - 2', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).limit(2).update({foo: r.now()}).run();
    }, 100)
    var count = 0;
    feed.each(function(err, result) {
      if (result.new_val.foo instanceof Date) {
        count++;
      }
      if (count === 2) {
        setTimeout(function() {
          feed.close().then(function() {
            done();
          }).error(done);
        }, 100);
      }
    });
  }
  catch(e) {
    done(e);
  }
})
It('events should not return an error if the feed is closed - 1', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).get(1).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).insert({id: 1}).run();
    }, 100)
    feed.each(function(err, result) {
      if (err) {
        return done(err);
      }
      if ((result.new_val != null) && (result.new_val.id === 1)) {
        feed.close().then(function() {
          done();
        }).error(done);
      }
    });
  }
  catch(e) {
    done(e);
  }
})
It('events should not return an error if the feed is closed - 2', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName2).changes().run();
    setTimeout(function() {
      r.db(dbName).table(tableName2).limit(2).update({foo: r.now()}).run();
    },100)
    var count = 0;
    feed.on('data', function(result) {
      if (result.new_val.foo instanceof Date) {
        count++;
      }
      if (count === 1) {
        setTimeout(function() {
          feed.close().then(function() {
            done();
          }).error(done);
        }, 100);
      }
    });
  }
  catch(e) {
    done(e);
  }
})
It('`includeStates` should work', function* (done) {
  try {
    feed = yield r.db(dbName).table(tableName).orderBy({index: 'id'}).limit(10).changes({includeStates: true, includeInitial: true}).run();
    var i = 0;
    feed.each(function(err, change) {
      i++;
      if (i === 10) {
        feed.close();
        done();
      }
    });
  }
  catch(e) {
    done(e);
  }
})
It('`each` should return an error if the connection dies', function* (done) {
  var connection = yield r.connect({host: config.host, port: config.port, authKey: config.authKey});
  assert(connection);

  var feed = yield r.db(dbName).table(tableName).changes().run(connection);
  feed.each(function(err, change) {
    assert(err.message.match(/^The connection was closed before the query could be completed for/))
    done();
  });
  // Kill the TCP connection
  connection.connection.end()
})
It('`eachAync` should return an error if the connection dies', function* (done) {
  var connection = yield r.connect({host: config.host, port: config.port, authKey: config.authKey});
  assert(connection);

  var feed = yield r.db(dbName).table(tableName).changes().run(connection);
  feed.eachAsync(function(change) {}).error(function(err) {
    assert(err.message.match(/^The connection was closed before the query could be completed for/))
    done();
  });
  // Kill the TCP connection
  connection.connection.end()
})


