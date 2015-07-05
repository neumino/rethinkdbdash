var config = require(__dirname+'/../test/config.js');
var longConfig = require(__dirname+'/config.js');

var assert = require('assert');
var util = require(__dirname+'/../test/util/common.js');
var uuid = util.uuid;
var It = util.It;

var spawn = require('child_process').spawn
var cmd = longConfig.cmd;
var host = config.host;

var INITIAL_OFFSET = longConfig.initialOffset;
var CLUSTER_PORT = 29015
var DRIVER_PORT = 28015;
var DATA_DIR = longConfig.dataDir;
var BUFFER = longConfig.buffer;
var MAX = longConfig.max;

var FEED_QUERY = longConfig.feedQuery;
var NUM_SERVERS = longConfig.numServers;

It('Test that pools are created and identified with discovery: true', function* (done) {
  console.log('');
  console.log('++ Starting servers');
  var servers = [];
  for(var portOffset=INITIAL_OFFSET; portOffset<INITIAL_OFFSET+NUM_SERVERS; portOffset++) {
    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', DATA_DIR+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--bind', 'all',
        '--join', 'localhost:'+(CLUSTER_PORT+INITIAL_OFFSET)
    ])
    //child.stdout.on('data', function(x) { console.log(x.toString())});
    //child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);
  }

  // Give 2 seconds for the servers to start
  yield util.sleep(2000);
  console.log('++ Starting rethinkdbdash');
  var r = require(__dirname+'/../lib')({
    host: host,
    port: DRIVER_PORT+INITIAL_OFFSET,
    discovery: true,
    max: MAX,
    buffer: BUFFER,
  });

  // Make sure we have enough healthy pools, try and retest every second for at most 5 seconds.
  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    try {
      // Expect NUM_SERVERS different pools
      assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS);
      // Expect NUM_SERVERS known pools
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS+1); // +1 for UNKNOWN_POOLS
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

  // Test the parameters for each pool
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/NUM_SERVERS));
    assert.equal(r.getPool(i).options.max, Math.ceil(MAX/NUM_SERVERS));
  }

  // Time to close the extra connection;
  yield util.sleep(1000);
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    // We have one change feed opened somewhere
    if (r.getPool(i).getAvailableLength() < Math.ceil(BUFFER/NUM_SERVERS)) {
      done(new Error('Not enough available connections'))
    }
  }

  // Assert that a changefeed on table_status exists
  var queries = yield r.db('rethinkdb').table('jobs')('info')('query').run();
  var found = false;
  for(var i=0; i<queries.length; i++) {
    if (queries[i] === FEED_QUERY) {
      found = true;
      break;
    }
  }
  assert(found, 'Feed opened');

  // Kill one server, test, then restart it
  for(var portOffset=INITIAL_OFFSET; portOffset<INITIAL_OFFSET+NUM_SERVERS; portOffset++) {
    var server = servers.shift();
    console.log('++ Killing a server');
    server.kill();

    var wait = 0;
    var extra = 1000;
    var maxWait = 5000;
    var pass = false;
    while (pass === false && wait < maxWait) {
      yield util.sleep(extra);
      try {
        // Expect NUM_SERVERS-1 different pools
        assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS-1);
        // Expect NUM_SERVERS known pools
        assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS-1+1); // +1 for UNKNOWN_POOLS
        pass = true;
      }
      catch(err) {
        wait += extra;
      }
    }
    if (pass === false) {
      done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
    }

    // Test the parameters for each pool
    for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
      assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/(NUM_SERVERS-1)));
      assert.equal(r.getPool(i).options.max, Math.ceil(MAX/(NUM_SERVERS-1)));
    }

    var found = false;
    var queries = yield r.db('rethinkdb').table('jobs')('info')('query').run();
    for(var i=0; i<queries.length; i++) {
      if (queries[i] === FEED_QUERY) {
        found = true;
        break;
      }
    }
    assert(found, 'Feed opened');

    console.log('++ Restarting a server');
    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', DATA_DIR+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--bind', 'all',
        '--join', 'localhost:'+(CLUSTER_PORT+INITIAL_OFFSET)
    ])
    //child.stdout.on('data', function(x) { console.log(x.toString())});
    //child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);

    var wait = 0;
    var extra = 1000;
    var maxWait = 5000;
    var pass = false;
    while (pass === false && wait < maxWait) {
      yield util.sleep(extra);
      try {
        // Expect NUM_SERVERS different pools
        assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS);
        // Expect NUM_SERVERS known pools
        assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS+1); // +1 for UNKNOWN_POOLS
        pass = true;
      }
      catch(err) {
        wait += extra;
      }
    }
    if (pass === false) {
      done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
    }

    // Test the parameters for each pool
    for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
      assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/(NUM_SERVERS)));
      assert.equal(r.getPool(i).options.max, Math.ceil(MAX/(NUM_SERVERS)));
    }
  }

  // Add a new server
  console.log('++ Adding a new server');
  var portOffset = NUM_SERVERS+1;
  var child = spawn(cmd, [
      '--port-offset',  INITIAL_OFFSET+portOffset,
      '--directory', DATA_DIR+portOffset,
      '--server-name',  'rethinkdbdash'+portOffset,
        '--bind', 'all',
      '--join', 'localhost:'+(CLUSTER_PORT+INITIAL_OFFSET)
  ])
  //child.stdout.on('data', function(x) { console.log(x.toString())});
  //child.stderr.on('data', function(x) { console.log(x.toString())});
  servers.push(child);


  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    // Expect NUM_SERVERS+1 different pools
    try {
      assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS+1);
      // Expect NUM_SERVERS+1 known pools
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS+1+1); // +1 for UNKNOWN_POOLS

      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

  // Test the parameters for each pool
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/(NUM_SERVERS+1)));
    assert.equal(r.getPool(i).options.max, Math.ceil(MAX/(NUM_SERVERS+1)));
  }

  console.log('++ Removing the extra server');
  var server = servers.pop();
  server.kill();

  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    // Expect NUM_SERVERS different pools
    try {
      assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS);
      // Expect NUM_SERVERS known pools
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS+1); // +1 for UNKNOWN_POOLS
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

 
  // Kill all servers except the last one
  console.log('++ Removing all the servers except the last one');
  while (servers.length > 1) {
    var server = servers.shift();
    server.kill();
  }

  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    try {
      // Expect 1 different pools
      assert.equal(r.getPoolMaster()._healthyPools.length, 1);
      // Expect 1 known pools
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, 1+1); // +1 for UNKNOWN_POOLS
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

  // Test the parameters for each pool
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/(1)));
    assert.equal(r.getPool(i).options.max, Math.ceil(MAX/(1)));
  }


  console.log('++ Removing the last server');
  // Kill the last server
  var server = servers.pop();
  server.kill();

  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    try {
      // Expect 0 healthy pools
      assert.equal(r.getPoolMaster()._healthyPools.length, 0);

      // Expect 1 known pools
      // In discovery mode, when the last pool dies, we don't delete it as we may use it to seed
      // things again
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, 1+1); // +1 for UNKNOWN_POOLS
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

  // Restart all the servers except the last one
  console.log('++ Restart all the servers except the last one (includes the seed)');
  for(var portOffset=INITIAL_OFFSET; portOffset<INITIAL_OFFSET+NUM_SERVERS-1; portOffset++) {
    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', DATA_DIR+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--bind', 'all',
        '--join', 'localhost:'+(CLUSTER_PORT+INITIAL_OFFSET)
    ])
    //child.stdout.on('data', function(x) { console.log(x.toString())});
    //child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);
  }

  // Make sure we have enough healthy pools, try and retest every second for at most 5 seconds.
  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    try {
      // Expect NUM_SERVERS different pools
      assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS-1);
      // Expect NUM_SERVERS-1 known pools
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS-1+1); // +1 for UNKNOWN_POOLS
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

  // Test the parameters for each pool
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/(NUM_SERVERS-1)));
    assert.equal(r.getPool(i).options.max, Math.ceil(MAX/(NUM_SERVERS-1)));
  }

  // Restart the last server
  var portOffset = INITIAL_OFFSET+NUM_SERVERS-1;
  var child = spawn(cmd, [
      '--port-offset',  portOffset,
      '--directory', DATA_DIR+portOffset,
      '--server-name',  'rethinkdbdash'+portOffset,
      '--bind', 'all',
      '--join', 'localhost:'+(CLUSTER_PORT+INITIAL_OFFSET)
  ])
  //child.stdout.on('data', function(x) { console.log(x.toString())});
  //child.stderr.on('data', function(x) { console.log(x.toString())});
  servers.push(child);

  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    try {
      // Expect NUM_SERVERS different pools
      assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS);
      // Expect NUM_SERVERS-1 known pools
      assert.equal(Object.keys(r.getPoolMaster()._pools).length, NUM_SERVERS+1); // +1 for UNKNOWN_POOLS
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

  // Test the parameters for each pool
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    assert.equal(r.getPool(i).options.buffer, Math.ceil(BUFFER/(NUM_SERVERS)));
    assert.equal(r.getPool(i).options.max, Math.ceil(MAX/(NUM_SERVERS)));
  }

  // Fill the pools, and tests that we use as many connections as allowed
  for(var i=0; i<MAX+1; i++) {
    // These queries take 2 seconds to fail
    r.js('while (true) {}', {timeout: 2}).run().then(function() {}).error(function() {});
  }
  for(var i=0; i<r.getPoolMaster()._healthyPools.length; i++) {
    assert.equal(r.getPool(i).getLength(), Math.ceil(MAX/(NUM_SERVERS)));
  }

  yield r.getPoolMaster().drain();
  for(var i=0; i<servers.length; i++) {
    servers[i].kill();
  }
  yield util.sleep(2000);
  done();
});
