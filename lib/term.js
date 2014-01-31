var Promise = require("bluebird");

var Error = require(__dirname+"/error.js");
var helper = require(__dirname+"/helper.js");

function Term(r) {
    var self = this;
    var term = function(field) {
        Term.prototype._arity(arguments, 1, "(...)", self); 
        return term.getField(field);
    }
    term.__proto__ = self.__proto__;
    term._self = {};
    term._r = r;
    return term;
}


Term.prototype.run = function(connection, options) {
    var self = this;

    if (helper.isPlainObject(connection) && (connection._isConnection) && (connection._isConnection() === true)) {
        if (!helper.isPlainObject(options)) options = {};
        if (connection._isOpen() !== true) throw new Error.ReqlDriverError("`run` was called with a closed connection", this);
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
                    val: new Term(self._r).db(connection.db)._self
                });
            }

            //For testing only
            if (connection.batch_conf) {
                query.global_optargs.push({
                    key: "batch_conf",
                    val: new Term(self._r).expr({max_els: connection.batch_conf})._self
                });
            }


            for(var key in options) {
                if ((key === "useOutdated") || (key === "durability") || (key === "noreply") || (key === "timeFormat") || (key === "profile")) {
                    query.global_optargs.push({
                        key: self._translateArgs[key] || key,
                        val: new Term(self._r).expr(options[key])._self
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


    }
    else {
        var pool = self._r.getPool(); // if self._r is defined, so is self._r.getPool()
        if (!pool) {
            throw new Error.ReqlDriverError("`run` was called without a connection and no pool has been created", self);
        }
        else {
            options = (helper.isPlainObject(connection)) ? connection : {};

            var p = new Promise(function(resolve, reject) {
                pool.getConnection().then(function(connection) {
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
                            val: new Term(self._r).db(connection.db)._self
                        });
                    }

                    for(var key in options) {
                        if ((key === "useOutdated") || (key === "durability") || (key === "noreply") || (key === "timeFormat") || (key === "profile")) {
                            query.global_optargs.push({
                                key: self._translateArgs[key] || key,
                                val: new Term(self._r).expr(options[key])._self
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
                }).error(function(error) {
                    reject(error);
                });
            });
        }
    }

    //if (options.noreply) return self; // Do not return a promise if the user ask for no reply.

    return p;
}


// Manipulating databases
Term.prototype.dbCreate = function(db) {
    // Check for arity is done in r.prototype.dbCreate
    this._noPrefix(this, "dbCreate");
    return new DbCreate(this._r, db);
}
Term.prototype.dbDrop = function(db) {
    this._noPrefix(this, "dbDrop");
    return new DbDrop(this._r, db);
}
Term.prototype.dbList = function() {
    this._noPrefix(this, "dbList");
    return new DbList(this._r);
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
        return new TableCreate(this._r, [table], options);
    }
    else {
        return new TableCreate(this._r, [this, table], options);
    }
}
Term.prototype.tableDrop = function(table) {
    this._arity(arguments, 1, "tableDrop", this); 
    if (this._self.type == null) {
        return new TableDrop(this._r, [table]);
    }
    else {
        return new TableDrop(this._r, [this, table]);
    }
}
Term.prototype.tableList = function() {
    this._arity(arguments, 0, "tableList", this); 
    if (this._self.type == null) {
        return new TableList(this._r);
    }
    else {
        return new TableList(this._r, this);
    }
}
Term.prototype.indexList = function() {
    return new IndexList(this._r, this);
}
Term.prototype.indexCreate = function(name, fn) {
    this._arityRange(arguments, 1, 2, "indexCreate", this); 
    return new IndexCreate(this._r, this, name, fn);
}
Term.prototype.indexDrop = function(name) {
    this._arity(arguments, 1, "indexDrop", this); 
    return new IndexDrop(this._r, this, name);
}
Term.prototype.indexStatus = function() {
    return new IndexStatus(this._r, this, helper.toArray(arguments));
}
Term.prototype.indexWait = function() {
    return new IndexWait(this._r, this, helper.toArray(arguments));
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

    return new Insert(this._r, this, documents, options);
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

    return new Update(this._r, this, newValue, options);
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

    return new Replace(this._r, this, newValue, options);
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

    return new Delete(this._r, this, options);
}
Term.prototype.sync = function() {
    this._arity(arguments, 0, "sync", this); 
    return new Sync(this._r, this);
}

// Selecting data
Term.prototype.db = function(db) {
    this._arity(arguments, 1, "db", this); 
    this._noPrefix(this, "db");
    return new Db(this._r, db);
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
        return new Table(this._r, [table], options);
    }
    else {
        return new Table(this._r, [this, table], options);
    }
}
Term.prototype.get = function(primaryKey) {
    this._arity(arguments, 1, "get", this); 
    return new Get(this._r, this, primaryKey);
}
Term.prototype.getAll = function() {
    this._arityRange(arguments, 1, Infinity, "getAll", this); 

    var args = helper.toArray(arguments);
    return new GetAll(this._r, this, args);
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

    return new Between(this._r, this, start, end, options);
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

    return new Filter(this._r, this, filter, options);
}

// Joins
Term.prototype.innerJoin = function(sequence, predicate) {
    this._arity(arguments, 2, "innerJoin", this); 
    return new InnerJoin(this._r, this, sequence, predicate);
}
Term.prototype.outerJoin = function(sequence, predicate) {
    this._arity(arguments, 2, "outerJoin", this); 
    return new OuterJoin(this._r, this, sequence, predicate);
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
    return new EqJoin(this._r, this, rightKey, sequence, options);
}
Term.prototype.zip = function() {
    this._arity(arguments, 0, "zip", this); 
    return new Zip(this._r, this);
}



// Transformation
Term.prototype.map = function(transformation) {
    this._arity(arguments, 1, "map", this); 
    return new Map(this._r, this, transformation);
}
Term.prototype.withFields = function() {
    this._arityRange(arguments, 1, Infinity, "withFields", this); 

    var args = helper.toArray(arguments);
    return new WithFields(this._r, this, args);
}
Term.prototype.concatMap = function(transformation) {
    this._arity(arguments, 1, "concatMap", this); 

    return new ConcatMap(this._r, this, transformation);
}
Term.prototype.orderBy = function() {
    this._arityRange(arguments, 1, Infinity, "orderBy", this); 

    var args = helper.toArray(arguments);
    return new OrderBy(this._r, this, args);
}
Term.prototype.desc = function(field) {
    this._arity(arguments, 1, "desc", this); 
    this._noPrefix(this, "desc");
    return new Desc(this._r, field);
}
Term.prototype.asc = function(field) {
    this._arity(arguments, 1, "asc", this); 
    this._noPrefix(this, "asc");
    return new Asc(this._r, field);
}
Term.prototype.skip = function(value) {
    this._arity(arguments, 1, "skip", this); 
    return new Skip(this._r, this, value);
}
Term.prototype.limit = function(value) {
    this._arity(arguments, 1, "limit", this); 
    return new Limit(this._r, this, value);
}
Term.prototype.slice = function(start, end, options) {
    this._arityRange(arguments, 1, 3, "slice", this); 
    return new Slice(this._r, this, start, end, options);
}
Term.prototype.nth = function(value) {
    this._arity(arguments, 1, "nth", this); 
    return new Nth(this._r, this, value);
}
Term.prototype.indexesOf = function(predicate) {
    this._arity(arguments, 1, "indexesOf", this); 
    return new IndexesOf(this._r, this, predicate);
}
Term.prototype.isEmpty = function() {
    this._arity(arguments, 0, "isEmpty", this); 
    return new IsEmpty(this._r, this);
}
Term.prototype.union = function(other) {
    this._arity(arguments, 1, "union", this); 
    return new Union(this._r, this, other);
}
Term.prototype.sample = function(size) {
    this._arity(arguments, 1, "sample", this); 
    return new Sample(this._r, this, size);
}

// Aggregations
Term.prototype.reduce = function(func, base) {
    this._arityRange(arguments, 1, 2, "reduce", this); 
    return new Reduce(this._r, this, func, base);
}
Term.prototype.count = function(filter) {
    this._arityRange(arguments, 0, 1, "count", this); 
    return new Count(this._r, this, filter);
}
Term.prototype.distinct = function() {
    this._arity(arguments, 0, "distinct", this); 
    return new Distinct(this._r, this);
}
Term.prototype.groupedMapReduce = function(group, map, reduce, base) {
    this._arityRange(arguments, 3, 4, "groupedMapReduce", this); 
    return new GroupedMapReduce(this._r, this, group, map, reduce, base);
}
Term.prototype.groupBy = function() {
    this._arityRange(arguments, 2, Infinity, "groupBy", this); 

    var args = helper.toArray(arguments); 
    return new GroupBy(this._r, this, args);
}
Term.prototype.contains = function() {
    this._arityRange(arguments, 1, Infinity, "contains", this); 
    var args = helper.toArray(arguments);
    return new Contains(this._r, this, args);
}


// Document manipulation
Term.prototype.row = function() {
    this._arity(arguments, 0, "r.row", this); 
    this._noPrefix(this, "row");
    return new ImplicitVar(this._r);
}
Term.prototype.pluck = function() {
    this._arityRange(arguments, 1, Infinity, "pluck", this); 

    var args = helper.toArray(arguments);
    return new Pluck(this._r, this, args);
}
Term.prototype.without = function() {
    this._arityRange(arguments, 1, Infinity, "without", this); 

    var args = helper.toArray(arguments);
    return new Without(this._r, this, args);
}
Term.prototype.merge = function(arg) {
    this._arity(arguments, 1, "merge", this); 
    return new Merge(this._r, this, arg);
}
Term.prototype.literal = function(obj) {
    this._arity(arguments, 1, "literal", this); 
    this._noPrefix(this, "literal");

    return new Literal(this._r, obj);
}
Term.prototype.append = function(value) {
    this._arity(arguments, 1, "append", this); 
    return new Append(this._r, this, value);
}
Term.prototype.prepend = function(value) {
    this._arity(arguments, 1, "prepend", this); 
    return new Prepend(this._r, this, value);
}
Term.prototype.difference = function(other) {
    this._arity(arguments, 1, "difference", this); 
    return new Difference(this._r, this, other);
}
Term.prototype.setInsert = function(other) {
    this._arity(arguments, 1, "setInsert", this); 
    return new SetInsert(this._r, this, other);
}
Term.prototype.setUnion = function(other) {
    this._arity(arguments, 1, "setUnion", this); 
    return new SetUnion(this._r, this, other);
}
Term.prototype.setIntersection = function(other) {
    this._arity(arguments, 1, "setIntersection", this); 
    return new SetIntersection(this._r, this, other);
}
Term.prototype.setDifference = function(other) {
    this._arity(arguments, 1, "setDifference", this); 
    return new SetDifference(this._r, this, other);
}
Term.prototype.getField = function(field) {
    this._arity(arguments, 1, "(...)", this); 
    return new GetField(this._r, this, field);
}
Term.prototype.hasFields = function() {
    this._arityRange(arguments, 1, Infinity, "hasFields", this); 
    var args = helper.toArray(arguments);
    return new HasFields(this._r, this, args);
}
Term.prototype.insertAt = function(index, value) {
    this._arity(arguments, 2, "insertAt", this); 
    return new InsertAt(this._r, this, index, value);
}
Term.prototype.spliceAt = function(index, array) {
    this._arityRange(arguments, 1, 2, "spliceAt", this); 
    return new SpliceAt(this._r, this, index, array);
}
Term.prototype.deleteAt = function(start, end) {
    this._arityRange(arguments, 1, 2, "deleteAt", this); 
    return new DeleteAt(this._r, this, start, end);
}
Term.prototype.changeAt = function(index, value) {
    this._arityRange(arguments, 1, 2, "changeAt", this); 
    return new ChangeAt(this._r, this, index, value);
}
Term.prototype.keys = function() {
    this._arity(arguments, 0, "keys", this); 
    return new Keys(this._r, this);
}



// String
Term.prototype.match = function(regex) {
    this._arity(arguments, 1, "match", this); 
    return new Match(this._r, this, regex);
}


// Math and Logic
Term.prototype.add = function() {
    this._arityRange(arguments, 1, Infinity, "add", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Add(this._r, args);
}
Term.prototype.sub = function() {
    this._arityRange(arguments, 1, Infinity, "sub", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Sub(this._r, args);
}
Term.prototype.mul = function() {
    this._arityRange(arguments, 1, Infinity, "mul", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Mul(this._r, args);
}
Term.prototype.div = function() {
    this._arityRange(arguments, 1, Infinity, "div", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Div(this._r, args);
}
Term.prototype.mod = function(b) {
    this._arity(arguments, 1, "mod", this); 

    return new Mod(this._r, this, b);
}
Term.prototype.and = function() {
    this._arityRange(arguments, 1, Infinity, "and", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new And(this._r, args);
}
Term.prototype.or = function() {
    this._arityRange(arguments, 1, Infinity, "or", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Or(this._r, args);
}
Term.prototype.eq = function() {
    this._arityRange(arguments, 1, Infinity, "eq", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Eq(this._r, args);
}
Term.prototype.ne = function() {
    this._arityRange(arguments, 1, Infinity, "ne", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Ne(this._r, args);
}
Term.prototype.gt = function(other) {
    this._arityRange(arguments, 1, Infinity, "gt", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Gt(this._r, args);
}
Term.prototype.ge = function(other) {
    this._arityRange(arguments, 1, Infinity, "ge", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Ge(this._r, args);
}
Term.prototype.lt = function(other) {
    this._arityRange(arguments, 1, Infinity, "lt", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Lt(this._r, args);
}
Term.prototype.le = function(other) {
    this._arityRange(arguments, 1, Infinity, "le", this); 

    var args = helper.toArray(arguments);
    if (this._self.type) args.unshift(this);

    return new Le(this._r, args);
}
Term.prototype.not = function() {
    this._arity(arguments, 0, 'not', this); 
    return new Not(this._r, this);
}


// Dates and times
Term.prototype.now = function() {
    this._noPrefix(this, "now");
    return new Now(this._r, this);
}
Term.prototype.time = function() {
    this._noPrefix(this, "time");

    var args = helper.toArray(arguments);
    return new Time(this._r, args);
}
Term.prototype.epochTime = function(epochTime) {
    this._noPrefix(this, "epochTime");

    return new EpochTime(this._r, epochTime);
}
Term.prototype.ISO8601 = function(isoTime, options) {
    this._arityRange(arguments, 1, 2, 'ISO8601', this); 
    this._noPrefix(this, "ISO8601");

    return new ISO8601(this._r, isoTime, options);
}
Term.prototype.inTimezone = function(timezone) {
    this._arity(arguments, 1, 'inTimezone', this); 
    return new InTimezone(this._r, this, timezone);
}
Term.prototype.timezone = function() {
    this._arity(arguments, 0, 'timezone', this); 
    return new Timezone(this._r, this);
}
Term.prototype.during = function(left, right, options) {
    this._arityRange(arguments, 2, 3, 'during', this); 
    return new During(this._r, this, left, right, options);
}
Term.prototype.date = function() {
    this._arity(arguments, 0, 'date', this); 
    return new ReqlDate(this._r, this);
}
Term.prototype.timeOfDay = function() {
    this._arity(arguments, 0, 'timeOfDay', this); 
    return new TimeOfDay(this._r, this);
}
Term.prototype.year = function() {
    this._arity(arguments, 0, 'year', this); 
    return new Year(this._r, this);
}
Term.prototype.month = function() {
    this._arity(arguments, 0, 'month', this); 
    return new Month(this._r, this);
}
Term.prototype.day = function() {
    this._arity(arguments, 0, 'day', this); 
    return new Day(this._r, this);
}
Term.prototype.dayOfYear = function() {
    this._arity(arguments, 0, 'dayOfYear', this); 
    return new DayOfYear(this._r, this);
}
Term.prototype.dayOfWeek = function() {
    this._arity(arguments, 0, 'dayOfWeek', this); 
    return new DayOfWeek(this._r, this);
}
Term.prototype.hours = function() {
    this._arity(arguments, 0, 'hours', this); 
    return new Hours(this._r, this);
}
Term.prototype.minutes = function() {
    this._arity(arguments, 0, 'minutes', this); 
    return new Minutes(this._r, this);
}
Term.prototype.seconds = function() {
    this._arity(arguments, 0, 'seconds', this); 
    return new Seconds(this._r, this);
}
Term.prototype.toISO8601 = function() {
    this._arity(arguments, 0, 'toISO8601', this); 
    return new ToISO8601(this._r, this);
}
Term.prototype.toEpochTime = function() {
    this._arity(arguments, 0, 'toEpochTime', this); 
    return new ToEpochTime(this._r, this);
}
Term.prototype.monday = function() { return new Monday(this._r); }
Term.prototype.tuesday = function() { return new Tuesday(this._r); }
Term.prototype.wednesday = function() { return new Wednesday(this._r); }
Term.prototype.thursday = function() { return new Thursday(this._r); }
Term.prototype.friday = function() { return new Friday(this._r); }
Term.prototype.saturday = function() { return new Saturday(this._r); }
Term.prototype.sunday = function() { return new Sunday(this._r); }

Term.prototype.january = function() { return new January(this._r); }
Term.prototype.february = function() { return new February(this._r); }
Term.prototype.march = function() { return new March(this._r); }
Term.prototype.april = function() { return new April(this._r); }
Term.prototype.may = function() { return new May(this._r); }
Term.prototype.june = function() { return new June(this._r); }
Term.prototype.july = function() { return new July(this._r); }
Term.prototype.august = function() { return new August(this._r); }
Term.prototype.september = function() { return new September(this._r); }
Term.prototype.october = function() { return new October(this._r); }
Term.prototype.november = function() { return new November(this._r); }
Term.prototype.december = function() { return new December(this._r); }



Term.prototype.do = function(func) {
    this._arity(arguments, 1, 'do', this); 

    return new Do(this._r, this, func);
}
Term.prototype.branch = function(predicate, trueBranch, falseBranch) {
    this._noPrefix(this, "branch");

    return new Branch(this._r, predicate, trueBranch, falseBranch);
}
Term.prototype.forEach = function(func) {
    this._arity(arguments, 1, 'forEach', this); 
    return new ForEach(this._r, this, func);
}
Term.prototype.error = function(strError) {
    this._noPrefix(this, "error");

    return new ReqlError(this._r, strError);
}
Term.prototype.default = function(func) {
    this._arity(arguments, 1, 'default', this); 
    return new Default(this._r, this, func);
}
Term.prototype.expr = function(expression, nestingLevel) {
    this._arityRange(arguments, 1, 2, 'expr', this); 
    this._noPrefix(this, "expr");

    // undefined will be caught in the last else
    var ar, obj;

    if (expression === undefined) throw new Error.ReqlDriverError("Cannot convert `undefined` with r.expr()");

    if (nestingLevel == null) nestingLevel = this._r.nestingLevel;
    if (nestingLevel < 0) throw new Error.ReqlDriverError("Nesting depth limit exceeded.\nYou probably have a circular reference somewhere")

    if (expression instanceof Term) {
        return expression;
    }
    else if (expression instanceof Function) {
        return new Func(this._r, expression);
    }
    else if (expression instanceof Date) {
        return new Term(this._r).ISO8601(expression.toISOString())
    }
    else if (Array.isArray(expression)) {
        return new MakeArray(this._r, expression, nestingLevel-1);
    }
    else if (helper.isPlainObject(expression)) {
        return new MakeObject(this._r, expression, nestingLevel-1);
    }
    else { // Primitive
        if (expression === null) {
            return new Null(this._r);
        }
        else if (typeof expression === "string") {
            return new Str(this._r, expression);
        }
        else if (typeof expression === "number") {
            return new Num(this._r, expression);
        }
        else if (typeof expression === "boolean") {
            return new Bool(this._r, expression);
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

    return new Js(this._r, arg);
}
Term.prototype.coerceTo = function(type) {
    this._arity(arguments, 1, 'coerceTo', this); 
    return new CoerceTo(this._r, this, type);
}
Term.prototype.typeOf = function() {
    this._arity(arguments, 0, 'typeOf', this); 
    return new TypeOf(this._r, this);
}
Term.prototype.info = function() {
    this._arity(arguments, 0, 'info', this); 
    return new Info(this._r, this);
}
Term.prototype.json = function(json) {
    this._arity(arguments, 1, 'info', this); 
    this._noPrefix(this, "json");
    return new Json(this._r, json);
}
Term.prototype.exprJSON = function(value, nestingLevel) {
    this._arityRange(arguments, 1, 2, 'exprJSON', this); 
    this._noPrefix(this, "exprJSON");

    var result = this._exprJSON(value, nestingLevel, this._r);

    if (result.isJSON === true) {
        return new Term(this._r).json(JSON.stringify(value))
    }
    else {
        return result.value;
    }
}

Term.prototype.toString = function() {
    return Error.generateBacktrace(this._self, 0).str;
}

// Return {isJSON: true, value: <object that can be serialized in JSON>}
// Return {isJSON: false, value: <instance of Term>
// Convert as many fields in JSON as possible,
Term.prototype._exprJSON = function(value, nestingLevel, _r) {
    var result;
    var isJSON;

    if (nestingLevel == null) nestingLevel = this._r.nestingLevel;
    if (nestingLevel < 0) throw new Error.ReqlDriverError("Nesting depth limit exceeded.\nYou probably have a circular reference somewhere")

    if (value instanceof Term) {
        return {isJSON: false, value: value};
    }
    else if (value instanceof Date) {
        return {isJSON: false, value: new Term(_r).expr(value)};
    }
    else if (value instanceof Function) {
        return {isJSON: false, value: new Term(_r).expr(value)};
    }
    else if (Array.isArray(value)) {
        isJSON = true; // value is considered to be JSON valid for now
        result = [];

        for(var i=0; i<value.length; i++) {
            if (isJSON === true) {
                var temp = Term.prototype._exprJSON(value[i], nestingLevel-1, _r);
                if (temp.isJSON === false) { // first field that can't be serialized in JSON
                    for(var k=0; k<i; k++) { // Convert all previous fields to JSON strings
                        result.push(new Term(_r).json(JSON.stringify(value[k])));
                    }
                    result.push(temp.value); // This one is not serializable
                    isJSON = false;
                }
            }
            else {
                var temp = Term.prototype._exprJSON(value[i], nestingLevel-1, _r)
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
            return {isJSON: false, value: new Term(_r).expr(result)};
        }
    }
    else if (helper.isPlainObject(value)) {
        isJSON = true;
        result = {};
        previousKeys = [];

        for(var key in value) {
            if (value.hasOwnProperty(key)) {
                if (isJSON) {
                    var temp = Term.prototype._exprJSON(value[key], nestingLevel-1, _r);
                    if (temp.isJSON === false) {
                        for(var k=0; k<previousKeys.length; k++) {
                            result[previousKeys[k]](new Term(_r).json(JSON.stringify(value[k])));
                        }
                        result[key] = new Term(_r).expr(value[key]);
                        isJSON = false;
                    }
                    else {
                        previousKeys.push(key);
                    }
                }
                else {
                    var temp = Term.prototype._exprJSON(value[key], nestingLevel-1, _r);
                    if (temp.isJSON === false) {
                        result[key] = temp.value;
                    }
                    else {
                        result[key] = new Term(_r).json(JSON.stringify(temp.value));
                    }
                }
            }
        }
        if (isJSON === true) {
            return {isJSON: true, value: value};
        }
        else {
            return {isJSON: false, value: new Term(_r).expr(result)};
        }

    }
    else { // Primitive
        return {isJSON: true, value: value}
    }
}








Term.prototype._wrap = function() {
    var self = this;
    if (helper.hasImplicit(this._self)) {
        //Must pass at least one variable to the function or it won't accept r.row
        return new Term(this._r).expr(function(doc) { return self; })
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
Term.prototype._makeOptArgs = function(r, options) {
    var optargs = [];
    for(var key in options) {
        if (options[key] !== undefined) {
            keyServer = Term.prototype._translateArgs[key] || key;
            optargs.push({
                key: keyServer,
                val: new Term(r).expr(options[key])._self
            });
        }
    }
    return optargs;
}
Term.prototype._setNestingLevel = function(nestingLevel) {
    Term.prototype._nestingLevel = nestingLevel
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
function Null(r) {
    this.type = "DATUM";
    this.datum = {
        type: "R_NULL"
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Num(r, value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_NUM",
        r_num: value
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Str(r, value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_STR",
        r_str: value
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}

function Bool(r, value) {
    this.type = "DATUM";
    this.datum = {
        type: "R_BOOL",
        r_bool: value
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function MakeArray(r, array, nestingLevel) {
    this.type = "MAKE_ARRAY";
    this.args = [];

    for(var i=0; i<array.length; i++) {
        this.args.push(new Term(r).expr(array[i], nestingLevel)._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function MakeObject(r, object, nestingLevel) {
    this.type = "MAKE_OBJ";
    this.optargs = []
    for(key in object) {
        if (object.hasOwnProperty(key)) {
            this.optargs.push({
                key: key,
                val: new Term(r).expr(object[key], nestingLevel)._self
            });
        }
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Func(r, func) {
    // We can retrieve the names of the arguments with
    // func.toString().match(/\(([^\)]*)\)/)[1].split(/\s*,\s*/)
    this.type = "FUNC";

    var args = []; // contains Var instances
    var argNums = []; // contains int
    for(var i=0; i<func.length; i++) {
        args.push(new Var(r, r.nextVarId));
        argNums.push(r.nextVarId);

        if (r.nextVarId === 9007199254740992) { // That seems like overdoing it... but well maybe...
            r.nextVarId = 0;
        }
        else {
            r.nextVarId++;
        }
    }

    var arg = func.apply(func, args)
    if (arg === undefined) throw new Error.ReqlDriverError("Annonymous function returned `undefined`. Did you forget a `return`?", this);
    body = new Term(r).expr(arg);

    this.args = [new MakeArray(r, argNums)._self, body._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
Func.prototype.nextVarId = 1;

function Var(r, id) {
    this.type = "VAR";
    this.args = [new Term(r).expr(id)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Manipulating databases
function DbCreate(r, db) {
    this.type = "DB_CREATE";
    this.args = [new Term(r).expr(db)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function DbDrop(r, db) {
    this.type = "DB_DROP";
    this.args = [new Term(r).expr(db)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function DbList(r) {
    this.type = "DB_LIST";

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}

// Manipulating tables
function TableCreate(r, args, options) {
    this.type = "TABLE_CREATE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function TableDrop(r, args) {
    this.type = "TABLE_DROP";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function TableList(r, db) {
    this.type = "TABLE_LIST";
    this.args = [];
    if (db !== undefined) this.args.push(db._self);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IndexCreate(r, table, name, fn) {
    this.type = "INDEX_CREATE";
    this.args = [table._self, new Term(r).expr(name)._self];
    if (fn !== undefined) {
        this.args.push(new Term(r).expr(fn)._self);
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IndexDrop(r, table, name) {
    this.type = "INDEX_DROP";
    this.args = [table._self, new Term(r).expr(name)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IndexList(r, table, indexes) {
    this.type = "INDEX_LIST";
    this.args = [table._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IndexStatus(r, table, indexes) {
    this.type = "INDEX_STATUS";
    this.args = [table._self];
    if (indexes !== undefined) {
        for(var i=0; i<indexes.length; i++) {
            this.args.push(new Term(r).expr(indexes[i])._self)
        }
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IndexWait(r, table, indexes) {
    this.type = "INDEX_WAIT";
    this.args = [table._self];
    if (indexes !== undefined) {
        for(var i=0; i<indexes.length; i++) {
            this.args.push(new Term(r).expr(indexes[i])._self)
        }
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Selecting data
function Db(r, db) {
    this.type = "DB";
    this.args = [];
    this.args.push(new Term(r).expr(db)._self);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Table(r, args, options) {
    this.type = "TABLE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    if (options !== undefined) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Get(r, table, primaryKey) {
    this.type = "GET";
    this.args = [table._self, new Term(r).expr(primaryKey)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function GetAll(r, table, args) {
    this.type = "GET_ALL";
    this.args = [table._self];
    for(var i=0; i<args.length-1; i++) {
        this.args.push(new Term(r).expr(args[i])._self);
    }
    if ((args.length > 1) && (args[args.length-1].index !== undefined)) {
        this.optargs = Term.prototype._makeOptArgs(r, args[args.length-1]);
    }
    else {
        this.args.push(new Term(r).expr(args[args.length-1])._self);
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Between(r, table, start, end, options) {
    this.type = "BETWEEN";
    this.args = [table._self];
    this.args.push(new Term(r).expr(start)._self);
    this.args.push(new Term(r).expr(end)._self);
    if (options !== undefined) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Filter(r, table, filter, options) {
    this.type = "FILTER";
    this.args = [table._self];
    this.args.push(new Term(r).expr(filter)._wrap()._self);

    if ((helper.isPlainObject(options))) {
        this.optargs = Term.prototype._makeOptArgs(r, options);
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}

// Joins
function InnerJoin(r, sequenceLeft, sequenceRight, predicate) {
    this.type = "INNER_JOIN";
    this.args = [sequenceLeft._self, new Term(r).expr(sequenceRight)._self, new Term(r).expr(predicate)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function OuterJoin(r, sequenceLeft, sequenceRight, predicate) {
    this.type = "OUTER_JOIN";
    this.args = [sequenceLeft._self, new Term(r).expr(sequenceRight)._self, new Term(r).expr(predicate)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function EqJoin(r, sequenceLeft, rightKey, sequenceRight, index) {
    this.type = "EQ_JOIN";
    this.args = [sequenceLeft._self, new Term(r).expr(rightKey)._wrap()._self, new Term(r).expr(sequenceRight)._self];

    if ((helper.isPlainObject(index))) {
        this.optargs = Term.prototype._makeOptArgs(r, index);
    }


    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Zip(r, sequence) {
    this.type = "ZIP",
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;

}


// Transformation
function Map(r, sequence, transformation) {
    this.type = "MAP";
    this.args = [sequence._self, new Term(r).expr(transformation)._wrap()._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function WithFields(r, sequence, fields) {
    this.type = "WITH_FIELDS";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term(r).expr(fields[i])._self)
    }


    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ConcatMap(r, sequence, transformation) {
    this.type = "CONCATMAP";
    this.args = [sequence._self, new Term(r).expr(transformation)._wrap()._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function OrderBy(r, sequence, fields) {
    this.type = "ORDERBY";
    this.args = [sequence._self]

    for(var i=0; i<fields.length-1; i++) {
        this.args.push(new Term(r).expr(fields[i])._wrap()._self);
    }
    if ((helper.isPlainObject(fields[fields.length-1])) && (fields[fields.length-1].index !== undefined)) {
        this.optargs = Term.prototype._makeOptArgs(r, fields[fields.length-1]);
    }
    else {
        this.args.push(new Term(r).expr(fields[fields.length-1])._wrap()._self);
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Desc(r, field) {
    this.type = "DESC";
    this.args = [new Term(r).expr(field)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Asc(r, field) {
    this.type = "ASC";
    this.args = [new Term(r).expr(field)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Skip(r, sequence, value) {
    this.type = "SKIP";
    this.args = [sequence._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Limit(r, sequence, value) {
    this.type = "LIMIT";
    this.args = [sequence._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Slice(r, sequence, start, end, options) {
    this.type = "SLICE";
    this.args = [sequence._self, new Term(r).expr(start)._self];
    if (end !== undefined) {
        this.args.push(new Term(r).expr(end)._self);
    }

    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Nth(r, sequence, value) {
    this.type = "NTH";
    this.args = [sequence._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IndexesOf(r, sequence, value) {
    this.type = "INDEXES_OF";
    this.args = [sequence._self, new Term(r).expr(value)._wrap()._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function IsEmpty(r, sequence) {
    this.type = "IS_EMPTY";
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Union(r, sequence, other) {
    this.type = "UNION";
    this.args = [sequence._self, new Term(r).expr(other)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Sample(r, sequence, size) {
    this.type = "SAMPLE";
    this.args = [sequence._self, new Term(r).expr(size)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Aggregations
function Reduce(r, sequence, func, base) {
    this.type = "REDUCE";
    this.args = [sequence._self, new Term(r).expr(func)._wrap()._self];
    if (base !== undefined) this.optargs = Term.prototype._makeOptArgs(r, {base: base});

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Count(r, sequence, filter) {
    this.type = "COUNT";
    this.args = [sequence._self];
    if (filter !== undefined) this.args.push(new Term(r).expr(filter)._wrap()._self)

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Distinct(r, sequence) {
    this.type = "DISTINCT";
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function GroupedMapReduce(r, sequence, group, map, reduce, base) {
    this.type = "GROUPED_MAP_REDUCE";
    this.args = [sequence._self, new Term(r).expr(group)._wrap()._self, new Term(r).expr(map)._wrap()._self, new Term(r).expr(reduce)._wrap()._self];
    if (base !== undefined) this.optargs = Term.prototype._makeOptArgs(r, {base: base});

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function GroupBy(r, sequence, selectors) {
    this.type = "GROUPBY";

    reduction = selectors.splice(-1);
    reduction = reduction[0];
    this.args = [sequence._self];
    this.args.push(new Term(r).expr(selectors)._self);
    this.args.push(reduction._self);


    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Contains(r, sequence, fields) {
    this.type = "CONTAINS";

    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term(r).expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Document manipulation
function ImplicitVar(r) {
    this.type = "IMPLICIT_VAR";

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Pluck(r, sequence, fields) {
    this.type = "PLUCK";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term(r).expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Without(r, sequence, fields) {
    this.type = "WITHOUT";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term(r).expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Merge(r, obj, arg) {
    this.type = "MERGE";
    this.args = [obj._self, new Term(r).expr(arg)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Literal(r, obj) {
    this.type = "LITERAL";
    this.args = [new Term(r).expr(obj)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Append(r, sequence, value) {
    this.type = "APPEND";
    this.args = [sequence._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Prepend(r, sequence, value) {
    this.type = "PREPEND";
    this.args = [sequence._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Difference(r, sequence, other) {
    this.type = "DIFFERENCE";
    this.args = [sequence._self, new Term(r).expr(other)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function SetInsert(r, sequence, other) {
    this.type = "SET_INSERT";
    this.args = [sequence._self, new Term(r).expr(other)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function SetUnion(r, sequence, other) {
    this.type = "SET_UNION";
    this.args = [sequence._self, new Term(r).expr(other)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function SetIntersection(r, sequence, other) {
    this.type = "SET_INTERSECTION";
    this.args = [sequence._self, new Term(r).expr(other)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function SetDifference(r, sequence, other) {
    this.type = "SET_DIFFERENCE";
    this.args = [sequence._self, new Term(r).expr(other)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function GetField(r, obj, field) {
    this.type = "GET_FIELD";
    this.args = [obj._self, new Term(r).expr(field)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function HasFields(r, sequence, fields) {
    this.type = "HAS_FIELDS";
    this.args = [sequence._self];
    for(var i=0; i<fields.length; i++) {
        this.args.push(new Term(r).expr(fields[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function InsertAt(r, sequence, index, value) {
    this.type = "INSERT_AT";
    this.args = [sequence._self, new Term(r).expr(index)._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function SpliceAt(r, sequence, index, array) {
    this.type = "SPLICE_AT";
    this.args = [sequence._self, new Term(r).expr(index)._self, new Term(r).expr(array)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function DeleteAt(r, sequence, start, end) {
    this.type = "DELETE_AT";
    this.args = [sequence._self, new Term(r).expr(start)._self];
    if (end !== undefined) this.args.push(new Term(r).expr(end)._self);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ChangeAt(r, sequence, index, value) {
    this.type = "CHANGE_AT";
    this.args = [sequence._self, new Term(r).expr(index)._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Keys(r, sequence) {
    this.type = "KEYS";
    this.args = [sequence._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// String
function Match(r, str, regex) {
    this.type = "MATCH";
    this.args = [str._self, new Term(r).expr(regex)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Math and Logic
function Add(r, args) { // args is an array
    this.type = "ADD";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Sub(r, args) {
    this.type = "SUB";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Mul(r, args) {
    this.type = "MUL";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Div(r, args) {
    this.type = "DIV";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Mod(r, a, b) {
    this.type = "MOD";
    this.args = [a._self, new Term(r).expr(b)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function And(r, args) {
    this.type = "ALL";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Or(r, args) {
    this.type = "ANY";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Eq(r, args) {
    this.type = "EQ";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Ne(r, args) {
    this.type = "NE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Gt(r, args) {
    this.type = "GT";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Ge(r, args) {
    this.type = "GE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Lt(r, args) {
    this.type = "LT";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Le(r, args) {
    this.type = "LE";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Not(r, bool) {
    this.type = "NOT";
    this.args = [bool._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Dates and times
function Now(r) {
    this.type = "NOW";

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Time(r, args) {
    this.type = "TIME";
    this.args = [];
    for(var i=0; i<args.length; i++) {
        this.args.push(new Term(r).expr(args[i])._wrap()._self)
    }

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function EpochTime(r, epochTime) {
    this.type = "EPOCH_TIME";
    this.args = [new Term(r).expr(epochTime)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ISO8601(r, isoTime, options) {
    this.type = "ISO8601";
    this.args = [new Term(r).expr(isoTime)._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function InTimezone(r, time, timezone) {
    this.type = "IN_TIMEZONE";
    this.args = [time._self, new Term(r).expr(timezone)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Timezone(r, time) {
    this.type = "TIMEZONE";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function During(r, time, left, right, options) {
    this.type = "DURING";
    this.args = [time._self, new Term(r).expr(left)._self, new Term(r).expr(right)._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ReqlDate(r, time) {
    this.type = "DATE";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function TimeOfDay(r, time) {
    this.type = "TIME_OF_DAY";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Year(r, time) {
    this.type = "YEAR";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Month(r, time) {
    this.type = "MONTH";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Day(r, time) {
    this.type = "DAY";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function DayOfYear(r, time) {
    this.type = "DAY_OF_YEAR";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function DayOfWeek(r, time) {
    this.type = "DAY_OF_WEEK";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Hours(r, time) {
    this.type = "HOURS";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Minutes(r, time) {
    this.type = "MINUTES";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Seconds(r, time) {
    this.type = "SECONDS";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ToISO8601(r, time) {
    this.type = "TO_ISO8601";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ToEpochTime(r, time) {
    this.type = "TO_EPOCH_TIME";
    this.args = [time._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Monday(r) {
    this.type = "MONDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Tuesday(r) {
    this.type = "TUESDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Wednesday(r) {
    this.type = "WEDNESDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Thursday(r) {
    this.type = "THURSDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Friday(r) {
    this.type = "FRIDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Saturday(r) {
    this.type = "SATURDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Sunday(r) {
    this.type = "SUNDAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function January(r) {
    this.type = "JANUARY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function February(r) {
    this.type = "FEBRUARY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function March(r) {
    this.type = "MARCH"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function April(r) {
    this.type = "APRIL"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function May(r) {
    this.type = "MAY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function June(r) {
    this.type = "JUNE"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function July(r) {
    this.type = "JULY"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function August(r) {
    this.type = "AUGUST"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function September(r) {
    this.type = "SEPTEMBER"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function October(r) {
    this.type = "OCTOBER"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function November(r) {
    this.type = "NOVEMBER"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function December(r) {
    this.type = "DECEMBER"
    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


// Control structures
function Do(r, bind, func) {
    this.type = "FUNCALL";
    this.args = [new Term(r).expr(func)._wrap()._self, bind._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Branch(r, predicate, trueBranch, falseBranch) {
    this.type = "BRANCH";
    this.args = [new Term(r).expr(predicate)._wrap()._self, new Term(r).expr(trueBranch)._wrap()._self, new Term(r).expr(falseBranch)._wrap()._self,];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ForEach(r, sequence, func) {
    this.type = "FOREACH";
    this.args = [sequence._self, new Term(r).expr(func)._wrap()._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function ReqlError(r, strError) {
    this.type = "ERROR";
    if (strError !== undefined) this.args = [new Term(r).expr(strError)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Default(r, term, value) {
    this.type = "DEFAULT";
    this.args = [term._self, new Term(r).expr(value)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Js(r, arg) {
    this.type = "JAVASCRIPT";
    this.args = [new Term(r).expr(arg)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function CoerceTo(r, value, type) {
    this.type = "COERCE_TO";
    this.args = [value._self, new Term(r).expr(type)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function TypeOf(r, value) {
    this.type = "TYPEOF";
    this.args = [value._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Info(r, arg) {
    this.type = "INFO";
    this.args = [arg._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Json(r, json) {
    this.type = "JSON";
    this.args = [new Term(r).expr(json)._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}



// Write
function Insert(r, table, documents, options) {
    this.type = "INSERT";
    this.args = [table._self];
    this.args.push(new Term(r).exprJSON(documents)._self);
    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}

function Update(r, table, newValue, options) {
    this.type = "UPDATE";
    this.args = [table._self];
    this.args.push(new Term(r).expr(newValue)._wrap()._self);
    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Replace(r, table, newValue, options) {
    this.type = "REPLACE";
    this.args = [table._self];
    this.args.push(new Term(r).expr(newValue)._wrap()._self);
    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Sync(r, table) {
    this.type = "SYNC";
    this.args = [table._self];

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}
function Delete(r, selection, options) {
    this.type = "DELETE";
    this.args = [selection._self];
    if (options) this.optargs = Term.prototype._makeOptArgs(r, options);

    var term = new Term();
    term._self = this;
    term._r = r;
    return term;
}


module.exports = Term;
