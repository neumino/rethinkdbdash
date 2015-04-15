var helper = require(__dirname+"/helper.js");

function Document(doc, table) {
    this.doc = doc;
    this.table = table;
}

Document.prototype.typeOf = function() {
    return "SELECTION<OBJECT>";
}
Document.prototype.update = function(newValue, options, query) {
    options = options || {};

    var result = helper.writeResult();
    var primaryKey = this.table.options.primaryKey;

    // Update context
    if (newValue[0] === 69) { // newValue is a FUNC term
        var varId = newValue[1][0][1][0]; // 0 to select the array, 1 to select the first element
        query.context[varId] = this;
    }
    var updateValue = query.evaluate(newValue)
    // Clean context
    if (newValue[0] === 69) {
        delete query.context[varId]
    }


    // TODO Refactor with replace
    if ((updateValue[primaryKey] !== undefined) 
        && (this.doc[primaryKey] !== updateValue[primaryKey])) {
        result.errors++;
        if(result.first_error === undefined) {
            result.first_error = "Primary key `id` cannot be changed(`"+
                JSON.stringify(updateValue, null, 2)+"` -> `"+
                JSON.stringify(this.doc, null, 2)+"`)"
        }
    }
    else {
        if (options.return_vals === true) {
            result.old_val = helper.deepCopy(this.doc); 
        }
        var changed = helper._merge(this.doc, updateValue)        

        if (options.return_vals === true) {
            result.new_val = helper.deepCopy(this.doc); 
        }

        if (changed === true) {
            result.replaced++;
        }
        else {
            result.unchagned++;
        }
    }
    return result;
}

Document.prototype.replace = function(newValue, options, query) {
    options = options || {};

    var result = helper.writeResult();
    var primaryKey = this.table.options.primaryKey;

    // Update context
    if (newValue[0] === 69) { // newValue is a FUNC term
        var varId = newValue[1][0][1][0]; // 0 to select the array, 1 to select the first element
        query.context[varId] = this;
    }
    var replaceValue = query.evaluate(newValue)
    // Clean context
    if (newValue[0] === 69) {
        delete query.context[varId]
    }



    if ((replaceValue[primaryKey] !== undefined) 
        && (this.doc[primaryKey] !== replaceValue[primaryKey])) {
        result.errors++;
        if(result.first_error === undefined) {
            result.first_error = "Primary key `id` cannot be changed(`"+
                JSON.stringify(replaceValue, null, 2)+"` -> `"+
                JSON.stringify(this.doc, null, 2)+"`)"
        }
    }
    else {
        if (options.return_vals === true) {
            result.old_val = helper.deepCopy(this.doc); 
        }
        var changed = helper._replace(this.doc, replaceValue)        

        if (options.return_vals === true) {
            result.new_val = helper.deepCopy(this.doc); 
        }

        if (changed === true) {
            result.replaced++;
        }
        else {
            result.unchanged++;
        }
    }
    return result;
}

Document.prototype.delete = function() {
    var result = helper.writeResult();
    var primaryKey = this.table.options.primaryKey;
    
    return this.table._delete(this.doc);

}

Document.prototype.toDatum = function() {
    var result = {};
    for(var key in this.doc) {
        if (typeof this.doc[key].toDatum === "function") {
            result[key] = this.doc[key].toDatum();
        }
        else {
            result[key] = helper.toDatum(this.doc[key]);
        }
    }
    return result;
}

Document.prototype.getField = function(field) {
    return this.doc[field];
}


module.exports = Document;
