// The main logic goes here parsing/executing queries

var protodef = require(__dirname+"/protodef.js");
var termTypes = protodef.Term.TermType;
var helper = require(__dirname+"/helper.js");

var Database = require(__dirname+"/database.js");
var Table = require(__dirname+"/table.js");
var Sequence = require(__dirname+"/sequence.js");
var Error = require(__dirname+"/error.js");
var util = require('util');

var Document = require(__dirname+"/document.js");
var Selection = require(__dirname+"/selection.js");
var Group = require(__dirname+"/group.js");

// Keep things in a function in case we somehow decide to implement lazy cursor
function Query(server, query, options) {
    this.server = server;
    this.query = query;
    this.options = {};
    this.context = {};
    this.frames = [];
    //this.token = token;

}
//TODO:
// - make sure that we call helper.toDatum
// - make sure that eq works with Sequence
// - assert type

//TODO Make sure there are no stray arrays going around
Query.prototype.run = function(query) {
    query = query || this.query;

    var queryType = query[0];

    //TODO Pass frames
    try {
        this.frames.push(0);
        this.options = query[2];
        var result = this.evaluate(query[1]);
        this.frames.pop();

        // TODO Check more types
        if (result instanceof Database) {
            throw new Error.ReqlRuntimeError("Query result must be of type DATUM, GROUPED_DATA, or STREAM (got DATABASE)");
        }
        

        var type;

        type = protodef.Response.ResponseType.SUCCESS_ATOM;

        result = helper.toDatum(result);
        result = [result];

        //TODO Make a deep copy of the results for the local browser
        var response = {
            t: type,
            r: result
        }
        return response
    }
    catch(err) {
        return {
            t: err.type,
            r: [err.message],
            b: err.frames || []
        }
    }
}

Query.prototype.evaluate = function(term) {
    if ((Array.isArray(term) === false) && (helper.isPlainObject(term) === false)) {
        // Primtiive
        return term;
    }
    else if (helper.isPlainObject(term)) {
        // Plain object
        var keys = Object.keys(term);
        var result = {};
        for(var i=0; i<keys.length; i++) {
            this.frames.push(keys[i])
            result[keys[i]] = this.evaluate(term[keys[i]]);
            this.frames.pop()
        }
        return result;
    }

    var termType = term[0];

    // We need to evaluate the options as there may be a ReQL term inside
    var options = term[2] || {};

    //TODO Check arity
    switch(termType) {
        case termTypes.MAKE_ARRAY: // 2
            var ar = new Sequence();
            for(var i=0; i<term[1].length; i++) {
                this.frames.push(i);
                ar.push(this.evaluate(term[1][i]));
                this.frames.pop();
            }
            return ar;

        case termTypes.MAKE_OBJ:
            //TODO Do we need to implement that?
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.VAR: // 10
            this.frames.push(0)
            var varId = this.evaluate(term[1][0]);
            this.frames.pop()
            if (this.context[varId] === undefined) {
                throw new Error.ReqlRuntimeError("The server is buggy, context not found")
            }
            return this.context[varId];
        case termTypes.JAVASCRIPT:
            //TODO That's unsafe... but can we do better?
            var result;
            with(this.context) {
               result = eval(term[1][0]);
            }
            return result;
        case termTypes.HTTP:
            //TODO
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.ERROR:
            this.frames.push(0);
            var message = this.evaluate(term[1][0]);
            this.frames.pop();

            helper.assertType(message, 'STRING', this);

            throw new Error.ReqlRuntimeError(message, this.frames);
        case termTypes.IMPLICIT_VAR: // 13
            return this.context[Object.keys(this.context)[0]];
        case termTypes.DB: // 14
            this.frames.push(1)
            var arg = this.evaluate(term[1][0]);
            this.frames.pop();

            helper.assertType(arg, 'STRING', this);
            helper.assertNoSpecialChar(arg, 'Database', this);

            if (this.server.databases[arg] == null) {
                throw new Error.ReqlRuntimeError("Database `"+arg+"` does not exist", this.frames)
            }
            return this.server.databases[arg];
        case termTypes.TABLE: // 15
            var db, tableName;
            if (term[1].length === 1) {
                db = this.evaluate(this.options.db) || this.server.databases['test'];
                this.frames.push(0);
                tableName = this.evaluate(term[1][0]);
                this.frames.pop();
            }
            else if (term[1].length === 2) {
                this.frames.push(0);
                db = this.evaluate(term[1][0]);
                this.frames.pop();
                this.frames.push(1);
                tableName = this.evaluate(term[1][1]);
                this.frames.pop();
            }
            helper.assertType(tableName, 'STRING', this);
            helper.assertNoSpecialChar(tableName, 'Table', this);

            if (db.tables[tableName] == null) {
                throw new Error.ReqlRuntimeError("Table `"+tableName+"` does not exist", this.frames)
            }
            return db.tables[tableName];
        case termTypes.GET:
            this.frames.push(0);
            var table = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var value = this.evaluate(term[1][1]);
            this.frames.pop();

            return table.get(value);
        case termTypes.GET_ALL:
            this.frames.push(0);
            var table = this.evaluate(term[1][0])
            this.frames.pop();

            var values = [];
            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                values.push(this.evaluate(term[1][i]))
                this.frames.pop();
            }
            return table.getAll.call(table, values, options, this);
        case termTypes.EQ:
            var left = this.evaluate(term[1][0]);

            for(var i=1; i<term[1].length; i++) {
                right = this.evaluate(term[1][i]);
                if (helper.eq(left, right) === false) {
                    return false;
                }
            }
            return true;
        case termTypes.NE:
            var left = this.evaluate(term[1][0]);

            for(var i=0; i<term[1].length; i++) {
                right = this.evaluate(term[1][i]);
                if (helper.eq(left, right) === false) {
                    return true;
                }
            }
            return false;

        case termTypes.LT:
            var left = this.evaluate(term[1][0]);

            for(var i=1; i<term[1].length; i++) {
                right = this.evaluate(term[1][i]);
                if (helper.lt(left, right) === false) {
                    return false;
                }
            }
            return true;
        case termTypes.LE:
            var left = this.evaluate(term[1][0]);

            for(var i=1; i<term[1].length; i++) {
                right = this.evaluate(term[1][i]);
                if ((helper.lt(left, right) === false) && (helper.eq(left, right) === false)) {
                    return false;
                }
            }
            return true;

        case termTypes.GT:
            var left = this.evaluate(term[1][0]);

            for(var i=1; i<term[1].length; i++) {
                right = this.evaluate(term[1][i]);
                if (helper.gt(left, right) === false) {
                    return false;
                }
            }
            return true;
        case termTypes.GE:
            var left = this.evaluate(term[1][0]);

            for(var i=1; i<term[1].length; i++) {
                right = this.evaluate(term[1][i]);
                if ((helper.gt(left, right) === false) && (helper.eq(left, right) === false)) {
                    return false;
                }
            }
            return true;

        case termTypes.NOT:
            var value = this.evaluate(term[1][0]);
            return !value.toBool()
        case termTypes.ADD:
            this.frames.push(0);
            var result = this.evaluate(term[1][0]);
            this.frames.pop();

            var valueToAdd;

            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                valueToAdd = this.evaluate(term[1][i]);
                this.frames.pop();

                if (helper.isDate(result)) {
                    helper.assertType(valueToAdd, "TIME", this);

                    result.epoch_time += valueToAdd;
                }
                else {
                    //TODO Throw for boolean etc.
                    helper.assertType(valueToAdd, typeof result, this);

                    result += valueToAdd;
                }
            }
            return result;
        case termTypes.SUB:
            this.frames.push(0);
            var result = this.evaluate(term[1][0]);
            this.frames.pop();

            var valueToAdd;

            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                valueToAdd = this.evaluate(term[1][i]);
                this.frames.pop();

                if (helper.isDate(result)) {
                    helper.assertType(valueToAdd, "TIME", this);

                    result.epoch_time -= valueToAdd;
                }
                else {
                    //TODO Throw for boolean etc.
                    helper.assertType(valueToAdd, typeof result, this);

                    result -= valueToAdd;
                }
            }
            return result;
        case termTypes.MUL:
            var result = 1;
            for(var i=0; i<term[1].length; i++) {
                this.frames.push(i);
                valueToMul = this.evaluate(term[1][i]);
                this.frames.pop();

                helper.assertType(valueToMul, "number", this);

                result *= valueToMul;
            }
            return result;
        case termTypes.DIV:
            this.frames.push(0);
            var result = this.evaluate(term[1][0]);
            this.frames.pop();

            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                valueToDiv = this.evaluate(term[1][i]);
                this.frames.pop();

                helper.assertType(valueToDiv, "number", this);

                result /= valueToDiv;
            }
            return result;

        case termTypes.MOD:
            //TODO enforce integers
            this.frames.push(0);
            var numerator = this.evaluate(term[1][0]);
            helper.assertType(numerator, "NUMBER", this);
            helper.assertType(numerator, "INT", this);
            this.frames.pop();

            this.frames.push(1);
            var denominator = this.evaluate(term[1][1]);
            helper.assertType(denominator, "NUMBER", this);
            helper.assertType(denominator, "INT", this);
            this.frames.pop();

            var remainder = numerator%denominator;
            if (remainder < 0) {
                remainder += denominator;
            }
            return remainder;
        case termTypes.APPEND:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var element = this.evaluate(term[1][1]);
            this.frames.pop();

            sequence.push(element);

            return sequence;
        case termTypes.PREPEND:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var element = this.evaluate(term[1][1]);
            this.frames.pop();

            sequence.unshift(element);

            return sequence;
        case termTypes.DIFFERENCE:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var other = this.evaluate(term[1][1]);
            this.frames.pop();

            return sequence.difference(other);
        case termTypes.SET_INSERT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var value = this.evaluate(term[1][1]);
            this.frames.pop();

            return sequence.setInsert(value);
        case termTypes.SET_INTERSECTION:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var other = this.evaluate(term[1][1]);
            this.frames.pop();

            return sequence.setIntersection(other);
        case termTypes.SET_UNION:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var other = this.evaluate(term[1][1]);
            this.frames.pop();

            return sequence.setUnion(other);

        case termTypes.SET_DIFFERENCE:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            this.frames.push(1);
            var other = this.evaluate(term[1][1]);
            this.frames.pop();

            return sequence.setDifference(other);
        case termTypes.SLICE:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var start = this.evaluate(term[1][1])
            this.frames.pop();

            this.frames.push(2);
            var end = this.evaluate(term[1][2])
            this.frames.pop();
            return sequence.slice(start, end, options);
        case termTypes.SKIP:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var skip = this.evaluate(term[1][1])
            this.frames.pop();

            return sequence.skip(skip);
        case termTypes.LIMIT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var limit = this.evaluate(term[1][1])
            this.frames.pop();
            return sequence.limit(limit);
        case termTypes.INDEXES_OF:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.indexesOf(term[1][1], this);
        case termTypes.CONTAINS:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.contains(term[1][1], this);
        case termTypes.GET_FIELD:
            this.frames.push(0);
            var doc = this.evaluate(term[1][0])
            this.frames.pop();
            this.frames.push(1)
            var field = this.evaluate(term[1][1])
            this.frames.pop();
            if (doc instanceof Document) {
                if (doc.doc[field] === undefined) {
                    throw new Error.ReqlRuntimeError("No attribute `"+field+"` in object:\n"+JSON.stringify(doc.toDatum(), null, 2), this.frames)
                }
                return doc.doc[field];
            }
            else {
                if (doc[field] === undefined) {
                    throw new Error.ReqlRuntimeError("No attribute `"+field+"` in object:\n"+JSON.stringify(helper.toDatum(doc), null, 2), this.frames)
                }
                return doc[field];
            }
        case termTypes.KEYS:
            this.frames.push(0);
            var obj = this.evaluate(term[1][0])
            this.frames.pop();

            var result = new Sequence();
            var keys = Object.keys(obj);
            for(var i=0; i<keys.length; i++) {
                result.push(keys[i]);
            }
            return result;
        case termTypes.OBJECT:
            if (term[1].length%2 === 1) {
                throw new Error.ReqlRuntimeError("OBJECT expects an even number of arguments (but found "+term[1].length+")")
            }
            var result = {};
            var key, value;
            var i=0;
            while (i<term[1].length) {
                this.frames.push(i);
                key = this.evaluate(term[1][i]);
                this.frames.pop();
                helper.assertType(key, "STRING", this);

                this.frames.push(i+1);
                value = this.evaluate(term[1][i+1])
                this.frames.pop();

                result[key] = value;
                i += 2;
            }
            return result;
        case termTypes.HAS_FIELDS:
            var sequenceOrObject = this.evaluate(term[1][0]);

            var keys = [];
            for(var i=1; i<term[1].length; i++) {
                keys.push(this.evaluate(term[1][i]));
            }

            if (sequenceOrObject instanceof Sequence) {
                return sequenceOrObject.hasFields(keys);
            }
            else {
                return helper.hasFields(sequenceOrObject, keys);
            }

        case termTypes.WITH_FIELDS:
            var sequence = this.evaluate(term[1][0]);
            var fields = new Sequence();
            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                fields.push(this.evaluate(term[1][i]));
                this.frames.pop();
            }
            return sequence.withFields(fields, this);
        case termTypes.PLUCK:
            //TODO Implement paths
            var sequenceOrObject = this.evaluate(term[1][0]);

            var keys = [];
            for(var i=1; i<term[1].length; i++) {
                keys.push(this.evaluate(term[1][i]));
            }

            if (sequenceOrObject instanceof Sequence) {
                return sequenceOrObject.pluck(keys);
            }
            else {
                return helper.pluck(sequenceOrObject, keys);
            }
        case termTypes.WITHOUT:
            var sequenceOrObject = this.evaluate(term[1][0]);

            var keys = [];
            for(var i=1; i<term[1].length; i++) {
                keys.push(this.evaluate(term[1][i]));
            }

            if ((sequenceOrObject instanceof Sequence)
                || (sequenceOrObject instanceof Selection)
                || (sequenceOrObject instanceof Table)) {

                return sequenceOrObject.without(keys);
            }
            else {
                return helper.without(sequenceOrObject, keys);
            }
        case termTypes.MERGE:
            var sequenceOrObject = this.evaluate(term[1][0]);

            if (sequenceOrObject instanceof Sequence) {
                return sequenceOrObject.merge(term[1][1], this);
            }
            else {
                return helper.merge(sequenceOrObject, term[1][1], this);
            }
        case termTypes.BETWEEN:
            this.frames.push(0);
            var table = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var left = this.evaluate(term[1][1])
            this.frames.pop();

            this.frames.push(2);
            var right = this.evaluate(term[1][2])
            this.frames.pop();

            return table.between(left, right, options, this);
        case termTypes.REDUCE:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.reduce(term[1][1], this);
        case termTypes.MAP:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            return sequence.map(term[1][1], this);
        case termTypes.FILTER:
            var sequence = this.evaluate(term[1][0]);
            options = this.evaluate(options);
            return sequence.filter(term[1][1], options, this);
        case termTypes.CONCATMAP: // 40
            var sequence = this.evaluate(term[1][0]);
            return sequence.concatMap(term[1][1], this);
        case termTypes.ORDERBY:
            var sequence = this.evaluate(term[1][0]);
            var fields = [];
            
            for(var i=0; i<term[1].length; i++) {
                fields.push(term[1][i]);
            }
            return sequence.orderBy(fields, options, this);
        case termTypes.DISTINCT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.distinct();
        case termTypes.COUNT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0]);
            this.frames.pop();

            if (Array.isArray(sequence)) {
                return sequence.length;
            }
            else {
                return sequence.count();
            }
        case termTypes.IS_EMPTY:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.isEmpty();
        case termTypes.UNION:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var other = this.evaluate(term[1][1])
            this.frames.pop();

            return sequence.concat(other);
        case termTypes.NTH:
            var sequence = this.evaluate(term[1][0])
            var index = this.evaluate(term[1][1])
            return sequence.nth(index, this);
        case termTypes.INNER_JOIN:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var otherSequence = this.evaluate(term[1][1])
            this.frames.pop();

            return sequence.join('inner', otherSequence, term[1][2], this);
        case termTypes.OUTER_JOIN:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var otherSequence = this.evaluate(term[1][1])
            this.frames.pop();

            return sequence.join('outer', otherSequence, term[1][2], this);
        case termTypes.EQ_JOIN:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(2);
            var rightTable = this.evaluate(term[1][2])
            this.frames.pop();

            return sequence.eqJoin(term[1][1], rightTable, options, this);
        case termTypes.ZIP:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.zip(this);
        case termTypes.INSERT_AT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();
            
            this.frames.push(1);
            var position = this.evaluate(term[1][1])
            if (position > sequence.sequence.length) {
                throw new Error.ReqlRuntimeError("Index `"+position+"` out of bounds for array of size: `"+sequence.sequence.length+"`", this.frames)
            }
            this.frames.pop();

            this.frames.push(2);
            var value = this.evaluate(term[1][2])
            this.frames.pop();

            return sequence.insertAt(position, value);
        case termTypes.DELETE_AT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var start = this.evaluate(term[1][1])
            this.frames.pop();

            var end;
            if (term[1].length > 1) {
                this.frames.push(2);
                end = this.evaluate(term[1][2])
                this.frames.pop();
            }
          
            return sequence.deleteAt(start, end, this);
        case termTypes.CHANGE_AT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();
            
            this.frames.push(1);
            var position = this.evaluate(term[1][1])
            if (position > sequence.sequence.length) {
                throw new Error.ReqlRuntimeError("Index `"+position+"` out of bounds for array of size: `"+sequence.sequence.length+"`", this.frames)
            }
            this.frames.pop();

            this.frames.push(2);
            var value = this.evaluate(term[1][2])
            this.frames.pop();

            return sequence.changeAt(position, value);

        case termTypes.SPLICE_AT:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();
            
            this.frames.push(1);
            var position = this.evaluate(term[1][1])
            if (position > sequence.sequence.length) {
                throw new Error.ReqlRuntimeError("Index `"+position+"` out of bounds for array of size: `"+sequence.sequence.length+"`", this.frames)
            }
            this.frames.pop();

            this.frames.push(2);
            var other = this.evaluate(term[1][2])
            this.frames.pop();

            return sequence.spliceAt(position, other);
        case termTypes.COERCE_TO:
            this.frames.push(0);
            var value = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(1);
            var newType = this.evaluate(term[1][1]);
            newType = newType.toUpperCase();
            this.frames.pop();

            var currentType = helper.typeOf(value);
            
            if (newType === "NUMBER") {
                return parseFloat(value);
            }
            else if (newType === "STRING") {
                return JSON.stringify(value);
            }
            else if (newType === "ARRAY") {
                if (typeof value.toSequence === "function") {
                    return value.toSequence();
                }
                else if (helper.isPlainObject(value)) {
                    var result = new Sequence();
                    var keys = Object.keys(value);
                    for(var i=0; i<keys.length; i++) {
                        var pair = new Sequence();
                        pair.push(keys[i]);
                        pair.push(value[keys[i]]);
                        result.push(pair);
                    }
                    return result;
                }
                else {
                    throw new Error.ReqlRuntimeError("Cannot coerce "+currentType+" to ARRAy", this.frames)
                }
            }
            else {
                throw new Error.ReqlRuntimeError("Not yet implemented")
            }
        case termTypes.TYPEOF:
            //TODO
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.UPDATE:
            this.frames.push(0);
            var selection = this.evaluate(term[1][0])
            this.frames.pop();

            //TODO Check selection type

            // We do not evaluate term[1][1] because there need to evaluate per document to update
            return selection.update(term[1][1], options, this)
        case termTypes.DELETE:
            //TODO Check selection type
            this.frames.push(0);
            var selection = this.evaluate(term[1][0])
            this.frames.pop();

            return selection.delete()
        case termTypes.REPLACE:
            this.frames.push(0);
            var selection = this.evaluate(term[1][0])
            this.frames.pop();

            //TODO Check selection type
            return selection.replace(term[1][1], options, this);
        case termTypes.INSERT:
            this.frames.push(0);
            var table = this.evaluate(term[1][0])
            this.frames.pop();

            this.frames.push(0);
            var docs = this.evaluate(term[1][1])
            this.frames.pop();

            return table.insert(docs, options)
        case termTypes.DB_CREATE:
            this.frames.push(0);
            var dbName = this.evaluate(term[1][0]);
            this.frames.pop();

            helper.assertType(dbName, 'STRING', this);
            helper.assertNoSpecialChar(dbName, 'Database', this);

            if (this.server.databases[dbName] != null) {
                throw new Error.ReqlRuntimeError("Database `"+dbName+"` already exists", this.frames)
            }
            this.server.databases[dbName] = new Database(arg)
            return {created: 1}
        case termTypes.DB_DROP:
            this.frames.push(0)
            var dbName = this.evaluate(term[1][0]);
            this.frames.pop();

            helper.assertType(dbName, 'STRING', this);
            helper.assertNoSpecialChar(dbName, 'Database', this);

            if (this.server.databases[dbName] == null) {
                throw new Error.ReqlRuntimeError("Database `"+dbName+"` does not exist", this.frames)
            }
            delete this.server.databases[dbName];
            return {dropped: 1}
        case termTypes.DB_LIST:
            return Object.keys(this.server.databases)
        case termTypes.TABLE_CREATE:
            var db, tableName;
            if (term[1].length === 1) {
                db = this.server.databases['test']
                this.frames.push(0);
                tableName = this.evaluate(term[1][0])
                this.frames.pop();
            }
            else if (term[1].length === 2) {
                this.frames.push(0);
                db = this.evaluate(term[1][0])
                this.frames.pop();
                this.frames.push(1);
                tableName = this.evaluate(term[1][1])
                this.frames.pop();
            }
            helper.assertType(tableName, 'STRING', this);
            helper.assertNoSpecialChar(tableName, 'Table', this);

            if (db.tables[tableName] != null) {
                throw new Error.ReqlRuntimeError("Table `"+tableName+"` already exists", this.frames)
            }
            db.tables[tableName] = new Table(tableName, db.name, options);
            return {created: 1}
        case termTypes.TABLE_DROP:
            var db, tableName;
            if (term[1].length === 1) {
                db = this.server.databases['test']
                this.frames.push(0);
                tableName = this.evaluate(term[1][0])
                this.frames.pop();
            }
            else if (term[1].length === 2) {
                this.frames.push(0);
                db = this.evaluate(term[1][0])
                this.frames.pop();

                this.frames.push(0);
                tableName = this.evaluate(term[1][1])
                this.frames.pop();
            }
            helper.assertType(tableName, 'STRING', this);
            helper.assertNoSpecialChar(tableName, 'Table', this);

            if (db.tables[tableName] == null) {
                throw new Error.ReqlRuntimeError("Table `"+arg+"` does not exist", this.frame)
            }
            delete db.tables[tableName];
            return {dropped: 1}
        case termTypes.TABLE_LIST:
            this.frames.push(0);
            var db = this.evaluate(term[1][0]);
            this.frames.pop();

            return Object.keys(db.tables)
        case termTypes.SYNC:
            // TODO Give a special meaning to sync?
            return {synced: 1}
        case termTypes.INDEX_CREATE:
            //var table = args[0];
            this.frames.push(0);
            var table = this.evaluate(term[1][0]);
            this.frames.pop();
            this.frames.push(1);
            var name = this.evaluate(term[1][1]); 
            this.frames.pop();
            var fn = term[1][2]; // DO NOT EVALUATE
            try {
                //TODO Factor me, I have nothing to do here
                if (fn === undefined) {
                    table.indexCreate(name, options);
                }
                else if (fn === undefined) {
                    table.indexCreate(name, options);
                }
                else {
                    table.indexCreate(name, fn, options);
                }
                return {created: 1}
            }
            catch(err) {
                throw new Error.ReqlRuntimeError(err.message, this.frames)
            }
        case termTypes.INDEX_DROP:
            this.frames.push(0);
            var table = this.evaluate(term[1][0]);
            this.frames.pop();
            this.frames.push(1);
            var index = this.evaluate(term[1][1]);
            this.frames.pop();
            try {
                return table.indexDrop(index);
            }
            catch(err) {
                throw new Error.ReqlRuntimeError(err.message, this.frames)
            }
        case termTypes.INDEX_LIST:
            this.frames.push(0);
            var table = this.evaluate(term[1][0]);
            this.frames.pop();
            return Object.keys(table.indexes);
        case termTypes.INDEX_STATUS:
            this.frames.push(0);
            var table = this.evaluate(term[1][0]);
            this.frames.pop();

            var indexes = [];
            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                indexes.push(this.evaluate(term[1][i]));
                this.frames.pop();
            }

            try {
                return table.indexWait.apply(table, indexes);
            }
            catch(err) {
                throw new Error.ReqlRuntimeError(err.message, this.frames)
            }
        case termTypes.INDEX_WAIT:
            this.frames.push(0);
            var table = this.evaluate(term[1][0]);
            this.frames.pop();

            var indexes = [];
            for(var i=1; i<term[1].length; i++) {
                this.frames.push(i);
                indexes.push(this.evaluate(term[1][i]));
                this.frames.pop();
            }

            try {
                return table.indexWait.apply(table, indexes);
            }
            catch(err) {
                throw new Error.ReqlRuntimeError(err.message, this.frames)
            }

        case termTypes.FUNCALL:
            // FUNCALL, FN [ AR[], BODY]
            //  0       1  [ 0 [ ...], 
            var fn = term[1][0];
            var argsFn = fn[1][0][1];
            for(var i=0; i<argsFn.length; i++) {
                this.frames.push(i+1);
                this.context[argsFn[i]] = this.evaluate(term[1][i+1]);
                this.frames.pop();
            }
            var result = this.evaluate(term[1][0]);

            for(var i=0; i<argsFn.length; i++) {
                delete this.context[argsFn[i]];
            }
            return result;
        case termTypes.BRANCH:
            this.frames.push(0);
            var condition = this.evaluate(term[1][0]);
            this.frames.pop();

            if (condition === false || condition === null) {
                this.frames.push(2);
                return this.evaluate(term[1][2]);
                this.frames.pop();
            }
            else {
                this.frames.push(1);
                return this.evaluate(term[1][1]);
                this.frames.pop();
            }
        case termTypes.ANY:
            var bool;
            for(var i=0; i<term[1].length; i++) {
                this.frames.push(i);
                bool = this.evaluate(term[1][i]);
                this.frames.pop();
                if (bool !== false && bool !== null) {
                    return true;
                }
            }
            return false;
        case termTypes.ALL:
            for(var i=0; i<term[1].length; i++) {
                this.frames.push(i);
                bool = this.evaluate(term[1][i]);
                this.frames.pop();
                if (bool === false || bool === null) {
                    return false
                }
            }
            return true;
        case termTypes.FOREACH:
            //TODO
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.FUNC: // 69
            var fnArgs = term[1][0];
            var body = term[1][1];
            this.frames.push(1);
            var result = this.evaluate(body);
            this.frames.push(0);
            return result;
        case termTypes.ASC:
            // This should not be evaluated, orderBy will handle it
            throw new Error.ReqlRuntimeError("Local server is buggy - not reachable code")
        case termTypes.DESC:
            // This should not be evaluated, orderBy will handle it
            throw new Error.ReqlRuntimeError("Local server is buggy - not reachable code")
        case termTypes.INFO:
            this.frames.push(0);
            var element = this.evaluate(term[1][0]);
            this.frames.pop();

            if (element instanceof Table) {
                return {
                    primary_key: element.options.primary_key
                }
            }
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.MATCH:
            //TODO
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.UPCASE:
            this.frames.push(0);
            var str = this.evaluate(term[1][0])
            this.frames.pop();

            return str.toUpperCase();
        case termTypes.DOWNCASE:
            this.frames.push(0);
            var str = this.evaluate(term[1][0])
            this.frames.pop();

            return str.toLowerCase();

        case termTypes.SAMPLE:
            var sequence = this.evaluate(term[1][0])
            var sample = this.evaluate(term[1][1])
            return sequence.sample(sample);
        case termTypes.DEFAULT:
            var value;
            try {
                this.frames.push(0);
                value = this.evaluate(term[1][0])
                this.frames.pop();
            }
            catch(err) {
                // Pop the frames 0
                this.frames.pop();

                if (err.message.match(/^No attribute `/)) {
                    this.frames.push(1);
                    value = this.evaluate(term[1][1])
                    this.frames.pop();
                }
                else {
                    throw err;
                }
            }
            return value;
        case termTypes.JSON:
            this.frames.push(0);
            var str = this.evaluate(term[1][0])
            this.frames.pop();
            try {
                var value = JSON.parse(str);
                return helper.revertDatum(value);
            }
            catch(err) {
                throw new Error.ReqlRuntimeError("Failed to parse \""+str+"\" as JSON", this.frames)
            }
        case termTypes.ISO8601: // 99
            this.frames.push(0);
            var date = this.evaluate(term[1][0]);
            this.frames.pop();

            timezone = helper.getTimezone(date, options);
            return {
                $reql_type$: "TIME",
                epoch_time: new Date(date).getTime()/1000,
                timezone: timezone
            }
        case termTypes.TO_ISO8601: // 99
            this.frames.push(0);
            var date = this.evaluate(term[1][0]);
            this.frames.pop();

            return helper.dateToString(date);
        case termTypes.EPOCH_TIME:
            this.frames.push(0);
            var epochTime = this.evaluate(term[1][0]);
            this.frames.pop();
            return result = {
                $reql_type$: "TIME",
                epoch_time: epochTime,
                timezone: "+00:00"
            }
        case termTypes.TO_EPOCH_TIME:
            this.frames.push(0);
            var date = this.evaluate(term[1][0]);
            this.frames.pop();
            return date.epoch_time;
        case termTypes.NOW: // 103
            return {
                $reql_type$: "TIME",
                epoch_time: Date.now()/1000,
                timezone: "+00:00"
            }
        case termTypes.IN_TIMEZONE:
            this.frames.push(0);
            var date = this.evaluate(term[1][0]);
            this.frames.pop();
            var timezone = helper.convertTimezone(this.evaluate(term[1][1]));
            return {
                $reql_type$: "TIME",
                epoch_time: date.epoch_time,
                timezone: timezone
            }
        case termTypes.DURING:
            this.frames.push(0);
            var date = new Date(helper.dateToString(this.evaluate(term[1][0])));
            this.frames.pop();
            this.frames.push(0);
            var left = new Date(helper.dateToString(this.evaluate(term[1][1])));
            this.frames.pop();
            this.frames.push(0);
            var right = new Date(helper.dateToString(this.evaluate(term[1][2])));
            this.frames.pop();

            var result = true;
            if (options.left_bound === "closed") {
                result = result && (left <= date)
            }
            else {
                result = result && (left < date)
            }
            if (options.right_bound === "closed") {
                result = result && (date <= right)
            }
            else {
                result = result && (date < right)
            }
            return result;
        case termTypes.DATE:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();
            var dateStr = helper.dateToString(date);
            dateStr = dateStr.replace(/\d{2}:\d{2}:\d{2}\.{0,1}\d*/, '00:00:00')
            return {
                $reql_type$: "TIME",
                epoch_time: new Date(dateStr).getTime()/1000,
                timezone: date.timezone
            }
        case termTypes.TIME_OF_DAY:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            var startDay = dateStr.replace(/\d{2}:\d{2}:\d{2}\.{0,1}\d*/, '00:00:00')
            return new Date(dateStr).getTime() - new Date(startDay).getTime()
        case termTypes.TIMEZONE:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            return date.timezone;
        case termTypes.YEAR:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return parseInt(dateStr.match(/(\d{4})/)[1], 10)
        case termTypes.MONTH:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return helper.monthToInt(dateStr.match(/[^\s]* ([^\s]*)/)[1]);
        case termTypes.DAY:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return parseInt(dateStr.match(/(\d{2})/)[1], 10);
        case termTypes.DAY_OF_WEEK:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return helper.dayToInt(dateStr.match(/(^[^\s]{3})/)[1]);
        case termTypes.DAY_OF_YEAR:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            var year = parseInt(dateStr.match(/(\d{4})/)[1], 10);
            var elapsedTime = new Date(dateStr) - new Date(year, 0, 1);
            return Math.floor(elapsedTime/(24*60*60*1000));
        case termTypes.HOURS:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return parseInt(dateStr.match(/.* .* .* (\d{2})/)[1], 10)
        case termTypes.MINUTES:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return parseInt(dateStr.match(/.* .* .* \d{2}:(\d{2})/)[1], 10)
        case termTypes.SECONDS:
            this.frames.push(0);
            var date = this.evaluate(term[1][0])
            this.frames.pop();

            var dateStr = helper.dateToString(date);
            return parseFloat(dateStr.match(/.* .* .* \d{2}:\d{2}:(\d{2}\.{0,1}\d*)/)[1], 10)
        case termTypes.TIME: // 136
            //TODO Here and in other places, check that the date is valid
            //TODO Handle timezone... Nooooooo
            this.frames.push(0);
            var year = this.evaluate(term[1][0])
            this.frames.pop();
            this.frames.push(1);
            var month = this.evaluate(term[1][1])
            this.frames.pop();
            this.frames.push(2);
            var day = this.evaluate(term[1][2])
            this.frames.pop();

            var hours, minutes, seconds, milliseconds, timezone;
            if (term[1].length === 4) {
                hours = 0;
                minutes = 0;
                seconds = 0;
                milliseconds = 0;
                timezone = helper.convertTimezone(this.evaluate(term[1][3]));
            }
            else if (term[1].length === 7) {
                this.frames.push(3);
                hours = this.evaluate(term[1][3])
                this.frames.pop();
                this.frames.push(4);
                minutes = this.evaluate(term[1][4])
                this.frames.pop();
                this.frames.push(5);
                seconds = this.evaluate(term[1][5])
                this.frames.pop();
                milliseconds = seconds - Math.floor(seconds);
                seconds = Math.floor(seconds);
                this.frames.push(6);
                timezone = helper.convertTimezone(this.evaluate(term[1][6]));
                this.frames.pop();
            }
            return {
                $reql_type$: "TIME",
                epoch_time: new Date(year, month, day, hours, minutes, seconds, milliseconds).getTime()/1000,
                timezone: timezone
            }
        case termTypes.MONDAY:
            return 1;
        case termTypes.TUESDAY:
            return 2;
        case termTypes.WEDNESDAY:
            return 3;
        case termTypes.THURSDAY:
            return 4;
        case termTypes.FRIDAY:
            return 5;
        case termTypes.SATURDAY:
            return 6;
        case termTypes.SUNDAY:
            return 7;
        case termTypes.JANUARY:
            return 1;
        case termTypes.FEBRUARY:
            return 2;
        case termTypes.MARCH:
            return 3;
        case termTypes.APRIL:
            return 4;
        case termTypes.MAY:
            return 5;
        case termTypes.JUNE:
            return 6;
        case termTypes.JULY:
            return 7;
        case termTypes.AUGUST:
            return 8;
        case termTypes.SEPTEMBER:
            return 9;
        case termTypes.OCTOBER:
            return 10;
        case termTypes.NOVEMBER:
            return 11;
        case termTypes.DECEMBER:
            return 12;
        case termTypes.LITERAL:
            throw new Error.ReqlRuntimeError("The server is buggy, ")
        case termTypes.GROUP:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            return sequence.group(term[1][1], this);
        case termTypes.SUM:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            var field;
            if (term[1].length > 1) {
                this.frames.push(1);
                field = this.evaluate(term[1][1])
                this.frames.pop();
            }

            return sequence.sum(field, this);
        case termTypes.AVG:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            var field;
            if (term[1].length > 1) {
                this.frames.push(1);
                field = this.evaluate(term[1][1])
                this.frames.pop();
            }

            return sequence.avg(field, this);
        case termTypes.MIN:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            var field;
            if (term[1].length > 1) {
                this.frames.push(1);
                field = this.evaluate(term[1][1])
                this.frames.pop();
            }

            return sequence.min(field, this);
        case termTypes.MAX:
            this.frames.push(0);
            var sequence = this.evaluate(term[1][0])
            this.frames.pop();

            var field;
            if (term[1].length > 1) {
                this.frames.push(1);
                field = this.evaluate(term[1][1])
                this.frames.pop();
            }

            return sequence.max(field, this);
        case termTypes.SPLIT:
            this.frames.push(0);
            var str = this.evaluate(term[1][0])
            this.frames.pop();


            var separator;
            if (term[1].length > 1) {
                this.frames.push(1);
                separator = this.evaluate(term[1][1])
                this.frames.pop();
            }
            else {
                separator = '';
            }

            var limit;
            if (term[1].length > 2) {
                this.frames.push(2);
                var limit = this.evaluate(term[1][2])
                this.frames.pop();
            }

            var result = str.split(separator);
            if (limit !== undefined) {
                if (limit < result.length) {
                    result = result.slice(0, limit).concat(result.slice(limit).join(''))
                }
            }
            return result;
        case termTypes.UNGROUP:
            this.frames.push(0);
            var groups = this.evaluate(term[1][0])
            this.frames.pop();

            return groups.ungroup();
        case termTypes.RANDOM:
            if ((!Array.isArray(term)) || (term[1].length === 0)) {
                return Math.random();
            }
            else {
                if (term[1].length === 1) {
                    var min = 0;
                    this.frames.push(1);
                    var max = this.evaluate(term[1][0]);
                    this.frames.pop();

                    helper.assertType(max, "NUMBER", this);
                    if (options.float !== true) {
                        try {
                            helper.assertType(max, "INT", this);
                        }
                        catch(err) {
                            throw new Error.ReqlRuntimeError("Upper bound ("+max+") could not be safely converted to an integer");
                        }
                    }
                }
                else if (term[1].length === 2) {
                    this.frames.push(1);
                    var min = this.evaluate(term[1][0]);
                    this.frames.pop();

                    this.frames.push(2);
                    var max = this.evaluate(term[1][1]);
                    this.frames.pop();

                    helper.assertType(min, "NUMBER", this);
                    helper.assertType(max, "NUMBER", this);
                    if (options.float !== true) {
                        try {
                            helper.assertType(min, "INT", this);
                        }
                        catch(err) {
                            throw new Error.ReqlRuntimeError("Lower bound ("+min+") could not be safely converted to an integer");
                        }

                        try {
                            helper.assertType(max, "INT", this);
                        }
                        catch(err) {
                            throw new Error.ReqlRuntimeError("Upper bound ("+max+") could not be safely converted to an integer");
                        }

                    }
                }

                if (min > max) {
                    if (options.float !== true) {
                        var temp = max;
                        max = min;
                        min = temp;
                    }
                    else {
                        throw new Error.ReqlRuntimeError("Lower bound ("+min+") is not less than upper bound ("+max+")")
                    }
                }

                return min+Math.random()*(max-min);
            }
        case termTypes.CHANGES:
            //TODO
            throw new Error.ReqlRuntimeError("Not yet implemented")
        case termTypes.ARGS:
            //TODO
            throw new Error.ReqlRuntimeError("Not yet implemented")
        default:
            console.log("TERMTYPE", termType)
            console.log(term);
            throw new Error.ReqlRuntimeError("Unkown term", this.frames)
    }
}

module.exports = Query;
