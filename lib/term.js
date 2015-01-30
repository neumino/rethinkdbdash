var Promise = require("bluebird");
var protodef = require(__dirname+"/protodef.js");
var termTypes = protodef.Term.TermType;

var Error = require(__dirname+"/error.js");
var helper = require(__dirname+"/helper.js");

function Term(r, value) {
    var self = this;
    var term = function(field) {
        Term.prototype._arity(arguments, 1, "(...)", self);
        return term.bracket(field);
    }
    helper.changeProto(term, self);

    if (value === undefined) {
        term._query = [];
    }
    else {
        term._query = value;
    }
    term._r = r;

    return term;
}

// run([connection][, options][, callback])
Term.prototype.run = function(connection, options, callback) {
    var self = this;

    if (helper.isPlainObject(connection) && (typeof connection._isConnection === "function") && (connection._isConnection() === true)) {
        if (typeof options === "function") {
            callback = options;
            options = {};
        }
        else {
            if (!helper.isPlainObject(options)) options = {};
        }

        if (connection._isOpen() !== true) throw new Error.ReqlDriverError("`run` was called with a closed connection", self._query);
        var p = new Promise(function(resolve, reject) {
            var token = connection.token++;

            var query = [protodef.Query.QueryType.START];
            query.push(self._query);

            var _options = {};
            var sendOptions = false;
            if (connection.db != null) {
                sendOptions = true;
                _options.db = self._r.db(connection.db)._query;
            }

            //For testing only
            if (connection.max_batch_rows) {
                sendOptions = true;
                _options.max_batch_rows = connection.max_batch_rows;
            }
            if (self._r.arrayLimit != null) {
                sendOptions = true;
                _options[self._translateArgs['arrayLimit']] = self._r.arrayLimit;
            };


            var keepGoing = true; // we need it just to avoir calling resolve/reject multiple times
            helper.loopKeys(options, function(options, key) {
                if (keepGoing === true) {
                    if ((key === "useOutdated") || (key === "durability") ||
                        (key === "noreply") || (key === "arrayLimit") || (key === "profile")) {

                        sendOptions = true;
                        if (self._translateArgs.hasOwnProperty(key)) {
                            _options[self._translateArgs[key]] = new Term(self._r).expr(options[key])._query;
                        }
                        else {
                            _options[key] = new Term(self._r).expr(options[key])._query;
                        }
                    }
                    else if ((key !== "timeFormat") && (key !== "groupFormat") && (key !== "binaryFormat") && (key !== "cursor") && (key !== "stream")) {
                        reject(new Error.ReqlDriverError("Unrecognized option `"+key+"` in `run`. Available options are useOutdated <bool>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>, binaryFormat <bool>, cursor <bool>, stream <bool>"));
                        keepGoing = false;
                    }
                }
            });

            if (keepGoing === false) return; // The promise was rejected in the loopKeys

            if (sendOptions === true) {
                query.push(_options);
            }
            connection._send(query, token, resolve, reject, self._query, options);
        }).nodeify(callback);
    }
    else {
        var pool = self._r.getPool(); // if self._r is defined, so is self._r.getPool()
        if (!pool) {
            throw new Error.ReqlDriverError("`run` was called without a connection and no pool has been created", self._query);
        }
        else {
            if (typeof connection === "function") {
                // run(callback);
                callback = connection;
                options = {};
            }
            else if (helper.isPlainObject(connection)) {
                // run(options[, callback])
                callback = options;
                options = connection;
            }
            else {
                options = {};
            }


            var p = new Promise(function(resolve, reject) {
                pool.getConnection().then(function(connection) {
                    var token = connection.token++;
                    var query = [protodef.Query.QueryType.START];
                    query.push(self._query);

                    var _options = {};
                    var sendOptions = false;
                    if (connection.db != null) {
                        sendOptions = true;
                        _options.db = self._r.db(connection.db)._query;
                    }
                    if (self._r.arrayLimit != null) {
                        sendOptions = true;
                        _options[self._translateArgs['arrayLimit']] = self._r.arrayLimit;
                    };

                    var keepGoing = true;
                    helper.loopKeys(options, function(options, key) {
                        if (keepGoing === true) {
                            if ((key === "useOutdated") || (key === "durability") ||
                               (key === "noreply") || (key === "arrayLimit") || (key === "profile")) {


                                sendOptions = true;
                                if (self._translateArgs.hasOwnProperty(key)) {
                                    _options[self._translateArgs[key]] = new Term(self._r).expr(options[key])._query
                                }
                                else {
                                    _options[key] = new Term(self._r).expr(options[key])._query
                                }
                            }
                            else if ((key !== "timeFormat") && (key !== "groupFormat") && (key !== "binaryFormat") && (key !== "cursor") && (key !== "stream")) {
                                setTimeout( function() {
                                    reject(new Error.ReqlDriverError("Unrecognized option `"+key+"` in `run`. Available options are useOutdated <bool>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>, binaryFormat <string>, cursor <bool>, stream <bool>"));
                                }, 0);
                                keepGoing = false;
                                return false;
                            }
                        }
                    });

                    if (keepGoing === false) {
                        connection.emit('release');
                        return // The promise was rejected in the loopKeys
                    }

                    if (sendOptions === true) {
                        query.push(_options);
                    }
                    connection._send(query, token, resolve, reject, self._query, options);
                }).error(function(error) {
                    reject(error);
                });
            }).nodeify(callback);
        }
    }

    //if (options.noreply) return self; // Do not return a promise if the user ask for no reply.

    return p;
}


// Manipulating databases
Term.prototype.dbCreate = function(db) {
    // Check for arity is done in r.prototype.dbCreate
    this._noPrefix(this, "dbCreate");

    var term = new Term(this._r);
    term._query.push(termTypes.DB_CREATE)
    term._query.push([new Term(this._r).expr(db)._query])
    return term;
}
Term.prototype.dbDrop = function(db) {
    this._noPrefix(this, "dbDrop");

    var term = new Term(this._r);
    term._query.push(termTypes.DB_DROP)
    term._query.push([new Term(this._r).expr(db)._query])
    return term;
}
Term.prototype.dbList = function() {
    this._noPrefix(this, "dbList");

    var term = new Term(this._r);
    term._query.push(termTypes.DB_LIST)
    return term;
}

// Manipulating Tables
Term.prototype.tableCreate = function(table, options) {
    var self = this;

    self._arityRange(arguments, 1, 2, "tableCreate", self);

    var term = new Term(self._r);
    term._query.push(termTypes.TABLE_CREATE)

    var args = [];
    if (Array.isArray(self._query) && (self._query.length > 0)) {
        args.push(self._query); // Push db
    }
    args.push(new Term(self._r).expr(table)._query)
    term._query.push(args);

    if (helper.isPlainObject(options)) {
        // Check for non valid key
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "primaryKey")
                    && (key !== "durability")
                    && (key !== "datacenter")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `tableCreate`", self._query, "Available options are primaryKey <string>, durability <string>, datancenter <string>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}

Term.prototype.tableDrop = function(table) {
    this._arity(arguments, 1, "tableDrop", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.TABLE_DROP)

    var args = [];
    if (Array.isArray(this._query) && (this._query.length > 0)) {
        args.push(this._query); // push db
    }
    args.push(new Term(this._r).expr(table)._query)
    query._query.push(args);
    return query;
}
Term.prototype.tableList = function() {
    this._arity(arguments, 0, "tableList", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.TABLE_LIST);

    var args = [];
    if (Array.isArray(this._query) && (this._query.length > 0)) {
        args.push(this._query);
    }
    if (args.length > 0) {
        query._query.push(args);
    }
    return query;
}
Term.prototype.indexList = function() {
    this._arity(arguments, 0, "indexList", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.INDEX_LIST);
    query._query.push([this._query]);
    return query;
}
Term.prototype.indexCreate = function(name, fn, options) {
    this._arityRange(arguments, 1, 3, "indexCreate", this);
    if ((options == null) && (helper.isPlainObject(fn))) {
        options = fn;
        fn = undefined;
    }

    var query = new Term(this._r);
    query._query.push(termTypes.INDEX_CREATE);
    var args = [this._query];
    args.push(new Term(this._r).expr(name)._query);
    if (typeof fn !== "undefined") args.push(new Term(this._r).expr(fn)._wrap()._query);
    query._query.push(args);

    if (helper.isPlainObject(options)) {
        // There is no need to translate here
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "multi") && (key !== "geo")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `indexCreate`", self._query, "Available option is multi <bool> and geo <bool>");
            }
        });
        query._query.push(new Term(this._r).expr(options)._query);
    }
    return query;
}
Term.prototype.indexDrop = function(name) {
    this._arity(arguments, 1, "indexDrop", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.INDEX_DROP);
    query._query.push([this._query, new Term(this._r).expr(name)._query]);
    return query;
}

Term.prototype.indexStatus = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.INDEX_STATUS);
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args);
    return term;
}
Term.prototype.indexWait = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.INDEX_WAIT);
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args);
    return term;
}
Term.prototype.indexRename = function(oldName, newName, options) {
    var self = this;
    self._arityRange(arguments, 2, 3, "indexRename", self);

    var term = new Term(this._r);
    term._query.push(termTypes.INDEX_RENAME);
    var args = [this._query, new Term(this._r).expr(oldName)._query, new Term(this._r).expr(newName)._query];
    term._query.push(args);

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if (key !== "overwrite") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `indexRename`", self._query, "Available options are overwrite <bool>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }


    return term;
}
Term.prototype.changes = function() {
    this._arity(arguments, 0, "changes", this); 
    var term = new Term(this._r);
    term._query.push(termTypes.CHANGES);
    term._query.push([this._query]);
    return term;
}

// Writing data
Term.prototype.insert = function(documents, options) {
    var self = this;
    self._arityRange(arguments, 1, 2, "insert", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.INSERT);
    term._query.push([self._query, new Term(self._r).expr(documents)._query]);

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "returnChanges") && (key !== "durability") && (key !== "conflict")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `insert`", self._query, "Available options are returnChanges <bool>, durability <string>, conflict <string>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.update = function(newValue, options) {
    var self = this;
    self._arityRange(arguments, 1, 2, "update", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.UPDATE);
    term._query.push([self._query, new Term(self._r).expr(newValue)._wrap()._query]);

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "returnChanges") && (key !== "durability") && (key !== "nonAtomic")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `update`", self._query, "Available options are returnChanges <bool>, durability <string>, nonAtomic <bool>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.replace = function(newValue, options) {
    var self = this;
    self._arityRange(arguments, 1, 2, "replace", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.REPLACE);
    term._query.push([self._query, new Term(self._r).expr(newValue)._wrap()._query]);

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "returnChanges") && (key !== "durability") && (key !== "nonAtomic")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `replace`", self._query, "Available options are returnChanges <bool>, durability <string>, nonAtomic <bool>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.delete = function(options) {
    var self = this;
    self._arityRange(arguments, 0, 1, "delete", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.DELETE);
    term._query.push([self._query]);

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "returnChanges") && (key !== "durability")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `delete`", self._query, "Available options are returnChanges <bool>, durability <string>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.sync = function() {
    this._arity(arguments, 0, "sync", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SYNC)
    term._query.push([this._query]);
    return term;
}

// Selecting data
Term.prototype.db = function(db) {
    this._arity(arguments, 1, "db", this);
    this._noPrefix(this, "db");

    var term = new Term(this._r);
    term._query.push(termTypes.DB)
    term._query.push([new Term(this._r).expr(db)._query])
    return term;
}
Term.prototype.table = function(table, options) {
    var self = this;
    self._arityRange(arguments, 1, 2, "table", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.TABLE)

    var args = [];
    if (Array.isArray(self._query) && (self._query.length > 0)) {
        args.push(self._query);
    }
    args.push(new Term(self._r).expr(table)._query)
    term._query.push(args);

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if (key !== "useOutdated") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `table`", self._query, "Available option is useOutdated <bool>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.get = function(primaryKey) {
    this._arity(arguments, 1, "get", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.GET);
    term._query.push([this._query, new Term(this._r).expr(primaryKey)._query])
    return term;
}
Term.prototype.getAll = function() {
    this._arityRange(arguments, 1, Infinity, "getAll", this);

    var term = new Term(this._r);
    term._query.push(termTypes.GET_ALL);
    
    var args = [];
    args.push(this._query);
    for(var i=0; i<arguments.length-1; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    if ((arguments.length > 1) && (helper.isPlainObject(arguments[arguments.length-1])) && (arguments[arguments.length-1].index !== undefined)) {
        term._query.push(args);
        term._query.push(new Term(this._r).expr(translateOptions(arguments[arguments.length-1]))._query);
    }
    else {
        args.push(new Term(this._r).expr(arguments[arguments.length-1])._query)
        term._query.push(args);
    }
    return term;
}
Term.prototype.between = function(start, end, options) {
    var self = this;
    self._arityRange(arguments, 2, 3, "between", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.BETWEEN);
    term._query.push([self._query, new Term(self._r).expr(start)._query, new Term(self._r).expr(end)._query])

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "index") && (key !== "leftBound") && (key !== "rightBound")){
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `between`", self._query, "Available options are index <string>, leftBound <string>, rightBound <string>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.filter = function(filter, options) {
    var self = this;
    self._arityRange(arguments, 1, 2, "filter", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.FILTER);
    term._query.push([self._query, new Term(self._r).expr(filter)._wrap()._query])

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if (key !== "default") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `filter`", self._query, "Available option is filter");
            }
        })
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}

// Joins
Term.prototype.innerJoin = function(sequence, predicate) {
    this._arity(arguments, 2, "innerJoin", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.INNER_JOIN);
    var args = [this._query];
    args.push(new Term(this._r).expr(sequence)._query);
    args.push(new Term(this._r).expr(predicate)._wrap()._query);
    term._query.push(args)

    return term;
}
Term.prototype.outerJoin = function(sequence, predicate) {
    this._arity(arguments, 2, "outerJoin", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.OUTER_JOIN);
    var args = [this._query];
    args.push(new Term(this._r).expr(sequence)._query);
    args.push(new Term(this._r).expr(predicate)._wrap()._query);
    term._query.push(args)

    return term;
}
Term.prototype.eqJoin = function(rightKey, sequence, options) {
    var self = this;
    self._arityRange(arguments, 2, 3, "eqJoin", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.EQ_JOIN);
    var args = [self._query];
    args.push(new Term(self._r).expr(rightKey)._wrap()._query);
    args.push(new Term(self._r).expr(sequence)._query);
    term._query.push(args)

    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if (key !== "index") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `eqJoin`", self._query, "Available option is index <string>");
            }
        })
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.zip = function() {
    this._arity(arguments, 0, "zip", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.ZIP);
    term._query.push([this._query]);
    return term;
}



// Transformation
Term.prototype.map = function(transformation) {
    this._arity(arguments, 1, "map", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MAP);
    var args = [this._query];
    args.push(new Term(this._r).expr(transformation)._wrap()._query)
    term._query.push(args);

    return term;
}
Term.prototype.withFields = function() {
    this._arityRange(arguments, 1, Infinity, "withFields", this);

    var term = new Term(this._r);
    term._query.push(termTypes.WITH_FIELDS);
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args);

    return term;
}
Term.prototype.concatMap = function(transformation) {
    this._arity(arguments, 1, "concatMap", this);

    var term = new Term(this._r);
    term._query.push(termTypes.CONCAT_MAP);
    var args = [this._query];
    args.push(new Term(this._r).expr(transformation)._wrap()._query)
    term._query.push(args);

    return term;
}
Term.prototype.orderBy = function() {
    this._arityRange(arguments, 1, Infinity, "orderBy", this);

    var term = new Term(this._r);
    term._query.push(termTypes.ORDER_BY);
    
    var args = [this._query];
    for(var i=0; i<arguments.length-1; i++) {
        if ((arguments[i] instanceof Term) &&
                ((arguments[i]._query[0] === termTypes.DESC) || (arguments[i]._query[0] === termTypes.ASC))) {
            args.push(new Term(this._r).expr(arguments[i])._query)
        }
        else {
            args.push(new Term(this._r).expr(arguments[i])._wrap()._query)
        }
    }
    // We actually don't need to make the difference here, but...
    if ((arguments.length > 0) && (helper.isPlainObject(arguments[arguments.length-1])) && (arguments[arguments.length-1].index !== undefined)) {
        term._query.push(args);
        term._query.push(new Term(this._r).expr(translateOptions(arguments[arguments.length-1]))._query);
    }
    else {
        if ((arguments[arguments.length-1] instanceof Term) &&
            ((arguments[arguments.length-1]._query[0] === termTypes.DESC) || (arguments[arguments.length-1]._query[0] === termTypes.ASC))) {
            args.push(new Term(this._r).expr(arguments[arguments.length-1])._query)
        }
        else {
            args.push(new Term(this._r).expr(arguments[arguments.length-1])._wrap()._query)
        }
        term._query.push(args);
    }
    return term;

}
Term.prototype.desc = function(field) {
    this._arity(arguments, 1, "desc", this);
    this._noPrefix(this, "desc");

    var term = new Term(this._r);
    term._query.push(termTypes.DESC)
    term._query.push([new Term(this._r).expr(field)._wrap()._query])
    return term;
}
Term.prototype.asc = function(field) {
    this._arity(arguments, 1, "asc", this);
    this._noPrefix(this, "asc");

    var term = new Term(this._r);
    term._query.push(termTypes.ASC)
    term._query.push([new Term(this._r).expr(field)._wrap()._query])
    return term;
}
Term.prototype.skip = function(value) {
    this._arity(arguments, 1, "skip", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SKIP)
    term._query.push([this._query, new Term(this._r).expr(value)._query])
    return term;
}
Term.prototype.limit = function(value) {
    this._arity(arguments, 1, "limit", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.LIMIT)
    term._query.push([this._query, new Term(this._r).expr(value)._query])
    return term;
}
Term.prototype.slice = function(start, end, options) {
    this._arityRange(arguments, 1, 3, "slice", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SLICE);

    var args = [];
    args.push(this._query);
    args.push(new Term(this._r).expr(start)._query);

    if ((end !== undefined) && (options !== undefined)) {
        args.push(new Term(this._r).expr(end)._query);
        term._query.push(args);
        term._query.push(new Term(this._r).expr(translateOptions(options))._query);
    }
    else if ((end !== undefined) && (options === undefined)) {
        if (helper.isPlainObject(end) === false) {
            args.push(new Term(this._r).expr(end)._query);
            term._query.push(args);
        }
        else {
            term._query.push(args);
            term._query.push(new Term(this._r).expr(translateOptions(end))._query);
        }
    }
    else { // end and options are both undefined
        term._query.push(args);
    }
    return term;
}
Term.prototype.nth = function(value) {
    this._arity(arguments, 1, "nth", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.NTH)
    term._query.push([this._query, new Term(this._r).expr(value)._query])
    return term;
}
Term.prototype.indexesOf = function(predicate) {
    this._arity(arguments, 1, "indexesOf", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.INDEXES_OF)
    term._query.push([this._query, new Term(this._r).expr(predicate)._wrap()._query])
    return term;
}
Term.prototype.isEmpty = function() {
    this._arity(arguments, 0, "isEmpty", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.IS_EMPTY)
    term._query.push([this._query])
    return term;
}
Term.prototype.union = function(other) {
    this._arity(arguments, 1, "union", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.UNION)
    term._query.push([this._query, new Term(this._r).expr(other)._query])
    return term;
}
Term.prototype.sample = function(size) {
    this._arity(arguments, 1, "sample", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SAMPLE)
    term._query.push([this._query, new Term(this._r).expr(size)._query])
    return term;
}

// Aggregations
Term.prototype.reduce = function(func) {
    this._arity(arguments, 1, "reduce", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.REDUCE)
    term._query.push([this._query, new Term(this._r).expr(func)._wrap()._query])
    return term;
}
Term.prototype.count = function(filter) {
    this._arityRange(arguments, 0, 1, "count", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.COUNT);
    var args = [];
    args.push(this._query);
    if (filter !== undefined) {
        args.push(new Term(this._r).expr(filter)._wrap()._query)
    }
    term._query.push(args);
    return term;
}
Term.prototype.distinct = function(options) {
    var self= this;
    self._arityRange(arguments, 0, 1, "distinct", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.DISTINCT)
    term._query.push([self._query])

    if (helper.isPlainObject(options)) {
        var keepGoing = true;
        helper.loopKeys(options, function(obj, key) {
            if ((keepGoing === true) && (key !== "index")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `distinct`", self._query, "Available option is index: <string>");
                keepGoing = false;
            }
        });
        if (keepGoing === true) {
            term._query.push(new Term(self._r).expr(translateOptions(options))._query);
        }
    }

    return term;
}
Term.prototype.group = function() {
    var self = this;

    self._arityRange(arguments, 1, Infinity, "group", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.GROUP);
    var args = [self._query];
    for(var i=0; i<arguments.length-1; i++) {
        args.push(new Term(self._r).expr(arguments[i])._wrap()._query)
    }
    if (arguments.length > 0) {
        if (helper.isPlainObject(arguments[arguments.length-1])) {
            helper.loopKeys(arguments[arguments.length-1], function(obj, key) {
                if (key !== "index") {
                    throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `group`", self._query, "Available option is index: <string>");
                }
            });
            term._query.push(args);
            term._query.push(new Term(self._r).expr(translateOptions(arguments[arguments.length-1]))._query);
        }
        else {
            args.push(new Term(self._r).expr(arguments[arguments.length-1])._wrap()._query)
            term._query.push(args);
        }
    }
    else {
        term._query.push(args);
    }

    return term;
}
Term.prototype.ungroup = function() {
    this._arity(arguments, 0, "ungroup", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.UNGROUP)
    term._query.push([this._query])
    return term;
}
Term.prototype.contains = function() {
    this._arityRange(arguments, 1, Infinity, "contains", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.CONTAINS)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._wrap()._query)
    }
    term._query.push(args)
    return term;
}
Term.prototype.sum = function(field) {
    this._arityRange(arguments, 0, 1, "sum", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SUM);
    var args = [this._query];
    if (field !== undefined) {
        args.push(new Term(this._r).expr(field)._wrap()._query)
    }
    term._query.push(args)
    return term;
}
Term.prototype.avg = function(field) {
    this._arityRange(arguments, 0, 1, "avg", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.AVG)
    var args = [this._query];
    if (field !== undefined) {
        args.push(new Term(this._r).expr(field)._wrap()._query)
    }
    term._query.push(args)
    return term;
}
Term.prototype.min = function(field) {
    this._arityRange(arguments, 0, 1, "min", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MIN)
    var args = [this._query];
    if (field !== undefined) {
        args.push(new Term(this._r).expr(field)._wrap()._query)
    }
    term._query.push(args)
    return term;
}
Term.prototype.max = function(field) {
    this._arityRange(arguments, 0, 1, "max", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MAX)
    var args = [this._query];
    if (field !== undefined) {
        args.push(new Term(this._r).expr(field)._wrap()._query)
    }
    term._query.push(args)

    return term;
}



// Document manipulation
Term.prototype.row = function() {
    this._arity(arguments, 0, "r.row", this);
    this._noPrefix(this, "row");

    var term = new Term(this._r);
    term._query.push(termTypes.IMPLICIT_VAR)
    return term;
}
Term.prototype.pluck = function() {
    this._arityRange(arguments, 1, Infinity, "pluck", this);

    var term = new Term(this._r);
    term._query.push(termTypes.PLUCK)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args)
    return term;
}
Term.prototype.without = function() {
    this._arityRange(arguments, 1, Infinity, "without", this);

    var term = new Term(this._r);
    term._query.push(termTypes.WITHOUT)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args)
    return term;
}
Term.prototype.merge = function(arg) {
    this._arity(arguments, 1, "merge", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MERGE)
    term._query.push([this._query, new Term(this._r).expr(arg)._wrap()._query])
    return term;
}
Term.prototype.literal = function(obj) {
    this._arity(arguments, 1, "literal", this);
    this._noPrefix(this, "literal");

    var term = new Term(this._r);
    term._query.push(termTypes.LITERAL)
    term._query.push([new Term(this._r).expr(obj)._query])
    return term;
}
Term.prototype.append = function(value) {
    this._arity(arguments, 1, "append", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.APPEND)
    term._query.push([this._query, new Term(this._r).expr(value)._query])
    return term;
}
Term.prototype.prepend = function(value) {
    this._arity(arguments, 1, "prepend", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.PREPEND)
    term._query.push([this._query, new Term(this._r).expr(value)._query])
    return term;
}
Term.prototype.difference = function(other) {
    this._arity(arguments, 1, "difference", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DIFFERENCE)
    term._query.push([this._query, new Term(this._r).expr(other)._query])
    return term;
}
Term.prototype.setInsert = function(other) {
    this._arity(arguments, 1, "setInsert", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SET_INSERT)
    term._query.push([this._query, new Term(this._r).expr(other)._query])
    return term;
}
Term.prototype.setUnion = function(other) {
    this._arity(arguments, 1, "setUnion", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SET_UNION)
    term._query.push([this._query, new Term(this._r).expr(other)._query])
    return term;
}
Term.prototype.setIntersection = function(other) {
    this._arity(arguments, 1, "setIntersection", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SET_INTERSECTION)
    term._query.push([this._query, new Term(this._r).expr(other)._query])
    return term;
}
Term.prototype.setDifference = function(other) {
    this._arity(arguments, 1, "setDifference", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SET_DIFFERENCE)
    term._query.push([this._query, new Term(this._r).expr(other)._query])
    return term;
}
Term.prototype.getField = function(field) {
    this._arity(arguments, 1, "(...)", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.GET_FIELD)
    query._query.push([this._query, new Term(this._r).expr(field)._query])
    return query;
}
Term.prototype.bracket = function(field) {
    this._arity(arguments, 1, "(...)", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.BRACKET)
    query._query.push([this._query, new Term(this._r).expr(field)._query])
    return query;
}

Term.prototype.hasFields = function() {
    this._arityRange(arguments, 1, Infinity, "hasFields", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.HAS_FIELDS)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args)
    return term;

}
Term.prototype.insertAt = function(index, value) {
    this._arity(arguments, 2, "insertAt", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.INSERT_AT)
    query._query.push([this._query, new Term(this._r).expr(index)._query, new Term(this._r).expr(value)._query])
    return query;
}
Term.prototype.spliceAt = function(index, array) {
    this._arityRange(arguments, 1, 2, "spliceAt", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.SPLICE_AT)
    query._query.push([this._query, new Term(this._r).expr(index)._query, new Term(this._r).expr(array)._query])
    return query;
}
Term.prototype.deleteAt = function(start, end) {
    this._arityRange(arguments, 1, 2, "deleteAt", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.DELETE_AT);
    var args = [this._query, new Term(this._r).expr(start)._query];
    if (end !== undefined) {
        args.push(new Term(this._r).expr(end)._query)
    }
    query._query.push(args)
    return query;
}
Term.prototype.changeAt = function(index, value) {
    this._arityRange(arguments, 1, 2, "changeAt", this); 

    var query = new Term(this._r);
    query._query.push(termTypes.CHANGE_AT);
    var args = [this._query];
    args.push(new Term(this._r).expr(index)._query)
    args.push(new Term(this._r).expr(value)._query)
    query._query.push(args)
    return query;
}
Term.prototype.keys = function() {
    this._arity(arguments, 0, "keys", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.KEYS)
    term._query.push([this._query])
    return term;
}
Term.prototype.object = function() {
    this._noPrefix(this, "object");
    this._arityRange(arguments, 0, Infinity, "object", this);

    var term = new Term(this._r);
    term._query.push(termTypes.OBJECT)
    var args = [];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._wrap()._query)
    }
    term._query.push(args)
    return term;
}



// String
Term.prototype.match = function(regex) {
    this._arity(arguments, 1, "match", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MATCH)
    term._query.push([this._query, new Term(this._r).expr(regex)._query])
    return term;
}
Term.prototype.upcase = function(regex) {
    this._arity(arguments, 0, "upcase", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.UPCASE)
    term._query.push([this._query])
    return term;
}
Term.prototype.downcase = function(regex) {
    this._arity(arguments, 0, "upcase", this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DOWNCASE)
    term._query.push([this._query])
    return term;
}




// Math and Logic
Term.prototype.add = function() {
    this._arityRange(arguments, 1, Infinity, "add", this);

    var query = new Term(this._r);
    query._query.push(termTypes.ADD)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.sub = function() {
    this._arityRange(arguments, 1, Infinity, "sub", this);

    var query = new Term(this._r);
    query._query.push(termTypes.SUB)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.mul = function() {
    this._arityRange(arguments, 1, Infinity, "mul", this);

    var query = new Term(this._r);
    query._query.push(termTypes.MUL)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.div = function() {
    this._arityRange(arguments, 1, Infinity, "div", this);

    var query = new Term(this._r);
    query._query.push(termTypes.DIV)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.mod = function(b) {
    this._arity(arguments, 1, "mod", this);

    var term = new Term(this._r);
    term._query.push(termTypes.MOD)
    term._query.push([this._query, new Term(this._r).expr(b)._query])
    return term;
}
Term.prototype.and = function() {
    this._arityRange(arguments, 1, Infinity, "and", this);

    var query = new Term(this._r);
    query._query.push(termTypes.ALL)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.or = function() {
    this._arityRange(arguments, 1, Infinity, "or", this);

    var query = new Term(this._r);
    query._query.push(termTypes.ANY)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.eq = function() {
    this._arityRange(arguments, 1, Infinity, "eq", this);

    var query = new Term(this._r);
    query._query.push(termTypes.EQ)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.ne = function() {
    this._arityRange(arguments, 1, Infinity, "ne", this);

    var query = new Term(this._r);
    query._query.push(termTypes.NE)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.gt = function(other) {
    this._arityRange(arguments, 1, Infinity, "gt", this);

    var query = new Term(this._r);
    query._query.push(termTypes.GT)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.ge = function(other) {
    this._arityRange(arguments, 1, Infinity, "ge", this);

    var query = new Term(this._r);
    query._query.push(termTypes.GE)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.lt = function(other) {
    this._arityRange(arguments, 1, Infinity, "lt", this);

    var query = new Term(this._r);
    query._query.push(termTypes.LT)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.le = function(other) {
    this._arityRange(arguments, 1, Infinity, "le", this);

    var query = new Term(this._r);
    query._query.push(termTypes.LE)
    var args = [this._query];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.not = function() {
    this._arity(arguments, 0, 'not', this); 

    var query = new Term(this._r);
    query._query.push(termTypes.NOT)
    query._query.push([this._query]);
    return query;
}
Term.prototype.random = function() {
    var self = this;

    self._noPrefix(this, "random");
    self._arityRange(arguments, 0, 3, "random", self); 

    var term = new Term(self._r);
    term._query.push(termTypes.RANDOM);

    var args = [];
    for(var i=0; i<arguments.length-1; i++) {
        args.push(new Term(self._r).expr(arguments[i])._query)
    }
    if (arguments.length > 0) {
        if (helper.isPlainObject(arguments[arguments.length-1])) {
            helper.loopKeys(arguments[arguments.length-1], function(obj, key) {
                if (key !== "float") {
                    throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `random`", self._query, "Available option is float: <boolean>");
                }
            });
            term._query.push(args);
            term._query.push(new Term(self._r).expr(translateOptions(arguments[arguments.length-1]))._query);
        }
        else {
            args.push(new Term(self._r).expr(arguments[arguments.length-1])._query)
            term._query.push(args);
        }
    }
    else {
        term._query.push(args);
    }
    return term;
}


// Dates and times
Term.prototype.now = function() {
    this._noPrefix(this, "now");

    var term = new Term(this._r);
    term._query.push(termTypes.NOW)
    return term;
}
Term.prototype.time = function() {
    this._noPrefix(this, "time");
    // Special check for arity
    var foundArgs = false;
    for(var i=0; i<arguments.length; i++) {
        if ((arguments[i] instanceof Term) && (arguments[i]._query[0] === termTypes.ARGS)) {
            foundArgs = true;
            break;
        }
    }
    if (foundArgs === false) {
        if ((arguments.length !== 4) && (arguments.length !== 7)) {
            throw new Error.ReqlDriverError("`r.time` called with "+arguments.length+" argument"+((arguments.length>1)?"s":""), null, "`r.time` takes 4 or 7 arguments");
        }
    }

    var query = new Term(this._r);
    query._query.push(termTypes.TIME)
    var args = [];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    query._query.push(args);
    return query;
}
Term.prototype.epochTime = function(epochTime) {
    this._noPrefix(this, "epochTime");

    var term = new Term(this._r);
    term._query.push(termTypes.EPOCH_TIME)
    term._query.push([new Term(this._r).expr(epochTime)._query])
    return term;
}
Term.prototype.ISO8601 = function(isoTime, options) {
    this._arityRange(arguments, 1, 2, 'ISO8601', this);
    this._noPrefix(this, "ISO8601");

    var term = new Term(this._r);
    term._query.push(termTypes.ISO8601)
    term._query.push([new Term(this._r).expr(isoTime)._query])
    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if (key !== "defaultTimezone") {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `ISO8601`. Available options are primaryKey <string>, durability <string>, datancenter <string>");
            }
        });
        term._query.push(new Term(this._r).expr(translateOptions(options))._query);
    }

    return term;

    return new ISO8601(this._r, isoTime, options);
}
Term.prototype.inTimezone = function(timezone) {
    this._arity(arguments, 1, 'inTimezone', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.IN_TIMEZONE)
    term._query.push([this._query, new Term(this._r).expr(timezone)._query])
    return term;
}
Term.prototype.timezone = function() {
    this._arity(arguments, 0, 'timezone', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.TIMEZONE)
    term._query.push([this._query])
    return term;
}
Term.prototype.during = function(left, right, options) {
    this._arityRange(arguments, 2, 3, 'during', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DURING);
    var args = [];
    args.push(this._query);
    args.push(new Term(this._r).expr(left)._query);
    args.push(new Term(this._r).expr(right)._query);

    term._query.push(args);
    if (helper.isPlainObject(options)) {
        term._query.push(new Term(this._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.date = function() {
    this._arity(arguments, 0, 'date', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DATE)
    term._query.push([this._query])
    return term;
}
Term.prototype.timeOfDay = function() {
    this._arity(arguments, 0, 'timeOfDay', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.TIME_OF_DAY)
    term._query.push([this._query])
    return term;
}
Term.prototype.year = function() {
    this._arity(arguments, 0, 'year', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.YEAR)
    term._query.push([this._query])
    return term;
}
Term.prototype.month = function() {
    this._arity(arguments, 0, 'month', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MONTH)
    term._query.push([this._query])
    return term;
}
Term.prototype.day = function() {
    this._arity(arguments, 0, 'day', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DAY)
    term._query.push([this._query])
    return term;
}
Term.prototype.dayOfYear = function() {
    this._arity(arguments, 0, 'dayOfYear', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DAY_OF_YEAR)
    term._query.push([this._query])
    return term;
}
Term.prototype.dayOfWeek = function() {
    this._arity(arguments, 0, 'dayOfWeek', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DAY_OF_WEEK)
    term._query.push([this._query])
    return term;
}
Term.prototype.hours = function() {
    this._arity(arguments, 0, 'hours', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.HOURS)
    term._query.push([this._query])
    return term;
}
Term.prototype.minutes = function() {
    this._arity(arguments, 0, 'minutes', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.MINUTES)
    term._query.push([this._query])
    return term;
}
Term.prototype.seconds = function() {
    this._arity(arguments, 0, 'seconds', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.SECONDS)
    term._query.push([this._query])
    return term;
}
Term.prototype.toISO8601 = function() {
    this._arity(arguments, 0, 'toISO8601', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.TO_ISO8601)
    term._query.push([this._query])
    return term;
}
Term.prototype.toEpochTime = function() {
    this._arity(arguments, 0, 'toEpochTime', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.TO_EPOCH_TIME)
    term._query.push([this._query])
    return term;
}
Term.prototype.monday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.MONDAY);
    return term;
}
Term.prototype.tuesday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.TUESDAY);
    return term;
}
Term.prototype.wednesday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.WEDNESDAY);
    return term;
}
Term.prototype.thursday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.THURSDAY);
    return term;
}
Term.prototype.friday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.FRIDAY);
    return term;
}
Term.prototype.saturday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.SATURDAY);
    return term;
}
Term.prototype.sunday = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.SUNDAY);
    return term;
}

Term.prototype.january = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.JANUARY);
    return term;
}
Term.prototype.february = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.FEBRUARY);
    return term;
}
Term.prototype.march = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.MARCH);
    return term;
}
Term.prototype.april = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.APRIL);
    return term;
}
Term.prototype.may = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.MAY);
    return term;
}
Term.prototype.june = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.JUNE);
    return term;
}
Term.prototype.july = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.JULY);
    return term;
}
Term.prototype.august = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.AUGUST);
    return term;
}
Term.prototype.september = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.SEPTEMBER);
    return term;
}
Term.prototype.october = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.OCTOBER);
    return term;
}
Term.prototype.november = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.NOVEMBER);
    return term;
}
Term.prototype.december = function() {
    var term = new Term(this._r);
    term._query.push(termTypes.DECEMBER);
    return term;
}


Term.prototype.args = function() {
    this._noPrefix(this, "args");

    var term = new Term(this._r);
    term._query.push(termTypes.ARGS);
    var args = [];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args);
    return term;
}
Term.prototype.do = function() {
    this._arityRange(arguments, 1, Infinity, 'do', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.FUNCALL);
    var args = [new Term(this._r).expr(arguments[arguments.length-1])._wrap()._query];
    args.push(this._query);
    for(var i=0; i<arguments.length-1; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args)
    return term;
}


Term.prototype.branch = function(predicate, trueBranch, falseBranch) {
    this._noPrefix(this, "branch");

    var term = new Term(this._r);
    term._query.push(termTypes.BRANCH)
    var args = [];
    args.push(new Term(this._r).expr(predicate)._query)
    args.push(new Term(this._r).expr(trueBranch)._query)
    args.push(new Term(this._r).expr(falseBranch)._query)
    term._query.push(args)
    return term;
}
Term.prototype.forEach = function(func) {
    this._arity(arguments, 1, 'forEach', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.FOR_EACH);
    term._query.push([this._query, new Term(this._r).expr(func)._wrap()._query]);
    return term;
}
Term.prototype.error = function(strError) {
    this._noPrefix(this, "error");

    var term = new Term(this._r);
    term._query.push(termTypes.ERROR);
    if (strError !== undefined) {
        term._query.push([new Term(this._r).expr(strError)._query]);
    }
    return term;
}
Term.prototype.default = function(expression) {
    this._arity(arguments, 1, 'default', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.DEFAULT);
    term._query.push([this._query, new Term(this._r).expr(expression)._query]);
    return term;
}
Term.prototype.expr = function(expression, nestingLevel) {
    var self = this;

    self._arityRange(arguments, 1, 2, 'expr', self); 
    self._noPrefix(self, "expr");

    // undefined will be caught in the last else
    var ar, obj;

    if (expression === undefined) throw new Error.ReqlDriverError("Cannot convert `undefined` with r.expr()");

    if (nestingLevel == null) nestingLevel = self._r.nestingLevel;
    if (nestingLevel < 0) throw new Error.ReqlDriverError("Nesting depth limit exceeded.\nYou probably have a circular reference somewhere")

    if (expression instanceof Term) {
        return expression;
    }
    else if (expression instanceof Function) {
        return new Func(self._r, expression);
    }
    else if (expression instanceof Date) {
        return new Term(self._r).ISO8601(expression.toISOString())
    }
    else if (Array.isArray(expression)) {
        var query = new Term(self._r);
        query._query.push(termTypes.MAKE_ARRAY);

        var args = [];
        for(var i=0; i<expression.length; i++) {
            args.push(new Term(self._r).expr(expression[i], nestingLevel-1)._query)
        }
        query._query.push(args);
        return query;
    }
    else if (expression instanceof Buffer) {
        return self._r.binary(expression);
    }
    else if (helper.isPlainObject(expression)) {
        var optArgs = {};
        helper.loopKeys(expression, function(expression, key) {
            if (expression[key] !== undefined) {
                optArgs[key] = new Term(self._r).expr(expression[key], nestingLevel-1)._query;
            }
        });
        return new Term(self._r, optArgs);
    }
    else { // Primitive
        if (expression === null) {
            return new Term(self._r, expression);
        }
        else if (typeof expression === "string") {
            return new Term(self._r, expression);
        }
        else if (typeof expression === "number") {
            if (expression !== expression) {
                throw new Error.ReqlDriverError("Cannot convert `NaN` to JSON");
            }
            else if (!isFinite(expression)) {
                throw new Error.ReqlDriverError("Cannot convert `Infinity` to JSON");
            }
            return new Term(self._r, expression);
        }
        else if (typeof expression === "boolean") {
            return new Term(self._r, expression);
        }
        else {
            throw new Error.ReqlDriverError("Cannot convert `"+expression+"` to datum.")
        }
    }
    return self;
}

Term.prototype.binary = function(bin) {
    this._noPrefix(this, "binary");
    this._arity(arguments, 1, 'binary', this);

    var term;
    if (bin instanceof Buffer) {
        // We could use BINARY, and coerce `bin` to an ASCII string, but that
        // will break if there is a null char
        term = new Term(this._r, {
            $reql_type$: "BINARY",
            data: bin.toString("base64")
        });
    }
    else {
        term = new Term(this._r);
        term._query.push(termTypes.BINARY)
        term._query.push([new Term(this._r).expr(bin)._query]);
    }
    return term;
}

Term.prototype.js = function(arg) {
    this._arity(arguments, 1, 'js', this);
    this._noPrefix(this, "js");

    var term = new Term(this._r);
    term._query.push(termTypes.JAVASCRIPT)
    term._query.push([new Term(this._r).expr(arg)._query])
    return term;
}
Term.prototype.coerceTo = function(type) {
    this._arity(arguments, 1, 'coerceTo', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.COERCE_TO)
    term._query.push([this._query, new Term(this._r).expr(type)._query])
    return term;
}
Term.prototype.typeOf = function() {
    this._arity(arguments, 0, 'typeOf', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.TYPE_OF);
    term._query.push([this._query])
    return term;
}
Term.prototype.info = function() {
    this._arity(arguments, 0, 'info', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.INFO);
    term._query.push([this._query])
    return term;
}
Term.prototype.json = function(json) {
    this._arity(arguments, 1, 'info', this);
    this._noPrefix(this, "json");
    var term = new Term(this._r);
    term._query.push(termTypes.JSON);
    term._query.push([new Term(this._r).expr(json)._query])
    return term;
}
Term.prototype.http = function(url, options) {
    this._noPrefix(this, "http");
    this._arityRange(arguments, 1, 2, 'http', this); 

    var term = new Term(this._r);
    term._query.push(termTypes.HTTP);
    term._query.push([new Term(this._r).expr(url)._query]);
    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "timeout") 
                && (key !==  "reattempts")
                && (key !==  "redirects")
                && (key !==  "verify")
                && (key !==  "resultFormat")
                && (key !==  "method")
                && (key !==  "auth")
                && (key !==  "params")
                && (key !==  "header")
                && (key !==  "data")
                && (key !==  "page")
                && (key !==  "pageLimit")
                && (key !==  "")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `http`. Available options are reattemps <number>, redirects <number>, verify <boolean>, resultFormat: <string>, method: <string>, auth: <object>, params: <object>, header: <string>, data: <string>, page: <string/function>, pageLimit: <number>");
            }
        });

        term._query.push(new Term(this._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.uuid = function() {
    this._noPrefix(this, "uuid");

    var term = new Term(this._r);
    term._query.push(termTypes.UUID)
    return term;
}


Term.prototype.circle = function(center, radius, options) {
    var self = this;

    // Arity check is done by r.circle
    self._noPrefix(self, "circle");
    var term = new Term(self._r);
    term._query.push(termTypes.CIRCLE);
    term._query.push([new Term(self._r).expr(center)._query, new Term(self._r).expr(radius)._query]);

    if (helper.isPlainObject(options)) {
    }

    if (helper.isPlainObject(options)) {
        // There is no need to translate here
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "numVertices") && (key !== "geoSystem") && (key !== "unit") && (key !== "fill")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `circle`", self._query, "Available options are numVertices <number>, geoSsystem <string>, unit <string> and fill <bool>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }

    return term;
}
Term.prototype.distance = function(geometry, options) {
    this._arityRange(arguments, 1, 2, 'distance', this);
    var term = new Term(this._r);
    term._query.push(termTypes.DISTANCE);
    term._query.push([this._query, new Term(this._r).expr(geometry)._query]);
    if (helper.isPlainObject(options)) {
        //TODO Check keys
        term._query.push(new Term(this._r).expr(translateOptions(options))._query);
    }
    return term;
}
Term.prototype.fill = function() {
    this._arity(arguments, 0, 'fill', this);
    var term = new Term(this._r);
    term._query.push(termTypes.FILL);
    term._query.push([this._query])
    return term;
}

Term.prototype.geojson = function(geometry) {
    this._arity(arguments, 1, 'geojson', this);
    this._noPrefix(this, "geojson");
    var term = new Term(this._r);
    term._query.push(termTypes.GEOJSON);
    term._query.push([new Term(this._r).expr(geometry)._query]);
    return term;
}

Term.prototype.toGeojson = function() {
    this._arity(arguments, 0, 'toGeojson', this);
    var term = new Term(this._r);
    term._query.push(termTypes.TO_GEOJSON);
    term._query.push([this._query]);
    return term;
}

Term.prototype.getIntersecting = function(geometry, options) {
    this._arity(arguments, 2, 'getIntersecting', this);
    var term = new Term(this._r);
    term._query.push(termTypes.GET_INTERSECTING);
    term._query.push([this._query, new Term(this._r).expr(geometry)._query]);
    if (helper.isPlainObject(options)) {
        //TODO check keys? Enforce index
        term._query.push(new Term(this._r).expr(translateOptions(options))._query);
    }
    else {
        // throw because we enforce index
    }
    return term;
}

Term.prototype.getNearest = function(geometry, options) {
    var self = this;

    self._arity(arguments, 2, 'getNearest', self);
    var term = new Term(self._r);
    term._query.push(termTypes.GET_NEAREST);
    term._query.push([self._query, new Term(self._r).expr(geometry)._query]);
    if (helper.isPlainObject(options)) {
        helper.loopKeys(options, function(obj, key) {
            if ((key !== "index") && (key !== "maxResults") && (key !== "maxDist") && (key !== "unit") && (key !== "geoSystem")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `getNearest`", self._query, "Available options are index <string>, maxResults <number>, maxDist <number>, unit <string>, geoSystem <string>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(options))._query);
    }
    else {
        // throw because we enforce index
    }
    return term;

}

Term.prototype.includes = function(geometry) {
    this._arity(arguments, 1, 'includes', this);
    var term = new Term(this._r);
    term._query.push(termTypes.INCLUDES);
    term._query.push([this._query, new Term(this._r).expr(geometry)._query]);
    return term;
}

Term.prototype.intersects = function(geometry) {
    this._arity(arguments, 1, 'intersects', this);
    var term = new Term(this._r);
    term._query.push(termTypes.INTERSECTS);
    term._query.push([this._query, new Term(this._r).expr(geometry)._query]);
    return term;
}

Term.prototype.line = function() {
    // Arity check is done by r.line
    this._noPrefix(this, "line");

    var term = new Term(this._r);
    term._query.push(termTypes.LINE);
    
    var args = [];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args);
    return term;
}

Term.prototype.point = function(longitude, latitude) {
    // Arity check is done by r.point
    this._noPrefix(this, "point");

    var term = new Term(this._r);
    term._query.push(termTypes.POINT);
    term._query.push([new Term(this._r).expr(longitude)._query, new Term(this._r).expr(latitude)._query]);
    return term;
}

Term.prototype.polygon = function() {
    // Arity check is done by r.polygon
    this._noPrefix(this, "polygon");

    var term = new Term(this._r);
    term._query.push(termTypes.POLYGON);

    var args = [];
    for(var i=0; i<arguments.length; i++) {
        args.push(new Term(this._r).expr(arguments[i])._query)
    }
    term._query.push(args);

    return term;
}

Term.prototype.polygonSub = function(geometry) {
    this._arity(arguments, 1, 'polygonSub', this);
    var term = new Term(this._r);
    term._query.push(termTypes.POLYGON_SUB);
    term._query.push([this._query, new Term(this._r).expr(geometry)._query]);
    return term;
}

Term.prototype.range = function(start, end) {
    this._arityRange(arguments, 1, 2, 'r.range', this);
    this._noPrefix(this, "range");
    var term = new Term(this._r);
    term._query.push(termTypes.RANGE);
    var args = [];
    args.push(new Term(this._r).expr(start)._query);
    if (end !== undefined) {
      args.push(new Term(this._r).expr(end)._query);
    }
    term._query.push(args);
    return term;
}
Term.prototype.toJsonString = function() {
    this._arity(arguments, 0, 'toJSON', this);
    var term = new Term(this._r);
    term._query.push(termTypes.TO_JSON_STRING);
    term._query.push([this._query]);
    return term;
}
Term.prototype.toJSON = Term.prototype.toJsonString;

Term.prototype.config = function() {
    this._arity(arguments, 0, 'config', this);
    var term = new Term(this._r);
    term._query.push(termTypes.CONFIG);
    term._query.push([this._query]);
    return term;
}

Term.prototype.status = function() {
    this._arity(arguments, 0, 'status', this);
    var term = new Term(this._r);
    term._query.push(termTypes.STATUS);
    term._query.push([this._query]);
    return term;
}

Term.prototype.wait = function() {
    this._arity(arguments, 0, 'wait', this);
    var term = new Term(this._r);
    term._query.push(termTypes.WAIT);
    if (Array.isArray(this._query) && (this._query.length > 0)) {
        term._query.push([this._query]);
    }
    return term;
}

Term.prototype.reconfigure = function(config) {
    var self = this;
    self._arity(arguments, 1, 'reconfigure', self);
    var term = new Term(self._r);
    term._query.push(termTypes.RECONFIGURE);

    if (Array.isArray(this._query) && (this._query.length > 0)) {
        term._query.push([this._query]);
    }
    else{
        term._query.push([]);
    }
    if (helper.isPlainObject(config)) {
        helper.loopKeys(config, function(obj, key) {
            if ((key !== "shards") && (key !== "replicas") &&
                    (key !== "dryRun") && (key !== "primaryReplicasTag")) {
                throw new Error.ReqlDriverError("Unrecognized option `"+key+"` in `reconfigure`", self._query, "Available options are shards: <number>, replicas: <number>, primaryReplicasTag: <object>, dryRun <boolean>");
            }
        });
        term._query.push(new Term(self._r).expr(translateOptions(config))._query);
    }
    else {
        throw new Error.ReqlDriverError("First argument of `reconfigure` must be an object");
    }
    return term;
}

Term.prototype.rebalance = function() {
    this._arity(arguments, 0, 'rebalance', this);
    var term = new Term(this._r);
    term._query.push(termTypes.REBALANCE);
    if (Array.isArray(this._query) && (this._query.length > 0)) {
        term._query.push([this._query]);
    }
    return term;
}


Term.prototype.then = function(resolve, reject) {
    return this.run().then(resolve, reject);
}
Term.prototype.error = function(reject) {
    return this.run().error(reject);
}
Term.prototype.catch = function(reject) {
    return this.run().catch(reject);
}
Term.prototype.finally = function(handler) {
    return this.run().finally(handler);
}


Term.prototype.toString = function() {
    return Error.generateBacktrace(this._query, 0, null, [], {indent: 0, extra: 0}).str;
}

Term.prototype._wrap = function() {
    var self = this;
    if (helper.hasImplicit(this._query)) {
        if (this._query[0] === termTypes.ARGS) {
            throw new Error.ReqlDriverError("Implicit variable `r.row` cannot be used inside `r.args`")
        }
        //Must pass at least one variable to the function or it won't accept r.row
        return new Term(this._r).expr(function(doc) { return self; })
    }
    else {
        return self;
    }
}
Term.prototype._translateArgs = {
    returnChanges: "return_changes",
    primaryKey: "primary_key",
    useOutdated: "use_outdated",
    nonAtomic: "non_atomic",
    leftBound: "left_bound",
    rightBound: "right_bound",
    defaultTimezone: "default_timezone",
    noReply: "noreply",
    resultFormat: "result_format",
    pageLimit: "page_limit",
    arrayLimit: "array_limit",
    numVertices: "num_vertices",
    geoSystem: "geo_system",
    maxResults: "max_results",
    maxDist: "max_dist",
    dryRun: "dry_run"
}
function translateOptions(options) {
    var translatedOpt = {};
    helper.loopKeys(options, function(options, key) {
        var keyServer = Term.prototype._translateArgs[key] || key;
        translatedOpt[keyServer] = options[key];
    });
    return translatedOpt;
}
Term.prototype._setNestingLevel = function(nestingLevel) {
    Term.prototype._nestingLevel = nestingLevel;
}
Term.prototype._setArrayLimit = function(arrayLimit) {
    Term.prototype._arrayLimit = arrayLimit;
}


Term.prototype._noPrefix = function(query, method) {
    if ((!Array.isArray(query._query)) || (query._query.length > 0)) {
        throw new Error.ReqlDriverError("`"+method+"` is not defined", query._query);
    }
}
Term.prototype._arityRange = function(args, min, max, method, query) {
    var foundArgs = false;
    if (args.length < min) {
        for(var i=0; i<args.length; i++) {
            if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
                foundArgs = true;
                break;
            }
        }
        if (foundArgs === false) {
            throw new Error.ReqlDriverError("`"+method+"` takes at least "+min+" argument"+((min>1)?'s':'')+", "+args.length+" provided", query._query);
        }
    }
    else if (args.length > max) {
        for(var i=0; i<args.length; i++) {
            if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
                foundArgs = true;
                break;
            }
        }
        if (foundArgs === false) {
            throw new Error.ReqlDriverError("`"+method+"` takes at most "+max+" argument"+((max>1)?'s':'')+", "+args.length+" provided", query._query);
        }
    }
}
Term.prototype._arity = function(args, num, method, query) {
    if (args.length !== num) {
        var foundArgs = false;
        for(var i=0; i<args.length; i++) {
            if ((args[i] instanceof Term) && (args[i]._query[0] === termTypes.ARGS)) {
                foundArgs = true;
                break;
            }
        }
        if (foundArgs === false) {
            throw new Error.ReqlDriverError("`"+method+"` takes "+num+" argument"+((num>1)?'s':'')+", "+args.length+" provided", query._query);
        }
    }
}


// Datums
function Func(r, func) {
    // We can retrieve the names of the arguments with
    // func.toString().match(/\(([^\)]*)\)/)[1].split(/\s*,\s*/)

    var query = new Term(this._r);
    query._query.push(termTypes.FUNC);
    var args = [];
    var argVars = [];
    var argNums = [];

    for(var i=0; i<func.length; i++) {
        argVars.push(new Var(r, r.nextVarId));
        argNums.push(r.nextVarId);

        if (r.nextVarId === 9007199254740992) { // That seems like overdoing it... but well maybe...
            r.nextVarId = 0;
        }
        else {
            r.nextVarId++;
        }
    }
        
    var body = func.apply(func, argVars)
    if (body === undefined) throw new Error.ReqlDriverError("Annonymous function returned `undefined`. Did you forget a `return`?", this._query);
    body = new Term(r).expr(body);

    args.push(new Term(r).expr(argNums)._query);
    args.push(body._query);

    query._query.push(args);

    return query;
}
Func.prototype.nextVarId = 1;

function Var(r, id) {
    var term = new Term(r);
    term._query.push(termTypes.VAR)
    term._query.push([new Term(r).expr(id)._query])
    return term;
}

module.exports = Term;
