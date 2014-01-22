module.exports.isPlainObject = function(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}

module.exports.toArray = function(args) {
    //TODO Check for undefined?
    return Array.prototype.slice.call(args);
}

var hasImplicit = function(arg) {
    if (arg.type === "IMPLICIT_VAR") return true;
    if (Array.isArray(arg.args)) {
        for(var i=0; i<arg.args.length; i++) {
            if (hasImplicit(arg.args[i])) return true;
        }
    }
    if (Array.isArray(arg.optargs)) {
        for(var i=0; i<arg.optargs.length; i++) {
            if (hasImplicit(arg.optargs[i].val)) return true;
        }
    }
    return false;
}
module.exports.hasImplicit = hasImplicit;

