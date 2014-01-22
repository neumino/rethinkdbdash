var Error = require("./error.js");
var helper = require("./helper.js");
var Promise = require("bluebird");


var _nestingLevel = 20;

function Term() {
    var self = this;
    var term = function(field) {
        Term.prototype._arity(arguments, 1, "(...)", self); 
        return term.getField(field);
    }
    term.__proto__ = self.__proto__;
    term._self = {};
    return term;
}


Term.prototype.run = function(connection, options) {
    var self = this;

    if (!helper.isPlainObject(options)) options = {};

    var p = new Promise(function(resolve, reject) {
        var token = connection.token++;
        var query = {
            token: token,
            query: self._self,
            accepts_r_json: true,
            type: "START",
            global_optargs: []
        };
        
        if (connection.db) {
            query.global_optargs.push({
                key: "db",
                val: new Term().db(connection.db)._self
            });
        }

        for(var key in options) {
            if ((key === "useOutdated") || (key === "durability") || (key === "noreply") || (key === "timeFormat") || (key === "profile")) {
                query.global_optargs.push({
                    key: self._translateArgs[key] || key,
                    val: new Term().expr(options[key])._self
                });
            }
            else {
                setTimeout( function() {
                    reject(new Error.ReqlDriverError("Unrecognized option `"+key+"` in `run`. Available options are useOutdated <bool>, durability <string>, noreply <bool>, timeFormat <string>, profile <bool>"));
                }, 0);
                return;
            }
        };

        connection._send(query, token, resolve, reject, self._self, options);
    });

    if (options.noReply) return self; // Do not return a promise if the user ask for no reply.

    return p;
}


// Manipulating databases
Term.prototype.dbCreate = function(db) {
    // Check for arity is done in r.prototype.dbCreate
    this._noPrefix(this, "dbCreate");
    return new DbCreate(db);
}
Term.prototype.dbDrop = function(db) {
    this._noPrefix(this, "dbDrop");
    return new DbDrop(db);
}
Term.prototype.dbList = function() {
    this._noPrefix(this, "dbList");
    return new DbList();
}

// Manipulating Tables
Term.prototype.tableCreate = function(table, options) {
    this._arityRange(arguments, 1, 2, "tableCreate", this); 

    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if ((key !== "primaryKey") && (key !== "durability") && (key !== "cacheSize") && (key !== "datacenter")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `tableCreate`. Available options are primaryKey <string>, durability <string>, cacheSize <nunber>, datancenter <string>");
            }
        }
    }

    if (this._self.type == null) {
        return new TableCreate([table], options);
    }
    else {
        return new TableCreate([this, table], options);
    }
}
Term.prototype.tableDrop = function(table) {
    this._arity(arguments, 1, "tableDrop", this); 
    if (this._self.type == null) {
        return new TableDrop([table]);
    }
    else {
        return new TableDrop([this, table]);
    }
}
Term.prototype.tableList = function() {
    this._arity(arguments, 0, "tableList", this); 
    if (this._self.type == null) {
        return new TableList();
    }
    else {
        return new TableList(this);
    }
}
Term.prototype.indexList = function() {
    return new IndexList(this);
}
Term.prototype.indexCreate = function(name, fn) {
    this._arityRange(arguments, 1, 2, "indexCreate", this); 
    return new IndexCreate(this, name, fn);
}
Term.prototype.indexDrop = function(name) {
    this._arity(arguments, 1, "indexDrop", this); 
    return new IndexDrop(this, name);
}
Term.prototype.indexStatus = function() {
    return new IndexStatus(this, helper.toArray(arguments));
}
Term.prototype.indexWait = function() {
    return new IndexWait(this, helper.toArray(arguments));
}


// Writing data
Term.prototype.insert = function(documents, options) {
    this._arityRange(arguments, 1, 2, "insert", this); 

    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if ((key !== "returnVals") && (key !== "durability") && (key !== "upsert")) {
                // We don't pass this to Error.ReqlDriverError because it doesn't make a super-pretty 
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `insert`", this, "Available options are returnVals <bool>, durability <string>, upsert <bool>");
            }
        }
    }

    return new Insert(this, documents, options);
}
Term.prototype.update = function(newValue, options) {
    this._arityRange(arguments, 1, 2, "update", this); 
    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if ((key !== "returnVals") && (key !== "durability") && (key !== "nonAtomic")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `update`", this, "Available options are returnVals <bool>, durability <string>, nonAtomic <bool>");
            }
        }
    }

    return new Update(this, newValue, options);
}
Term.prototype.replace = function(newValue, options) {
    this._arityRange(arguments, 1, 2, "replace", this); 
    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if ((key !== "returnVals") && (key !== "durability") && (key !== "nonAtomic")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `replace`", this, "Available options are returnVals <bool>, durability <string>, nonAtomic <bool>");
            }
        }
    }

    return new Replace(this, newValue, options);
}
Term.prototype.delete = function(options) {
    this._arityRange(arguments, 0, 1, "delete", this); 
    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if ((key !== "returnVals") && (key !== "durability")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `delete`", this, "Available options are returnVals <bool>, durability <string>");
            }
        }
    }

    return new Delete(this, options);
}
Term.prototype.sync = function() {
    this._arity(arguments, 0, "sync", this); 
    return new Sync(this);
}

// Selecting data
Term.prototype.db = function(db) {
    this._arity(arguments, 1, "db", this); 
    this._noPrefix(this, "db");
    return new Db(db);
}
Term.prototype.table = function(table, options) {
    this._arityRange(arguments, 1, 2, "table", this); 

    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if (key !== "useOutdated") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `table`", this, "Available option is useOutdated <bool>");
            }
        }
    }


    if (this._self.type == null) {
        return new Table([table], options);
    }
    else {
        return new Table([this, table], options);
    }
}
Term.prototype.get = function(primaryKey) {
    this._arity(arguments, 1, "get", this); 
    return new Get(this, primaryKey);
}
Term.prototype.getAll = function() {
    this._arityRange(arguments, 1, Infinity, "getAll", this); 

    var args = helper.toArray(arguments);
    return new GetAll(this, args);
}
Term.prototype.between = function(start, end, options) {
    this._arityRange(arguments, 2, 3, "between", this); 

    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if ((key !== "index") && (key !== "leftBound") && (key !== "rightBound")){
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `between`", this, "Available options are index <string>, leftBound <string>, rightBound <string>");
            }
        }
    }

    return new Between(this, start, end, options);
}
Term.prototype.filter = function(filter, options) {
    this._arityRange(arguments, 1, 2, "filter", this); 

    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if (key !== "default") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `filter`", this, "Available option is filter");
            }
        }
    }

    return new Filter(this, filter, options);
}

// Joins
Term.prototype.innerJoin = function(sequence, predicate) {
    this._arity(arguments, 2, "innerJoin", this); 
    return new InnerJoin(this, sequence, predicate);
}
Term.prototype.outerJoin = function(sequence, predicate) {
    this._arity(arguments, 2, "outerJoin", this); 
    return new OuterJoin(this, sequence, predicate);
}
Term.prototype.eqJoin = function(rightKey, sequence, options) {
    this._arityRange(arguments, 2, 3, "eqJoin", this); 

    if (helper.isPlainObject(options)) {
        for(var key in options) {
            if (key !== "index") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `eqJoin`", this, "Available option is index <string>");
            }
        }
    }
    return new EqJoin(this, rightKey, sequence, options);
}
Term.prototype.zip = function() {
    this._arity(arguments, 0, "zip", this); 
    return new Zip(this);
}



// Transformation
Term.prototype.map = function(transformation) {
    this._arity(arguments, 1, "map", this); 
    return new Map(this, transformation);
}
Term.prototype.withFields = function() {
    this._arityRange(arguments, 1, Infinity, "withFields", this); 

    var args = helper.toArray(arguments);
    return new WithFields(this, args);
}
Term.prototype.concatMap = function(transformation) {
    this._arity(arguments, 1, "concatMap", this); 

    return new ConcatMap(this, transformation);
}
Term.prototype.orderBy = function() {
    this._arityRange(arguments, 1, Infinity, "orderBy", this); 

    var args = helper.toArray(arguments);
    return new OrderBy(this, args);
}
Term.prototype.desc = function(field) {
    this._arity(arguments, 1, "desc", this); 
    this._noPrefix(this, "desc");
    return new Desc(field);
}
Term.prototype.asc = function(field) {
    this._arity(arguments, 1, "asc", this); 
    this._noPrefix(this, "asc");
    return new Asc(field);
}
Term.prototype.skip = function(value) {
    this._arity(arguments, 1, "skip", this); 
    return new Skip(this, value);
}
Term.prototype.limit = function(value) {
    this._arity(arguments, 1, "limit", this); 
    return new Limit(this, value);
}
Term.prototype.slice = function(start, end, options) {
    this._arityRange(arguments, 1, 3, "slice", this); 
    return new Slice(this, start, end, options);
}
Term.prototype.nth = function(value) {
    this._arity(arguments, 1, "nth", this); 
    return new Nth(this, value);
}
Term.prototype.indexesOf = function(predicate) {
    this._arity(arguments, 1, "indexesOf", this); 
    return new IndexesOf(this, predicate);
}
Term.prototype.isEmpty = function() {
    this._arity(arguments, 0, "isEmpty", this); 
    return new IsEmpty(this);
}
Term.prototype.union = function(other) {
    this._arity(arguments, 1, "union", this); 
    return new Union(this, other);
}
Term.prototype.sample = function(size) {
    this._arity(arguments, 1, "sample", this); 
    return new Sample(this, size);
}

// Aggregations
Term.prototype.reduce = function(func, base) {
    this._arityRange(arguments, 1, 2, "reduce", this); 
    return new Reduce(this, func, base);
}
Term.prototype.count = function(filter) {
    this._arityRange(arguments, 0, 1, "count", this); 
    return new Count(this, filter);
}
Term.prototype.distinct = function() {
    this._arity(arguments, 0, "distinct", this); 
    return new Distinct(this);
}
Term.prototype.groupedMapReduce = function(group, map, reduce, base) {
    this._arityRange(arguments, 3, 4, "groupedMapReduce", this); 
    return new GroupedMapReduce(this, group, map, reduce, base);
}
Term.prototype.groupBy = function() {
    this._arityRange(arguments, 2, Infinity, "groupBy", this); 

    var args = helper.toArray(arguments); 
    return new GroupBy(this, args);
}
Term.prototype.contains = function() {
    this._arityRange(arguments, 1, Infinity, "contains", this); 
    var args = helper.toArray(arguments);
    return new Contains(this, args);
}


// Document manipulation
Term.prototype.row = function() {
    this._arity(arguments, 0, "r.row", this); 
    this._noPrefix(this, "row");
    return new ImplicitVar();
}
Term.prototype.pluck = function() {
    this._arityRange(arguments, 1, Infinity, "pluck", this); 

    var args = helper.toArray(arguments);
    return new Pluck(this, args);
}
Term.prototype.without = function() {
    this._arityRange(arguments, 1, Infinity, "without", this); 

    var args = helper.toArray(arguments);
    return new Without(this, args);
}
Term.prototype.merge = function(arg) {
    this._arity(arguments, 1, "merge", this); 
    return new Merge(this, arg);
}
Term.prototype.literal = function(obj) {
    this._arity(arguments, 1, "literal", this); 
    this._noPrefix(this, "literal");

    return new Literal(obj);
}
Term.prototype.append = function(value) {
    this._arity(arguments, 1, "append", this); 
    return new Append(this, value);
}
Term.prototype.prepend = function(value) {
    this._arity(arguments, 1, "prepend", this); 
    return new Prepend(this, value);
}
Term.prototype.difference = function(other) {
    this._arity(arguments, 1, "difference", this); 
    return new Difference(this, other);
}
Term.prototype.setInsert = function(other) {
    this._arity(arguments, 1, "setInsert", this); 
    return new SetInsert(this, other);
}
Term.prototype.setUnion = function(other) {
    this._arity(arguments, 1, "setUnion", this); 
    return new SetUnion(this, other);
}
Term.prototype.setIntersection = function(other) {
    this._arity(arguments, 1, "setIntersection", this); 
    return new SetIntersection(this, other);
}
Term.prototype.setDifference = function(other) {
    this._arity(arguments, 1, "setDifference", this); 
    return new SetDifference(this, other);
}
Term.prototype.getField = function(field) {
    this._arity(arguments, 1, "(...)", this); 
    return new GetField(this, field);
}
Term.prototype.hasFields = function() {
    this._arityRange(arguments, 1, Infinity, "hasFields", this); 
    var args = helper.toArray(arguments);
    return new HasFields(this, args);
}
Term.prototype.insertAt = function(index, value) {
    this._arity(arguments, 2, "insertAt", this); 
    return new InsertAt(this, index, value);
}
Term.prototype.spliceAt = function(index, array) {
    this._arityRange(arguments, 1, 2, "spliceAt", this); 
    return new SpliceAt(this, index, array);
}
Term.prototype.deleteAt = function(start, end) {
    this._arityRange(arguments, 1, 2, "deleteAt", this); 
    return new DeleteAt(this, start, end);
}
Term.prototype.changeAt = function(index, value) {
    this._arityRange(arguments, 1, 2, "changeAt", this); 
    return new ChangeAt(this, index, value);
}
Term.prototype.keys = function() {
    this._arity(arguments, 0, "keys", this); 
    return new Keys(this);
}



// String
Term.prototype.match = function(regex) {
    this._arity(arguments, 1, "match", this); 
    return new Match(this, regex);
}


// Math and Logic
Term.prototype.add = function() {
    this._arityRange(arguments, 1, Infinity, "add", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Add(args);
}
Term.prototype.sub = function() {
    this._arityRange(arguments, 1, Infinity, "sub", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Sub(args);
}
Term.prototype.mul = function() {
    this._arityRange(arguments, 1, Infinity, "mul", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Mul(args);
}
Term.prototype.div = function() {
    this._arityRange(arguments, 1, Infinity, "div", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Div(args);
}
Term.prototype.mod = function(b) {
    this._arity(arguments, 1, "mod", this); 

    return new Mod(this, b);
}
Term.prototype.and = function() {
    this._arityRange(arguments, 1, Infinity, "and", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new And(args);
}
Term.prototype.or = function() {
    this._arityRange(arguments, 1, Infinity, "or", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Or(args);
}
Term.prototype.eq = function() {
    this._arityRange(arguments, 1, Infinity, "eq", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Eq(args);
}
Term.prototype.ne = function() {
    this._arityRange(arguments, 1, Infinity, "ne", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Ne(args);
}
Term.prototype.gt = function(other) {
    this._arityRange(arguments, 1, Infinity, "gt", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Gt(args);
}
Term.prototype.ge = function(other) {
    this._arityRange(arguments, 1, Infinity, "ge", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Ge(args);
}
Term.prototype.lt = function(other) {
    this._arityRange(arguments, 1, Infinity, "lt", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Lt(args);
}
Term.prototype.le = function(other) {
    this._arityRange(arguments, 1, Infinity, "le", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Le(args);
}
Term.prototype.not = function() {
    this._arity(arguments, 0, 'not', this); 
    return new Not(this);
}


// Dates and times
Term.prototype.now = function() {
    this._noPrefix(this, "now");
    return new Now(this);
}
Term.prototype.time = function() {
    this._noPrefix(this, "time");

    var args = helper.toArray(arguments);
    return new Time(args);
}
Term.prototype.epochTime = function(epochTime) {
    this._noPrefix(this, "epochTime");

    return new EpochTime(epochTime);
}
Term.prototype.ISO8601 = function(isoTime, options) {
    this._arityRange(arguments, 1, 2, 'ISO8601', this); 
    this._noPrefix(this, "ISO8601");

    return new ISO8601(isoTime, options);
}
Term.prototype.inTimezone = function(timezone) {
    this._arity(arguments, 1, 'inTimezone', this); 
    return new InTimezone(this, timezone);
}
Term.prototype.timezone = function() {
    this._arity(arguments, 0, 'timezone', this); 
    return new Timezone(this);
}
Term.prototype.during = function(left, right, options) {
    this._arityRange(arguments, 2, 3, 'during', this); 
    return new During(this, left, right, options);
}
Term.prototype.date = function() {
    this._arity(arguments, 0, 'date', this); 
    return new ReqlDate(this);
}
Term.prototype.timeOfDay = function() {
    this._arity(arguments, 0, 'timeOfDay', this); 
    return new TimeOfDay(this);
}
Term.prototype.year = function() {
    this._arity(arguments, 0, 'year', this); 
    return new Year(this);
}
Term.prototype.month = function() {
    this._arity(arguments, 0, 'month', this); 
    return new Month(this);
}
Term.prototype.day = function() {
    this._arity(arguments, 0, 'day', this); 
    return new Day(this);
}
Term.prototype.dayOfYear = function() {
    this._arity(arguments, 0, 'dayOfYear', this); 
    return new DayOfYear(this);
}
Term.prototype.dayOfWeek = function() {
    this._arity(arguments, 0, 'dayOfWeek', this); 
    return new DayOfWeek(this);
}
Term.prototype.hours = function() {
    this._arity(arguments, 0, 'hours', this); 
    return new Hours(this);
}
Term.prototype.minutes = function() {
    this._arity(arguments, 0, 'minutes', this); 
    return new Minutes(this);
}
Term.prototype.seconds = function() {
    this._arity(arguments, 0, 'seconds', this); 
    return new Seconds(this);
}
Term.prototype.toISO8601 = function() {
    this._arity(arguments, 0, 'toISO8601', this); 
    return new ToISO8601(this);
}
Term.prototype.toEpochTime = function() {
    this._arity(arguments, 0, 'toEpochTime', this); 
    return new ToEpochTime(this);
}
Term.prototype.monday = function() { return new Monday(); }
Term.prototype.tuesday = function() { return new Tuesday(); }
Term.prototype.wednesday = function() { return new Wednesday(); }
Term.prototype.thursday = function() { return new Thursday(); }
Term.prototype.friday = function() { return new Friday(); }
Term.prototype.saturday = function() { return new Saturday(); }
Term.prototype.sunday = function() { return new Sunday(); }

Term.prototype.january = function() { return new January(); }
Term.prototype.february = function() { return new February(); }
Term.prototype.march = function() { return new March(); }
Term.prototype.april = function() { return new April(); }
Term.prototype.may = function() { return new May(); }
Term.prototype.june = function() { return new June(); }
Term.prototype.july = function() { return new July(); }
Term.prototype.august = function() { return new August(); }
Term.prototype.september = function() { return new September(); }
Term.prototype.october = function() { return new October(); }
Term.prototype.november = function() { return new November(); }
Term.prototype.december = function() { return new December(); }



Term.prototype.do = function(func) {
    this._arity(arguments, 1, 'do', this); 

    return new Do(this, func);
}
Term.prototype.branch = function(predicate, trueBranch, falseBranch) {
    this._noPrefix(this, "branch");

    return new Branch(predicate, trueBranch, falseBranch);
}
Term.prototype.forEach = function(func) {
    this._arity(arguments, 0, 'forEach', this); 
    return new ForEach(this, func);
}
Term.prototype.error = function(strError) {
    this._noPrefix(this, "error");

    return new ReqlError(strError);
}
Term.prototype.default = function(func) {
    this._arity(arguments, 1, 'default', this); 
    return new Default(this, func);
}
Term.prototype.expr = function(expression, nestingLevel) {
    this._arity(arguments, 1, 'default', this); 
    this._noPrefix(this, "expr");

    // undefined will be caught in the last else
    var ar, obj;

    if (expression === undefined) throw new Error.ReqlDriverError("Cannot convert `undefined` with r.expr()")

    if (nestingLevel == null) nestingLevel = _nestingLevel;
    if (nestingLevel < 0) throw new Error.ReqlDriverError("Nesting depth limit exceeded.\nYou probably have a circular reference somewhere")

    if (expression instanceof Term) {
        return expression;
    }
    else if (expression instanceof Function) {
        return new Func(expression);
    }
    else if (expression instanceof Date) {
        return new Term().ISO8601(expression.toISOString())
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
            throw new Error.ReqlDriverError("Cannot convert `"+expression+"` to datum.")
        }
    }
    return this;
}
Term.prototype.js = function(arg) {
    this._arity(arguments, 1, 'js', this); 
    this._noPrefix(this, "js");

    return new Js(arg);
}
Term.prototype.coerceTo = function(type) {
    this._arity(arguments, 1, 'coerceTo', this); 
    return new CoerceTo(this, type);
}
Term.prototype.typeOf = function() {
    this._arity(arguments, 0, 'typeOf', this); 
    return new TypeOf(this);
}
Term.prototype.info = function() {
    this._arity(arguments, 0, 'info', this); 
    return new Info(this);
}
Term.prototype.json = function(json) {
    this._arity(arguments, 1, 'info', this); 
    this._noPrefix(this, "json");
    return new Json(json);
}
Term.prototype.exprJSON = function(value) {
    var result = this._exprJSON(value);

    if (result.isJSON === true) {
        return new Term().json(JSON.stringify(value))
    }
    else {
        return result.value;
    }
}
// Return {isJSON: true, value: <object that can be serialized in JSON>}
// Return {isJSON: false, value: <instance of Term>
// Convert as many fields in JSON as possible,
Term.prototype._exprJSON = function(value, nestingLevel) {
    var result;
    var isJSON;

    if (nestingLevel == null) nestingLevel = _nestingLevel;

    if (value instanceof Term) {
        return {isJSON: false, value: value};
    }
    else if (value instanceof Date) {
        return {isJSON: false, value: new Term().expr(value)};
    }
    else if (value instanceof Function) {
        return {isJSON: false, value: new Term().expr(value)};
    }
    else if (Array.isArray(value)) {
        isJSON = true; // value is considered to be JSON valid for now
        result = [];

        for(var i=0; i<value.length; i++) {
            if (isJSON === true) {
                var temp = Term.prototype._exprJSON(value[i]);
                if (temp.isJSON === false) { // first field that can't be serialized in JSON
                    for(var k=0; k<i; k++) { // Convert all previous fields to JSON strings
                        result.push(new Term().json(JSON.stringify(value[k])));
                    }
                    result.push(temp.value); // This one is not serializable
                    isJSON = false;
                }
            }
            else {
                var temp = Term.prototype._exprJSON(value[i])
                if (!temp.isJSON) {
                    result.push(temp.value); // That's a term
                }
                else {
                    result.push(Term.prototype.json(JSON.stringify(temp.value)));
                }
            }
        }
        if (isJSON === true) {
            return {isJSON: true, value: value};
        }
        else {
            return {isJSON: false, value: new Term().expr(result)};
        }
    }
    else if (helper.isPlainObject(value)) {
        isJSON = true;
        result = {};
        previousKeys = [];

        for(var key in value) {
            if (value.hasOwnProperty(key)) {
                if (isJSON) {
                    var temp = Term.prototype._exprJSON(value[key]);
                    if (temp.isJSON === false) {
                        for(var k=0; k<previousKeys.length; k++) {
                            result[previousKeys[k]](new Term().json(JSON.stringify(value[k])));
                        }
                        result[key] = new Term().expr(value[key]);
                        isJSON = false;
                    }
                    else {
                        previousKeys.push(key);
                    }
                }
                else {
                    var temp = Term.prototype._exprJSON(value[key]);
                    if (temp.isJSON === false) {
                        result[key] = temp.value;
                    }
                    else {
                        result[key] = new Term().json(JSON.stringify(temp.value));
                    }
                }
            }
        }
        if (isJSON === true) {
            return {isJSON: true, value: value};
        }
        else {
            return {isJSON: false, value: new Term().expr(result)};
        }

    }
    else { // Primitive
        return {isJSON: true, value: value}
    }
}








Term.prototype._wrap = function() {
    var self = this;
    //TODO Remove this hackish thing and recursive like a grown up.
    if (helper.hasImplicit(this._self)) {
        //Must padd at least one variable to the function or it won't accept r.row
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
    defaultTimezone: "default_timezone",
    noReply: "noreply",
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
Term.prototype._setNestingLevel = function() {
    //TODO use r.nestingLevel
    _nestingLevel = 100;
}

Term.prototype._noPrefix = function(query, method) {
    if (query._self.type !== undefined) throw new Error.ReqlDriverError("`"+method+"` is not defined", query);
}
Term.prototype._arityRange = function(args, min, max, method, query) {
    if (args.length < min) {
        throw new Error.ReqlDriverError("`"+method+"` takes at least "+min+" argument"+((min>1)?'s':'')+", "+args.length+" provided", query);
    }
    else if (args.length > max) {
        throw new Error.ReqlDriverError("`"+method+"` takes at most "+max+" argument"+((max>1)?'s':'')+", "+args.length+" provided", query);
    }
}
Term.prototype._arity = function(args, num, method, query) {
    if (args.length !== num) {
        throw new Error.ReqlDriverError("`"+method+"` takes "+num+" argument"+((num>1)?'s':'')+", "+args.length+" provided", query);
    }
}







// Datums
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
function Func(func) {
    this.type = "FUNC";

    var args = []; // contains Var instances
    var argNums = []; // contains int
    for(var i=0; i<func.length; i++) {
        args.push(new Var(Func.prototype.nextVarId));
        argNums.push(Func.prototype.nextVarId);

        Func.prototype.nextVarId++; //TODO Reset when it hits the limit
    }

    var arg = func.apply(func, args)
    if (arg === undefined) throw new Error.ReqlDriverError("Annonymous function returned `undefined`. Did you forget a `return`?", this);
    body = new Term().expr(arg);

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


// Manipulating databases
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

// Manipulating tables
function TableCreate(args, options) {
    this.type = "TABLE_CREATE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function TableDrop(args) {
    this.type = "TABLE_DROP";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function TableList(db) {
    this.type = "TABLE_LIST";
    this.args = [];
    if (db !== undefined) this.args.push(db._self);

    var term = new Term();
    term._self = this;
    return term;
}
function IndexCreate(table, name, fn) {
    this.type = "INDEX_CREATE";
    this.args = [table._self, new Term().expr(name)._self];
    if (fn !== undefined) {
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
    if (indexes !== undefined) {
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
    if (indexes !== undefined) {
        for(var i=0; i<indexes.length; i++) {
            this.args.push(new Term().expr(indexes[i])._self)
        }
    }

    var term = new Term();
    term._self = this;
    return term;
}


// Selecting data
function Db(db) {
    this.type = "DB";
    this.args = [];
    this.args.push(new Term().expr(db)._self);

    var term = new Term();
    term._self = this;
    return term;
}
function Table(args, options) {
    this.type = "TABLE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    if (options !== undefined) this.optargs = Term.prototype._makeOptArgs(options);

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
    if ((args.length > 1) && (args[args.length-1].index !== undefined)) {
        this.optargs = Term.prototype._makeOptArgs(args[args.length-1]);
    }
    else {
        this.args.push(new Term().expr(args[args.length-1])._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Between(table, start, end, options) {
    this.type = "BETWEEN";
    this.args = [table._self];
    this.args.push(new Term().expr(start)._self);
    this.args.push(new Term().expr(end)._self);
    if (options !== undefined) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function Filter(table, filter, options) {
    this.type = "FILTER";
    this.args = [table._self];
    this.args.push(new Term().expr(filter)._wrap()._self);

    if ((helper.isPlainObject(options))) {
        this.optargs = Term.prototype._makeOptArgs(options);
    }

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
function EqJoin(sequenceLeft, rightKey, sequenceRight, index) {
    this.type = "EQ_JOIN";
    this.args = [sequenceLeft._self, new Term().expr(rightKey)._wrap()._self, new Term().expr(sequenceRight)._self];

    if ((helper.isPlainObject(index))) {
        this.optargs = Term.prototype._makeOptArgs(index);
    }


    var term = new Term();
    term._self = this;
    return term;
}
function Zip(sequence) {
    this.type = "ZIP",
    this.args = [sequence._self];

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
        this.args.push(new Term().expr(fields[i])._wrap()._self);
    }
    if ((helper.isPlainObject(fields[fields.length-1])) && (fields[fields.length-1].index !== undefined)) {
        this.optargs = Term.prototype._makeOptArgs(fields[fields.length-1]);
    }
    else {
        this.args.push(new Term().expr(fields[fields.length-1])._wrap()._self);
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Desc(field) {
    this.type = "DESC";
    this.args = [new Term().expr(field)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Asc(field) {
    this.type = "ASC";
    this.args = [new Term().expr(field)._self];

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
function Slice(sequence, start, end, options) {
    this.type = "SLICE";
    this.args = [sequence._self, new Term().expr(start)._self];
    if (end !== undefined) {
        this.args.push(new Term().expr(end)._self);
    }

    if (options) this.optargs = Term.prototype._makeOptArgs(options);

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
    if (base !== undefined) this.optargs = Term.prototype._makeOptArgs({base: base});

    var term = new Term();
    term._self = this;
    return term;
}
function Count(sequence, filter) {
    this.type = "COUNT";
    this.args = [sequence._self];
    if (filter !== undefined) this.args.push(new Term().expr(filter)._wrap()._self)

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
    if (base !== undefined) this.optargs = Term.prototype._makeOptArgs({base: base});

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


// Document manipulation
function ImplicitVar() {
    this.type = "IMPLICIT_VAR";

    var term = new Term();
    term._self = this;
    return term;
}
function Pluck(sequence, fields) {
    this.type = "PLUCK";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term().expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Without(sequence, fields) {
    this.type = "WITHOUT";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term().expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Merge(obj, arg) {
    this.type = "MERGE";
    this.args = [obj._self, new Term().expr(arg)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Literal(obj) {
    this.type = "LITERAL";
    this.args = new Term().expr(obj)._self;

    var term = new Term();
    term._self = this;
    return term;
}
function Append(sequence, value) {
    this.type = "APPEND";
    this.args = [sequence._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Prepend(sequence, value) {
    this.type = "PREPEND";
    this.args = [sequence._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Difference(sequence, other) {
    this.type = "DIFFERENCE";
    this.args = [sequence._self, new Term().expr(other)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function SetInsert(sequence, other) {
    this.type = "SET_INSERT";
    this.args = [sequence._self, new Term().expr(other)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function SetUnion(sequence, other) {
    this.type = "SET_UNION";
    this.args = [sequence._self, new Term().expr(other)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function SetIntersection(sequence, other) {
    this.type = "SET_INTERSECTION";
    this.args = [sequence._self, new Term().expr(other)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function SetDifference(sequence, other) {
    this.type = "SET_DIFFERENCE";
    this.args = [sequence._self, new Term().expr(other)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function GetField(obj, field) {
    this.type = "GET_FIELD";
    this.args = [obj._self, new Term().expr(field)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function HasFields(sequence, fields) {
    this.type = "HAS_FIELDS";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term().expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function InsertAt(sequence, index, value) {
    this.type = "INSERT_AT";
    this.args = [sequence._self, new Term().expr(index)._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function SpliceAt(sequence, index, array) {
    this.type = "SPLICE_AT";
    this.args = [sequence._self, new Term().expr(index)._self, new Term().expr(array)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function DeleteAt(sequence, start, end) {
    this.type = "DELETE_AT";
    this.args = [sequence._self, new Term().expr(start)._self];
    if (end !== undefined) this.args.push(new Term().expr(end)._self);

    var term = new Term();
    term._self = this;
    return term;
}
function ChangeAt(sequence, index, value) {
    this.type = "CHANGE_AT";
    this.args = [sequence._self, new Term().expr(index)._self, new Term().expr(value)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Keys(sequence) {
    this.type = "KEYS";
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    return term;
}


// String
function Match(str, regex) {
    this.type = "MATCH";
    this.args = [str._self, new Term().expr(regex)._self];

    var term = new Term();
    term._self = this;
    return term;
}


// Math and Logic
function Add(args) { // args is an array
    this.type = "ADD";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Sub(args) {
    this.type = "SUB";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Mul(args) {
    this.type = "MUL";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Div(args) {
    this.type = "DIV";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Mod(a, b) {
    this.type = "MOD";
    this.args = [a._self, new Term().expr(b)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function And(args) {
    this.type = "ALL";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Or(args) {
    this.type = "ANY";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Eq(args) {
    this.type = "EQ";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Ne(args) {
    this.type = "NE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Gt(args) {
    this.type = "GT";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Ge(args) {
    this.type = "GE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Lt(args) {
    this.type = "LT";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Le(args) {
    this.type = "LE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function Not(bool) {
    this.type = "NOT";
    this.args = [bool._self];

    var term = new Term();
    term._self = this;
    return term;
}


// Dates and times
function Now() {
    this.type = "NOW";

    var term = new Term();
    term._self = this;
    return term;
}
function Time(args) {
    this.type = "TIME";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term().expr(args[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    return term;
}
function EpochTime(epochTime) {
    this.type = "EPOCH_TIME";
    this.args = [new Term().expr(epochTime)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function ISO8601(isoTime, options) {
    this.type = "ISO8601";
    this.args = [new Term().expr(isoTime)._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function InTimezone(time, timezone) {
    this.type = "IN_TIMEZONE";
    this.args = [time._self, new Term().expr(timezone)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Timezone(time) {
    this.type = "TIMEZONE";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function During(time, left, right, options) {
    this.type = "DURING";
    this.args = [time._self, new Term().expr(left)._self, new Term().expr(right)._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}
function ReqlDate(time) {
    this.type = "DATE";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function TimeOfDay(time) {
    this.type = "TIME_OF_DAY";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Year(time) {
    this.type = "YEAR";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Month(time) {
    this.type = "MONTH";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Day(time) {
    this.type = "DAY";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function DayOfYear(time) {
    this.type = "DAY_OF_YEAR";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function DayOfWeek(time) {
    this.type = "DAY_OF_WEEK";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Hours(time) {
    this.type = "HOURS";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Minutes(time) {
    this.type = "MINUTES";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Seconds(time) {
    this.type = "SECONDS";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function ToISO8601(time) {
    this.type = "TO_ISO8601";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function ToEpochTime(time) {
    this.type = "TO_EPOCH_TIME";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Monday() {
    this.type = "MONDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function Tuesday() {
    this.type = "TUESDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function Wednesday() {
    this.type = "WEDNESDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function Thursday() {
    this.type = "THURSDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function Friday() {
    this.type = "FRIDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function Saturday() {
    this.type = "SATURDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function Sunday() {
    this.type = "SUNDAY"
    var term = new Term();
    term._self = this;
    return term;
}
function January() {
    this.type = "JANUARY"
    var term = new Term();
    term._self = this;
    return term;
}
function February() {
    this.type = "FEBRUARY"
    var term = new Term();
    term._self = this;
    return term;
}
function March() {
    this.type = "MARCH"
    var term = new Term();
    term._self = this;
    return term;
}
function April() {
    this.type = "APRIL"
    var term = new Term();
    term._self = this;
    return term;
}
function May() {
    this.type = "MAY"
    var term = new Term();
    term._self = this;
    return term;
}
function June() {
    this.type = "JUNE"
    var term = new Term();
    term._self = this;
    return term;
}
function July() {
    this.type = "JULY"
    var term = new Term();
    term._self = this;
    return term;
}
function August() {
    this.type = "AUGUST"
    var term = new Term();
    term._self = this;
    return term;
}
function September() {
    this.type = "SEPTEMBER"
    var term = new Term();
    term._self = this;
    return term;
}
function October() {
    this.type = "OCTOBER"
    var term = new Term();
    term._self = this;
    return term;
}
function November() {
    this.type = "NOVEMBER"
    var term = new Term();
    term._self = this;
    return term;
}
function December() {
    this.type = "DECEMBER"
    var term = new Term();
    term._self = this;
    return term;
}


// Control structures
function Do(bind, func) {
    this.type = "FUNCALL";
    //TODO WTF these arguments are in the reversed order
    this.args = [new Term().expr(func)._wrap()._self, bind._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Branch(predicate, trueBranch, falseBranch) {
    this.type = "BRANCH";
    this.args = [new Term().expr(predicate)._wrap()._self, new Term().expr(trueBranch)._wrap()._self, new Term().expr(falseBranch)._wrap()._self,];

    var term = new Term();
    term._self = this;
    return term;
}
function ForEach(sequence, func) {
    this.type = "FOREACH";
    this.args = [sequence._self, new Term().expr(func)._wrap()._self];

    var term = new Term();
    term._self = this;
    return term;
}
function ReqlError(strError) {
    this.type = "ERROR";
    if (strError !== undefined) this.args = [new Term().expr(strError)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function Default(term, value) {
    this.type = "DEFAULT";
    this.args = [term._self, new Term().expr(value)._self];

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
function CoerceTo(value, type) {
    this.type = "COERCE_TO";
    this.args = [value._self, new Term().expr(type)._self];

    var term = new Term();
    term._self = this;
    return term;
}
function TypeOf(value) {
    this.type = "TYPEOF";
    this.args = [value._self];

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
function Json(json) {
    this.type = "JSON";
    this.args = [new Term().expr(json)._self];

    var term = new Term();
    term._self = this;
    return term;
}



// Write
function Insert(table, documents, options) {
    this.type = "INSERT";
    this.args = [table._self];
    this.args.push(new Term().exprJSON(documents)._self);
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
function Delete(selection, options) {
    //TODO Add options
    this.type = "DELETE";
    this.args = [selection._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(options);

    var term = new Term();
    term._self = this;
    return term;
}


module.exports = Term;
