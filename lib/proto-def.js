module.exports = require("protobufjs").newBuilder().import({
    "package": null,
    "messages": [
        {
            "name": "VersionDummy",
            "fields": [],
            "enums": [
                {
                    "name": "Version",
                    "values": [
                        {
                            "name": "V0_1",
                            "id": 1063369270
                        },
                        {
                            "name": "V0_2",
                            "id": 1915781601
                        }
                    ],
                    "options": {}
                }
            ],
            "messages": [],
            "options": {}
        },
        {
            "name": "Query",
            "fields": [
                {
                    "rule": "optional",
                    "type": "QueryType",
                    "name": "type",
                    "id": 1,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "Term",
                    "name": "query",
                    "id": 2,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "int64",
                    "name": "token",
                    "id": 3,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "bool",
                    "name": "OBSOLETE_noreply",
                    "id": 4,
                    "options": {
                        "default": "false"
                    }
                },
                {
                    "rule": "optional",
                    "type": "bool",
                    "name": "accepts_r_json",
                    "id": 5,
                    "options": {
                        "default": "false"
                    }
                },
                {
                    "rule": "repeated",
                    "type": "AssocPair",
                    "name": "global_optargs",
                    "id": 6,
                    "options": {}
                }
            ],
            "enums": [
                {
                    "name": "QueryType",
                    "values": [
                        {
                            "name": "START",
                            "id": 1
                        },
                        {
                            "name": "CONTINUE",
                            "id": 2
                        },
                        {
                            "name": "STOP",
                            "id": 3
                        },
                        {
                            "name": "NOREPLY_WAIT",
                            "id": 4
                        }
                    ],
                    "options": {}
                }
            ],
            "messages": [
                {
                    "name": "AssocPair",
                    "fields": [
                        {
                            "rule": "optional",
                            "type": "string",
                            "name": "key",
                            "id": 1,
                            "options": {}
                        },
                        {
                            "rule": "optional",
                            "type": "Term",
                            "name": "val",
                            "id": 2,
                            "options": {}
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {}
                }
            ],
            "options": {}
        },
        {
            "name": "Frame",
            "fields": [
                {
                    "rule": "optional",
                    "type": "FrameType",
                    "name": "type",
                    "id": 1,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "int64",
                    "name": "pos",
                    "id": 2,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "string",
                    "name": "opt",
                    "id": 3,
                    "options": {}
                }
            ],
            "enums": [
                {
                    "name": "FrameType",
                    "values": [
                        {
                            "name": "POS",
                            "id": 1
                        },
                        {
                            "name": "OPT",
                            "id": 2
                        }
                    ],
                    "options": {}
                }
            ],
            "messages": [],
            "options": {}
        },
        {
            "name": "Backtrace",
            "fields": [
                {
                    "rule": "repeated",
                    "type": "Frame",
                    "name": "frames",
                    "id": 1,
                    "options": {}
                }
            ],
            "enums": [],
            "messages": [],
            "options": {}
        },
        {
            "name": "Response",
            "fields": [
                {
                    "rule": "optional",
                    "type": "ResponseType",
                    "name": "type",
                    "id": 1,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "int64",
                    "name": "token",
                    "id": 2,
                    "options": {}
                },
                {
                    "rule": "repeated",
                    "type": "Datum",
                    "name": "response",
                    "id": 3,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "Backtrace",
                    "name": "backtrace",
                    "id": 4,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "Datum",
                    "name": "profile",
                    "id": 5,
                    "options": {}
                }
            ],
            "enums": [
                {
                    "name": "ResponseType",
                    "values": [
                        {
                            "name": "SUCCESS_ATOM",
                            "id": 1
                        },
                        {
                            "name": "SUCCESS_SEQUENCE",
                            "id": 2
                        },
                        {
                            "name": "SUCCESS_PARTIAL",
                            "id": 3
                        },
                        {
                            "name": "WAIT_COMPLETE",
                            "id": 4
                        },
                        {
                            "name": "CLIENT_ERROR",
                            "id": 16
                        },
                        {
                            "name": "COMPILE_ERROR",
                            "id": 17
                        },
                        {
                            "name": "RUNTIME_ERROR",
                            "id": 18
                        }
                    ],
                    "options": {}
                }
            ],
            "messages": [],
            "options": {}
        },
        {
            "name": "Datum",
            "fields": [
                {
                    "rule": "optional",
                    "type": "DatumType",
                    "name": "type",
                    "id": 1,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "bool",
                    "name": "r_bool",
                    "id": 2,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "double",
                    "name": "r_num",
                    "id": 3,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "string",
                    "name": "r_str",
                    "id": 4,
                    "options": {}
                },
                {
                    "rule": "repeated",
                    "type": "Datum",
                    "name": "r_array",
                    "id": 5,
                    "options": {}
                },
                {
                    "rule": "repeated",
                    "type": "AssocPair",
                    "name": "r_object",
                    "id": 6,
                    "options": {}
                }
            ],
            "enums": [
                {
                    "name": "DatumType",
                    "values": [
                        {
                            "name": "R_NULL",
                            "id": 1
                        },
                        {
                            "name": "R_BOOL",
                            "id": 2
                        },
                        {
                            "name": "R_NUM",
                            "id": 3
                        },
                        {
                            "name": "R_STR",
                            "id": 4
                        },
                        {
                            "name": "R_ARRAY",
                            "id": 5
                        },
                        {
                            "name": "R_OBJECT",
                            "id": 6
                        },
                        {
                            "name": "R_JSON",
                            "id": 7
                        }
                    ],
                    "options": {}
                }
            ],
            "messages": [
                {
                    "name": "AssocPair",
                    "fields": [
                        {
                            "rule": "optional",
                            "type": "string",
                            "name": "key",
                            "id": 1,
                            "options": {}
                        },
                        {
                            "rule": "optional",
                            "type": "Datum",
                            "name": "val",
                            "id": 2,
                            "options": {}
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {}
                }
            ],
            "options": {}
        },
        {
            "name": "Term",
            "fields": [
                {
                    "rule": "optional",
                    "type": "TermType",
                    "name": "type",
                    "id": 1,
                    "options": {}
                },
                {
                    "rule": "optional",
                    "type": "Datum",
                    "name": "datum",
                    "id": 2,
                    "options": {}
                },
                {
                    "rule": "repeated",
                    "type": "Term",
                    "name": "args",
                    "id": 3,
                    "options": {}
                },
                {
                    "rule": "repeated",
                    "type": "AssocPair",
                    "name": "optargs",
                    "id": 4,
                    "options": {}
                }
            ],
            "enums": [
                {
                    "name": "TermType",
                    "values": [
                        {
                            "name": "DATUM",
                            "id": 1
                        },
                        {
                            "name": "MAKE_ARRAY",
                            "id": 2
                        },
                        {
                            "name": "MAKE_OBJ",
                            "id": 3
                        },
                        {
                            "name": "VAR",
                            "id": 10
                        },
                        {
                            "name": "JAVASCRIPT",
                            "id": 11
                        },
                        {
                            "name": "ERROR",
                            "id": 12
                        },
                        {
                            "name": "IMPLICIT_VAR",
                            "id": 13
                        },
                        {
                            "name": "DB",
                            "id": 14
                        },
                        {
                            "name": "TABLE",
                            "id": 15
                        },
                        {
                            "name": "GET",
                            "id": 16
                        },
                        {
                            "name": "GET_ALL",
                            "id": 78
                        },
                        {
                            "name": "EQ",
                            "id": 17
                        },
                        {
                            "name": "NE",
                            "id": 18
                        },
                        {
                            "name": "LT",
                            "id": 19
                        },
                        {
                            "name": "LE",
                            "id": 20
                        },
                        {
                            "name": "GT",
                            "id": 21
                        },
                        {
                            "name": "GE",
                            "id": 22
                        },
                        {
                            "name": "NOT",
                            "id": 23
                        },
                        {
                            "name": "ADD",
                            "id": 24
                        },
                        {
                            "name": "SUB",
                            "id": 25
                        },
                        {
                            "name": "MUL",
                            "id": 26
                        },
                        {
                            "name": "DIV",
                            "id": 27
                        },
                        {
                            "name": "MOD",
                            "id": 28
                        },
                        {
                            "name": "APPEND",
                            "id": 29
                        },
                        {
                            "name": "PREPEND",
                            "id": 80
                        },
                        {
                            "name": "DIFFERENCE",
                            "id": 95
                        },
                        {
                            "name": "SET_INSERT",
                            "id": 88
                        },
                        {
                            "name": "SET_INTERSECTION",
                            "id": 89
                        },
                        {
                            "name": "SET_UNION",
                            "id": 90
                        },
                        {
                            "name": "SET_DIFFERENCE",
                            "id": 91
                        },
                        {
                            "name": "SLICE",
                            "id": 30
                        },
                        {
                            "name": "SKIP",
                            "id": 70
                        },
                        {
                            "name": "LIMIT",
                            "id": 71
                        },
                        {
                            "name": "INDEXES_OF",
                            "id": 87
                        },
                        {
                            "name": "CONTAINS",
                            "id": 93
                        },
                        {
                            "name": "GET_FIELD",
                            "id": 31
                        },
                        {
                            "name": "KEYS",
                            "id": 94
                        },
                        {
                            "name": "HAS_FIELDS",
                            "id": 32
                        },
                        {
                            "name": "WITH_FIELDS",
                            "id": 96
                        },
                        {
                            "name": "PLUCK",
                            "id": 33
                        },
                        {
                            "name": "WITHOUT",
                            "id": 34
                        },
                        {
                            "name": "MERGE",
                            "id": 35
                        },
                        {
                            "name": "BETWEEN",
                            "id": 36
                        },
                        {
                            "name": "REDUCE",
                            "id": 37
                        },
                        {
                            "name": "MAP",
                            "id": 38
                        },
                        {
                            "name": "FILTER",
                            "id": 39
                        },
                        {
                            "name": "CONCATMAP",
                            "id": 40
                        },
                        {
                            "name": "ORDERBY",
                            "id": 41
                        },
                        {
                            "name": "DISTINCT",
                            "id": 42
                        },
                        {
                            "name": "COUNT",
                            "id": 43
                        },
                        {
                            "name": "IS_EMPTY",
                            "id": 86
                        },
                        {
                            "name": "UNION",
                            "id": 44
                        },
                        {
                            "name": "NTH",
                            "id": 45
                        },
                        {
                            "name": "GROUPED_MAP_REDUCE",
                            "id": 46
                        },
                        {
                            "name": "GROUPBY",
                            "id": 47
                        },
                        {
                            "name": "INNER_JOIN",
                            "id": 48
                        },
                        {
                            "name": "OUTER_JOIN",
                            "id": 49
                        },
                        {
                            "name": "EQ_JOIN",
                            "id": 50
                        },
                        {
                            "name": "ZIP",
                            "id": 72
                        },
                        {
                            "name": "INSERT_AT",
                            "id": 82
                        },
                        {
                            "name": "DELETE_AT",
                            "id": 83
                        },
                        {
                            "name": "CHANGE_AT",
                            "id": 84
                        },
                        {
                            "name": "SPLICE_AT",
                            "id": 85
                        },
                        {
                            "name": "COERCE_TO",
                            "id": 51
                        },
                        {
                            "name": "TYPEOF",
                            "id": 52
                        },
                        {
                            "name": "UPDATE",
                            "id": 53
                        },
                        {
                            "name": "DELETE",
                            "id": 54
                        },
                        {
                            "name": "REPLACE",
                            "id": 55
                        },
                        {
                            "name": "INSERT",
                            "id": 56
                        },
                        {
                            "name": "DB_CREATE",
                            "id": 57
                        },
                        {
                            "name": "DB_DROP",
                            "id": 58
                        },
                        {
                            "name": "DB_LIST",
                            "id": 59
                        },
                        {
                            "name": "TABLE_CREATE",
                            "id": 60
                        },
                        {
                            "name": "TABLE_DROP",
                            "id": 61
                        },
                        {
                            "name": "TABLE_LIST",
                            "id": 62
                        },
                        {
                            "name": "SYNC",
                            "id": 138
                        },
                        {
                            "name": "INDEX_CREATE",
                            "id": 75
                        },
                        {
                            "name": "INDEX_DROP",
                            "id": 76
                        },
                        {
                            "name": "INDEX_LIST",
                            "id": 77
                        },
                        {
                            "name": "INDEX_STATUS",
                            "id": 139
                        },
                        {
                            "name": "INDEX_WAIT",
                            "id": 140
                        },
                        {
                            "name": "FUNCALL",
                            "id": 64
                        },
                        {
                            "name": "BRANCH",
                            "id": 65
                        },
                        {
                            "name": "ANY",
                            "id": 66
                        },
                        {
                            "name": "ALL",
                            "id": 67
                        },
                        {
                            "name": "FOREACH",
                            "id": 68
                        },
                        {
                            "name": "FUNC",
                            "id": 69
                        },
                        {
                            "name": "ASC",
                            "id": 73
                        },
                        {
                            "name": "DESC",
                            "id": 74
                        },
                        {
                            "name": "INFO",
                            "id": 79
                        },
                        {
                            "name": "MATCH",
                            "id": 97
                        },
                        {
                            "name": "UPCASE",
                            "id": 141
                        },
                        {
                            "name": "DOWNCASE",
                            "id": 142
                        },
                        {
                            "name": "SAMPLE",
                            "id": 81
                        },
                        {
                            "name": "DEFAULT",
                            "id": 92
                        },
                        {
                            "name": "JSON",
                            "id": 98
                        },
                        {
                            "name": "ISO8601",
                            "id": 99
                        },
                        {
                            "name": "TO_ISO8601",
                            "id": 100
                        },
                        {
                            "name": "EPOCH_TIME",
                            "id": 101
                        },
                        {
                            "name": "TO_EPOCH_TIME",
                            "id": 102
                        },
                        {
                            "name": "NOW",
                            "id": 103
                        },
                        {
                            "name": "IN_TIMEZONE",
                            "id": 104
                        },
                        {
                            "name": "DURING",
                            "id": 105
                        },
                        {
                            "name": "DATE",
                            "id": 106
                        },
                        {
                            "name": "TIME_OF_DAY",
                            "id": 126
                        },
                        {
                            "name": "TIMEZONE",
                            "id": 127
                        },
                        {
                            "name": "YEAR",
                            "id": 128
                        },
                        {
                            "name": "MONTH",
                            "id": 129
                        },
                        {
                            "name": "DAY",
                            "id": 130
                        },
                        {
                            "name": "DAY_OF_WEEK",
                            "id": 131
                        },
                        {
                            "name": "DAY_OF_YEAR",
                            "id": 132
                        },
                        {
                            "name": "HOURS",
                            "id": 133
                        },
                        {
                            "name": "MINUTES",
                            "id": 134
                        },
                        {
                            "name": "SECONDS",
                            "id": 135
                        },
                        {
                            "name": "TIME",
                            "id": 136
                        },
                        {
                            "name": "MONDAY",
                            "id": 107
                        },
                        {
                            "name": "TUESDAY",
                            "id": 108
                        },
                        {
                            "name": "WEDNESDAY",
                            "id": 109
                        },
                        {
                            "name": "THURSDAY",
                            "id": 110
                        },
                        {
                            "name": "FRIDAY",
                            "id": 111
                        },
                        {
                            "name": "SATURDAY",
                            "id": 112
                        },
                        {
                            "name": "SUNDAY",
                            "id": 113
                        },
                        {
                            "name": "JANUARY",
                            "id": 114
                        },
                        {
                            "name": "FEBRUARY",
                            "id": 115
                        },
                        {
                            "name": "MARCH",
                            "id": 116
                        },
                        {
                            "name": "APRIL",
                            "id": 117
                        },
                        {
                            "name": "MAY",
                            "id": 118
                        },
                        {
                            "name": "JUNE",
                            "id": 119
                        },
                        {
                            "name": "JULY",
                            "id": 120
                        },
                        {
                            "name": "AUGUST",
                            "id": 121
                        },
                        {
                            "name": "SEPTEMBER",
                            "id": 122
                        },
                        {
                            "name": "OCTOBER",
                            "id": 123
                        },
                        {
                            "name": "NOVEMBER",
                            "id": 124
                        },
                        {
                            "name": "DECEMBER",
                            "id": 125
                        },
                        {
                            "name": "LITERAL",
                            "id": 137
                        }
                    ],
                    "options": {}
                }
            ],
            "messages": [
                {
                    "name": "AssocPair",
                    "fields": [
                        {
                            "rule": "optional",
                            "type": "string",
                            "name": "key",
                            "id": 1,
                            "options": {}
                        },
                        {
                            "rule": "optional",
                            "type": "Term",
                            "name": "val",
                            "id": 2,
                            "options": {}
                        }
                    ],
                    "enums": [],
                    "messages": [],
                    "options": {}
                }
            ],
            "options": {}
        }
    ],
    "enums": [],
    "imports": [],
    "options": {}
}).build();
