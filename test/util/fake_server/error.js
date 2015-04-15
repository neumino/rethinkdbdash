var protodef = require(__dirname+"/protodef.js");

function ReqlRuntimeError(msg, frames) {
    Error.captureStackTrace(this, ReqlRuntimeError)
    this.type = protodef.Response.ResponseType.RUNTIME_ERROR;
    this.message = msg;
    this.frames = frames || [];
}
ReqlRuntimeError.prototype = new Error();
//ReqlRuntimeError.prototype.name = "ReqlRuntimeError"


function ReqlClientError(msg, frames) {
    Error.captureStackTrace(this, ReqlClientError)
    this.type = protodef.Response.ResponseType.CLIENT_ERROR;
    this.message = msg;
    this.frames = frames || [];
}
ReqlClientError.prototype = new Error();
//ReqlClientError.prototype.name = "ReqlClientError"

function ReqlCompileError(msg, frames) {
    Error.captureStackTrace(this, ReqlCompileError)
    this.type = protodef.Response.ResponseType.COMPILE_ERROR;
    this.message = msg;
    this.frames = frames || [];
}
ReqlCompileError.prototype = new Error();
ReqlCompileError.prototype.name = "ReqlCompileError"


Err = {};
Err.ReqlRuntimeError = ReqlRuntimeError;
Err.ReqlCompileError = ReqlCompileError;
Err.ReqLClientError = ReqlClientError;



module.exports = Err;
