function ReqlDriverError(message, query, backtrace) {
    Error.captureStackTrace(this, ReqlDriverError);
    this.message = message;
};
ReqlDriverError.prototype = new Error();
ReqlDriverError.prototype.name = "ReqlDriverError"; 

module.exports.ReqlDriverError = ReqlDriverError;


function ReqlServerError(message) {
    Error.captureStackTrace(this, ReqlServerError);
    this.message = message;
};
ReqlServerError.prototype = new Error();
ReqlServerError.prototype.name = "ReqlServerError"; 

module.exports.ReqlServerError = ReqlServerError;


function ReqlRuntimeError(message, query, frames) {
    Error.captureStackTrace(this, ReqlRuntimeError);
    this.message = message;
    this.message += " in:\n"+backtrace(query, frames);
};
ReqlRuntimeError.prototype = new Error();
ReqlRuntimeError.prototype.name = "ReqlRuntimeError"; 

module.exports.ReqlRuntimeError = ReqlRuntimeError;


function ReqlCompileError(message) {
    Error.captureStackTrace(this, ReqlCompileError);
    this.message = message;
};
ReqlCompileError.prototype = new Error();
ReqlCompileError.prototype.name = "ReqlCompileError"; 

module.exports.ReqlCompileError = ReqlCompileError;


function ReqlClientError(message) {
    Error.captureStackTrace(this, ReqlClientError);
    this.message = message;
};
ReqlClientError.prototype = new Error();
ReqlClientError.prototype.name = "ReqlClientError"; 

module.exports.ReqlClientError = ReqlClientError;




nonPrefix = {
    DB: true,
    DB_CREATE: true,
    DB_LIST: true,
    DB_DROP: true,
    JS: true,
    NOW: true,
    TIME: true,
    EPOCH_TIME: true,
    ISO8601: true,
    BRANCH: true,
    JAVASCRIPT: true
}

typeToString = {
    DB: "db",
    DB_CREATE: "dbCreate",
    DB_LIST: "dbList",
    DB_DROP: "dbDrop",
    TABLE_CREATE: "tableCreate",
    TABLE_LIST: "tableList",
    TABLE_DROP: "tableDrop",
    TABLE: "table",
    INDEX_CREATE: "indexCreate",
    INDEX_DROP: "indexDrop",
    INDEX_LIST: "indexList",
    INDEX_WAIT: "indexWait",
    INDEX_STATUS: "indexStatus",
    INSERT: "insert",
    UPDATE: "update",
    REPLACE: "replace",
    DELETE: "delete",
    SYNC: "sync",
    GET: "get",
    GET_ALL: "getAll",
    BETWEEN: "between",
    FILTER: "filter",
    INNER_JOIN: "innerJoin",
    OUTER_JOIN: "outerJoin",
    EQ_JOIN: "eqJoin",
    ZIP: "zip",
    MAP: "map",
    WITH_FIELDS: "withFields",
    CONCATMAP: "concatMap",
    ORDERBY: "orderBy",
    SKIP: "skip",
    LIMIT: "limit",
    SLICE: "slice",
    NTH: "nth",
    INDEXES_OF: "indexes_of",
    IS_EMPTY: "isEmpty",
    UNION: "union",
    SAMPLE: "sample",
    REDUCE: "reduce",
    COUNT: "count",
    DISTINCT: "distinct",
    GROUPED_MAP_REDUCE: "groupedMapReduce",
    GROUPBY: "groupBy",
    CONTAINS: "contains",
    IMPLICIT_VAR: "row",
    PLUCK: "pluck",
    WITHOUT: "without",
    MERGE: "merge",
    APPEND: "append",
    PREPEND: "prepend",
    DIFFERENCE: "difference",
    SET_INSERT: "setInsert",
    SET_UNION: "setUnion",
    SET_INTERSECTION: "setIntersection",
    SET_DIFFERENCE: "setDifference",
    HAS_FIELDS: "hasFields",
    INSERT_AT: "insertAt",
    SPLICE_AT: "spliceAt",
    DELETE_AT: "deleteAt",
    CHANGE_AT: "changeAt",
    KEYS: "keys",
    MATCH: "match",
    ADD: "add",
    SUB: "sub",
    MUL: "mul",
    DIV: "div",
    MOD: "mod",
    ALL: "and",
    ANY: "or",
    EQ: "eq",
    NE: "ne",
    GT: "gt",
    GE: "ge",
    LT: "lt",
    LE: "le",
    NOT: "not",
    NOW: "now",
    TIME: "time",
    EPOCH_TIME: "epochTime",
    ISO8601: "ISO8601",
    IN_TIMEZONE: "inTimezone",
    TIMEZONE: "timezone",
    DURING: "during",
    DATE: "date",
    TIME_OF_DAY: "timeOfDay",
    YEAR: "year",
    MONTH: "month",
    DAY: "day",
    DAY_OF_WEEK: "dayOfWeek",
    DAY_OF_YEAR: "dayOfYear",
    HOURS: "hours",
    MINUTES: "minutes",
    SECONDS: "seconds",
    TO_ISO8601: "toISO8601",
    TO_EPOCH_TIME: "toEpochTime",
    FUNCALL: "do",
    BRANCH: "branch",
    FOREACH: "forEach",
    ERROR: "error",
    DEFAULT: "default",
    JAVASCRIPT: "js",
    COERCE_TO: "coerceTo",
    TYPEOF: "typeOf",
    INFO: "info",
    JSON: "json"
}

specialType = {
    DATUM: function(term, frames, index, father) {
        var str = "";
        if ((index === 0) && ((father == null) || (!nonPrefix[father.type]))) str = "r.expr(";

        if (term.datum.type === "R_NUM") {
            str += term.datum.r_num;
        }
        else if (term.datum.type === "R_STR") {
            str += '"'+term.datum.r_str+'"';
        }
        else if (term.datum.type === "R_BOOL") {
            str += '"'+term.datum.r_bool+'"';
        }
        else if (term.datum.type === "R_NULL") {
            str += "null";
        }


        if ((index === 0) && ((father == null) || (!nonPrefix[father.type]))) str += ")";

        return str;
    },
    TABLE: function(term, frames, index, father) {
        var str; 
        if (term.args[0].type !== "DB") {
            str = "r."+typeToString[term.type]+"(";
            for(var i=0; i<term.args.length; i++) {
                str += backtrace(term.args[i], frames, i);
            }
        }
        else {
            str = backtrace(term.args[0], frames, i);
            str += "."+typeToString[term.type]+"(";
            str += backtrace(term.args[1], frames, i);
            str += ")"
        }
        return str;
    },




    GET_FIELD: function(term, frames, index, father) {
        var str = backtrace(term.args[0], frames, 0, term);
        str += "(";
        str += backtrace(term.args[1], frames, 1, term);
        str += ")";
        return str;
    },
    MAKE_ARRAY: function(term, frames, index, father) {
        var str = "";
        if ((index === 0) && ((father == null) || (!nonPrefix[father.type]))) str += "r.expr([";
        str += "[";
        for(var i=0; i<term.args.length; i++) {
            if (i !== 0) str += ", "
            str += backtrace(term.args[i], frames, i+1, term); // +1 because there is no need to wrap
        }
        str += "]";
        if ((index === 0) && ((father == null) || (!nonPrefix[father.type]))) str += ")";
        return str;
    },
    MAKE_OBJ: function(term, frames, index, father) {
        var str = "{";
        for(var i=0; i<term.optargs.length; i++) {
            if (i !== 0) str += ", "
            str += term.optargs[i].key+": ";
            str += backtrace(term.optargs[i].val, frames, index, term);
        }
        str += "}";
        return str;
    },
    FUNC: function(term, frames, index, father) {
        var str;
        if ((term.args[0].length === 0) && (JSON.stringify(term).match('"type":"IMPLICIT_VAR"'))) {
            str = backtrace(term.args[1], frames, 0, term);
        }
        else {
            str = "function(";
            for(var i=0; i<term.args[0].args.length; i++) {
                if (i !== 0) str += ", "
                str += "var_"+term.args[0].args[i].datum.r_num;
            }
            str += ") {";
            str += backtrace(term.args[1], frames, 0, term);
            str += "}"
        }
        return str;
    },
    VAR: function(term, frames, index, father) {
        return "var_"+term.args[0].datum.r_num;
    },
    FUNCALL: function(term, frames, index, father) {
        var str = backtrace(term.args[1], frames, 0, term);
        str += ".do(";
        str += backtrace(term.args[0], frames, 0, term);
        str += ")";
        return str;
    },
    IMPLICIT_VAR: function(term, frames, index, father) {
        return "r.row";
    }
}
specialType.TABLE_CREATE = specialType.TABLE;
specialType.TABLE_LIST = specialType.TABLE;
specialType.TABLE_DROP = specialType.TABLE;


function backtrace(term, frames, index, father) {
    if (term) {
        if (specialType[term.type]) {
            str = specialType[term.type](term, frames, index, father);
        }
        else if (nonPrefix[term.type]) {
            str = "r."+typeToString[term.type]+"("

            if (term.args) {
                for(var i=0; i<term.args.length; i++) {
                    if (i !==0) str += ", ";
                    str += backtrace(term.args[i], frames, index, term);
                }
            }
            str += ")";
        }

        else {
            //TODO Check existence?
            str = backtrace(term.args[0], frames, 0, term);
            str += "."+typeToString[term.type]+"("

            for(var i=1; i<term.args.length; i++) {
                if (i !== 1) str += ", ";
                str += backtrace(term.args[i], frames, i, term);
            }
            str += ")";
        }
    }
    else {
        return ""
    }

    //TODO optargs
    return str;
}

