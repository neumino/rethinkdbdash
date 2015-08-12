var config = require('./config.js');
var clientConfig = JSON.parse(JSON.stringify(config)); // clone object
clientConfig.port = 10000 + Math.floor(Math.random()*1000);
clientConfig.ssl = true;

var tls = require('tls');
var net = require('net');
var fs = require('fs');
var path = require('path');
var tlsOpts = {
  // Seriously, don't do this in your code...
  key: fs.readFileSync(path.join(__dirname, 'certs/my-server.key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/my-server.crt.pem')),
  ca: fs.readFileSync(path.join(__dirname, 'certs/my-private-root-ca.crt.pem'))
};


var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var uuid = util.uuid;
var It = util.It;

It("Connecting through a proxy with TLS", function *(done) {
  // Create the TLS server that will pipe to RethinkDB
  var server = tls.createServer(tlsOpts, function (socket) {
    var conn = net.createConnection(config.port, config.host);
    socket.pipe(conn).pipe(socket);
  }).listen(clientConfig.port);
  //server.on('clientError', console.log);

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore self-signed certificates
  var r = require('../lib')(clientConfig);

  try {
    var result = yield r.expr(1).add(2).run()
    assert.equal(3, result);
    done();
  }
  catch(e) {
    done(e);
  }
  server.close();
});

/*
  The self signed certificate is only good for localhost and not
  other IP/hostnames that may be used in CIs, so we will only test
  this if the environment variable WERCKER_RETHINKDB_HOST is not declared.
*/
if (clientConfig.host === 'localhost') {
  It("hello world for `tls.js` with TLS options", function *(done) {
    // Create the TLS server that will pipe to RethinkDB
    var server = tls.createServer(tlsOpts, function (socket) {
      var conn = net.createConnection(config.port, config.host);
      socket.pipe(conn).pipe(socket);
    }).listen(clientConfig.port);
    //server.on('clientError', console.log);

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1"; // do not ignore self-signed certificates (default)
    clientConfig.ssl = tlsOpts;
    var r = require('../lib')(clientConfig);

    try {
      var result = yield r.expr(3).add(4).run()
      assert.equal(7, result);
      done();
    }
    catch(e) {
      done(e);
    }
    server.close();
  });
}
