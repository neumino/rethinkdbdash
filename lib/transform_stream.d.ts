import { Transform } from 'stream';
export declare class TransformStream extends Transform {
    _flushCallback: any;
    _writableState: any;
    _sequence: any;
    _insertOptions: any;
    _highWaterMark: any;
    _connection: any;
    _delayed: any;
    _inserting: any;
    _ended: any;
    _pendingCallback: any;
    _cache: any;
    _options: any;
    _r: any;
    _table: any;
    constructor(table: any, options: any, connection: any);
    _flush(done: any): void;
    _insert(): void;
    _next(value: any, encoding: any, done: any): void;
    _transform(value: any, encoding: any, done: any): void;
}
