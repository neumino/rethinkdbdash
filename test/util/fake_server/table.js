var Selection = require(__dirname+"/selection.js");
var Sequence = require(__dirname+"/sequence.js");
var Document = require(__dirname+"/document.js");
var helper = require(__dirname+"/helper.js");
var util = require('util');
//var Error = require(__dirname+"/error.js");

function Table(name, db, options) {
    this.name = name;
    this.db = db;
    this.options = options || {};
    this.options.primaryKey = this.options.primary_key || "id";
    this.documents = {};
    this.indexes = {}; // String -> FUNC terms
    this.indexes[this.options.primaryKey] = {
        //TODO Make me use TERMS
        //fn: function(doc) { return doc[name] },
        // 69=FUNC, 2=MAKE_ARRAY, 31=GET_FIELD, 10=VAR, 1=ARGUMENT_INDEX
        //TODO Use a uuid to avoid collision
        fn: [ 69, [ [ 2, [ 1 ] ], [ 31, [ [ 10, [ 1 ] ], this.options.primaryKey ] ] ] ],
        options: {}
    }

}
// Import methods from Selection
var keys = Object.keys(Selection.prototype);
for(var i=0; i<keys.length; i++) {
    (function(key) {
        Table.prototype[key] = function() {
            var docs = [];
            for(var internalPk in this.documents) {
                docs.push(this.documents[internalPk]);
            }
            var selection = new Selection(docs, this);
            return selection[key].apply(selection, arguments);
        }
    })(keys[i]);
}

Table.prototype.typeOf = function() {
    return "TABLE";
}

Table.prototype.get = function(primaryKeyValue) {
    var pk = this.options.primaryKey;
    var internalPk = helper.makeInternalPk(primaryKeyValue);
    if (this.documents[internalPk] === undefined) {
        return null;
    }
    else {
        return this.documents[internalPk];
    }
}

Table.prototype._delete = function(doc) {
    var pk = this.options.primaryKey;
    var internalPk = helper.makeInternalPk(doc[pk]);
    if (this.documents[internalPk] === undefined) {
        return {deleted: 0}
    }
    else {
        delete this.documents[internalPk]
        return {deleted: 1}
    }
}

Table.prototype.insert = function(docs, options) {
    options = options || {};

    var result = helper.writeResult();
    var generatedKeys = [];
    var newUuid;
    if (docs instanceof Sequence) {
        if (options.return_vals === true) {
            //TODO Throw the appropriate error
        }
        for(var i=0; i<docs.length; i++) {
            try {
                this._singleInsert(docs._get(i), options, result);
            }
            catch(err) {
                result.errors++;
                if (result.first_error == null) {
                    result.first_error = err.message;
                }
            }
        }
    }
    else {
        try {
            this._singleInsert(docs, options, result);

            // We keep it here since `returnVals` works only for point write
            if (options.return_vals === true) {
                result.old_val = null;
                result.new_val = docs;
            }
        }
        catch(err) {
            result.errors++;
            if (result.first_error == null) {
                result.first_error = err.message;
            }
        }
    }
    if (generatedKeys.length > 0) {
        result.generated_keys = generatedKeys;
    }
    return result;
}
Table.prototype._singleInsert = function(doc, options, result) {
    if (!(doc instanceof Document)) doc = new Document(doc, this);

    var pk = this.options.primaryKey;

    if (doc.doc[pk] === undefined) {
        // Keep generating a uuid until one is free...
        var uuid;
        while (true) {
            uuid = helper.uuid();
            if (this.documents[uuid] === undefined) {
                doc.doc[pk] = uuid;
                this.documents[helper.makeInternalPk(uuid)] = doc;
                if (result.generated_keys === undefined) {
                    result.generated_keys = [];
                }
                result.generated_keys.push(uuid);
                result.inserted++;
                break;
            }
        }
    }
    else {
        // Can throw, `insert` will catch it
        var internalPk = helper.makeInternalPk(doc.doc[pk]);

        if (this.documents[internalPk] === undefined) {
            this.documents[internalPk] = doc;
            result.inserted++;
        }
        else {
            if (options.upsert === true) {
                this.documents[internalPk] = doc;
                result.replaced++;
            }
            else {
                //TODO Better message
                throw new Error("Pk used")
            }
        }
    }
}
Table.prototype.getAll = function(args, options, query) {
    //TODO Implement frames
    var selection = new Selection();

    // If no secondary index is provided, we are dealing with the primary key
    if ((helper.isPlainObject(options) === false) || (typeof options.index !== 'string')) {
        options.index = this.options.primaryKey; 
    };

        
    var keys = Object.keys(this.documents);
    var valueIndex, valuesIndex;

    //TODO Throw if the index does not exist
    var varId = this.indexes[options.index].fn[1][0][1][0]; //TODO Refactor

    for(var i=0; i<keys.length; i++) { // Iterate on all the documents of the tablepay attention to what browserify does here
        query.context[varId] = this.documents[keys[i]].toDatum(); // TODO toDatum??

        if (this.indexes[options.index].options.multi === true) {
            valuesIndex = query.evaluate(this.indexes[options.index].fn, query);

            for(var j=0; j<args.length; j++) {
                for(var k=0; k<valuesIndex.length; k++) {
                    valueIndex = valuesIndex[k];
                    if (valueIndex === args[j]) {
                        selection.push(this.documents[keys[i]]);
                        break;
                    }
                }
            }
        }
        else {
            valueIndex = query.evaluate(this.indexes[options.index].fn, query);

            for(var j=0; j<args.length; j++) {
                if (valueIndex === args[j]) {
                    selection.push(this.documents[keys[i]]);
                    break;
                }
            }
        }
        delete query.context[varId];
    }

    return selection;
}

Table.prototype.between = function(left, right, options, query) {
    //TODO Implement frames

    // TODO Mimick the server's by returning a table hack to enable chaining between and orderBy
    var selection = new Selection();

    // If no secondary index is provided, we are dealing with the primary key
    if ((helper.isPlainObject(options) === false) || (typeof options.index !== 'string')) {
        options.index = this.options.primaryKey; 
    };

    //TODO Enforce valid options
    if (options.left_bound === undefined) {
        options.left_bound = "closed";
    }
    if (options.right_bound === undefined) {
        options.right_bound = "open";
    }

        
    var valueIndex, valuesIndex, keep;

    var keys = Object.keys(this.documents);
    for(var i=0; i<keys.length; i++) { // Iterate on all the documents of the tablepay attention to what browserify does here

        var varId = this.indexes[options.index].fn[1][0][1][0]; //TODO Refactor
        query.context[varId] = this.documents[keys[i]].toDatum();

        if (this.indexes[options.index].options.multi === true) {
            valuesIndex = query.evaluate(this.indexes[options.index].fn, query);

            for(var k=0; k<valuesIndex.length; k++) {
                valueIndex = valuesIndex[k];

                //TODO Refactor
                keep = true;
                if (options.left_bound === "closed") {
                    if (helper.lt(valueIndex, left)) {
                        keep = false;
                    }
                }
                else {
                    if (helper.le(valueIndex, left)) {
                        keep = false;
                    }
                }

                if (options.right_bound === "closed") {
                    if (helper.gt(valueIndex, right)) {
                        keep = false;
                    }
                }
                else {
                    if (helper.ge(valueIndex, right)) {
                        keep = false;
                    }
                }

                if (keep === true) {
                    selection.push(this.documents[keys[i]]);
                }
            }
        }
        else {
            valueIndex = query.evaluate(this.indexes[options.index].fn, query);

            keep = true;
            if (options.left_bound === "closed") {
                if (helper.lt(valueIndex, left)) {
                    keep = false;
                }
            }
            else {
                if (helper.le(valueIndex, left)) {
                    keep = false;
                }
            }

            if (options.right_bound === "closed") {
                if (helper.gt(valueIndex, right)) {
                    keep = false;
                }
            }
            else {
                if (helper.ge(valueIndex, right)) {
                    keep = false;
                }
            }

            if (keep === true) {
                selection.push(this.documents[keys[i]]);
            }
        }
        delete query.context[varId];
    }
    
    return selection;
}



Table.prototype.indexCreate = function(name, fn, options) {
    if (this.indexes[name] != null) {
        throw new Error("Index `"+name+"` already exists on table `"+this.db+"."+this.table+"`")
    }

    // TODO Remove the first if statement. `options` are always passed (I think)
    if (arguments.length === 1) {
        this.indexes[name] = {
            //TODO Make me use TERMS
            //fn: function(doc) { return doc[name] },
            // 69=FUNC, 2=MAKE_ARRAY, 31=GET_FIELD, 10=VAR, 1=ARGUMENT_INDEX
            //TODO Use uuid for variable names?
            fn: [ 69, [ [ 2, [ name+1 ] ], [ 31, [ [ 10, [ name+1 ] ], name ] ] ] ],
            options: {}
        }
    }
    else if (arguments.length === 2) {
        if (helper.isPlainObject(fn)) {
            options = fn;
            //TODO Make me use TERMS
            //fn = function(doc) { return doc[name] }
            fn = [ 69, [ [ 2, [ name+1 ] ], [ 31, [ [ 10, [ name+1 ] ], name ] ] ] ];

        }
        else {
            options = {};
        }
        // TODO How to make sure that it does not collide with other varIds? Prefix with something?
        this.indexes[name] = {
            fn: fn,
            options: options
        }
    }
    else if (arguments.length === 3) {
        this.indexes[name] = {
            fn: fn,
            options: options
        }
    }
    else {
        throw new Error("Unexpected number of argument")
    }
}

Table.prototype.indexDrop = function(name) {
    if (this.indexes[name] == null) {
        throw new Error("Index `"+name+"` does not exist on table `"+this.db+"."+this.table+"`")
    }
    delete this.indexes[name];
    return {dropped: 1};
}

Table.prototype.indexWait = function() {
    var args = Array.prototype.slice(arguments);
    var result = [];

    if (args.length === 0) {
        var indexes = Object.keys(this.indexes);
        for(var i=0; i<indexes.length; i++) {
            if (indexes[i] == null) {
                throw new Error("Index `"+name+"` was not found on table `"+this.db+"."+this.table+"`")
            }
            result.push({
                index: indexes[i],
                ready: true
            });
        }
    }
    else {
        for(var i=0; i<self.indexes.length; i++) {
            result.push({
                index: indexes[i],
                ready: true
            });
        }

    }
    return result;
}


// Table can use an index
Table.prototype.orderBy = function(fields, options, query) {
    var self = this;

    var selection = new Selection();
    for(var internalKey in self.documents) {
        selection.push(self.documents[internalKey]);
    }
    //TODO Refactor with the while loop
    selection.selection.sort(function(left, right) {
        var index = 0;
        var field, leftValue, rightValue;

        var order = "ASC";
        var index;
        if (Array.isArray(options.index) || (typeof options.index === "string")) {
            if (Array.isArray(options.index)) {
                if (options.index[0] === 73) { // ASC
                    index = options.index[1][0];
                    order = "ASC";
                }
                else if (options.index[0] === 74) { // DESC
                    index = options.index[1][0];
                    order = "DESC";
                }
                else {
                    throw new Error("Non reachable code")
                }
            }
            else if (typeof options.index === "string") {
                index = options.index;
                order = "ASC";
            }

            var varId = self.indexes[index].fn[1][0][1][0]; // TODO Refactor
            query.context[varId] = left;
            leftValue = query.evaluate(self.indexes[index].fn, query);
            delete query.context[varId];

            query.context[varId] = right;
            rightValue = query.evaluate(self.indexes[index].fn, query);
            delete query.context[varId];

            if (helper.gt(leftValue, rightValue)) {
                if (order === "ASC") {
                    return 1;
                }
                else {
                    return -1;
                }
            }
            else if (helper.lt(leftValue, rightValue)) {
                if (order === "ASC") {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        }
        // else we let the other fields do the work

        order = "ASC";
        while(index <= fields.length) {
            field = fields[index];

            if (Array.isArray(field) && (field[0] === 73)) { // ASC
                field = field[1][0];
                order = "ASC";
            }
            else if (Array.isArray(field) && (field[0] === 74)) { // DESC
                field = field[1][0];
                order = "DESC";
            }
            else {
                order = "ASC";
            }

            if (Array.isArray(field) && (field[0] === 69)) { // newValue is a FUNC term
                var varId = field[1][0][1][0]; // 0 to select the array, 1 to select the first element
                query.context[varId] = left;
                leftValue = query.evaluate(field);
                delete query.context[varId];

                query.context[varId] = right;
                rightValue = query.evaluate(field);
                delete query.context[varId];
            }
            else {
                field = query.evaluate(field);

                //TODO Are we really doing that? Seriously?
                leftValue = (typeof left.getField === "function") ? left.getField(field) : left[field];
                rightValue = (typeof right.getField === "function") ? right.getField(field) : right[field];
            }

            if (helper.gt(leftValue, rightValue)) {
                if (order === "ASC") {
                    return 1;
                }
                else {
                    return -1;
                }
            }
            else if (helper.eq(leftValue, rightValue)) {
                index++;
            }
            else {
                if (order === "ASC") {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        }
        return 0;
    });
    return selection;
}



/* These methods are now imported via Selection
// Import methods from Sequence
var keys = Object.keys(Sequence.prototype);
for(var i=0; i<keys.length; i++) {
    (function(key) {
        Table.prototype[key] = function() {
            return Sequence.prototype[key].apply(this, arguments);
        }
    })(keys[i]);
}
*/


module.exports = Table;
