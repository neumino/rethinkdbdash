// Metadata we keep per query
export class Metadata {
  endReject;
  endResolve;

  removeEndCallbacks() {
    this.endResolve = null;
    this.endReject = null;
  }

  removeCallbacks() {
    this.resolve = null;
    this.reject = null;
  }

  setCallbacks(resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
  }

  setEnd(resolve, reject) {
    this.endResolve = resolve;
    this.endReject = reject;
  }

  setCursor() {
    this.cursor = true;
  }

  cursor;
  options;
  query;
  reject;
  resolve;

  constructor(resolve, reject, query, options) {
    this.resolve = resolve;
    this.reject = reject;
    this.query = query; // The query in case we have to build a backtrace
    this.options = options;
    this.cursor = false;
  }
}
