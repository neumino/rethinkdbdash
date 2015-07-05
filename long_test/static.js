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

var FEED_QUERY = longConfig.feedQuery;
var NUM_SERVERS = longConfig.numServers;


It('Test that pools are created and identified with discovery: true', function* (done) {
  console.log('');
  console.log('++ Starting servers');
  var servers = [];
  var serversConfig = [];
  for(var portOffset=INITIAL_OFFSET; portOffset<INITIAL_OFFSET+NUM_SERVERS; portOffset++) {
    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', DATA_DIR+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--join', 'localhost:'+(CLUSTER_PORT+INITIAL_OFFSET)
    ])
    //child.stdout.on('data', function(x) { console.log(x.toString())});
    //child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);
    serversConfig.push({
      host: host,
      port: DRIVER_PORT+portOffset
    });
  }
  // Give 2 seconds for the servers to start
  yield util.sleep(2000);
  console.log('++ Starting rethinkdbdash');
  var r = require(__dirname+'/../lib')({
    host: host,
    port: DRIVER_PORT+INITIAL_OFFSET,
    discovery: false,
    max: 10,
    buffer: 5,
    servers: serversConfig
  });

  // Make sure we have enough healthy pools, try and retest every second for at most 5 seconds.
  var wait = 0;
  var extra = 1000;
  var maxWait = 5000;
  var pass = false;
  while (pass === false && wait < maxWait) {
    yield util.sleep(extra);
    // Expect NUM_SERVERS different pools
    try {
      assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS);
      pass = true;
    }
    catch(err) {
      wait += extra;
    }
  }
  if (pass === false) {
    done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
  }

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
      // Expect NUM_SERVERS different pools
      try {
        assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS-1);
        pass = true;
      }
      catch(err) {
        wait += extra;
      }
    }
    if (pass === false) {
      done(new Error('Could not find '+(NUM_SERVERS-1)+' healthy pools.'));
    }


    console.log('++ Restarting a server');
    var child = spawn(cmd, [
        '--port-offset',  portOffset,
        '--directory', DATA_DIR+portOffset,
        '--server-name',  'rethinkdbdash'+portOffset,
        '--join', 'localhost:'+(29015+INITIAL_OFFSET)
    ])
    //child.stdout.on('data', function(x) { console.log(x.toString())});
    //child.stderr.on('data', function(x) { console.log(x.toString())});
    servers.push(child);
    yield util.sleep(8000);

    var wait = 0;
    var extra = 1000;
    var maxWait = 5000;
    var pass = false;
    while (pass === false && wait < maxWait) {
      yield util.sleep(extra);
      // Expect NUM_SERVERS different pools
      try {
        assert.equal(r.getPoolMaster()._healthyPools.length, NUM_SERVERS);
        pass = true;
      }
      catch(err) {
        wait += extra;
      }
    }
    if (pass === false) {
      done(new Error('Could not find '+NUM_SERVERS+' healthy pools.'));
    }

  }


  yield r.getPoolMaster().drain();
  for(var i=0; i<servers.length; i++) {
    servers[i].kill();
  }
  yield util.sleep(2000);
  done();
});
