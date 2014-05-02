var helper = require(__dirname+"/helper.js");
var Error = require(__dirname+"/error.js");

var fs = require("fs")
//var p = require("node-protobuf").Protobuf
//var pb = new p(fs.readFileSync(__dirname+"/ql2.desc")); // Yup, that blocks.
var pb = {};

var protodef = require(__dirname+"/protodef.js");
var datumTypes = protodef.Datum.DatumType;


pb.parseResponse = function(buffer) {
    return pb.Parse(buffer, "Response");
};
pb.serializeQuery = function(query) {
    return pb.Serialize(query, "Query");
};

pb.convertPseudoType = function(obj, options) {
    if (Array.isArray(obj)) {
        for(var i=0; i<obj.length; i++) {
            obj[i] = pb.convertPseudoType(obj[i], options);
        }
    }
    else if (helper.isPlainObject(obj)) {
        if ((options.timeFormat != 'raw') && (obj.$reql_type$ === "TIME")) {
            obj = new Date(obj.epoch_time*1000);
        }
        else if ((options.groupFormat != 'raw') && (obj.$reql_type$ === "GROUPED_DATA")) {
            var result = [];
            for(var i=0; i<obj.data.length; i++) {
                result.push({
                    group: obj.data[i][0],
                    reduction: obj.data[i][1],
                })
            }
            obj = result;
        }
        else{
            for(var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = pb.convertPseudoType(obj[key], options);
                }
            }
        }
    }
    return obj;
}

pb.makeAtom = function(response, options) {
    options = options || {};
    return pb.convertPseudoType(response.r[0], options);
}
pb.makeSequence = function(response, options) {
    var result = [];
    options = options || {};

    return pb.convertPseudoType(response.r, options);
}


module.exports = pb;

/*
// node-protobuf
var fs = require('fs');
var p = require("node-protobuf").Protobuf;

module.exports = new p(fs.readFileSync("./lib/ql2.desc"));
*/
