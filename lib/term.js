var error = require('./error.js');
var helper = require('./helper.js');
var Promise = require('bluebird');


var _nestingLevel = 20;

function Term() {
}

Term.prototype._setNestingLevel = function() {
    _nestingLevel = 20;    
}

Term.prototype.run = function(connection) {
    var self = this;
    var p = new Promise(function(resolve, reject) {
        var token = connection.token++;
        var query = {
            token: token,
            query: self,
            accepts_r_json: true,
            type: "START"
        }

        connection._send(query, token, resolve, reject);
    });
    return p;
}

Term.prototype.expr = function(expression, nestingLevel) {
    var ar, obj;

    if (expression === undefined) throw new error.ReqlDriverError("Cannot convert `undefined` with r.expr().")

    if (nestingLevel == null) nestingLevel = _nestingLevel;
    if (nestingLevel < 0) throw new error.ReqlDriverError("Nesting depth limit exceeded.\nYou probably have a circular reference somewhere.")

    if (expression instanceof Term) {
        return expression;
    }
    else if (expression instanceof Function) {
        return new Func(expression);
    }
    else if (expression instanceof Date) {
        //TODO
    }
    else if (Array.isArray(expression)) {
        return new MakeArray(expression);
    }
    else if (helper.isPlainObject(expression)) {
        return new MakeObject(expression);
    }
    else { // Primitive
        if (expression === null) {
            return new Null();
        }
        else if (typeof expression === "string") {
            return new Str(expression);
        }
        else if (typeof expression === "number") {
            return new Num(expression);
        }
        else if (typeof expression === "boolean") {
            return new Bool(expression);
        }
        else {
            throw new error.ReqlDriverError("Cannot convert `"+expression+"` to datum.")
        }
    }
    return this;
}


Term.prototype.add = function() {
    var args = [this];
    args.push.apply(args, helper.toArray(arguments));
    return new Add(args);
}
Term.prototype.sub = function() {
    var args = [this];
    args.push.apply(args, helper.toArray(arguments));
    return new Sub(args);
}
Term.prototype.mul = function() {
    var args = [this];
    args.push.apply(args, helper.toArray(arguments));
    return new Mul(args);
}
Term.prototype.div = function() {
    var args = [this];
    args.push.apply(args, helper.toArray(arguments));
    return new Div(args);
}

Term.prototype.db = function(db) {
    return new Db(db);
}
Term.prototype.table = function(table) {
    if (this.type == null) {
        return new Table([table]);
    }
    else {
        return new Table([this, table]);
    }
}
Term.prototype.get = function(primaryKey) {
    return new Get(this, primaryKey);
}

Term.prototype.insert = function(documents, options) {
    return new Insert(this, documents, options);
}
Term.prototype.update = function(newValue, options) {
    return new Update(this, newValue, options);
}
Term.prototype.replace = function(newValue, options) {
    return new Replace(this, newValue, options);
}
Term.prototype.delete = function() {
    return new Delete(this);
}
Term.prototype.sync = function() {
    return new Sync(this);
}


Term.prototype.merge = function(arg) {
    return new Merge(this, arg);
}



Term.prototype.info = function() {
    return new Info(this);
}
Term.prototype.js = function(arg) {
    return new Js(arg);
}



Term.prototype._translateArgs = {
    returnVals: "return_vals",
    primaryKey: "primary_key",
    useOutdated: "use_outdated",
    nonAtomic: "non_atomic",
    cacheSize: "cache_size",
    leftBound: "left_bound",
    rightBound: "right_bound",
    defaultTimezone: "default_timezone"
}
Term.prototype._makeOptArgs = function(options) {
    var optargs = [];
    for(var key in options) {
        if (options[key] !== undefined) {
            keyServer = Term.prototype._translateArgs[key] || key;
            optargs.push({
                key: keyServer,
                val: new Term().expr(options[key])
            });
        }
    }
    return optargs;
}


function Add(args) {
    this.type = "ADD";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i]));
    }
    this.__proto__ = Term.prototype;
}
function Sub(args) {
    this.type = "SUB";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i]));
    }
    this.__proto__ = Term.prototype;
}
function Mul(args) {
    this.type = "MUL";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i]));
    }
    this.__proto__ = Term.prototype;
}
function Div(args) {
    this.type = "DIV";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i]));
    }
    this.__proto__ = Term.prototype;
}



function Null() {
    this.type = "DATUM";
    this.datum = {
        type: "R_NULL"
    }
    this.__proto__ = Term.prototype;
}
function Num(value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_NUM",
        r_num: value
    }
    this.__proto__ = Term.prototype;
}
function Str(value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_STR",
        r_str: value
    }
    this.__proto__ = Term.prototype;
}

function Bool(value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_BOOL",
        r_bool: value
    }
    this.__proto__ = Term.prototype;
}
function MakeArray(array) {
    this.type = "MAKE_ARRAY";
    this.args = [];

    for(var i=0; i<array.length; i++) {
        this.args.push(new Term().expr(array[i]))
    }

    this.__proto__ = Term.prototype;
}
function MakeObject(object) {
    this.type = "MAKE_OBJ";
    this.optargs = []
    for(key in object) {
        if (object.hasOwnProperty(key)) {
            this.optargs.push({
                key: key,
                val: new Term().expr(object[key])
            });
        }
    }

    this.__proto__ = Term.prototype;
}
function Func(func) {
    this.type = "FUNC";

    var args = []; // contains Var instances
    var argNums = []; // contains int
    for(var i=0; i<func.length; i++) {
        args.push(new Var(Func.prototype.nextVarId));
        argNums.push(Func.prototype.nextVarId);
    }
    Func.nextVarId++; //TODO Reset when it hits the limit

    body = func.apply(func, args);
    if (body === undefined) throw new Error.ReqlDriverError("An anonymous returned `undefined`. Did you forget a `return`?");

    this.args = [new MakeArray(argNums), body];
    this.__proto__ = Term.prototype;
}
Func.prototype.nextVarId = 1;

function Var(id) {
    this.type = "VAR";
    this.args = [new Term().expr(id)];

    this.__proto__ = Term.prototype;
}

function Db(db) {
    this.type = "DB";
    this.args = [];
    this.args.push(new Term().expr(db));

    this.__proto__ = Term.prototype;
}
function Table(args) {
    this.type = "TABLE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i]))
    }

    this.__proto__ = Term.prototype;
}
function Get(table, primaryKey) {
    this.type = "GET";
    this.args = [table, new Term().expr(primaryKey)];

    this.__proto__ = Term.prototype;
}

function Insert(table, documents, options) {
    this.type = "INSERT";
    this.args = [table];
    this.args.push(new Term().expr(documents));
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    this.__proto__ = Term.prototype;
}

function Update(table, newValue, options) {
    this.type = "UPDATE";
    this.args = [table];
    this.args.push(new Term().expr(newValue));
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    this.__proto__ = Term.prototype;
}
function Replace(table, newValue, options) {
    this.type = "REPLACE";
    this.args = [table];
    this.args.push(new Term().expr(newValue));
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    this.__proto__ = Term.prototype;
}
function Sync(table) {
    this.type = "SYNC";
    this.args = [table];

    this.__proto__ = Term.prototype;
}



function Delete(selection) {
    //TODO Add options
    this.type = "DELETE";
    this.args = [selection];

    this.__proto__ = Term.prototype;
}

function Merge(obj, arg) {
    this.type = "MERGE";
    this.args = [obj, new Term().expr(arg)];

    this.__proto__ = Term.prototype;
}

function Info(arg) {
    this.type = "INFO";
    this.args = [arg];

    this.__proto__ = Term.prototype;
}
function Js(arg) {
    this.type = "JAVASCRIPT";
    this.args = [new Term().expr(arg)];

    this.__proto__ = Term.prototype;
}




module.exports = Term;
