import { Readable } from 'stream';
export declare class ReadableStream extends Readable {
    private Cursor;
    _recursion: any;
    _highWaterMark: any;
    _maxRecursion: any;
    _index: any;
    _pending: any;
    _cursor: any;
    _count: any;
    constructor(options: any, cursor?: any);
    close(): any;
    _fetch(): void;
    _fetchAndDecrement(): void;
    _read(size: any): void;
    _setCursor(cursor: any): ReadableStream;
}
