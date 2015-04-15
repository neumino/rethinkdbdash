/*
 * Rough version of reqlite
 * We use it here only with `r.expr(number)` to have a deterministic
 * way to predict the behavior of the pools
 * Do not use :)
 */
var net = require('net');
var protodef = require(__dirname+"/../../../lib/protodef.js");
var Query = require(__dirname+"/query.js");
var util = require('util');
var _util = require(__dirname+'/../common.js');

// Create a new TCP server -- used for tests
function Server(options) {
    var self = this;

    self.authKey = "";
    self.version = protodef.VersionDummy.Version.V0_4;
    self.protocol = protodef.VersionDummy.Protocol.JSON; // Support for JSON protocol only
    self.port = options['port'] || 28015;
    self.host = options['host'] || 'localhost';

    self.numConnections = 0;
    self._connections = {};

    self.databases = {};
    self._mock = [];
    self.id = _util.uuid();

    var index = 0;
    self.server = net.createServer(function(connection) { //'connection' listener
        self._connections[index] = new Connection(connection, self, {
            version: self.version,
            authKey: self.authKey,
            protocol: self.protocol,
            id: index
        });
        index++
    });
    self.server.listen(self.port, function() { //'listening' listener
    });
    self.server.on('error', function(error) {
    });
}

Server.prototype.close = function() {
    var self = this;
    this.server.close();
    for(var id in this._connections) {
        this._connections[id].connection.end();
    }
}
Server.prototype.destroy = function() {
    this.server.close();
    for(var id in this._connections) {
        this._connections[id].connection.destroy();
    }
}

Server.prototype.mockServersStatus = function(servers) {
    var response = [];
    for(var i=0; i<servers.length; i++) {
        var server = servers[i];
        response.push({
            "connection": {
               "time_connected":{
                    "$reql_type$":"TIME",
                    "epoch_time":1425627107.941,
                    "timezone":"+00:00"
                },
                "time_disconnected":null
            },
            "id":server.id,
            "name":'name_'+server.id,
            "network":{
                "canonical_addresses": [
                    {"host":server.host,"port":server.port+1000},
                    {"host":"::1","port":server.port+1000}
                ],
                "cluster_port":server.port+1000,
                "hostname":"xone",
                "http_admin_port":8080,
                "reql_port":server.port},
                "process":{
                    "argv": ["rethinkdb"],
                    "cache_size_mb":2645.6015625,
                    "pid":5065,
                    "time_started": {
                        "$reql_type$":"TIME",
                        "epoch_time":1425627107.94,
                        "timezone":"+00:00"
                    },
                    "version":"rethinkdb 1.16.2-1 (GCC 4.9.2)"
                },
                "status":"connected"
        })
    }
    this._mock.push(response);
}

Server.prototype.cleanMockServersStatus = function(servers) {
    this._mock = [];
}

function Connection(connection, server, options) {
    var self = this;

    self.connection = connection;
    self.options = options;
    self.server = server;
    self.id = options.id

    self.open = false;
    self.buffer = new Buffer(0);
    self.version;
    self.auth;
    self.protocol;

    self.connection.on('connect', function() {
        self.open = true;
        self.numConnections++;
    });
    self.connection.on('data', function(data) {
        self.buffer = Buffer.concat([self.buffer, data])
        self.read();
    });
    self.connection.on("end", function() {
        delete self.server._connections[self.id]
        self.numConnections--;
    });
}
Connection.prototype.read = function() {
    var self = this;

    if (self.version === undefined) {
        if (self.buffer.length >= 4) {
            var version = self.buffer.readUInt32LE(0)
            self.buffer = self.buffer.slice(4);

            if (version !== self.options.version) {
                //TODO Send appropriate error
                self.connection.end();
            }
            else {
                self.version = version;
            }
            
            self.read();
        }
        // else, we need more data
    }
    else if (self.auth === undefined) {
        if (self.buffer.length >= 4) {
            var authKeyLength = self.buffer.readUInt32LE(0)
            if (self.buffer.length >= authKeyLength+4) {
                self.buffer = self.buffer.slice(4);
                var authKey = self.buffer.slice(0, authKeyLength).toString();

                if (authKey !== self.options.authKey) {
                    //TODO Send appropriate error
                    self.connection.end();
                }
                else {
                    self.auth = true;
                    self.read();
                }
            }
        }
    }
    else if (self.protocol === undefined) {
        if (self.buffer.length >= 4) {
            var protocol = self.buffer.readUInt32LE(0)
            self.buffer = self.buffer.slice(4);

            if (protocol !== self.options.protocol) {
                //TODO Send appropriate error
                self.connection.end();
            }
            else {
                self.protocol = protocol;
            }
            self.connection.write("SUCCESS\u0000");
            self.read();
        }
    }
    else {
        if (self.buffer.length >= 8+4) { // 8 for the token, 4 for the query's length
            var token = self.buffer.readUInt32LE(0);
            var queryLength = self.buffer.readUInt32LE(8);

            if (self.buffer.length >= queryLength+8+4) {
                self.buffer = self.buffer.slice(8+4);
                var queryStr = self.buffer.slice(0, queryLength).toString();
                self.buffer = self.buffer.slice(queryLength);
                try {
                    if (queryStr === '[1,[15,[[14,["rethinkdb"]],"server_status"]],{"db":[14,["test"]]}]') {
                        var result = self.server._mock.shift();
                        var response = {
                            t: protodef.Response.ResponseType.SUCCESS_SEQUENCE,
                            r: result
                        }
                    }
                    else {
                        var query = JSON.parse(queryStr);
                        var response = new Query(self.server, query).run();
                    }
                    function sendResult() {
                        var tokenBuffer = new Buffer(8);
                        tokenBuffer.writeUInt32LE(token, 0)
                        tokenBuffer.writeUInt32LE(0, 4)

                        var responseBuffer = new Buffer(JSON.stringify(response));
                        var responseLengthBuffer = new Buffer(4);
                        responseLengthBuffer.writeUInt32LE(responseBuffer.length, 0);
                        try {
                            self.connection.write(Buffer.concat([tokenBuffer, responseLengthBuffer, responseBuffer]))
                        }
                        catch(err) {
                            //console.log("Failed to send back the result.");
                            //console.log(err);
                        }
                    }


                    // If a query return a number, we wait this number before
                    // sending back the result. This simulate asynchronous,
                    // concurrent operations.
                    if ((response.r.length === 1) && (typeof response.r[0] === 'number') && (response.r[0] >= 0)) {
                        setTimeout(sendResult, response.r[0]);
                    }
                    else {
                        sendResult();
                    }
                }
                catch(err) {
                    console.log("Fake server crashed.");
                    console.log(err);
                    console.log(err.stack);
                    self.connection.write("Error, could not parse query");
                }
            }
        }
    }

}

module.exports = Server;
