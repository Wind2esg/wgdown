/**
 * wgdown ts
 *
 * wgdown is a download tool using child process
 *
 * @author wind2esg
 * @date 20190930
 *
 * #parent
 *
 * type def
 * and parent
 */
export interface Log {
    exist: number;
    noResource: number;
    download: number;
    error: number;
    child: number;
}
export interface Options {
    list: Array<DownloadTarget>;
    cpus: number;
    errorLimit: number;
    quiet: boolean;
    callback(log: Log, errorList: Array<string>): void;
}
export interface DownloadTarget {
    serverPath: string;
    localPath: string;
}
export declare class Wgdown {
    options: Options;
    childPath: string;
    log: Log;
    errorList: Array<string>;
    constructor(options: Options, childPath?: string);
    parent(): void;
    download(): void;
}
