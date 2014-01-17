function ReqlDriverError(message) {
    Error.captureStackTrace(this, ReqlDriverError);
    this.message = message;
};
ReqlDriverError.prototype = new Error();
ReqlDriverError.prototype.name = "ReqlDriverError"; 

module.exports.ReqlDriverError = ReqlDriverError;


function ReqlServerError(message) {
    Error.captureStackTrace(this, ReqlServerError);
    this.message = message;
};
ReqlServerError.prototype = new Error();
ReqlServerError.prototype.name = "ReqlServerError"; 

module.exports.ReqlServerError = ReqlServerError;


function ReqlRuntimeError(message) {
    Error.captureStackTrace(this, ReqlRuntimeError);
    this.message = message;
};
ReqlRuntimeError.prototype = new Error();
ReqlRuntimeError.prototype.name = "ReqlRuntimeError"; 

module.exports.ReqlRuntimeError = ReqlRuntimeError;


function ReqlCompileError(message) {
    Error.captureStackTrace(this, ReqlCompileError);
    this.message = message;
};
ReqlCompileError.prototype = new Error();
ReqlCompileError.prototype.name = "ReqlCompileError"; 

module.exports.ReqlCompileError = ReqlCompileError;


function ReqlClientError(message) {
    Error.captureStackTrace(this, ReqlClientError);
    this.message = message;
};
ReqlClientError.prototype = new Error();
ReqlClientError.prototype.name = "ReqlClientError"; 

module.exports.ReqlClientError = ReqlClientError;
