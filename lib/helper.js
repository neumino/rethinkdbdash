module.exports.isPlainObject = function(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
}
