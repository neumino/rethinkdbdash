var error = require('./error.js');
var helper = require('./helper.js');
var Promise = require('bluebird');


var _nestingLevel = 20;

function Term() {
    var self = this;
    var term = function(field) {
        return term.getField(field);
    }
    term.__proto__ = self.__proto__;
    term._self = {};
    return term;
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
            query: self._self,
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
Term.prototype.getField = function(field) {
    return new GetField(this, field);
}



Term.prototype.db = function(db) {
    return new Db(db);
}
Term.prototype.table = function(table) {
    if (this._self.type == null) {
        return new Table([table]);
    }
    else {
        return new Table([this, table]);
    }
}
Term.prototype.get = function(primaryKey) {
    return new Get(this, primaryKey);
}
Term.prototype.getAll = function() {
    return new GetAll(this, helper.toArray(arguments));
}
Term.prototype.between = function(start, end, index) {
    return new Between(this, start, end, index);
}
Term.prototype.filter = function(filter) {
    return new Filter(this, filter);
}

// Joins
Term.prototype.innerJoin = function(sequence, predicate) {
    return new InnerJoin(this, sequence, predicate);
}
Term.prototype.outerJoin = function(sequence, predicate) {
    return new OuterJoin(this, sequence, predicate);
}
Term.prototype.eqJoin = function(rightKey, sequence) {
    return new EqJoin(this, rightKey, sequence);
}

// Transformation
Term.prototype.map = function(transformation) {
    return new Map(this, transformation);
}
Term.prototype.withFields = function() {
    return new WithFields(this, helper.toArray(arguments));
}
Term.prototype.concatMap = function(transformation) {
    return new ConcatMap(this, transformation);
}
Term.prototype.orderBy = function() {
    return new OrderBy(this, helper.toArray(arguments));
}
Term.prototype.skip = function(value) {
    return new Skip(this, value);
}
Term.prototype.limit = function(value) {
    return new Limit(this, value);
}
Term.prototype.slice = function(start, end) {
    return new Slice(this, start, end);
}
Term.prototype.nth = function(value) {
    return new Nth(this, value);
}
Term.prototype.indexesOf = function(predicate) {
    return new IndexesOf(this, predicate);
}
Term.prototype.isEmpty = function() {
    return new IsEmpty(this);
}
Term.prototype.union = function(other) {
    return new Union(this, other);
}
Term.prototype.sample = function(size) {
    return new Sample(this, size);
}

// Aggregations
Term.prototype.reduce = function(func, base) {
    return new Reduce(this, func, base);
}
Term.prototype.count = function(filter) {
    return new Count(this, filter);
}
Term.prototype.distinct = function() {
    return new Distinct(this);
}
Term.prototype.groupedMapReduce = function(group, map, reduce, base) {
    return new GroupedMapReduce(this, group, map, reduce, base);
}
Term.prototype.groupBy = function() {
    return new GroupBy(this, helper.toArray(arguments));
}
Term.prototype.contains = function() {
    return new Contains(this, helper.toArray(arguments));
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

Term.prototype.dbCreate = function(db) {
    return new DbCreate(db);
}
Term.prototype.dbDrop = function(db) {
    return new DbDrop(db);
}
Term.prototype.dbList = function() {
    return new DbList();
}
Term.prototype.tableCreate = function(table, options) {
    return new TableCreate(this, table, options);
}
Term.prototype.tableDrop = function(table) {
    return new TableDrop(this, table);
}
Term.prototype.tableList = function() {
    return new TableList(this);
}
Term.prototype.indexList = function() {
    return new IndexList(this);
}
Term.prototype.indexCreate = function(name, fn) {
    return new IndexCreate(this, name, fn);
}
Term.prototype.indexDrop = function(name) {
    return new IndexDrop(this, name);
}
Term.prototype.indexStatus = function() {
    return new IndexStatus(this, helper.toArray(arguments));
}
Term.prototype.indexWait = function() {
    return new IndexWait(this, helper.toArray(arguments));
}


// Math and Logic
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
Term.prototype.eq = function(other) {
    return new Eq(this, other);
}
Term.prototype.lt = function(other) {
    return new Lt(this, other);
}





// Document manipulation
Term.prototype.row = function() {
    return new ImplicitVar();
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



Term.prototype._wrap = function() {
    var self = this;
    //TODO Remove this hackish thing and recursive like a grown up.
    if (JSON.stringify(this._self).match('"type":"IMPLICIT_VAR"')) {
        return new Term().expr(function(doc) { return self; })
    }
    else {
        return self;
    }
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
                val: new Term().expr(options[key])._self
            });
        }
    }
    return optargs;
}

function GetField(obj, field) {
    this.type = "GET_FIELD";
    this.args = [obj._self, new Term().expr(field)._self];

    var term = new Term();
    term._self = this;
    return term;
}



function Null() {
    this.type = "DATUM";
    this.datum = {
        type: "R_NULL"
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Num(value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_NUM",
        r_num: value
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Str(value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_STR",
        r_str: value
    }

    var term = new Term();
    term._self = this;
    return term;
}

function Bool(value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_BOOL",
        r_bool: value
    }

    var term = new Term();
    term._self = this;
    return term;
}
function MakeArray(array) {
    this.type = "MAKE_ARRAY";
    this.args = [];

    for(var i=0; i<array.length; i++) {
        this.args.push(new Term().expr(array[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function MakeObject(object) {
    this.type = "MAKE_OBJ";
    this.optargs = []
    for(key in object) {
        if (object.hasOwnProperty(key)) {
            this.optargs.push({
                key: key,
                val: new Term().expr(object[key])._self
            });
        }
    }

    var term = new Term();
    term._self = this;
    return term;
}

global.MakeObject = MakeObject;

function Func(func) {
    this.type = "FUNC";

    var args = []; // contains Var instances
    var argNums = []; // contains int
    for(var i=0; i<func.length; i++) {
        args.push(new Var(Func.prototype.nextVarId));
        argNums.push(Func.prototype.nextVarId);

        Func.prototype.nextVarId++; //TODO Reset when it hits the limit
    }

    body = func.apply(func, args);
    if (body === undefined) throw new Error.ReqlDriverError("An anonymous returned `undefined`. Did you forget a `return`?");

    this.args = [new MakeArray(argNums)._self, body._self];

    var term = new Term();
    term._self = this;
    return term;
}
Func.prototype.nextVarId = 1;

function Var(id) {
    this.type = "VAR";
    this.args = [new Term().expr(id)._self];

    var term = new Term();
    term._self = this;
    return term;
}

function Db(db) {
    this.type = "DB";
    this.args = [];
    this.args.push(new Term().expr(db)._self);

    var term = new Term();
    term._self = this;
    return term;
}
function Table(args) {
    this.type = "TABLE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Get(table, primaryKey) {
    this.type = "GET";
    this.args = [table._self, new Term().expr(primaryKey)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function GetAll(table, args) {
    this.type = "GET_ALL";
    this.args = [table._self];
    for(var i=0; i<args.length-1; i++) {
        this.args.push(new Term().expr(args[i])._self);
    }
    if ((args.length > 1) && (args[args.length-1].index != null)) {
        this.optargs = Term.prototype._makeOptArgs(args[args.length-1]);
    }
    else {
        this.args.push(new Term().expr(args[args.length-1])._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Between(table, start, end, index) {
    this.type = "BETWEEN";
    this.args = [table._self];
    this.args.push(new Term().expr(start)._self);
    this.args.push(new Term().expr(end)._self);
    if (index != null) this.optargs = Term.prototype._makeOptArgs(index);

    var term = new Term();
    term._self = this;
    return term;
}
function Filter(table, filter) {
    this.type = "FILTER";
    this.args = [table._self];
    this.args.push(new Term().expr(filter)._wrap()._self);

    var term = new Term();
    term._self = this;
    return term;
}

// Joins
function InnerJoin(sequenceLeft, sequenceRight, predicate) {
    this.type = "INNER_JOIN";
    this.args = [sequenceLeft._self, new Term().expr(sequenceRight)._self, new Term().expr(predicate)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function OuterJoin(sequenceLeft, sequenceRight, predicate) {
    this.type = "OUTER_JOIN";
    this.args = [sequenceLeft._self, new Term().expr(sequenceRight)._self, new Term().expr(predicate)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function EqJoin(sequenceLeft, rightKey, sequenceRight) {
    this.type = "EQ_JOIN";
    this.args = [sequenceLeft._self, new Term().expr(rightKey)._wrap()._self, new Term().expr(sequenceRight)._self];

    var term = new Term();
    term._self = this;
    return term;
}


// Transformation
function Map(sequence, transformation) {
    this.type = "MAP";
    this.args = [sequence._self, new Term().expr(transformation)._wrap()._self];

    var term = new Term();
    term._self = this;
    return term;
}
function WithFields(sequence, fields) {
    this.type = "WITH_FIELDS";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term().expr(fields[i])._self)
    }


    var term = new Term();
    term._self = this;
    return term;
}
function ConcatMap(sequence, transformation) {
    this.type = "CONCATMAP";
    this.args = [sequence._self, new Term().expr(transformation)._wrap()._self];

    var term = new Term();
    term._self = this;
    return term;
}
function OrderBy(sequence, fields) {
    this.type = "ORDERBY";
    this.args = [sequence._self]

    for(var i=0; i<fields.length-1; i++) {
        this.args.push(new Term().expr(args[i])._wrap()._self);
    }
    if ((helper.isPlainObject(fields[fields.length-1])) && (fields[fields.length-1].index != null)) {
        this.optargs = Term.prototype._makeOptArgs(fields[fields.length-1]);
    }
    else {
        this.args.push(new Term().expr(fields[fields.length-1])._wrap()._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Skip(sequence, value) {
    this.type = "SKIP";
    this.args = [sequence._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Limit(sequence, value) {
    this.type = "LIMIT";
    this.args = [sequence._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Slice(sequence, start, end) {
    this.type = "SLICE";
    this.args = [sequence._self, new Term().expr(start)._self];
    if (end != null) {
        this.args.push(new Term().expr(end)._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Nth(sequence, value) {
    this.type = "NTH";
    this.args = [sequence._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function IndexesOf(sequence, value) {
    this.type = "INDEXES_OF";
    this.args = [sequence._self, new Term().expr(value)._wrap()._self];

    var term = new Term();
    term._self = this;
    return term;
}
function IsEmpty(sequence) {
    this.type = "IS_EMPTY";
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Union(sequence, other) {
    this.type = "UNION";
    this.args = [sequence._self, new Term().expr(other)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Sample(sequence, size) {
    this.type = "SAMPLE";
    this.args = [sequence._self, new Term().expr(size)._self];

    var term = new Term();
    term._self = this;
    return term;
}


// Aggregations
function Reduce(sequence, func, base) {
    this.type = "REDUCE";
    this.args = [sequence._self, new Term().expr(func)._wrap()._self];
    if (base != null) this.optargs = Term.prototype._makeOptArgs({base: base});

    var term = new Term();
    term._self = this;
    return term;
}
function Count(sequence, filter) {
    this.type = "COUNT";
    this.args = [sequence._self];
    if (filter != null) this.args.push(new Term().expr(filter)._wrap()._self)

    var term = new Term();
    term._self = this;
    return term;
}
function Distinct(sequence) {
    this.type = "DISTINCT";
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    return term;
}
function GroupedMapReduce(sequence, group, map, reduce, base) {
    this.type = "GROUPED_MAP_REDUCE";
    this.args = [sequence._self, new Term().expr(group)._wrap()._self, new Term().expr(map)._wrap()._self, new Term().expr(reduce)._wrap()._self];
    if (base != null) this.optargs = Term.prototype._makeOptArgs({base: base});

    var term = new Term();
    term._self = this;
    return term;
}
function GroupBy(sequence, selectors) {
    this.type = "GROUPBY";

    reduction = selectors.splice(-1);
    reduction = reduction[0];
    this.args = [sequence._self];
    this.args.push(new Term().expr(selectors)._self);
    this.args.push(reduction._self);


    var term = new Term();
    term._self = this;
    return term;
}
function Contains(sequence, fields) {
    this.type = "CONTAINS";

    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term().expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}




// Write
function Insert(table, documents, options) {
    this.type = "INSERT";
    this.args = [table._self];
    this.args.push(new Term().expr(documents)._self);
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}

function Update(table, newValue, options) {
    this.type = "UPDATE";
    this.args = [table._self];
    this.args.push(new Term().expr(newValue)._wrap()._self);
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function Replace(table, newValue, options) {
    this.type = "REPLACE";
    this.args = [table._self];
    this.args.push(new Term().expr(newValue)._wrap()._self);
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function Sync(table) {
    this.type = "SYNC";
    this.args = [table._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Delete(selection) {
    //TODO Add options
    this.type = "DELETE";
    this.args = [selection._self];

    var term = new Term();
    term._self = this;
    return term;
}


function DbCreate(db) {
    this.type = "DB_CREATE";
    this.args = [new Term().expr(db)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function DbDrop(db) {
    this.type = "DB_DROP";
    this.args = [new Term().expr(db)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function DbList() {
    this.type = "DB_LIST";

    var term = new Term();
    term._self = this;
    return term;
}
function TableCreate(db, table, options) {
    this.type = "TABLE_CREATE";
    this.args = [db._self, new Term().expr(table)._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function TableDrop(db, table) {
    this.type = "TABLE_DROP";
    this.args = [db._self, new Term().expr(table)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function TableList(db) {
    this.type = "TABLE_LIST";
    this.args = [db._self];

    var term = new Term();
    term._self = this;
    return term;
}

function IndexCreate(table, name, fn) {
    this.type = "INDEX_CREATE";
    this.args = [table._self, new Term().expr(name)._self];
    if (fn != null) {
        this.args.push(new Term().expr(fn)._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function IndexDrop(table, name) {
    this.type = "INDEX_DROP";
    this.args = [table._self, new Term().expr(name)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function IndexList(table, indexes) {
    this.type = "INDEX_LIST";
    this.args = [table._self];

    var term = new Term();
    term._self = this;
    return term;
}
function IndexStatus(table, indexes) {
    this.type = "INDEX_STATUS";
    this.args = [table._self];
    if (indexes != null) {
        for(var i=0; i<indexes.length; i++) {
            this.args.push(new Term().expr(indexes[i])._self)
        }
    }

    var term = new Term();
    term._self = this;
    return term;
}
function IndexWait(table, indexes) {
    this.type = "INDEX_WAIT";
    this.args = [table._self];
    if (indexes != null) {
        for(var i=0; i<indexes.length; i++) {
            this.args.push(new Term().expr(indexes[i])._self)
        }
    }

    var term = new Term();
    term._self = this;
    return term;
}


// Math and Logic
function Add(args) {
    this.type = "ADD";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Sub(args) {
    this.type = "SUB";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Mul(args) {
    this.type = "MUL";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Div(args) {
    this.type = "DIV";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Eq(left, right) {
    this.type = "EQ";
    this.args = [new Term().expr(left)._self, new Term().expr(right)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Lt(left, right) {
    this.type = "LT";
    this.args = [new Term().expr(left)._self, new Term().expr(right)._self];

    var term = new Term();
    term._self = this;
    return term;
}

// Document manipulation
function Merge(obj, arg) {
    this.type = "MERGE";
    this.args = [obj._self, new Term().expr(arg)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function ImplicitVar() {
    this.type = "IMPLICIT_VAR";

    var term = new Term();
    term._self = this;
    return term;
}

function Info(arg) {
    this.type = "INFO";
    this.args = [arg._self];

    var term = new Term();
    term._self = this;
    return term;

}
function Js(arg) {
    this.type = "JAVASCRIPT";
    this.args = [new Term().expr(arg)._self];

    var term = new Term();
    term._self = this;
    return term;
}




module.exports = Term;
