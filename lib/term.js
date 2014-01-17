var error = require('./error.js');
var helper = require('./helper.js');
var Promise = require('bluebird');
var pb = require('./protobuf.js');


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
            type: "START"
        }

        //console.log(JSON.stringify(query, null, 2));
        var data = new pb.Query(query).toBuffer();

        var lengthBuffer = new Buffer(4);
        lengthBuffer.writeUInt32LE(data.length, 0)

        var fullBuffer = Buffer.concat([lengthBuffer, data]);

        connection._send(fullBuffer, token, resolve, reject);
    });
    return p;
}

Term.prototype.expr = function(expression, nestingLevel) {
    var ar, obj;

    if (expression === undefined) throw new error.RqlDriverError("Cannot convert `undefined` with r.expr().")

    if (nestingLevel == null) nestingLevel = _nestingLevel;
    if (nestingLevel < 0) throw new error.RqlDriverError("Nesting depth limit exceeded.\nYou probably have a circular reference somewhere.")

    if (expression instanceof Term) {
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
        this.quey = {
            type: "MAKE_OBJ",
            optargs: {}
        };
        for(key in expression) {
            if (expression.hasOwnProperty(key)) {
                this.query.optargs[key] = Query.expr(expression[key], nestingLevel-1)
            }
        }
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
            throw new error.RqlDriverError("Cannot convert `"+expression+"` to datum.")
        }
    }
    return this;

}


Term.prototype.add = function() {
    return new Add(arguments);
}

function Add() {
    this.type = "ADD";
    this.args = [];
    for(var i=0; i<arguments.length; i++) {
        //TODO Check for undefined
        this.args.push(arguments[i]);
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


module.exports = Term;
