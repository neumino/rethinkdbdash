var protodef = require(__dirname+"/protodef.js");
var termTypes = protodef.Term.TermType;
var datumTypes = protodef.Datum.DatumType;

function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}
module.exports.isPlainObject = isPlainObject;

function toArray(args) {
    return Array.prototype.slice.call(args);
}
module.exports.toArray = toArray;

function hasImplicit(arg) {
    if (Array.isArray(arg)) {
        if (arg[0] === termTypes.IMPLICIT_VAR) return true;

        if (Array.isArray(arg[1])) {
            for(var i=0; i<arg[1].length; i++) {
                if (hasImplicit(arg[1][i])) return true;
            }
        }
        if (isPlainObject(arg[2])) {
            for(var key in arg[2]) {
                if (hasImplicit(arg[2][key])) return true;
            }
        }
    }
    else if (isPlainObject(arg)) {
        for(var key in arg) {
            if (hasImplicit(arg[key])) return true;
        }
    }
    return false;
}
module.exports.hasImplicit = hasImplicit;

function loopKeys(obj, fn) {
    var keys = Object.keys(obj);
    var result;
    for(var i=0; i<keys.length; i++) {
        result = fn(obj, keys[i]);
        if (result === false) return;
    }
}
module.exports.loopKeys = loopKeys;

function convertPseudoType(obj, options) {
    if (Array.isArray(obj)) {
        for(var i=0; i<obj.length; i++) {
            obj[i] = convertPseudoType(obj[i], options);
        }
    }
    else if (isPlainObject(obj)) {
        if ((options.timeFormat != 'raw') && (obj.$reql_type$ === "TIME")) {
            obj = new Date(obj.epoch_time*1000);
        }
        else if ((options.binaryFormat != 'raw') && (obj.$reql_type$ === "BINARY")) {
            obj = new Buffer(obj.data, "base64");
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
                    obj[key] = convertPseudoType(obj[key], options);
                }
            }
        }
    }
    return obj;
}
function makeAtom(response, options) {
    options = options || {};
    return convertPseudoType(response.r[0], options);
}
module.exports.makeAtom = makeAtom;

function makeSequence(response, options) {
    var result = [];
    options = options || {};

    return convertPseudoType(response.r, options);
}

module.exports.makeSequence = makeSequence;

function changeProto(object, other) {
    object.__proto__ = other.__proto__;
}
module.exports.changeProto = changeProto;
