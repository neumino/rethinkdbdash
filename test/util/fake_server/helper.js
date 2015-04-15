var helper = {};
var Error = require(__dirname+"/error.js");
var util = require('util');

helper.isPlainObject = function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

helper.typeOf = function(value, query) {
    //TODO Properly handle circular references
    var Sequence = require(__dirname+"/sequence.js");

    if (typeof value === "number") {
        return "NUMBER";
    }
    else if (typeof value === "string") {
        return "STRING";
    }
    else if (typeof value === "boolean") {
        return "BOOL";
    }
    else if (value === null) {
        return "NULL";
    }
    else if (typeof value.typeOf === "function") {
        return value.typeOf();
    }
    else if (helper.isDate(value)) {
        return "PTYPE<TIME>";
    }
    else if (helper.isPlainObject(value)) {
        return "OBJECT";
    }
    throw new Error.ReqlRuntimeError("Server is buggy, unknown type", query.frames)

}
helper.assertType = function assertType(value, type, query) {
    var Sequence = require(__dirname+"/sequence.js");
    var typeValue;

    //TODO Add group?
    if (value instanceof Sequence) {
        typeValue = "ARRAY";
    }
    else if (value === null) {
        typeValue = "NULL"
    }
    else if (helper.isDate(value)) {
        typeValue = "PTYPE<TIME>";
    }
    else if (helper.isPlainObject(value)) {
        typeValue = "OBJECT";
    }
    else {
        typeValue = (typeof value).toUpperCase();
    }

    if (type === 'STRING') {
        if (typeof value !== 'string') {
            throw new Error.ReqlRuntimeError("Expected type STRING but found "+typeValue, query.frames)
        }
    }
    else if (type === 'NUMBER') {
        if (typeof value !== 'number') {
            throw new Error.ReqlRuntimeError("Expected type NUMBER but found "+typeValue, query.frames)
        }
    }
    else if (type === "TIME") {
        if (typeof value !== 'number') {
            throw new Error.ReqlRuntimeError("Expected type NUMBER but found "+typeValue, query.frames)
        }
    }
    else if (type === "ARRAY") {
        if (!(value instanceof Sequence)) {
            throw new Error.ReqlRuntimeError("Expected type ARRAY but found "+typeValue, query.frames)
        }
    }
    else if (type === "INT") {
        var floored = Math.floor(value);
        if (floored !== value) {
            throw new Error.ReqlRuntimeError("Number not an integer: "+value, query.frames)
        }
    }
}
helper.assertNoSpecialChar = function assertNoSpecialChar(value, type, query) {
    if (!value.match(/^[0-9a-zA-Z]+$/)) {
        throw new Error.ReqlRuntimeError(type+" name `"+value+"` invalid (Use A-Za-z0-9_ only) ", query.frames)
    }
}

helper.s4 = function s4() {
    return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
};

helper.uuid = function uuid() {
    return helper.s4()+helper.s4()+"-"+helper.s4()+"-"+helper.s4()+"-"+helper.s4()+"-"+helper.s4()+"-"+helper.s4()+helper.s4();
}

helper.writeResult = function writeResult() {
    return {
        deleted: 0,
        errors: 0,
        inserted: 0,
        replaced: 0,
        skipped: 0,
        unchanged: 0
    }
}

// Merging write result in place
helper.mergeWriteResult = function(left, right) {
    left.deleted += right.deleted;
    left.errors += right.errors;
    left.inserted += right.inserted;
    left.replaced += right.replaced;
    left.skipped += right.skipped;
    left.unchanged += right.unchanged;
    if (left.generated_keys !== undefined || right.generated_keys !== undefined) {
        if (Array.isArray(left.generated_keys) && Array.isArray(right.generated_keys)) {
            left.generated_keys = left.generated_keys.concat(right.generated_keys);
        }
        else if (Array.isArray(right.generated_keys)) {
            left.generated_keys = right.generated_keys;
        }
    }
    if ((left.first_error === undefined) && (right.first_error !== undefined)) {
        left.first_error = right.first_error;
    }
}

helper.merge = function(self, toMerge, query) {
    var varId;
    if (Array.isArray(toMerge) && (toMerge[0] === 69)) {
        varId = toMerge[1][0][1][0];
        query.context[varId] = helper.toDatum(self);
    }

    toMerge = query.evaluate(toMerge);

    if (varId !== undefined) {
        delete query.context[varId];
    }
    return helper.mergeDatum(self, toMerge);
}
helper.mergeDatum = function merge(self, obj) {
    //A non in place merge, used for the ReQL `merge` command
    var result = helper.deepCopy(self);
    for(var key in obj) {
        // Recursively merge only if both fields are objects, else we'll overwrite the field
        if (helper.isPlainObject(obj[key]) && helper.isPlainObject(result[key])) {
            result[key] = helper.mergeDatum(result[key], obj[key]);
        }
        else {
            result[key] = obj[key];
        }
    }
    return result;
}
helper._merge = function _merge(self, obj) {
    // Inplace merge (behave like the `update` command.
    // Return whether `self` has been changed
    var changed = false;
    for(var key in obj) {
        // Recursively merge only if both fields are objects, else we'll overwrite the field
        if (helper.isPlainObject(obj[key]) && helper.isPlainObject(self[key])) {
            changed = helper._merge.call(self[key], obj[key]) || changed;
        }
        else {
            if (Array.isArray(self[key])) {
                if (Array.isArray(obj[key])) {
                    if (self[key].length !== obj[key].length) {
                        changed = true;
                    }
                    else {
                        for(var i=0; i<self[key].length; i++) {
                            if ((helper.isPlainObject(self[key][i])) && (helper.isPlainObject(obj[key][i]))) {
                                changed = helper._merge(self[key][i], obj[key][i]) || changed;
                            }
                            else {
                                changed = true;
                                self[key][i] = helper.deepCopy(obj[key][i]);
                            }
                        }
                    }
                }
                else {
                    changed = true;
                }
            }
            else if (self[key] !== obj[key]) {
                changed = true;
            }
            self[key] = obj[key];
        }
    }
    return changed
}

helper._replace = function replace(self, obj) {
    // Inplace replace (behave like the `replace` command.
    // Return whether `self` has been changed
    var changed = false;
    for(var key in self) {
        if (obj[key] === undefined) {
            delete self[key];
            changed = true;
        }
    }
    for(var key in obj) {
        // Recursively merge only if both fields are objects, else we'll overwrite the field
        if (helper.isPlainObject(obj[key]) && helper.isPlainObject(self[key])) {
            changed = helper.replaceecall(self[key], obj[key]) || changed;
        }
        else {
            if (Array.isArray(self[key])) {
                if (Array.isArray(obj[key])) {
                    if (self[key].length !== obj[key].length) {
                        changed = true;
                    }
                    else {
                        for(var i=0; i<self[key].length; i++) {
                            //TODO If self[ley][i] is not an object, it will break
                            if ((helper.isPlainObject(self[key][i])) && (helper.isPlainObject(obj[key][i]))) {
                                changed = helper.replace(self[key][i], obj[key][i]) || changed;
                            }
                            else if (helper.isPlainObject(self[key][i])) {
                                changed = true;
                                self[key][i];
                            }
                        }
                    }
                }
                else {
                    changed = true;
                }
            }
            else if (self[key] !== obj[key]) {
                changed = true;
            }
            self[key] = obj[key];
        }
    }
    return changed
}

helper.makeInternalPk = function(value) {
    // Build the internal prinary key we use in the hash table
    if (typeof value === 'string') {
        return "string_"+value
    }
    else if (typeof value === 'number') {
        return "number_"+value
    }
    else if (typeof value === 'boolaen') {
        return "boolean_"+value
    }
    else if (helper.isPlainObject(value) && value.$reql_type$ === 'TIME') {
        helper.validDate();
        return "date_"+value.epoch_time+"_"+value.timezone;
    }
    else {
        var type = typeof value;
        throw new Error.ReqlRuntimeError("Primary keys must be either a number, bool, pseudotype or string (got type "+type+"):\n"+JSON.stringify(value, null, 2));
    }

}
helper.validDate = function(date) {
    // `date` should be an object with the field $reql_type$ mapping to "TIME"
    if (typeof date.epoch_time !== "number") {
        throw new Error.ReqlRuntimeError("RqlRuntimeError: Invalid time object constructed (no field `epoch_time`):\n"+JSON.stringify(date, null, 2))
    }
    else if (date.timezone.match(/^(?:Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$/) == null) {
        throw new Error.ReqlRuntimeError("RqlRuntimeError: Invalid time object constructed (no field `timezone`):\n"+JSON.stringify(date, null, 2))
    }
}
//TODO CamelCase the thing
helper.dateToString = function(date) {
    var timezone = date.timezone;
    
    // Extract data from the timezone
    var timezone_array = date.timezone.split(':');
    var sign = timezone_array[0][0]; // Keep the sign
    timezone_array[0] = timezone_array[0].slice(1); // Remove the sign

    // Save the timezone in minutes
    var timezone_int = (parseInt(timezone_array[0], 10)*60+parseInt(timezone_array[1], 10))*60;
    if (sign === '-') {
        timezone_int = -1*timezone_int;
    }

    // d = real date with user's timezone
    var d = new Date(date.epoch_time*1000);

    // Add the user local timezone
    timezone_int += d.getTimezoneOffset()*60;

    // d_shifted = date shifted with the difference between the two timezones
    // (user's one and the one in the ReQL object)
    var d_shifted = new Date((date.epoch_time+timezone_int)*1000);

    // If the timezone between the two dates is not the same,
    // it means that we changed time between (e.g because of daylight savings)
    if (d.getTimezoneOffset() !== d_shifted.getTimezoneOffset()) {
        // d_shifted_bis = date shifted with the timezone of d_shifted and not d
        var d_shifted_bis = new Date((date.epoch_time+timezone_int-(d.getTimezoneOffset()-d_shifted.getTimezoneOffset())*60)*1000);

        var raw_data_str;
        if (d_shifted.getTimezoneOffset() !== d_shifted_bis.getTimezoneOffset()) {
            // We moved the clock forward -- and therefore cannot generate the appropriate time with JS
            // Let's create the date outselves...
            var str_pieces = d_shifted_bis.toString().match(/([^ ]* )([^ ]* )([^ ]* )([^ ]* )(\d{2})(.*)/);
            var hours = parseInt(str_pieces[5], 10);
            hours++;
            if (hours.toString().length === 1) {
                hours = "0"+hours.toString()
            }
            else {
                hours = hours.toString()
            }
            // Note str_pieces[0] is the whole string
            raw_date_str = str_pieces[1]+" "+str_pieces[2]+" "+str_pieces[3]+" "+str_pieces[4]+" "+hours+str_pieces[6]
        }
        else {
            raw_date_str = d_shifted_bis.toString();
        }
    }
    else {
        raw_date_str = d_shifted.toString()
    }

    // Remove the timezone and replace it with the good one
    return raw_date_str.slice(0, raw_date_str.indexOf('GMT')+3)+timezone
}

helper.getHours = function(date) {
    //TODO
}

helper.getTimezone = function(date, options) {
    options = options || {};

    if (date.match(/Z$/)) {
        return "+00:00"
    }
    else {
        var regexResult = date.match(/[+-]{1}[0-9]{2}:[0-9]{2}$/);
        if ((Array.isArray(regexResult)) && (regexResult.length > 0)) {
            return regexResult[0]
        }
        else if (options.default_timezone !== undefined) {
            return options.default_timezone;
        }
        else {
            throw new Error.ReqlRuntimeError("ISO 8601 string has no time zone, and no default time zone was provided", frames)
        }
    }
}
helper.isDate = function(date) {
    return helper.isPlainObject(date) && (date.$reql_type$ === "TIME")
}

// Obviously not a "full" deep copy...
helper.deepCopy = function(value) {
    var result;
    if (helper.isPlainObject(value)) {
        result = {};
        for(var key in value) {
            result[key] = helper.deepCopy(value[key]);
        }
        return result;
    }
    else if (Array.isArray(value)) {
        result = [];
        for(var i=0; i<value.length; i++) {
            result.push(helper.deepCopy(value[i]));
        }
        return result;
    }
    else {
        return value;
    }
}
helper.convertTimezone = function(timezone) {
    if (timezone === "Z") {
        return "+00:00"
    }
    else if (timezone.indexOf(":") === -1) {
        return timezone.slice(0, 3)+":"+timezone.slice(3)
    }
    //TODO Validate timezone
    return timezone;
}

helper.monthToInt = function(month) {
    switch(month) {
        case "Jan":
            return 1
        case "Feb":
            return 2
        case "Mar":
            return 3
        case "Apr":
            return 4
        case "May":
            return 5
        case "Jun":
            return 6
        case "Jul":
            return 7
        case "Aug":
            return 8
        case "Sep":
            return 9
        case "Oct":
            return 10
        case "Nov":
            return 11
        case "Dec":
            return 12
        default:
            throw new Error("Non valid month")
    }
}

helper.dayToInt = function(day) {
    switch(day) {
        case "Mon":
            return 1
        case "Tue":
            return 2
        case "Wed":
            return 3
        case "Thu":
            return 4
        case "Fri":
            return 5
        case "Sat":
            return 6
        case "Sun":
            return 7
        default:
            throw new Error("Non valid day")
    }
}

helper.eq = function(left, right) {
    //TODO Sequence?
    if ((Array.isArray(left)) && (Array.isArray(right))) {
        if (left.length !== right.length) {
            return false;
        }
        for(var i=0; i<left.length; i++) {
            if (helper.eq(left[i], right[i]) === false) {
                return false;
            }
        }
        return true;
    }
    else if (helper.isPlainObject(left) && (helper.isPlainObject(right))) {
        var leftKeys = Object.keys(left);
        var rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }
        for(var i=0; i<leftKeys.length; i++) {
            if (helper.eq(left[leftKeys[i]], right[leftKeys[i]]) === false) {
                return false;
            }
        }
        // If the keys are not the same, we will eventually compare undefined with something
        // and we will return false, so we won't reach this part of the code
        return true;
    }
    else {
        return left === right;
    }
}

helper.lt = function(left, right) {
    // array < bool < null < number < object < string < time

    // Keep the require here to avoid issues with circular rerefences
    // TODO pay attention to what browserify does here
    var Sequence = require(__dirname+"/sequence.js");
    if (left instanceof Sequence) {
        if (right instanceof Sequence) {
            left = left.toDatum();
            right = right.toDatum();
            for(var i=0; i<left.length; i++) {
                if (right[i] === undefined) {
                    return false;
                }
                if ((helper.eq(left[i], right[i]) === false)
                    && (helper.lt(left[i], right[i]) === false)) {

                    return false;
                }
            }
            return left.length < right.length;
        }
        else {
            return true;
        }
    }
    else if (typeof left === "boolean") {
        if (Array.isArray(right)) {
            return false;
        }
        else if (typeof right === "boolean") {
            return (left === false) && (right === true)
        }
        else {
            return true;
        }
    }
    else if (left === null) {
        if (Array.isArray(right) || (typeof right === "boolean")) {
            return false;
        }
        else {
            return true;
        }
    }
    else if (typeof left === "number") {
        if (Array.isArray(right) || (typeof right === "boolean") || (right === null)) {
            return false;
        }
        else if (typeof right === "number") {
            return left < right;
        }
        else {
            return true;
        }

    }
    else if (helper.isPlainObject(left)) {
        if (left.$reql_type$ === "TIME") {
            // left is a date
            if (Array.isArray(right) || typeof right === "boolean") {
                return false;
            }
            else if (helper.isPlainObject(right) === false) {
                return true;
            }
            else {
                if (right.$reql_time$ !== "TIME") {
                    return true ;
                }
                else {
                    return left.epoch_time < right.epoch_time;
                }
            }
        }
        else {
            // left is just an object
            if (helper.isPlainObject(right) && (right.$reql_type$ === "TIME")) {
                return true;
            }
            else if (typeof right === "string") {
                return true;
            }
            else if (helper.isPlainObject(right)) {
                var leftKeys = Object.keys(left);
                var rightKeys = Object.keys(right);
                leftKeys.sort();
                rightKeys.sort();
                for(var i=0; i<leftKeys.length; i++) {
                    if (leftKeys[i] !== rightKeys[i]) {
                        return false;
                    }
                    else if (right[leftKeys[i]] === undefined) {
                        return false;
                    }
                    else if (helper.lt(left[leftKeys[i]], right[leftKeys[i]]) === false) {
                        return false;
                    }
                }
                return false;
            }
            else {
                return false;
            }

        }
    }
    else if (typeof left === "string") {
        if (helper.isPlainObject(right) && (right.$reql_type$ === "TIME")) {
            return true;
        }
        else if (typeof right === "string") {
            return left < right;
        }
        else {
            return false;
        }
    }
}

helper.gt = function(left, right) {
    return !(helper.lt(left, right) || helper.eq(left, right))
}

helper.ge = function(left, right) {
    return helper.gt(left, right) || helper.eq(left, right)
}


helper.filter = function(doc, filter) {
    if (helper.isPlainObject(filter)) {
        if (helper.isPlainObject(doc)) {
            for(var key in filter) {
                if (doc[key] === undefined) {
                    throw new Error.ReqlRuntimeError("No attribute `"+field+"` in object:\n"+JSON.stringify(doc.toDatum(), null, 2), this.frames)
                }
                if (helper.filter(doc[key], filter[key]) === false) {
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }
    else if (Array.isArray(filter)) {
        if (Array.isArray(doc)) {
            if (filter.length !== doc.length) {
                return false;
            }
            for(var i=0; i<filter.length; i++) {
                if (filter[i] !== doc[i]) {
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }
    else {
        return filter === doc;
    }

    return true;
}

helper.toDatum = function(doc) {
    var result;
    if (Array.isArray(doc)) {
        result = [];
        for(var i=0; i<doc.length; i++) {
            if (typeof doc[i].toDatum === "function") {
                result.push(doc[i].toDatum());
            }
            else {
                result.push(helper.toDatum(doc[i]));
            }
        }
        return result;
    }
    else if (helper.isPlainObject(doc)) {
        if (typeof doc.toDatum === "function") {
            return doc.toDatum();
        }

        result = {};
        for(var key in doc) {
            result[key] = helper.toDatum(doc[key]);
        }
        return result;
    }
    else {
        return doc;
    }
}

// Take a datum and replace arrays with instances of Sequence
helper.revertDatum = function(value) {
    if (Array.isArray(value)) {
        var Sequence = require(__dirname+"/sequence.js");
        var sequence = new Sequence();
        for(var i=0; i<value.length; i++) {
            sequence.push(helper.revertDatum(value[i]));
        }
        return sequence;
    }
    else if (helper.isPlainObject(value)) {
        var obj = {};
        for(var key in value) {
            obj[key] = helper.revertDatum(value[key]);
        }
        return obj;
    }
    else {
        return value
    }
}

helper.isTrue = function(value) {
    return !(value === false || value === null)
}
helper.pluck = function(obj, keys) {
    var result = {};
    for(var i=0; i<keys.length; i++) {
        result[keys[i]] = obj[keys[i]];
    }
    return result;
}
helper.hasFields = function(obj, keys) {
    for(var i=0; i<keys.length; i++) {
        if ((obj.hasOwnProperty(keys[i]) === false) || (obj[keys[i]] === undefined)) {
            return false;
        }
    }
    return true;
}


helper.without = function(obj, keys) {
    var result = helper.deepCopy(obj);

    for(var i=0; i<keys.length; i++) {
        delete result[keys[i]];
    }
    return result;
}

helper.toBool = function(val) {
    if ((val === false) || (val === null)) {
        return false;
    }
    else {
        return true;
    }
}
module.exports = helper;
