var pb = require('./proto-def.js');

pb.parseResponse = function(buffer) {
    //node-protobuf
    //var response = pb.parse(responseBuffer, "Response");

    var response = pb.Response.decode(buffer);
    var type = response.type;

    return response;
};

pb.convertPseudoType = function(obj, options) {
    //TODO
    return obj;
}

pb.makeDatum = function(datum, options) {
    var result, raw, i;

    if (datum.type === pb.Datum.DatumType['R_JSON']) {
        raw = JSON.parse(datum.r_str)
        return pb.convertPseudoType(raw, options);
    }
    else if (datum.type === pb.Datum.DatumType['R_NULL']) {
        return null;
    }
    else if (datum.type === pb.Datum.DatumType['R_BOOL']) {
        return datum.r_bool;
    }
    else if (datum.type === pb.Datum.DatumType['R_NUM']) {
        return datum.r_num;
    }
    else if (datum.type === pb.Datum.DatumType['R_STR']) {
        return datum.r_str;
    }
    else if (datum.type === pb.Datum.DatumType['R_ARRAY']) {
        result = [];
        for(i=0; i<datum.r_array.length; i++) {
            result.push(pb.makeDatum(datum.r_array[i]));        
        }
        return result;
    }
    else if (datum.type === pb.Datum.DatumType['R_OBJECT']) {
        raw = {};
        for(i=0; i<datum.r_object.length; i++) {
            raw[datum.r_object[i].key] = pb.makeDatum(datum.r_object[i].val)
        }
        return pb.convertPseudoType(raw, options);
    }
    else {
        throw new error.ReqlDriverError("Unknown datum type");
    }

}

pb.makeAtom = function(response, options) {
    return pb.makeDatum(response.response[0], options);
}
module.exports = pb;

/*
// node-protobuf
var fs = require('fs');
var p = require("node-protobuf").Protobuf;

module.exports = new p(fs.readFileSync("./lib/ql2.desc"));
*/
