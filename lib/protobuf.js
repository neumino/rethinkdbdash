var helper = require(__dirname+"/helper.js");
var Error = require(__dirname+"/error.js");

var fs = require("fs")
var p = require("node-protobuf").Protobuf
var pb = new p(fs.readFileSync(__dirname+"/ql2.desc")); // Yup, that blocks.


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

pb.makeDatum = function(datum, options) {
    var result, raw, i;

    if (datum.type === 'R_JSON') {
        raw = JSON.parse(datum.r_str);
        return raw;
    }
    else if (datum.type === 'R_NULL') {
        return null;
    }
    else if (datum.type === 'R_BOOL') {
        return datum.r_bool;
    }
    else if (datum.type === 'R_NUM') {
        return datum.r_num;
    }
    else if (datum.type === 'R_STR') {
        return datum.r_str;
    }
    else if (datum.type === 'R_ARRAY') {
        result = [];
        for(i=0; i<datum.r_array.length; i++) {
            result.push(pb.makeDatum(datum.r_array[i], options));
        }
        return result;
    }
    else if (datum.type === 'R_OBJECT') {
        raw = {};
        for(i=0; i<datum.r_object.length; i++) {
            raw[datum.r_object[i].key] = pb.makeDatum(datum.r_object[i].val, options)
        }
        return raw;
    }
    else {
        throw new error.ReqlDriverError("Unknown datum type");
    }
}

pb.makeAtom = function(response, options) {
    var obj = pb.makeDatum(response.response[0], options);
    options = options || {};
    return pb.convertPseudoType(obj, options);
}
pb.makeSequence = function(response, options) {
    var result = [];
    options = options || {};
    for(var i=0; i<response.response.length; i++) {
        result.push(pb.makeDatum(response.response[i], options));
    }
    return pb.convertPseudoType(result, options);
}


module.exports = pb;

/*
// node-protobuf
var fs = require('fs');
var p = require("node-protobuf").Protobuf;

module.exports = new p(fs.readFileSync("./lib/ql2.desc"));
*/
