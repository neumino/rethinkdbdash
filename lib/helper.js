var protodef = require(__dirname+"/protodef.js");
var termTypes = protodef.Term.TermType;

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
    for(var key in obj) {
        fn(obj, key);
    }
}
module.exports.loopKeys = loopKeys;
