export declare function createLogger(poolMaster: any, silent: any): (message: any) => void;
export declare function isPlainObject(obj: any): boolean;
export declare function toArray(args: any): any;
export declare function hasImplicit(arg: any): boolean;
export declare function loopKeys(obj: any, fn: any): void;
export declare function convertPseudoType(obj: any, options: any): any;
export declare function makeAtom(response: any, options?: any): any;
export declare function makeSequence(response: any, options: any): any;
export declare function changeProto<T>(object: any, other: any): T;
export declare function getCanonicalAddress(addresses: any): any;
export declare const localhostAliases: {
    'localhost': boolean;
    '127.0.0.1': boolean;
    '::1': boolean;
};
export declare function tryCatch(toTry: any, handleError: any): void;
