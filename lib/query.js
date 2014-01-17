var error = require('./error.js');
var helper = require('./helper.js');
var Promise = require('bluebird');
var pb = require('./protobuf.js');

function Query(term) {
    this.term = term;

Query.prototype.run = function(connection) {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        var token = connection.token++;
        var query = {
            token: token,
            query: self.term,
            type: "START"
        };
        //node-protobuf
        //var data = pb.Serialize(fullQuery, "Query");
        var data = new pb.Query(fullQuery).toBuffer();

        var lengthBuffer = new Buffer(4);
        lengthBuffer.writeUInt32LE(data.length, 0)

        var fullBuffer = Buffer.concat([lengthBuffer, data]);

        var response = connection._send(fullBuffer, token, resolve, reject);
    });
    console.log(JSON.stringify(self.query, null, 2));
    return p;
};

Query.prototype.expr = function(expr, nestingLevel) {
}

module.exports = Query;
