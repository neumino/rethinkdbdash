export declare class ReqlDriverError extends Error {
    IS_OPERATIONAL: any;
    setOperational(): ReqlDriverError;
    message: any;
    name: string;
    constructor(message: any, query?: any, secondMessage?: any);
}
export declare class ReqlServerError extends Error {
    message: any;
    name: string;
    IS_OPERATIONAL: boolean;
    constructor(message: any, query?: any);
}
export declare class ReqlRuntimeError extends Error {
    IS_OPERATIONAL: boolean;
    setName(type: any): void;
    private protoErrorType;
    frames: any;
    message: any;
    name: string;
    constructor(message: any, query?: any, frames?: any);
}
export declare class ReqlCompileError extends Error {
    IS_OPERATIONAL: boolean;
    frames: any;
    message: any;
    name: string;
    constructor(message: any, query?: any, frames?: any);
}
export declare class ReqlClientError extends Error {
    message: any;
    name: string;
    IS_OPERATIONAL: boolean;
    constructor(message: any);
}
export declare function generateBacktrace(term: any, index: any, father: any, frames: any, options: any): {
    str: string;
    car: string;
};
