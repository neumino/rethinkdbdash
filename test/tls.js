var config = require('./config.js');
var clientConfig = JSON.parse(JSON.stringify(config)); // clone object
clientConfig.port = 1000 + Math.floor(Math.random()*1000);
clientConfig.tls = true;

var tls = require('tls');
var net = require('net');
var fs = require('fs');
var path = require('path');
var tlsOpts = {
    key: fs.readFileSync(path.join(__dirname, 'certs/my-server.key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/my-server.crt.pem')),
    ca: fs.readFileSync(path.join(__dirname, 'certs/my-private-root-ca.crt.pem'))
};
tls.createServer(tlsOpts, function (socket) {
    var conn = net.createConnection(config.port, config.host);
    socket.pipe(conn).pipe(socket);
}).listen(clientConfig.port);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore self-signed certificates

var r = require('../lib')(clientConfig);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');
var uuid = util.uuid;
var It = util.It;

var dbName = uuid();
var tableName = uuid();
It("Init for `tls.js`", function *(done) {
    try {
        var result = yield r.dbCreate(dbName).run();
        assert.equal(1, result.dbs_created);
        var tableCreated = yield r.db(dbName).tableCreate(tableName)('tables_created').run()
        assert.equal(1, tableCreated);
        done();
    }
    catch(e) {
        done(e);
    }
});

It("hello world for `tls.js`", function *(done) {
    try {
        var doc = {
            "id": "hello world"
        };

        var result = yield r.db(dbName).table(tableName).insert(doc).run();
        assert.equal(1, result.inserted);

        var docFromDb = yield r.db(dbName).table(tableName).get('hello world').run();
        assert.deepEqual(doc, docFromDb);
        done();
    }
    catch(e) {
        done(e);
    }
});

It("hello world for `tls.js` with TLS options", function *(done) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1"; // do not ignore self-signed certificates (default)
    clientConfig.tls = tlsOpts;
    r = require('../lib')(clientConfig);
    try {
        var doc = {
            "id": "hello world safe!"
        };

        var result = yield r.db(dbName).table(tableName).insert(doc).run();
        assert.equal(1, result.inserted);

        var docFromDb = yield r.db(dbName).table(tableName).get('hello world safe!').run();
        assert.deepEqual(doc, docFromDb);
        done();
    }
    catch(e) {
        done(e);
    }
});

It("cleanup for TLS options", function *(done) {
    try {
        var result = yield r.dbDrop(dbName).run();
        assert.equal(1, result.dbs_dropped);
        assert.equal(1, result.tables_dropped);
        done();
    }
    catch(e) {
        done(e);
    }
});