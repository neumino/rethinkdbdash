var config = require(__dirname+'/config.js');
var assert = require('assert');
var util = require(__dirname+'/util/common.js');
var uuid = util.uuid;
var It = util.It;

var spawn = require('child_process').spawn
var cmd = '/home/michel/projects/rethinkdb-all/rethinkdb/build/debug/rethinkdb';//'rethinkdb';
var host = config.host;
var dataDir = 'rethinkdbdash_datadir';
var initialOffset = 180;
var clusterPort = 29015
var driverPort = 28015;


It('Test that pools are created and identified with discovery: true', function* (done) {
  var servers = [];
  for(var portOffset=initialOffset; portOffset<initialOffset+3; portOffset++) {

    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', dataDir+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--join', 'localhost:'+(29015+initialOffset)
    ])
    child.stdout.on('data', function(x) { console.log(x.toString())});
    child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);
  }
  yield util.sleep(2000);
  var r = require(__dirname+'/../lib')({
    host: host,
    port: driverPort+initialOffset,
    discovery: true,
    max: 10,
    buffer: 5,

  });
  yield util.sleep(2000);
  assert.equal(r.getPoolMaster()._healthyPools.length, 3);
  assert.equal(Object.keys(r.getPoolMaster()._pools).length, 3+1); //+1 for UNKNOWN_POOLS
  yield r.getPoolMaster().drain();
  for(var i=0; i<servers.length; i++) {
    servers[i].kill();
  }
  yield util.sleep(2000);
  done();
});

It('Test that pools are created but not identified with discovery: false', function* (done) {
  var servers = [];
  for(var portOffset=initialOffset; portOffset<initialOffset+3; portOffset++) {

    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', dataDir+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--join', 'localhost:'+(29015+initialOffset)
    ])
    child.stdout.on('data', function(x) { console.log(x.toString())});
    child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);
  }
  yield util.sleep(2000);
  var r = require(__dirname+'/../lib')({
    host: host,
    port: driverPort+initialOffset,
    discovery: false,
    max: 10,
    buffer: 5,
    servers: [
      {host: host, port: driverPort+initialOffset},
      {host: host, port: driverPort+initialOffset+1},
      {host: host, port: driverPort+initialOffset+2},
    ],


  });
  yield util.sleep(2000);
  assert.equal(r.getPoolMaster()._healthyPools.length, 3);
  assert.deepEqual(Object.keys(r.getPoolMaster()._pools), ['unknownPools']);
  r.getPoolMaster().drain();
  yield util.sleep(2000);
  for(var i=0; i<servers.length; i++) {
    servers[i].kill();
  }
  done();
});


/*
It('Test pool no query with discovery: false', function* (done) {
  server1.mockServersStatus([server1])
  var r = require(__dirname+'/../lib')({
    host: server1.host,
    port: server1.port,
    max: 10,
    buffer: 5,
    discovery: false
  });

  try {
    var result = yield util.sleep(200);
    // 5 connections are immediately created
    assert.equal(r.getPool(0).getLength(), 5);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test pool no query with discovery: true', function* (done) {
  server1.mockServersStatus([server1])
  var r = require(__dirname+'/../lib')({
    host: server1.host,
    port: server1.port,
    max: 10,
    buffer: 5,
    discovery: true
  });

  try {
    var result = yield util.sleep(200);
    // 5 connections are immediately created
    // 1 connection for fetchServer (via expandAll)
    // 1 connection for fetchServer (via getConnection to refill the buffer)
    assert.equal(r.getPool(0).getLength(), 7);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test expanding the pool with discovery: false', function* (done) {
  server1.mockServersStatus([server1])
  var r = require(__dirname+'/../lib')({
    host: server1.host,
    port: server1.port,
    max: 9,
    buffer: 5,
    discovery: false
  });
  try {
    yield util.sleep(1000);
    assert.equal(r.getPool().getLength(), 5);
    var result = yield [
      r.expr(200).run(),
      r.expr(200).run()
    ]
    assert.equal(result.length, 2);
    assert.equal(r.getPool().getLength(), 7);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test expanding the pool with discovery: true', function* (done) {
  server1.mockServersStatus([server1])
  var r = require(__dirname+'/../lib')({
    host: server1.host,
    port: server1.port,
    max: 11,
    buffer: 5,
    discovery: true
  });
  try {
    yield util.sleep(300);
    assert.equal(r.getPool().getLength(), 7);
    var result = yield [
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run()
    ]
    assert.equal(result.length, 3);
    assert.equal(r.getPool().getLength(), 8);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test expanding the pool to max with discovery: false', function* (done) {
  server1.mockServersStatus([server1])
  var r = require(__dirname+'/../lib')({
    host: server1.host,
    port: server1.port,
    max: 9,
    buffer: 5,
    discovery: false
  });
  try {
    var result = yield [
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run()
    ]
    assert.equal(result.length, 10);
    assert.equal(r.getPool(0).getLength(), 9);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test expanding the pool to max with discovery: true', function* (done) {
  server1.mockServersStatus([server1])
  var r = require(__dirname+'/../lib')({
    host: server1.host,
    port: server1.port,
    max: 9,
    buffer: 5,
    discovery: true
  });
  try {
    yield util.sleep(100);
    assert.equal(r.getPool(0).getLength(), 7);
    var result = yield [
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run(),
      r.expr(200).run()
    ]
    assert.equal(result.length, 11);
    assert.equal(r.getPool(0).getLength(), 9);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test multiple pools with late start', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();

  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port},
      {host: server2.host, port: server2.port},
      {host: server3.host, port: server3.port}
    ],
    max: 15*3,
    buffer: 5*3,
    discovery: true
  });
  try {
    yield util.sleep(500);
    // all +1 for expandAll, and the first pool execute fetchServer
    // and recrete a connection as the first 5 have not yet returned
    var result = {6: 0, 7: 0};
    var pools = r.getPoolMaster().getPools();
    result[pools[0].getLength()]++;
    result[pools[1].getLength()]++;
    result[pools[2].getLength()]++;

    assert.deepEqual(result, {6: 2, 7: 1});
    var result = yield [
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run(),
      r.expr(400).run()
    ]
    assert.equal(result.length, 9);
    // 8 = 9/3+5
    // 5 = buffer
    assert.equal(r.getPool(0).getLength(), 8);
    assert.equal(r.getPool(1).getLength(), 8);
    assert.equal(r.getPool(2).getLength(), 8);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test multiple pools with early start', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();

  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])

  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port},
      {host: server2.host, port: server2.port},
      {host: server3.host, port: server3.port}
    ],
    max: 15*3,
    buffer: 5*3,
    discovery: true
  });
  try {
    // All these queries are fired on an empty pool master,
    // so they will each trigger expandAll
    // There's also a fetchServer happening
    var result = yield [
      r.expr(1000).run(),
      r.expr(1000).run()
    ]

    // fetchServer: all -> +1
    // queries: all +> + 1
    // server1 returns connection first and execute all the queries
    // +1 for each of them as getConnection will call expandBuffer with no available connection
    yield util.sleep(100);

    assert.equal(result.length, 2);
    var result = {8: 0, 11: 0};
    result[r.getPool(0).getLength()]++;
    result[r.getPool(1).getLength()]++;
    result[r.getPool(2).getLength()]++;

    assert.deepEqual(result, {8: 2, 11: 1});

    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test multiple pools - kill a server - check options', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();

  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])

  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port},
      {host: server2.host, port: server2.port},
      {host: server3.host, port: server3.port}
    ],
    max: 10*3,
    buffer: 4*3,
    silent: true
  });
  try {
    yield util.sleep(100);
    server2.close();

    yield util.sleep(4000);
    assert.equal(r.getPool(0).options.max, 15);
    assert.equal(r.getPool(1).options.max, 10);
    assert.equal(r.getPool(2).options.max, 15);
    assert.equal(r.getPool(0).options.buffer, 6);
    assert.equal(r.getPool(1).options.buffer, 4);
    assert.equal(r.getPool(2).options.buffer, 6);

    yield r.getPoolMaster().drain();
    // Restart server2 since we killed it
    server2 = new Server({
      host: 'localhost',
      port: server2.port
    })

    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test multiple pools - kill a server while running queries', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();

  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])

  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port},
      {host: server2.host, port: server2.port},
      {host: server3.host, port: server3.port}
    ],
    max: 10*3,
    buffer: 4*3,
    silent: true
  });
  try {
    yield util.sleep(100);
    var success = 0;
    var error = 0;
    for(var i=0; i<9; i++) {
      r.expr(100).run().then(function() {
        success++;
      }).error(function() {
        error++;
      });
    }
    server2.destroy();
    yield util.sleep(1000);
    assert.equal(r.getPool(0).options.max, 15);
    assert.equal(r.getPool(1).options.max, 10);
    assert.equal(r.getPool(2).options.max, 15);
    assert.equal(r.getPool(0).options.buffer, 6);
    assert.equal(r.getPool(1).options.buffer, 4);
    assert.equal(r.getPool(2).options.buffer, 6);

    assert.equal(success, 6);
    assert.equal(error, 3);

    yield r.getPoolMaster().drain();
    // Restart server2 since we killed it
    server2 = new Server({
      host: 'localhost',
      port: server2.port
    })

    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test multiple pools - kill a server and restart it - discovery: true', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();

  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port},
      {host: server2.host, port: server2.port},
      {host: server3.host, port: server3.port}
    ],
    max: 10*3,
    buffer: 4*3,
    silent: true,
    discovery: true
  });
  try {
    yield util.sleep(100);
    var success = 0;
    var error = 0;
    for(var i=0; i<9; i++) {
      r.expr(100).run().then(function() {
        success++;
      }).error(function() {
        error++;
      });
    }
    server2.destroy();
    yield util.sleep(1000);
    // Attempt to fill the two remaining pools
    for(var i=0; i<30; i++) {
      r.expr(100).run().then(function() {
        success++;
      }).error(function() {
        error++;
      });
    }

    // Restart server2 since we killed it
    server2 = new Server({
      host: server2.host,
      port: server2.port 
    })

    yield util.sleep(2000);
    assert.equal(r.getPool(0).options.max, 10);
    assert.equal(r.getPool(1).options.max, 10);
    assert.equal(r.getPool(2).options.max, 10);
    assert.equal(r.getPool(0).options.buffer, 4);
    assert.equal(r.getPool(1).options.buffer, 4);
    assert.equal(r.getPool(2).options.buffer, 4);

    assert.equal(success, 6+30);
    assert.equal(error, 3);

    var p = []
    for(var i=0; i<40; i++) {
      p.push(r.expr(100).run());
    }
    var result =yield p;
    assert.equal(result.length, 40);
    yield util.sleep(1000); // yield to let the connection some time to close
    assert.equal(r.getPool(0).getLength(), 10);
    assert.equal(r.getPool(1).getLength(), 10);
    assert.equal(r.getPool(2).getLength(), 10);

    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test multiple pools - kill a server and restart it - discovery: false', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();

  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])
  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port},
      {host: server2.host, port: server2.port},
      {host: server3.host, port: server3.port}
    ],
    max: 10*3,
    buffer: 4*3,
    silent: true,
    discovery: false
  });
  try {
    yield util.sleep(100);
    var success = 0;
    var error = 0;
    for(var i=0; i<9; i++) {
      r.expr(300).run().then(function(result) {
        success++;
      }).error(function() {
        error++;
      });
    }
    server2.destroy();
    yield util.sleep(1000);
    server2 = new Server({
      host: server2.host,
      port: server2.port 
    })

    yield util.sleep(2000);
    assert.equal(r.getPool(0).options.max, 10);
    assert.equal(r.getPool(1).options.max, 10);
    assert.equal(r.getPool(2).options.max, 10);
    assert.equal(r.getPool(0).options.buffer, 4);
    assert.equal(r.getPool(1).options.buffer, 4);
    assert.equal(r.getPool(2).options.buffer, 4);

    assert.equal(success, 6);
    assert.equal(error, 3);

    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test adding a new server', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();
  server1.mockServersStatus([server1, server2])
  server2.mockServersStatus([server1, server2])
  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port}
    ],
    max: 10*3,
    buffer: 4*3,
    silent: true,
    discovery: true
  });
  try {
    assert.equal(r.getPoolMaster().getPools().length, 1);
    yield util.sleep(1000);
    assert.equal(r.getPoolMaster().getPools().length, 2);

    server1.cleanMockServersStatus();
    server2.cleanMockServersStatus();
    server1.mockServersStatus([server1, server2, server3])
    server2.mockServersStatus([server1, server2, server3])
    server3.mockServersStatus([server1, server2, server3])

    r.getPoolMaster().fetchServers();
    yield util.sleep(1000);
    assert.equal(r.getPoolMaster().getPools().length, 3);
    yield r.getPoolMaster().drain();
    done();
  }
  catch(e) {
    done(e);
  }
});
It('Test removing a new server', function* (done) {
  server1.cleanMockServersStatus();
  server2.cleanMockServersStatus();
  server3.cleanMockServersStatus();
  server1.mockServersStatus([server1, server2, server3])
  server2.mockServersStatus([server1, server2, server3])
  server3.mockServersStatus([server1, server2, server3])

  server1.mockServersStatus([server1, server3])
  server3.mockServersStatus([server1, server3])

  var r = require(__dirname+'/../lib')({
    servers: [
      {host: server1.host, port: server1.port}
    ],
    max: 10*3,
    buffer: 4*3,
    silent: true,
    discovery: true
  });
  try {
    assert.equal(r.getPoolMaster().getPools().length, 1);
    yield util.sleep(500);
    assert.equal(r.getPoolMaster().getPools().length, 3);

    yield util.sleep(500);
    server1.mockServersStatus([server1, server3])
    server3.mockServersStatus([server1, server3])

    server2.close();

    yield util.sleep(500);
    assert.equal(r.getPoolMaster().getPools().length, 2);
    done();
  }
  catch(e) {
    done(e);
  }
});
*/
