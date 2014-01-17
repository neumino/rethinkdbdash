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
        //TODO
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

Term.prototype.info = function() {
    return new Info(this);
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


function Info(arg) {
    this.type = "INFO";
    this.args = [arg];

    this.__proto__ = Term.prototype;
}




module.exports = Term;
