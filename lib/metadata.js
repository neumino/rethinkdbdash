// Metadata we keep per query
function Metadata(resolve, reject, query, options) {
  this.resolve = resolve;
  this.reject = reject;
  this.query = query; // The query in case we have to build a backtrace
  this.options = options || {};
  this.cursor = false;
}

Metadata.prototype.setCursor = function() {
  this.cursor = true;
}

Metadata.prototype.setEnd = function(resolve, reject) {
  this.endResolve = resolve;
  this.endReject = reject;
}

Metadata.prototype.setCallbacks = function(resolve, reject) {
  this.resolve = resolve;
  this.reject = reject;
}
Metadata.prototype.removeCallbacks = function() {
  this.resolve = null;
  this.reject = null;
}
Metadata.prototype.removeEndCallbacks = function() {
  this.endResolve = null;
  this.endReject = null;
}

module.exports = Metadata;
