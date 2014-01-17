module.exports.isPlainObject = function(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}

module.exports.toArray = function(args) {
    //TODO Check for undefined?
    return Array.prototype.slice.call(args);
}
