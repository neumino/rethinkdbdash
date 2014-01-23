var pb = require('node-protobuf')

var helper = require('./helper.js');
var Error = require('./error.js');

var fs = require("fs")
var p = require("node-protobuf").Protobuf
//TODO Hum what's this relative thing?
var pb = new p(fs.readFileSync("./lib/ql2.desc")); // Yup, that blocks.


pb.parseResponse = function(buffer) {
    return pb.Parse(buffer, "Response");
};
pb.serializeQuery = function(query) {
    return pb.Serialize(query, "Query");
};

pb.convertPseudoType = function(obj, options) {
    if (Array.isArray(obj)) {
        for(var i=0; i<obj.length; i++) {
            obj[i] = pb.convertPseudoType(obj[i]);
        }
    }
    else if (helper.isPlainObject(obj)) {
        if (obj.$reql_type$ === "TIME") {
            if (obj.epoch_time != null) {
                obj = new Date(obj.epoch_time*1000);
            }
            else {
                throw new Error.ReqlDriverError("Pseudo-type TIME"+obj+" is missing the field epoch_time");
            }
        }
        else{
            for(var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = pb.convertPseudoType(obj[key]);
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
    if ((options == null) || (options.timeFormat != 'raw')) obj = pb.convertPseudoType(obj);

    return obj;
}
pb.makeSequence = function(response, options) {
    var result = [];
    for(var i=0; i<response.response.length; i++) {
        result.push(pb.makeDatum(response.response[i], options));
    }

    if ((options == null) || (options.timeFormat != 'raw')) result = pb.convertPseudoType(result);
    return result;
}


module.exports = pb;

/*
// node-protobuf
var fs = require('fs');
var p = require("node-protobuf").Protobuf;

module.exports = new p(fs.readFileSync("./lib/ql2.desc"));
*/
