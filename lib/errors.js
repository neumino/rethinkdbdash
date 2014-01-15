function RqlDriverError(message) {
    Error.captureStackTrace(this, RqlDriverError);
    this.message = message;
};
RqlDriverError.prototype = new Error();
RqlDriverError.prototype.name = "RqlDriverError"; 

module.exports.RqlDriverError = RqlDriverError;


function RqlServerError(message) {
    Error.captureStackTrace(this, RqlServerError);
    this.message = message;
};
RqlServerError.prototype = new Error();
RqlServerError.prototype.name = "RqlServerError"; 

module.exports.RqlServerError = RqlServerError;


function RqlRuntimeError(message) {
    Error.captureStackTrace(this, RqlRuntimeError);
    this.message = message;
};
RqlRuntimeError.prototype = new Error();
RqlRuntimeError.prototype.name = "RqlRuntimeError"; 

module.exports.RqlRuntimeError = RqlRuntimeError;


function RqlCompileError(message) {
    Error.captureStackTrace(this, RqlCompileError);
    this.message = message;
};
RqlCompileError.prototype = new Error();
RqlCompileError.prototype.name = "RqlCompileError"; 

module.exports.RqlCompileError = RqlCompileError;


function RqlClientError(message) {
    Error.captureStackTrace(this, RqlClientError);
    this.message = message;
};
RqlClientError.prototype = new Error();
RqlClientError.prototype.name = "RqlClientError"; 

module.exports.RqlClientError = RqlClientError;
