var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var helper = require('./helper');
var INDENT = 4;
var LIMIT = 80;
var IS_OPERATIONAL = 'isOperational';
var protodef = require('./protodef');
var protoErrorType = protodef.Response.ErrorType;
var responseTypes = protodef.Response.ResponseType;
var termTypes = protodef.Term.TermType;
var datumTypes = protodef.Datum.DatumType;
var frameTypes = protodef.Frame.FrameType;
var ReqlDriverError = (function (_super) {
    __extends(ReqlDriverError, _super);
    function ReqlDriverError(message, query, secondMessage) {
        _super.call(this, message);
        this.name = 'ReqlDriverError';
        Error.captureStackTrace(this, ReqlDriverError);
        this.message = message;
        if ((Array.isArray(query) && (query.length > 0)) || (!Array.isArray(query) && query != null)) {
            if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
                this.message = this.message.slice(0, this.message.length - 1);
            }
            this.message += ' after:\n';
            var backtrace = generateBacktrace(query, 0, null, [], { indent: 0, extra: 0 });
            this.message += backtrace.str;
        }
        else {
            if (this.message[this.message.length - 1] !== '?')
                this.message += '.';
        }
        if (secondMessage)
            this.message += '\n' + secondMessage;
    }
    ReqlDriverError.prototype.setOperational = function () {
        this[IS_OPERATIONAL] = true;
        return this;
    };
    ;
    return ReqlDriverError;
})(Error);
exports.ReqlDriverError = ReqlDriverError;
;
ReqlDriverError.prototype.name = 'ReqlDriverError';
ReqlDriverError.prototype.setOperational = function () {
    this[IS_OPERATIONAL] = true;
    return this;
};
var ReqlServerError = (function (_super) {
    __extends(ReqlServerError, _super);
    function ReqlServerError(message, query) {
        _super.call(this, message);
        this.name = 'ReqlServerError';
        this.IS_OPERATIONAL = true;
        Error.captureStackTrace(this, ReqlServerError);
        this.message = message;
        if ((Array.isArray(query) && (query.length > 0)) || (!Array.isArray(query) && query != null)) {
            if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
                this.message = this.message.slice(0, this.message.length - 1);
            }
            this.message += ' for:\n';
            var backtrace = generateBacktrace(query, 0, null, [], { indent: 0, extra: 0 });
            this.message += backtrace.str;
        }
        else {
            if (this.message[this.message.length - 1] !== '?')
                this.message += '.';
        }
    }
    return ReqlServerError;
})(Error);
exports.ReqlServerError = ReqlServerError;
;
ReqlServerError.prototype.name = 'ReqlServerError';
ReqlServerError.prototype[IS_OPERATIONAL] = true;
var ReqlRuntimeError = (function (_super) {
    __extends(ReqlRuntimeError, _super);
    function ReqlRuntimeError(message, query, frames) {
        _super.call(this, message);
        this.IS_OPERATIONAL = true;
        this.protoErrorType = protodef.Response.ErrorType;
        this.name = 'ReqlRuntimeError';
        Error.captureStackTrace(this, ReqlRuntimeError);
        this.message = message;
        if ((query != null) && (frames)) {
            if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
                this.message = this.message.slice(0, this.message.length - 1);
            }
            this.message += ' in:\n';
            frames = frames.b;
            if (frames)
                this.frames = frames.slice(0);
            //this.frames = JSON.stringify(frames, null, 2);
            var backtrace = generateBacktrace(query, 0, null, frames, { indent: 0, extra: 0 });
            var queryLines = backtrace.str.split('\n');
            var carrotLines = backtrace.car.split('\n');
            for (var i = 0; i < queryLines.length; i++) {
                this.message += queryLines[i] + '\n';
                if (carrotLines[i].match(/\^/)) {
                    var pos = queryLines[i].match(/[^\s]/);
                    if ((pos) && (pos.index)) {
                        this.message += space(pos.index) + carrotLines[i].slice(pos.index) + '\n';
                    }
                    else {
                        this.message += carrotLines[i] + '\n';
                    }
                }
            }
        }
        //this.query = JSON.stringify(query, null, 2);
    }
    ReqlRuntimeError.prototype.setName = function (type) {
        switch (type) {
            case this.protoErrorType.INTERNAL:
                this.name = 'ReqlInternalError';
                break;
            case this.protoErrorType.RESOURCE_LIMIT:
                this.name = 'ReqlResourceError';
                break;
            case this.protoErrorType.QUERY_LOGIC:
                this.name = 'ReqlLogicError';
                break;
            case this.protoErrorType.OP_FAILED:
                this.name = 'ReqlOpFailedError';
                break;
            case this.protoErrorType.OP_INDETERMINATE:
                this.name = 'ReqlOpIndeterminateError';
                break;
            case this.protoErrorType.USER:
                this.name = 'ReqlUserError';
                break;
        }
    };
    return ReqlRuntimeError;
})(Error);
exports.ReqlRuntimeError = ReqlRuntimeError;
;
ReqlRuntimeError.prototype.name = 'ReqlRuntimeError';
ReqlRuntimeError.prototype.setName = function (type) {
    switch (type) {
        case protoErrorType.INTERNAL:
            this.name = 'ReqlInternalError';
            break;
        case protoErrorType.RESOURCE_LIMIT:
            this.name = 'ReqlResourceError';
            break;
        case protoErrorType.QUERY_LOGIC:
            this.name = 'ReqlLogicError';
            break;
        case protoErrorType.OP_FAILED:
            this.name = 'ReqlOpFailedError';
            break;
        case protoErrorType.OP_INDETERMINATE:
            this.name = 'ReqlOpIndeterminateError';
            break;
        case protoErrorType.USER:
            this.name = 'ReqlUserError';
            break;
    }
};
ReqlRuntimeError.prototype[IS_OPERATIONAL] = true;
var ReqlCompileError = (function (_super) {
    __extends(ReqlCompileError, _super);
    function ReqlCompileError(message, query, frames) {
        _super.call(this, message);
        this.IS_OPERATIONAL = true;
        this.name = 'ReqlCompileError';
        Error.captureStackTrace(this, ReqlCompileError);
        this.message = message;
        if ((query != null) && (frames)) {
            if ((this.message.length > 0) && (this.message[this.message.length - 1] === '.')) {
                this.message = this.message.slice(0, this.message.length - 1);
            }
            this.message += ' in:\n';
            frames = frames.b;
            if (frames)
                this.frames = frames.slice(0);
            //this.frames = JSON.stringify(frames, null, 2);
            var backtrace = generateBacktrace(query, 0, null, frames, { indent: 0, extra: 0 });
            var queryLines = backtrace.str.split('\n');
            var carrotLines = backtrace.car.split('\n');
            for (var i = 0; i < queryLines.length; i++) {
                this.message += queryLines[i] + '\n';
                if (carrotLines[i].match(/\^/)) {
                    var pos = queryLines[i].match(/[^\s]/);
                    if ((pos) && (pos.index)) {
                        this.message += space(pos.index) + carrotLines[i].slice(pos.index) + '\n';
                    }
                    else {
                        this.message += carrotLines[i] + '\n';
                    }
                }
            }
        }
    }
    return ReqlCompileError;
})(Error);
exports.ReqlCompileError = ReqlCompileError;
;
ReqlCompileError.prototype.name = 'ReqlCompileError';
ReqlCompileError.prototype[IS_OPERATIONAL] = true;
var ReqlClientError = (function (_super) {
    __extends(ReqlClientError, _super);
    function ReqlClientError(message) {
        _super.call(this, message);
        this.name = 'ReqlClientError';
        this.IS_OPERATIONAL = true;
        Error.captureStackTrace(this, ReqlClientError);
        this.message = message;
    }
    return ReqlClientError;
})(Error);
exports.ReqlClientError = ReqlClientError;
;
ReqlClientError.prototype.name = 'ReqlClientError';
ReqlClientError.prototype[IS_OPERATIONAL] = true;
var _constants = {
    MONDAY: true,
    TUESDAY: true,
    WEDNESDAY: true,
    THURSDAY: true,
    FRIDAY: true,
    SATURDAY: true,
    SUNDAY: true,
    JANUARY: true,
    FEBRUARY: true,
    MARCH: true,
    APRIL: true,
    MAY: true,
    JUNE: true,
    JULY: true,
    AUGUST: true,
    SEPTEMBER: true,
    OCTOBER: true,
    NOVEMBER: true,
    DECEMBER: true,
    MINVAL: true,
    MAXVAL: true,
};
var constants = {};
for (var key in _constants) {
    constants[termTypes[key]] = true;
}
var _nonPrefix = {
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
    JAVASCRIPT: true,
    ERROR: true,
    MAKE_ARRAY: true,
    JSON: true,
    ARGS: true,
    HTTP: true,
    RANDOM: true,
    BINARY: true,
    OBJECT: true,
    CIRCLE: true,
    GEOJSON: true,
    POINT: true,
    LINE: true,
    POLYGON: true,
    UUID: true,
    DESC: true,
    ASC: true,
    RANGE: true,
    LITERAL: 'true'
};
var nonPrefix = {};
for (var key in _nonPrefix) {
    nonPrefix[termTypes[key]] = true;
}
// Constants are also in nonPrefix
for (var key in _constants) {
    nonPrefix[termTypes[key]] = true;
}
var _typeToString = {
    DB: 'db',
    DB_CREATE: 'dbCreate',
    DB_LIST: 'dbList',
    DB_DROP: 'dbDrop',
    TABLE_CREATE: 'tableCreate',
    TABLE_LIST: 'tableList',
    TABLE_DROP: 'tableDrop',
    TABLE: 'table',
    INDEX_CREATE: 'indexCreate',
    INDEX_DROP: 'indexDrop',
    INDEX_LIST: 'indexList',
    INDEX_WAIT: 'indexWait',
    INDEX_STATUS: 'indexStatus',
    INSERT: 'insert',
    UPDATE: 'update',
    REPLACE: 'replace',
    DELETE: 'delete',
    SYNC: 'sync',
    GET: 'get',
    GET_ALL: 'getAll',
    BETWEEN: 'between',
    FILTER: 'filter',
    INNER_JOIN: 'innerJoin',
    OUTER_JOIN: 'outerJoin',
    EQ_JOIN: 'eqJoin',
    ZIP: 'zip',
    MAP: 'map',
    WITH_FIELDS: 'withFields',
    CONCAT_MAP: 'concatMap',
    ORDER_BY: 'orderBy',
    DESC: 'desc',
    ASC: 'asc',
    SKIP: 'skip',
    LIMIT: 'limit',
    SLICE: 'slice',
    NTH: 'nth',
    OFFSETS_OF: 'offsetsOf',
    IS_EMPTY: 'isEmpty',
    UNION: 'union',
    SAMPLE: 'sample',
    REDUCE: 'reduce',
    COUNT: 'count',
    SUM: 'sum',
    AVG: 'avg',
    MIN: 'min',
    MAX: 'max',
    OBJECT: 'object',
    DISTINCT: 'distinct',
    GROUP: 'group',
    UNGROUP: 'ungroup',
    CONTAINS: 'contains',
    IMPLICIT_VAR: 'row',
    PLUCK: 'pluck',
    WITHOUT: 'without',
    MERGE: 'merge',
    APPEND: 'append',
    PREPEND: 'prepend',
    DIFFERENCE: 'difference',
    SET_INSERT: 'setInsert',
    SET_UNION: 'setUnion',
    SET_INTERSECTION: 'setIntersection',
    SET_DIFFERENCE: 'setDifference',
    HAS_FIELDS: 'hasFields',
    INSERT_AT: 'insertAt',
    SPLICE_AT: 'spliceAt',
    DELETE_AT: 'deleteAt',
    CHANGE_AT: 'changeAt',
    KEYS: 'keys',
    VALUES: 'values',
    MATCH: 'match',
    UPCASE: 'upcase',
    DOWNCASE: 'downcase',
    ADD: 'add',
    SUB: 'sub',
    MUL: 'mul',
    DIV: 'div',
    MOD: 'mod',
    AND: 'and',
    OR: 'or',
    EQ: 'eq',
    NE: 'ne',
    GT: 'gt',
    GE: 'ge',
    LT: 'lt',
    LE: 'le',
    NOT: 'not',
    FLOOR: 'floor',
    CEIL: 'ceil',
    ROUND: 'round',
    NOW: 'now',
    TIME: 'time',
    EPOCH_TIME: 'epochTime',
    ISO8601: 'ISO8601',
    IN_TIMEZONE: 'inTimezone',
    TIMEZONE: 'timezone',
    DURING: 'during',
    DATE: 'date',
    TIME_OF_DAY: 'timeOfDay',
    YEAR: 'year',
    MONTH: 'month',
    DAY: 'day',
    DAY_OF_WEEK: 'dayOfWeek',
    DAY_OF_YEAR: 'dayOfYear',
    HOURS: 'hours',
    MINUTES: 'minutes',
    SECONDS: 'seconds',
    TO_ISO8601: 'toISO8601',
    TO_EPOCH_TIME: 'toEpochTime',
    FUNCALL: 'do',
    BRANCH: 'branch',
    FOR_EACH: 'forEach',
    ERROR: 'error',
    DEFAULT: 'default',
    JAVASCRIPT: 'js',
    COERCE_TO: 'coerceTo',
    TYPE_OF: 'typeOf',
    INFO: 'info',
    JSON: 'json',
    ARGS: 'args',
    HTTP: 'http',
    RANDOM: 'random',
    CHANGES: 'changes',
    BINARY: 'binary',
    INDEX_RENAME: 'indexRename',
    CIRCLE: 'circle',
    DISTANCE: 'distance',
    FILL: 'fill',
    GEOJSON: 'geojson',
    TO_GEOJSON: 'toGeojson',
    GET_INTERSECTING: 'getIntersecting',
    GET_NEAREST: 'getNearest',
    INCLUDES: 'includes',
    INTERSECTS: 'intersects',
    LINE: 'line',
    POINT: 'point',
    POLYGON: 'polygon',
    POLYGON_SUB: 'polygonSub',
    UUID: 'uuid',
    RANGE: 'range',
    TO_JSON_STRING: 'toJSON',
    CONFIG: 'config',
    STATUS: 'status',
    WAIT: 'wait',
    RECONFIGURE: 'reconfigure',
    REBALANCE: 'rebalance',
    SPLIT: 'split',
    LITERAL: 'literal',
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday',
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday',
    JANUARY: 'january',
    FEBRUARY: 'february',
    MARCH: 'march',
    APRIL: 'april',
    MAY: 'may',
    JUNE: 'june',
    JULY: 'july',
    AUGUST: 'august',
    SEPTEMBER: 'september',
    OCTOBER: 'october',
    NOVEMBER: 'november',
    DECEMBER: 'december',
    MINVAL: 'minval',
    MAXVAL: 'maxval',
};
var typeToString = {};
for (var key in _typeToString) {
    typeToString[termTypes[key]] = _typeToString[key];
}
var _noPrefixOptargs = {
    ISO8601: true,
};
var noPrefixOptargs = {};
for (var key in _noPrefixOptargs) {
    noPrefixOptargs[termTypes[key]] = true;
}
var _specialType = {
    DATUM: function (term, index, father, frames, options, optarg) {
        optarg = optarg || false;
        var underline = Array.isArray(frames) && (frames.length === 0);
        var currentFrame, backtrace;
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        var result = {
            str: '',
            car: ''
        };
        if ((helper.isPlainObject(term)) && (term.$reql_type$ === 'BINARY')) {
            carify(result, 'r.binary(<Buffer>)', underline);
            return result;
        }
        if ((index === 0) && ((father == null) || (!nonPrefix[father[0]])))
            carify(result, 'r.expr(', underline);
        if (typeof term === 'string') {
            carify(result, '"' + term + '"', underline);
        }
        else if (helper.isPlainObject(term)) {
            var totalKeys = Object.keys(term).length;
            if (totalKeys === 0) {
                carify(result, '{}', underline);
            }
            else {
                carify(result, '{\n', underline);
                var countKeys = 0;
                var extraToRemove = options.extra;
                options.indent += INDENT + options.extra;
                options.extra = 0;
                for (var key in term) {
                    countKeys++;
                    //if (!((father) && (Array.isArray(father[2])) && (Object.keys(father[2]).length > 0))) options.extra = 0;
                    if (optarg) {
                        carify(result, space(options.indent) + camelCase(key) + ': ', underline);
                    }
                    else {
                        carify(result, space(options.indent) + key + ': ', underline);
                    }
                    if ((currentFrame != null) && (currentFrame === key)) {
                        backtrace = generateBacktrace(term[key], i, term, frames, options);
                    }
                    else {
                        backtrace = generateBacktrace(term[key], i, term, null, options);
                    }
                    result.str += backtrace.str;
                    result.car += backtrace.car;
                    if (countKeys !== totalKeys) {
                        carify(result, ',\n', underline);
                    }
                }
                options.indent -= INDENT + extraToRemove;
                carify(result, '\n' + space(options.indent + extraToRemove) + '}', underline);
            }
        }
        else if (Array.isArray(term)) {
            carify(result, '[', underline);
            for (var i = 0; i < term.length; i++) {
                if ((currentFrame != null) && (currentFrame === i)) {
                    backtrace = generateBacktrace(term[i], i, term, frames, options);
                }
                else {
                    backtrace = generateBacktrace(term[i], i, term, null, options);
                }
                result.str += backtrace.str;
                result.car += backtrace.car;
            }
            carify(result, ']', underline);
        }
        else {
            carify(result, '' + term, underline);
        }
        if ((index === 0) && ((father == null) || (!nonPrefix[father[0]])))
            carify(result, ')', underline);
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    TABLE: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        if ((term.length === 1) || (term[1].length === 0) || (term[1][0][0] !== termTypes.DB)) {
            var underline = Array.isArray(frames) && (frames.length === 0);
            if (Array.isArray(frames))
                currentFrame = frames.shift();
            carify(result, 'r.' + typeToString[term[0]] + '(', underline);
            if (Array.isArray(term[1])) {
                for (var i = 0; i < term[1].length; i++) {
                    if (i !== 0)
                        result.str += ', ';
                    if ((currentFrame != null) && (currentFrame === 1)) {
                        // +1 for index because it's like if there was a r.db(...) before .table(...)
                        backtrace = generateBacktrace(term[1][i], i + 1, term, frames, options);
                    }
                    else {
                        backtrace = generateBacktrace(term[1][i], i + 1, term, null, options);
                    }
                    result.str += backtrace.str;
                    result.car += backtrace.car;
                }
            }
            backtrace = makeOptargs(term, i, term, frames, options, currentFrame);
            result.str += backtrace.str;
            result.car += backtrace.car;
            carify(result, ')', underline);
            if (underline)
                result.car = result.str.replace(/./g, '^');
        }
        else {
            backtrace = generateNormalBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        return result;
    },
    GET_FIELD: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        var underline = Array.isArray(frames) && (frames.length === 0);
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        if ((currentFrame != null) && (currentFrame === 0)) {
            backtrace = generateBacktrace(term[1][0], 0, term, frames, options);
        }
        else {
            backtrace = generateBacktrace(term[1][0], 0, term, null, options);
        }
        result.str = backtrace.str;
        result.car = backtrace.car;
        carify(result, '(', underline);
        if ((currentFrame != null) && (currentFrame === 1)) {
            backtrace = generateBacktrace(term[1][1], 1, term, frames, options);
        }
        else {
            backtrace = generateBacktrace(term[1][1], 1, term, null, options);
        }
        result.str += backtrace.str;
        result.car += backtrace.car;
        carify(result, ')', underline);
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    MAKE_ARRAY: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        var underline = Array.isArray(frames) && (frames.length === 0);
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        if ((index === 0) && ((father == null) || (!nonPrefix[father[0]])))
            carify(result, 'r.expr(', underline);
        if (!((options) && (options.noBracket))) {
            carify(result, '[', underline);
        }
        for (var i = 0; i < term[1].length; i++) {
            if (i !== 0) {
                carify(result, ', ', underline);
            }
            if ((currentFrame != null) && (currentFrame === i)) {
                backtrace = generateBacktrace(term[1][i], i, term, frames, options);
            }
            else {
                backtrace = generateBacktrace(term[1][i], i, term, null, options);
            }
            result.str += backtrace.str;
            result.car += backtrace.car;
        }
        if (!((options) && (options.noBracket))) {
            carify(result, ']', underline);
        }
        if ((index === 0) && ((father == null) || (!nonPrefix[father[0]]))) {
            carify(result, ')', underline);
        }
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    FUNC: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        var underline = Array.isArray(frames) && (frames.length === 0);
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        if ((term[1][0][1].length === 1) && (helper.hasImplicit(term[1][1]))) {
            if ((currentFrame != null) && (currentFrame === 1)) {
                backtrace = generateBacktrace(term[1][1], 1, term, frames, options);
            }
            else {
                backtrace = generateBacktrace(term[1][1], 1, term, null, options);
            }
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        else {
            carify(result, 'function(', underline);
            for (var i = 0; i < term[1][0][1].length; i++) {
                if (i !== 0) {
                    carify(result, ', ', underline);
                }
                carify(result, 'var_' + term[1][0][1][i], underline);
            }
            options.indent += INDENT + options.extra;
            var extraToRemove = options.extra;
            options.extra = 0;
            //if (!((Array.isArray(term[2])) && (term[2].length > 0))) options.extra = 0;
            carify(result, ') {\n' + space(options.indent) + 'return ', underline);
            if ((currentFrame != null) && (currentFrame === 1)) {
                backtrace = generateBacktrace(term[1][1], 1, term, frames, options);
            }
            else {
                backtrace = generateBacktrace(term[1][1], 1, term, null, options);
            }
            result.str += backtrace.str;
            result.car += backtrace.car;
            options.indent -= INDENT + extraToRemove;
            options.extra = extraToRemove;
            carify(result, '\n' + space(options.indent + extraToRemove) + '}', underline);
        }
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    VAR: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        var underline = Array.isArray(frames) && (frames.length === 0);
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        carify(result, 'var_' + term[1][0], underline);
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    FUNCALL: function (term, index, father, frames, options) {
        // The syntax is args[1].do(args[0])
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        var underline = Array.isArray(frames) && (frames.length === 0);
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        if (term[1].length === 2) {
            if ((currentFrame != null) && (currentFrame === 1)) {
                backtrace = generateBacktrace(term[1][1], 0, term, frames, options);
            }
            else {
                backtrace = generateBacktrace(term[1][1], 0, term, null, options);
            }
            result.str = backtrace.str;
            result.car = backtrace.car;
            carify(result, '.do(', underline);
        }
        else {
            carify(result, 'r.do(', underline);
            for (var i = 1; i < term[1].length; i++) {
                if ((currentFrame != null) && (currentFrame === i)) {
                    backtrace = generateBacktrace(term[1][i], i, term, frames, options);
                }
                else {
                    backtrace = generateBacktrace(term[1][i], i, term, null, options);
                }
                result.str += backtrace.str;
                result.car += backtrace.car;
                if (i !== term[1].length) {
                    carify(result, ', ', underline);
                }
            }
        }
        if ((currentFrame != null) && (currentFrame === 0)) {
            backtrace = generateBacktrace(term[1][0], 0, term, frames, options);
        }
        else {
            backtrace = generateBacktrace(term[1][0], 0, term, null, options);
        }
        result.str += backtrace.str;
        result.car += backtrace.car;
        carify(result, ')', underline);
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    IMPLICIT_VAR: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        var underline = Array.isArray(frames) && (frames.length === 0);
        if (Array.isArray(frames))
            currentFrame = frames.shift();
        carify(result, 'r.row', underline);
        if (underline)
            result.car = result.str.replace(/./g, '^');
        return result;
    },
    WAIT: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        if (term.length === 1 || term[1].length === 0) {
            backtrace = generateWithoutPrefixBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        else {
            backtrace = generateNormalBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        return result;
    },
    MAP: function (term, index, father, frames, options) {
        var result = {
            str: '',
            car: ''
        };
        var backtrace, underline, currentFrame;
        if (term.length > 1 && term[1].length > 2) {
            backtrace = generateWithoutPrefixBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        else {
            backtrace = generateNormalBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        return result;
    },
    TABLE_CREATE: null,
    TABLE_DROP: null,
    TABLE_LIST: null,
    RECONFIGURE: null,
    REBALANCE: null,
    BRACKET: null,
};
_specialType.TABLE_CREATE = _specialType.TABLE;
_specialType.TABLE_DROP = _specialType.TABLE;
_specialType.TABLE_LIST = _specialType.TABLE;
_specialType.RECONFIGURE = _specialType.WAIT;
_specialType.REBALANCE = _specialType.WAIT;
_specialType.BRACKET = _specialType.GET_FIELD;
var specialType = {};
for (var key in _specialType) {
    specialType[termTypes[key]] = _specialType[key];
}
function space(n) {
    return new Array(n + 1).join(' ');
}
function carify(result, str, underline) {
    if (underline === true) {
        result.str += str;
        result.car += str.replace(/[^\n]/g, '^');
    }
    else {
        result.str += str;
        result.car += str.replace(/[^\n]/g, ' ');
    }
}
function makeOptargs(term, index, father, frames, options, currentFrame) {
    var result = {
        str: '',
        car: ''
    };
    var backtrace, currentFrame, underline;
    if (helper.isPlainObject(term[2])) {
        //if ((currentFrame != null) && (frames != null)) frames.unshift(currentFrame);
        //underline = Array.isArray(frames) && (frames.length === 0);
        var underline = false;
        //if (Array.isArray(frames)) currentFrame = frames.shift();
        // This works before there is no prefix term than can be called with no normal argument but with an optarg
        if (Array.isArray(term[1]) && (term[1].length > 1)) {
            carify(result, ', ', underline);
        }
        else if (Array.isArray(term[1]) && (term[1].length > 0) && (noPrefixOptargs[term[0]])) {
            carify(result, ', ', underline);
        }
        backtrace = specialType[termTypes.DATUM](term[2], index, term[2], frames, options, true);
        result.str += backtrace.str;
        result.car += backtrace.car;
        if (underline)
            result.car = result.str.replace(/./g, '^');
    }
    return result;
}
function generateNormalBacktrace(term, index, father, frames, options) {
    var result = {
        str: '',
        car: ''
    };
    var backtrace, currentFrame, underline;
    //if (term[1]) {
    var underline = Array.isArray(frames) && (frames.length === 0);
    if (Array.isArray(frames))
        currentFrame = frames.shift();
    if ((currentFrame != null) && (currentFrame === 0)) {
        backtrace = generateBacktrace(term[1][0], 0, term, frames, options);
    }
    else {
        backtrace = generateBacktrace(term[1][0], 0, term, null, options);
    }
    result.str = backtrace.str;
    result.car = backtrace.car;
    var lines = backtrace.str.split('\n');
    var line = lines[lines.length - 1];
    var pos = line.match(/[^\s]/);
    pos = (pos) ? pos.index : 0;
    if (line.length - pos > LIMIT) {
        if (options.extra === 0)
            options.extra += INDENT;
        carify(result, '\n' + space(options.indent + options.extra), underline);
    }
    carify(result, '.' + typeToString[term[0]] + '(', underline);
    options.indent += options.extra;
    var extraToRemove = options.extra;
    options.extra = 0;
    for (var i = 1; i < term[1].length; i++) {
        if (i !== 1) {
            carify(result, ', ', underline);
        }
        if ((currentFrame != null) && (currentFrame === i)) {
            backtrace = generateBacktrace(term[1][i], i, term, frames, options);
        }
        else {
            backtrace = generateBacktrace(term[1][i], i, term, null, options);
        }
        result.str += backtrace.str;
        result.car += backtrace.car;
    }
    backtrace = makeOptargs(term, i, term, frames, options, currentFrame);
    result.str += backtrace.str;
    result.car += backtrace.car;
    options.indent -= extraToRemove;
    options.extra = extraToRemove;
    carify(result, ')', underline);
    if (underline)
        result.car = result.str.replace(/./g, '^');
    /*
    }
    else {
      throw new Error('The driver should never enter this condition. Please report the query to the developers -- End 1 --\n'+JSON.stringify(term, null, 2))
    }
    */
    return result;
}
function generateWithoutPrefixBacktrace(term, index, father, frames, options) {
    var result = {
        str: '',
        car: ''
    };
    var backtrace, currentFrame, underline;
    var underline = Array.isArray(frames) && (frames.length === 0);
    if (Array.isArray(frames))
        currentFrame = frames.shift();
    if (constants[term[0]]) {
        carify(result, 'r.' + typeToString[term[0]], underline);
        return result;
    }
    carify(result, 'r.' + typeToString[term[0]] + '(', underline);
    if (Array.isArray(term[1])) {
        for (var i = 0; i < term[1].length; i++) {
            if (i !== 0)
                carify(result, ', ', underline);
            if ((currentFrame != null) && (currentFrame === i)) {
                backtrace = generateBacktrace(term[1][i], i, term, frames, options);
            }
            else {
                backtrace = generateBacktrace(term[1][i], i, term, null, options);
            }
            result.str += backtrace.str;
            result.car += backtrace.car;
        }
    }
    backtrace = makeOptargs(term, i, term, frames, options, currentFrame);
    result.str += backtrace.str;
    result.car += backtrace.car;
    carify(result, ')', underline);
    if (underline)
        result.car = result.str.replace(/./g, '^');
    return result;
}
function generateBacktrace(term, index, father, frames, options) {
    var result = {
        str: '',
        car: ''
    };
    var backtrace, currentFrame, underline;
    // frames = null -> do not underline
    // frames = [] -> underline
    if (Array.isArray(term)) {
        if (term.length === 0) {
            var underline = Array.isArray(frames) && (frames.length === 0);
            carify(result, 'undefined', underline);
        }
        else if (specialType[term[0]]) {
            backtrace = specialType[term[0]](term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        else if (nonPrefix[term[0]]) {
            backtrace = generateWithoutPrefixBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
        else {
            backtrace = generateNormalBacktrace(term, index, father, frames, options);
            result.str = backtrace.str;
            result.car = backtrace.car;
        }
    }
    else if (term !== undefined) {
        backtrace = specialType[termTypes.DATUM](term, index, father, frames, options);
        result.str = backtrace.str;
        result.car = backtrace.car;
    }
    else {
    }
    return result;
}
exports.generateBacktrace = generateBacktrace;
function camelCase(str) {
    return str.replace(/_(.)/g, function (m, char) { return char.toUpperCase(); });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXJyb3IudHMiXSwibmFtZXMiOlsiUmVxbERyaXZlckVycm9yIiwiUmVxbERyaXZlckVycm9yLmNvbnN0cnVjdG9yIiwiUmVxbERyaXZlckVycm9yLnNldE9wZXJhdGlvbmFsIiwiUmVxbFNlcnZlckVycm9yIiwiUmVxbFNlcnZlckVycm9yLmNvbnN0cnVjdG9yIiwiUmVxbFJ1bnRpbWVFcnJvciIsIlJlcWxSdW50aW1lRXJyb3IuY29uc3RydWN0b3IiLCJSZXFsUnVudGltZUVycm9yLnNldE5hbWUiLCJSZXFsQ29tcGlsZUVycm9yIiwiUmVxbENvbXBpbGVFcnJvci5jb25zdHJ1Y3RvciIsIlJlcWxDbGllbnRFcnJvciIsIlJlcWxDbGllbnRFcnJvci5jb25zdHJ1Y3RvciIsIkRBVFVNIiwiVEFCTEUiLCJHRVRfRklFTEQiLCJNQUtFX0FSUkFZIiwiRlVOQyIsIlZBUiIsIkZVTkNBTEwiLCJJTVBMSUNJVF9WQVIiLCJXQUlUIiwiTUFQIiwic3BhY2UiLCJjYXJpZnkiLCJtYWtlT3B0YXJncyIsImdlbmVyYXRlTm9ybWFsQmFja3RyYWNlIiwiZ2VuZXJhdGVXaXRob3V0UHJlZml4QmFja3RyYWNlIiwiZ2VuZXJhdGVCYWNrdHJhY2UiLCJjYW1lbENhc2UiXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsSUFBWSxNQUFNLFdBQU0sVUFBVSxDQUFDLENBQUE7QUFDbkMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsSUFBSSxjQUFjLEdBQUcsZUFBZSxDQUFDO0FBRXJDLElBQU8sUUFBUSxXQUFXLFlBQVksQ0FBQyxDQUFDO0FBRXhDLElBQUksY0FBYyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO0FBQ2pELElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDO0FBQ25ELElBQUksU0FB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RUEsZ0JBQWdCQSxDQUFDQSxDQUFDQTtRQUNoREEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsT0FBT0EsQ0FBQ0E7UUFFdkJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0VBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEdBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzlEQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxPQUFPQSxJQUFJQSxRQUFRQSxDQUFDQTtZQUV6QkEsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbEJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBO2dCQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxQ0EsZ0RBQWdEQTtZQUVoREEsSUFBSUEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxFQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFDQSxDQUFDQSxDQUFDQTtZQUVqRkEsSUFBSUEsVUFBVUEsR0FBR0EsU0FB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QSxDQUFDQTtRQUNoREEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsT0FBT0EsQ0FBQ0E7UUFFdkJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0VBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEdBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzlEQSxDQUFDQTtZQUVEQSxJQUFJQSxDQUFDQSxPQUFPQSxJQUFJQSxRQUFRQSxDQUFDQTtZQUV6QkEsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbEJBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBO2dCQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxQ0EsZ0RBQWdEQTtZQUVoREEsSUFBSUEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxFQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxDQUFDQSxFQUFDQSxDQUFDQSxDQUFDQTtZQUVqRkEsSUFBSUEsVUFBVUEsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDM0NBLElBQUlBLFdBQVdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBRTVDQSxHQUFHQSxDQUFBQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFDQSxVQUFVQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFDdENBLElBQUlBLENBQUNBLE9BQU9BLElBQUlBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBO2dCQUNuQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQy9CQSxJQUFJQSxHQUFHQSxHQUFHQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtvQkFDdkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUN6QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsSUFBSUEsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBQ0EsSUFBSUEsQ0FBQ0E7b0JBQ3hFQSxDQUFDQTtvQkFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ0pBLElBQUlBLENBQUNBLE9BQU9BLElBQUlBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBO29CQUN0Q0EsQ0FBQ0E7Z0JBQ0hBLENBQUNBO1lBQ0hBLENBQUNBO1FBQ0hBLENBQUNBO0lBQ0hBLENBQUNBO0lBQ0hELHVCQUFDQTtBQUFEQSxDQUFDQSxBQXpDRCxFQUFzQyxLQUFLLEVBeUMxQztBQXpDWSx3QkFBZ0IsbUJBeUM1QixDQUFBO0FBQUEsQ0FBQztBQUNGLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsa0JBQWtCLENBQUM7QUFDckQsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUVsRDtJQUFxQ0UsbUNBQUtBO0lBS3hDQSx5QkFBWUEsT0FBT0E7UUFDakJDLGtCQUFNQSxPQUFPQSxDQUFDQSxDQUFDQTtRQUpqQkEsU0FBSUEsR0FBR0EsaUJBQWlCQSxDQUFDQTtRQUN6QkEsbUJBQWNBLEdBQUdBLElBQUlBLENBQUNBO1FBSXBCQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBLElBQUlBLEVBQUVBLGVBQWVBLENBQUNBLENBQUNBO1FBQy9DQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxPQUFPQSxDQUFDQTtJQUN6QkEsQ0FBQ0E7SUFDSEQsc0JBQUNBO0FBQURBLENBQUNBLEFBVkQsRUFBcUMsS0FBSyxFQVV6QztBQVZZLHVCQUFlLGtCQVUzQixDQUFBO0FBQUEsQ0FBQztBQUNGLGVBQWUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLGlCQUFpQixDQUFDO0FBQ25ELGVBQWUsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBRWpELElBQUksVUFBVSxHQUFHO0lBQ2YsTUFBTSxFQUFFLElBQUk7SUFDWixPQUFPLEVBQUUsSUFBSTtJQUNiLFNBQVMsRUFBRSxJQUFJO0lBQ2YsUUFBUSxFQUFFLElBQUk7SUFDZCxNQUFNLEVBQUUsSUFBSTtJQUNaLFFBQVEsRUFBRSxJQUFJO0lBQ2QsTUFBTSxFQUFFLElBQUk7SUFDWixPQUFPLEVBQUUsSUFBSTtJQUNiLFFBQVEsRUFBRSxJQUFJO0lBQ2QsS0FBSyxFQUFFLElBQUk7SUFDWCxLQUFLLEVBQUUsSUFBSTtJQUNYLEdBQUcsRUFBRSxJQUFJO0lBQ1QsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLE1BQU0sRUFBRSxJQUFJO0lBQ1osU0FBUyxFQUFFLElBQUk7SUFDZixPQUFPLEVBQUUsSUFBSTtJQUNiLFFBQVEsRUFBRSxJQUFJO0lBQ2QsUUFBUSxFQUFFLElBQUk7SUFDZCxNQUFNLEVBQUUsSUFBSTtJQUNaLE1BQU0sRUFBRSxJQUFJO0NBQ2IsQ0FBQztBQUNGLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNuQixHQUFHLENBQUEsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDMUIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNuQyxDQUFDO0FBR0QsSUFBSSxVQUFVLEdBQUc7SUFDZixFQUFFLEVBQUUsSUFBSTtJQUNSLFNBQVMsRUFBRSxJQUFJO0lBQ2YsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtJQUNiLEVBQUUsRUFBRSxJQUFJO0lBQ1IsR0FBRyxFQUFFLElBQUk7SUFDVCxJQUFJLEVBQUUsSUFBSTtJQUNWLFVBQVUsRUFBRSxJQUFJO0lBQ2hCLE9BQU8sRUFBRSxJQUFJO0lBQ2IsTUFBTSxFQUFFLElBQUk7SUFDWixVQUFVLEVBQUUsSUFBSTtJQUNoQixLQUFLLEVBQUUsSUFBSTtJQUNYLFVBQVUsRUFBRSxJQUFJO0lBQ2hCLElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsSUFBSTtJQUNWLE1BQU0sRUFBRSxJQUFJO0lBQ1osTUFBTSxFQUFFLElBQUk7SUFDWixNQUFNLEVBQUUsSUFBSTtJQUNaLE1BQU0sRUFBRSxJQUFJO0lBQ1osT0FBTyxFQUFFLElBQUk7SUFDYixLQUFLLEVBQUUsSUFBSTtJQUNYLElBQUksRUFBRSxJQUFJO0lBQ1YsT0FBTyxFQUFFLElBQUk7SUFDYixJQUFJLEVBQUUsSUFBSTtJQUNWLElBQUksRUFBRSxJQUFJO0lBQ1YsR0FBRyxFQUFFLElBQUk7SUFDVCxLQUFLLEVBQUUsSUFBSTtJQUNYLE9BQU8sRUFBRSxNQUFNO0NBQ2hCLENBQUM7QUFDRixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDbkIsR0FBRyxDQUFBLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzFCLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkMsQ0FBQztBQUNELGtDQUFrQztBQUNsQyxHQUFHLENBQUEsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDMUIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNuQyxDQUFDO0FBR0QsSUFBSSxhQUFhLEdBQUc7SUFDbEIsRUFBRSxFQUFFLElBQUk7SUFDUixTQUFTLEVBQUUsVUFBVTtJQUNyQixPQUFPLEVBQUUsUUFBUTtJQUNqQixPQUFPLEVBQUUsUUFBUTtJQUNqQixZQUFZLEVBQUUsYUFBYTtJQUMzQixVQUFVLEVBQUUsV0FBVztJQUN2QixVQUFVLEVBQUUsV0FBVztJQUN2QixLQUFLLEVBQUUsT0FBTztJQUNkLFlBQVksRUFBRSxhQUFhO0lBQzNCLFVBQVUsRUFBRSxXQUFXO0lBQ3ZCLFVBQVUsRUFBRSxXQUFXO0lBQ3ZCLFVBQVUsRUFBRSxXQUFXO0lBQ3ZCLFlBQVksRUFBRSxhQUFhO0lBQzNCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLElBQUksRUFBRSxNQUFNO0lBQ1osR0FBRyxFQUFFLEtBQUs7SUFDVixPQUFPLEVBQUUsUUFBUTtJQUNqQixPQUFPLEVBQUUsU0FBUztJQUNsQixNQUFNLEVBQUUsUUFBUTtJQUNoQixVQUFVLEVBQUUsV0FBVztJQUN2QixVQUFVLEVBQUUsV0FBVztJQUN2QixPQUFPLEVBQUUsUUFBUTtJQUNqQixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsV0FBVyxFQUFFLFlBQVk7SUFDekIsVUFBVSxFQUFFLFdBQVc7SUFDdkIsUUFBUSxFQUFFLFNBQVM7SUFDbkIsSUFBSSxFQUFFLE1BQU07SUFDWixHQUFHLEVBQUUsS0FBSztJQUNWLElBQUksRUFBRSxNQUFNO0lBQ1osS0FBSyxFQUFFLE9BQU87SUFDZCxLQUFLLEVBQUUsT0FBTztJQUNkLEdBQUcsRUFBRSxLQUFLO0lBQ1YsVUFBVSxFQUFFLFdBQVc7SUFDdkIsUUFBUSxFQUFFLFNBQVM7SUFDbkIsS0FBSyxFQUFFLE9BQU87SUFDZCxNQUFNLEVBQUUsUUFBUTtJQUNoQixNQUFNLEVBQUUsUUFBUTtJQUNoQixLQUFLLEVBQUUsT0FBTztJQUNkLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsTUFBTSxFQUFFLFFBQVE7SUFDaEIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsS0FBSyxFQUFFLE9BQU87SUFDZCxPQUFPLEVBQUUsU0FBUztJQUNsQixRQUFRLEVBQUUsVUFBVTtJQUNwQixZQUFZLEVBQUUsS0FBSztJQUNuQixLQUFLLEVBQUUsT0FBTztJQUNkLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLEtBQUssRUFBRSxPQUFPO0lBQ2QsTUFBTSxFQUFFLFFBQVE7SUFDaEIsT0FBTyxFQUFFLFNBQVM7SUFDbEIsVUFBVSxFQUFFLFlBQVk7SUFDeEIsVUFBVSxFQUFFLFdBQVc7SUFDdkIsU0FBUyxFQUFFLFVBQVU7SUFDckIsZ0JBQWdCLEVBQUUsaUJBQWlCO0lBQ25DLGNBQWMsRUFBRSxlQUFlO0lBQy9CLFVBQVUsRUFBRSxXQUFXO0lBQ3ZCLFNBQVMsRUFBRSxVQUFVO0lBQ3JCLFNBQVMsRUFBRSxVQUFVO0lBQ3JCLFNBQVMsRUFBRSxVQUFVO0lBQ3JCLFNBQVMsRUFBRSxVQUFVO0lBQ3JCLElBQUksRUFBRSxNQUFNO0lBQ1osTUFBTSxFQUFFLFFBQVE7SUFDaEIsS0FBSyxFQUFFLE9BQU87SUFDZCxNQUFNLEVBQUUsUUFBUTtJQUNoQixRQUFRLEVBQUUsVUFBVTtJQUNwQixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixHQUFHLEVBQUUsS0FBSztJQUNWLEdBQUcsRUFBRSxLQUFLO0lBQ1YsR0FBRyxFQUFFLEtBQUs7SUFDVixFQUFFLEVBQUUsSUFBSTtJQUNSLEVBQUUsRUFBRSxJQUFJO0lBQ1IsRUFBRSxFQUFFLElBQUk7SUFDUixFQUFFLEVBQUUsSUFBSTtJQUNSLEVBQUUsRUFBRSxJQUFJO0lBQ1IsRUFBRSxFQUFFLElBQUk7SUFDUixFQUFFLEVBQUUsSUFBSTtJQUNSLEdBQUcsRUFBRSxLQUFLO0lBQ1YsS0FBSyxFQUFFLE9BQU87SUFDZCxJQUFJLEVBQUUsTUFBTTtJQUNaLEtBQUssRUFBRSxPQUFPO0lBQ2QsR0FBRyxFQUFFLEtBQUs7SUFDVixJQUFJLEVBQUUsTUFBTTtJQUNaLFVBQVUsRUFBRSxXQUFXO0lBQ3ZCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFdBQVcsRUFBRSxZQUFZO0lBQ3pCLFFBQVEsRUFBRSxVQUFVO0lBQ3BCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLElBQUksRUFBRSxNQUFNO0lBQ1osV0FBVyxFQUFFLFdBQVc7SUFDeEIsSUFBSSxFQUFFLE1BQU07SUFDWixLQUFLLEVBQUUsT0FBTztJQUNkLEdBQUcsRUFBRSxLQUFLO0lBQ1YsV0FBVyxFQUFFLFdBQVc7SUFDeEIsV0FBVyxFQUFFLFdBQVc7SUFDeEIsS0FBSyxFQUFFLE9BQU87SUFDZCxPQUFPLEVBQUUsU0FBUztJQUNsQixPQUFPLEVBQUUsU0FBUztJQUNsQixVQUFVLEVBQUUsV0FBVztJQUN2QixhQUFhLEVBQUUsYUFBYTtJQUM1QixPQUFPLEVBQUUsSUFBSTtJQUNiLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLFFBQVEsRUFBRSxTQUFTO0lBQ25CLEtBQUssRUFBRSxPQUFPO0lBQ2QsT0FBTyxFQUFFLFNBQVM7SUFDbEIsVUFBVSxFQUFFLElBQUk7SUFDaEIsU0FBUyxFQUFFLFVBQVU7SUFDckIsT0FBTyxFQUFFLFFBQVE7SUFDakIsSUFBSSxFQUFFLE1BQU07SUFDWixJQUFJLEVBQUUsTUFBTTtJQUNaLElBQUksRUFBRSxNQUFNO0lBQ1osSUFBSSxFQUFFLE1BQU07SUFDWixNQUFNLEVBQUUsUUFBUTtJQUNoQixPQUFPLEVBQUUsU0FBUztJQUNsQixNQUFNLEVBQUUsUUFBUTtJQUNoQixZQUFZLEVBQUUsYUFBYTtJQUMzQixNQUFNLEVBQUUsUUFBUTtJQUNoQixRQUFRLEVBQUUsVUFBVTtJQUNwQixJQUFJLEVBQUUsTUFBTTtJQUNaLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLFVBQVUsRUFBRSxXQUFXO0lBQ3ZCLGdCQUFnQixFQUFFLGlCQUFpQjtJQUNuQyxXQUFXLEVBQUUsWUFBWTtJQUN6QixRQUFRLEVBQUUsVUFBVTtJQUNwQixVQUFVLEVBQUUsWUFBWTtJQUN4QixJQUFJLEVBQUUsTUFBTTtJQUNaLEtBQUssRUFBRSxPQUFPO0lBQ2QsT0FBTyxFQUFFLFNBQVM7SUFDbEIsV0FBVyxFQUFFLFlBQVk7SUFDekIsSUFBSSxFQUFFLE1BQU07SUFDWixLQUFLLEVBQUUsT0FBTztJQUNkLGNBQWMsRUFBRSxRQUFRO0lBQ3hCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLE1BQU0sRUFBRSxRQUFRO0lBQ2hCLElBQUksRUFBRSxNQUFNO0lBQ1osV0FBVyxFQUFFLGFBQWE7SUFDMUIsU0FBUyxFQUFFLFdBQVc7SUFDdEIsS0FBSyxFQUFFLE9BQU87SUFDZCxPQUFPLEVBQUUsU0FBUztJQUNsQixNQUFNLEVBQUUsUUFBUTtJQUNoQixPQUFPLEVBQUUsU0FBUztJQUNsQixTQUFTLEVBQUUsV0FBVztJQUN0QixRQUFRLEVBQUUsVUFBVTtJQUNwQixNQUFNLEVBQUUsUUFBUTtJQUNoQixRQUFRLEVBQUUsVUFBVTtJQUNwQixNQUFNLEVBQUUsUUFBUTtJQUNoQixPQUFPLEVBQUUsU0FBUztJQUNsQixRQUFRLEVBQUUsVUFBVTtJQUNwQixLQUFLLEVBQUUsT0FBTztJQUNkLEtBQUssRUFBRSxPQUFPO0lBQ2QsR0FBRyxFQUFFLEtBQUs7SUFDVixJQUFJLEVBQUUsTUFBTTtJQUNaLElBQUksRUFBRSxNQUFNO0lBQ1osTUFBTSxFQUFFLFFBQVE7SUFDaEIsU0FBUyxFQUFFLFdBQVc7SUFDdEIsT0FBTyxFQUFFLFNBQVM7SUFDbEIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsUUFBUSxFQUFFLFVBQVU7SUFDcEIsTUFBTSxFQUFFLFFBQVE7SUFDaEIsTUFBTSxFQUFFLFFBQVE7Q0FDakIsQ0FBQztBQUNGLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUN0QixHQUFHLENBQUEsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDN0IsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBRUQsSUFBSSxnQkFBZ0IsR0FBRztJQUNyQixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFDRixJQUFJLGVBQWUsR0FBRyxFQUFFLENBQUM7QUFDekIsR0FBRyxDQUFBLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDaEMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN6QyxDQUFDO0FBRUQsSUFBSSxZQUFZLEdBQUc7SUFDakIsS0FBSyxZQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTTtRQUNoREUsTUFBTUEsR0FBR0EsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0E7UUFFekJBLElBQUlBLFNBQVNBLEdBQVdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZFQSxJQUFJQSxZQUFZQSxFQUFFQSxTQUFTQSxDQUFDQTtRQUM1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsWUFBWUEsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7UUFFekRBLElBQUlBLE1BQU1BLEdBQUdBO1lBQ1hBLEdBQUdBLEVBQUVBLEVBQUVBO1lBQ1BBLEdBQUdBLEVBQUVBLEVBQUVBO1NBQ1JBLENBQUNBO1FBQ0ZBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLGFBQWFBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFdBQVdBLEtBQUtBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3BFQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxvQkFBb0JBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1lBQ2hEQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsU0FBU0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDekdBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLElBQUlBLEtBQUtBLFFBQVNBLENBQUNBLENBQUNBLENBQUNBO1lBQzlCQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxHQUFDQSxJQUFJQSxHQUFDQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUMxQ0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcENBLElBQUlBLFNBQVNBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBO1lBQ3pDQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDcEJBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLElBQUlBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1lBQ2xDQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsS0FBS0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pDQSxJQUFJQSxTQUFTQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDbEJBLElBQUlBLGFBQWFBLEdBQUdBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBO2dCQUNsQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsSUFBSUEsTUFBTUEsR0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsQ0FBQ0E7Z0JBQ3ZDQSxPQUFPQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDbEJBLEdBQUdBLENBQUFBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUNwQkEsU0FBU0EsRUFBRUEsQ0FBQ0E7b0JBQ1pBLDBHQUEwR0E7b0JBRTFHQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDWEEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBQ0EsSUFBSUEsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZFQSxDQUFDQTtvQkFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ0pBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLEdBQUNBLEdBQUdBLEdBQUNBLElBQUlBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO29CQUM1REEsQ0FBQ0E7b0JBQ0RBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUNyREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtvQkFDckVBLENBQUNBO29CQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTt3QkFDSkEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtvQkFDbkVBLENBQUNBO29CQUNEQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtvQkFDNUJBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO29CQUU1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsS0FBS0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzVCQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxLQUFLQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtvQkFDbkNBLENBQUNBO2dCQUVIQSxDQUFDQTtnQkFDREEsT0FBT0EsQ0FBQ0EsTUFBTUEsSUFBSUEsTUFBTUEsR0FBQ0EsYUFBYUEsQ0FBQ0E7Z0JBQ3ZDQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxHQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFDQSxhQUFhQSxDQUFDQSxHQUFDQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUMxRUEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1lBQy9CQSxHQUFHQSxDQUFBQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFDaENBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUNuREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDbkVBLENBQUNBO2dCQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDSkEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDakVBLENBQUNBO2dCQUNEQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtnQkFDNUJBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQzlCQSxDQUFDQTtZQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNqQ0EsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsR0FBQ0EsSUFBSUEsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDckNBLENBQUNBO1FBRURBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLE1BQU1BLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1FBRW5HQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQTtZQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUUxREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBQ0QsS0FBSyxZQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQ3hDQyxJQUFJQSxNQUFNQSxHQUFHQTtZQUNYQSxHQUFHQSxFQUFFQSxFQUFFQTtZQUNQQSxHQUFHQSxFQUFFQSxFQUFFQTtTQUNSQSxDQUFDQTtRQUNGQSxJQUFJQSxTQUFTQSxFQUFFQSxTQUFpQkEsRUFBRUEsWUFBWUEsQ0FBQ0E7UUFHL0NBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3RGQSxJQUFJQSxTQUFTQSxHQUFXQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2RUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQUNBLFlBQVlBLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO1lBRXpEQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxHQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFDQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUMxREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzNCQSxHQUFHQSxDQUFBQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtvQkFDbkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUlBLENBQUNBLENBQUNBO3dCQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQTtvQkFHL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUNuREEsNkVBQTZFQTt3QkFDN0VBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3hFQSxDQUFDQTtvQkFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ0pBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3RFQSxDQUFDQTtvQkFDREEsTUFBTUEsQ0FBQ0EsR0FBR0EsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7b0JBQzVCQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtnQkFDOUJBLENBQUNBO1lBQ0hBLENBQUNBO1lBRURBLFNBQVNBLEdBQUdBLFdBQVdBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLE9BQU9BLEVBQUVBLFlBQVlBLENBQUNBLENBQUNBO1lBQ3RFQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUM1QkEsTUFBTUEsQ0FBQ0EsR0FBR0EsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7WUFFNUJBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1lBRS9CQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQTtnQkFBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFDNURBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLFNBQVNBLEdBQUdBLHVCQUF1QkEsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDMUVBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQzNCQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUM3QkEsQ0FBQ0E7UUFFREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBQ0QsU0FBUyxZQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQzVDQyxJQUFJQSxNQUFNQSxHQUFHQTtZQUNYQSxHQUFHQSxFQUFFQSxFQUFFQTtZQUNQQSxHQUFHQSxFQUFFQSxFQUFFQTtTQUNSQSxDQUFDQTtRQUNGQSxJQUFJQSxTQUFTQSxFQUFFQSxTQUFpQkEsRUFBRUEsWUFBWUEsQ0FBQ0E7UUFFL0NBLElBQUlBLFNBQVNBLEdBQVdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZFQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUFDQSxZQUFZQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtRQUV6REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsWUFBWUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDdEVBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcEVBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBQzNCQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUUzQkEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFFL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxTQUFTQSxHQUFHQSxpQkFBaUJBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3RFQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxTQUFTQSxHQUFHQSxpQkFBaUJBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BFQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUM1QkEsTUFBTUEsQ0FBQ0EsR0FBR0EsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7UUFFNUJBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1FBRS9CQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQTtZQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUUxREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBQ0QsVUFBVSxZQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQzdDQyxJQUFJQSxNQUFNQSxHQUFHQTtZQUNYQSxHQUFHQSxFQUFFQSxFQUFFQTtZQUNQQSxHQUFHQSxFQUFFQSxFQUFFQTtTQUNSQSxDQUFDQTtRQUNGQSxJQUFJQSxTQUFTQSxFQUFFQSxTQUFpQkEsRUFBRUEsWUFBWUEsQ0FBQ0E7UUFFL0NBLElBQUlBLFNBQVNBLEdBQVdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZFQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUFDQSxZQUFZQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtRQUV6REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsU0FBU0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDekdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3hDQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNqQ0EsQ0FBQ0E7UUFDREEsR0FBR0EsQ0FBQUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFDbkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNaQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUNsQ0EsQ0FBQ0E7WUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsWUFBWUEsS0FBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BEQSxTQUFTQSxHQUFHQSxpQkFBaUJBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1lBQ3RFQSxDQUFDQTtZQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtnQkFDSkEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUNwRUEsQ0FBQ0E7WUFDREEsTUFBTUEsQ0FBQ0EsR0FBR0EsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7WUFDNUJBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBRTlCQSxDQUFDQTtRQUVEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN4Q0EsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDakNBLENBQUNBO1FBRURBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLE1BQU1BLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ25FQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNqQ0EsQ0FBQ0E7UUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0E7WUFBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFFMURBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUNELElBQUksWUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FB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QUNBLEtBQUtBLENBQUNBO1lBQ2xDQSxPQUFPQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNsQkEsNkVBQTZFQTtZQUU3RUEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsT0FBT0EsR0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBQ0EsU0FBU0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFFbkVBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNuREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUN0RUEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDcEVBLENBQUNBO1lBRURBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQzVCQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUU1QkEsT0FBT0EsQ0FBQ0EsTUFBTUEsSUFBSUEsTUFBTUEsR0FBQ0EsYUFBYUEsQ0FBQ0E7WUFDdkNBLE9BQU9BLENBQUNBLEtBQUtBLEdBQUdBLGFBQWFBLENBQUNBO1lBRTlCQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxHQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFDQSxhQUFhQSxDQUFDQSxHQUFDQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUUxRUEsQ0FBQ0E7UUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0E7WUFBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFFMURBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUNELEdBQUcsWUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTztRQUN0Q0MsSUFBSUEsTUFBTUEsR0FBR0E7WUFDWEEsR0FBR0EsRUFBRUEsRUFBRUE7WUFDUEEsR0FBR0EsRUFBRUEsRUFBRUE7U0FDUkEsQ0FBQ0E7UUFDRkEsSUFBSUEsU0FBU0EsRUFBRUEsU0FBaUJBLEVBQUVBLFlBQVlBLENBQUNBO1FBRS9DQSxJQUFJQSxTQUFTQSxHQUFXQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN2RUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFBQ0EsWUFBWUEsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7UUFFekRBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLE1BQU1BLEdBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1FBRTdDQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQTtZQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUMxREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBQ0QsT0FBTyxZQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQzFDQyxvQ0FBb0NBO1FBQ3BDQSxJQUFJQSxNQUFNQSxHQUFHQTtZQUNYQSxHQUFHQSxFQUFFQSxFQUFFQTtZQUNQQSxHQUFHQSxFQUFFQSxFQUFFQTtTQUNSQSxDQUFDQTtRQUNGQSxJQUFJQSxTQUFTQSxFQUFFQSxTQUFpQkEsRUFBRUEsWUFBWUEsQ0FBQ0E7UUFFL0NBLElBQUlBLFNBQVNBLEdBQVdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZFQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUFDQSxZQUFZQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtRQUV6REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDekJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNuREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUN0RUEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDcEVBLENBQUNBO1lBQ0RBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQzNCQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUUzQkEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDcENBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLE9BQU9BLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1lBRW5DQSxHQUFHQSxDQUFBQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtnQkFDbkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUNuREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDdEVBLENBQUNBO2dCQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDSkEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDcEVBLENBQUNBO2dCQUNEQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtnQkFDNUJBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO2dCQUU1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pCQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxFQUFHQSxTQUFTQSxDQUFDQSxDQUFDQTtnQkFDbkNBLENBQUNBO1lBQ0hBLENBQUNBO1FBQ0hBLENBQUNBO1FBRURBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ25EQSxTQUFTQSxHQUFHQSxpQkFBaUJBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3RFQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxTQUFTQSxHQUFHQSxpQkFBaUJBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLElBQUlBLEVBQUVBLElBQUlBLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1FBQ3BFQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUM1QkEsTUFBTUEsQ0FBQ0EsR0FBR0EsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7UUFFNUJBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLFNBQVNBLENBQUNBLENBQUNBO1FBRS9CQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQTtZQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUUxREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBQ0QsWUFBWSxZQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQy9DQyxJQUFJQSxNQUFNQSxHQUFHQTtZQUNYQSxHQUFHQSxFQUFFQSxFQUFFQTtZQUNQQSxHQUFHQSxFQUFFQSxFQUFFQTtTQUNSQSxDQUFDQTtRQUNGQSxJQUFJQSxTQUFTQSxFQUFFQSxTQUFpQkEsRUFBRUEsWUFBWUEsQ0FBQ0E7UUFFL0NBLElBQUlBLFNBQVNBLEdBQVdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO1FBQ3ZFQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUFDQSxZQUFZQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtRQUV6REEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsT0FBT0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFFbkNBLEVBQUVBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBO1lBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO1FBQzFEQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtJQUNoQkEsQ0FBQ0E7SUFDRCxJQUFJLFlBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU87UUFDdkNDLElBQUlBLE1BQU1BLEdBQUdBO1lBQ1hBLEdBQUdBLEVBQUVBLEVBQUVBO1lBQ1BBLEdBQUdBLEVBQUVBLEVBQUVBO1NBQ1JBLENBQUNBO1FBQ0ZBLElBQUlBLFNBQVNBLEVBQUVBLFNBQWlCQSxFQUFFQSxZQUFZQSxDQUFDQTtRQUUvQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDOUNBLFNBQVNBLEdBQUdBLDhCQUE4QkEsQ0FBQ0EsSUFBSUEsRUFBRUEsS0FBS0EsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDakZBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQzNCQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUM3QkEsQ0FBQ0E7UUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDSkEsU0FBU0EsR0FBR0EsdUJBQXVCQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUMxRUEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7WUFDM0JBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBQzdCQSxDQUFDQTtRQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtJQUNoQkEsQ0FBQ0E7SUFDRCxHQUFHLFlBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU87UUFDdENDLElBQUlBLE1BQU1B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Q0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdEZBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUVBLElBQUlBLEVBQUdBLFNBQVNBLENBQUNBLENBQUNBO1FBQ25DQSxDQUFDQTtRQUVEQSxTQUFTQSxHQUFHQSxXQUFXQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxFQUFFQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUV6RkEsTUFBTUEsQ0FBQ0EsR0FBR0EsSUFBSUEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7UUFDNUJBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBRTVCQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQTtZQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUM1REEsQ0FBQ0E7SUFFREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7QUFDaEJBLENBQUNBO0FBRUQsaUNBQWlDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO0lBQ25FQyxJQUFJQSxNQUFNQSxHQUFHQTtRQUNYQSxHQUFHQSxFQUFFQSxFQUFFQTtRQUNQQSxHQUFHQSxFQUFFQSxFQUFFQTtLQUNSQSxDQUFDQTtJQUNGQSxJQUFJQSxTQUFTQSxFQUFFQSxZQUFZQSxFQUFFQSxTQUFpQkEsQ0FBQ0E7SUFFL0NBLGdCQUFnQkE7SUFDZEEsSUFBSUEsU0FBU0EsR0FBV0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDdkVBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQUNBLFlBQVlBLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO0lBRXpEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxZQUFZQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxZQUFZQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUNuREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUN0RUEsQ0FBQ0E7SUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDSkEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtJQUNwRUEsQ0FBQ0E7SUFDREEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7SUFDM0JBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO0lBRTNCQSxJQUFJQSxLQUFLQSxHQUFHQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUN0Q0EsSUFBSUEsSUFBSUEsR0FBR0EsS0FBS0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsR0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDakNBLElBQUlBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBO0lBQzlCQSxHQUFHQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUU1QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBQ0EsR0FBR0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDNUJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBO1lBQUNBLE9BQU9BLENBQUNBLEtBQUtBLElBQUlBLE1BQU1BLENBQUNBO1FBQ2pEQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxHQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxHQUFDQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxFQUFHQSxTQUFTQSxDQUFDQSxDQUFDQTtJQUN2RUEsQ0FBQ0E7SUFFREEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsR0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsR0FBR0EsRUFBR0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFDMURBLE9BQU9BLENBQUNBLE1BQU1BLElBQUlBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBO0lBQ2hDQSxJQUFJQSxhQUFhQSxHQUFHQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQTtJQUNsQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFFbEJBLEdBQUdBLENBQUFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUNBLENBQUNBLEVBQUVBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1FBQ25DQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNaQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxFQUFHQSxTQUFTQSxDQUFDQSxDQUFDQTtRQUNuQ0EsQ0FBQ0E7UUFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsWUFBWUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsWUFBWUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDbkRBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDdEVBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLENBQUNBO1lBQ0pBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDcEVBLENBQUNBO1FBQ0RBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBQzVCQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtJQUM5QkEsQ0FBQ0E7SUFFREEsU0FBU0EsR0FBR0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsRUFBRUEsWUFBWUEsQ0FBQ0EsQ0FBQ0E7SUFDeEVBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO0lBQzFCQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtJQUU1QkEsT0FBT0EsQ0FBQ0EsTUFBTUEsSUFBSUEsYUFBYUEsQ0FBQ0E7SUFDaENBLE9BQU9BLENBQUNBLEtBQUtBLEdBQUdBLGFBQWFBLENBQUNBO0lBRTlCQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFHQSxTQUFTQSxDQUFDQSxDQUFDQTtJQUVoQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsU0FBU0EsQ0FBQ0E7UUFBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFDNURBOzs7OztNQUtFQTtJQUdGQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtBQUNoQkEsQ0FBQ0E7QUFFRCx3Q0FBd0MsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU87SUFDMUVDLElBQUlBLE1BQU1BLEdBQUdBO1FBQ1hBLEdBQUdBLEVBQUVBLEVBQUVBO1FBQ1BBLEdBQUdBLEVBQUVBLEVBQUVBO0tBQ1JBLENBQUNBO0lBQ0ZBLElBQUlBLFNBQVNBLEVBQUVBLFlBQVlBLEVBQUVBLFNBQWlCQSxDQUFDQTtJQUUvQ0EsSUFBSUEsU0FBU0EsR0FBV0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDdkVBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQUNBLFlBQVlBLEdBQUdBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO0lBRXpEQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUN2QkEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsSUFBSUEsR0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDdERBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUVEQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxHQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFDQSxHQUFHQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtJQUUxREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDM0JBLEdBQUdBLENBQUFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUNBLENBQUNBLEVBQUVBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBO1lBQ25DQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsSUFBSUEsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFlBQVlBLElBQUlBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFlBQVlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNuREEsU0FBU0EsR0FBR0EsaUJBQWlCQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUN0RUEsQ0FBQ0E7WUFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLFNBQVNBLEdBQUdBLGlCQUFpQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7WUFDcEVBLENBQUNBO1lBQ0RBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1lBQzVCQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtRQUM5QkEsQ0FBQ0E7SUFDSEEsQ0FBQ0E7SUFFREEsU0FBU0EsR0FBR0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsTUFBTUEsRUFBRUEsT0FBT0EsRUFBRUEsWUFBWUEsQ0FBQ0EsQ0FBQ0E7SUFDdEVBLE1BQU1BLENBQUNBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO0lBQzVCQSxNQUFNQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtJQUU1QkEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7SUFFL0JBLEVBQUVBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBO1FBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO0lBRTFEQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtBQUNoQkEsQ0FBQ0E7QUFFRCwyQkFBa0MsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU87SUFDcEVDLElBQUlBLE1BQU1BLEdBQUdBO1FBQ1hBLEdBQUdBLEVBQUVBLEVBQUVBO1FBQ1BBLEdBQUdBLEVBQUVBLEVBQUVBO0tBQ1JBLENBQUNBO0lBQ0ZBLElBQUlBLFNBQVNBLEVBQUVBLFlBQVlBLEVBQUVBLFNBQWlCQSxDQUFDQTtJQUUvQ0Esb0NBQW9DQTtJQUNwQ0EsMkJBQTJCQTtJQUUzQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDeEJBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3RCQSxJQUFJQSxTQUFTQSxHQUFXQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN2RUEsTUFBTUEsQ0FBQ0EsTUFBTUEsRUFBRUEsV0FBV0EsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLENBQUNBO1FBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLFdBQVdBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzlCQSxTQUFTQSxHQUFHQSxXQUFXQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUN2RUEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7WUFDM0JBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBQzdCQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM1QkEsU0FBU0EsR0FBR0EsOEJBQThCQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUNqRkEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7WUFDM0JBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO1FBQzdCQSxDQUFDQTtRQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUNKQSxTQUFTQSxHQUFHQSx1QkFBdUJBLENBQUNBLElBQUlBLEVBQUVBLEtBQUtBLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE9BQU9BLENBQUNBLENBQUNBO1lBQzFFQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxTQUFTQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUMzQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7UUFDN0JBLENBQUNBO0lBQ0hBLENBQUNBO0lBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLEtBQUtBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBO1FBQzVCQSxTQUFTQSxHQUFHQSxXQUFXQSxDQUFDQSxTQUFTQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxLQUFLQSxFQUFFQSxNQUFNQSxFQUFFQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtRQUUvRUEsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0E7UUFDM0JBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBO0lBQzdCQSxDQUFDQTtJQUNEQSxJQUFJQSxDQUFDQSxDQUFDQTtJQUVOQSxDQUFDQTtJQUNEQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtBQUNoQkEsQ0FBQ0E7QUF6Q2UseUJBQWlCLG9CQXlDaEMsQ0FBQTtBQUVELG1CQUFtQixHQUFHO0lBQ3BCQyxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxFQUFFQSxVQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxJQUFLQSxPQUFBQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxFQUFsQkEsQ0FBa0JBLENBQUNBLENBQUNBO0FBQy9EQSxDQUFDQSJ9