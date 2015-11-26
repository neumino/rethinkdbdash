import { Writable } from 'stream';
export declare class WritableStream extends Writable {
    _i: any;
    _sequence: any;
    _insertOptions: any;
    _highWaterMark: any;
    _connection: any;
    _delayed: any;
    _inserting: any;
    _pendingCallback: any;
    _cache: any;
    _options: any;
    _table: any;
    _writableState: any;
    _insert(): void;
    _next(value: any, encoding: any, done: any): void;
    _write(value: any, encoding: any, done: any): void;
    constructor(table: any, options: any, connection: any);
}
