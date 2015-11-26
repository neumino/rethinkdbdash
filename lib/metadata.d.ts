export declare class Metadata {
    endReject: any;
    endResolve: any;
    removeEndCallbacks(): void;
    removeCallbacks(): void;
    setCallbacks(resolve: any, reject: any): void;
    setEnd(resolve: any, reject: any): void;
    setCursor(): void;
    cursor: any;
    options: any;
    query: any;
    reject: any;
    resolve: any;
    constructor(resolve: any, reject: any, query: any, options: any);
}
