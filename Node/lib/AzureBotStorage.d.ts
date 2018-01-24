import * as builder from 'botbuilder-proxy';
import { IStorageClient } from './IStorageClient';
export interface IAzureBotStorageOptions {
    /** If true the data will be gzipped prior to writing to storage. */
    gzipData?: boolean;
}
export declare class AzureBotStorage implements builder.IBotStorage {
    private options;
    private storageClient;
    private logFunc;
    private initializeTableClientPromise;
    private storageClientInitialized;
    constructor(options: IAzureBotStorageOptions, storageClient?: IStorageClient, logFunc?: (logObject: any) => void);
    client(storageClient: IStorageClient): this;
    /** Reads in data from storage. */
    getData(context: builder.IBotStorageContext, callback: (err: Error, data: builder.IBotStorageData) => void): void;
    /** Writes out data to storage. */
    saveData(context: builder.IBotStorageContext, data: builder.IBotStorageData, callback?: (err: Error) => void): void;
    private initializeStorageClient();
}
