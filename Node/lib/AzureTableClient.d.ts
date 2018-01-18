import { IStorageClient, IHttpResponse, IBotEntity } from './IStorageClient';
export interface IBotTableEntity extends IBotEntity {
    partitionKey: string;
    rowKey: string;
}
export interface IProxyService {
    protocol: string;
    host: string;
    port: number;
}
export declare class AzureTableClient implements IStorageClient {
    private readonly connectionString;
    private readonly accountName;
    private readonly accountKey;
    private readonly tableName;
    private readonly proxy;
    private readonly useDevelopmentStorage;
    constructor(tableName: string, accountName?: string, accountKey?: string, proxy?: IProxyService);
    /** Initializes the Azure Table client */
    initialize(callback: (error: Error) => void): void;
    /** Inserts or replaces an entity in the table */
    insertOrReplace(partitionKey: string, rowKey: string, data: any, isCompressed: boolean, callback: (error: Error, etag: any, response: IHttpResponse) => void): void;
    /** Retrieves an entity from the table */
    retrieve(partitionKey: string, rowKey: string, callback: (error: Error, entity: IBotEntity, response: IHttpResponse) => void): void;
    private static toBotEntity(tableResult);
    private buildTableService();
    private static getError(error, response);
}
