import { IStorageClient, IHttpResponse, IBotEntity } from './IStorageClient';
import { ConnectionOptions, ConnectionConfig } from "tedious";
/**
 * IAzureSqlConfiguration extends ConnectionConfig to take IAzureSqlOptions
 */
export interface IAzureSqlConfiguration extends ConnectionConfig {
    /**
     * IAzureSqlOptions which extends ConnectionOptions.
     * Includes "table" parameter
     */
    options: IAzureSqlOptions;
    /**
     * Flag to set if user wishes BotBuilder-Azure to create specified table if it doesn't exist.
     * By default is set to false.
     */
    enforceTable: boolean;
}
/**
 * IAzureSqlOptions extends ConnectionOptions to include "table" and custom note for "encrypt".
 */
export interface IAzureSqlOptions extends ConnectionOptions {
    /**
     * Table name must be included.
     */
    table: string;
    /**
     * "encrypt" MUST be set to true to work with Azure SQL
     */
    encrypt?: boolean;
}
export declare class AzureSqlClient implements IStorageClient {
    private options;
    constructor(options: IAzureSqlConfiguration);
    /** Initializes the SQL Server client */
    initialize(callback: (error: any) => void): void;
    /** Inserts or replaces an entity in the table */
    insertOrReplace(partitionKey: string, rowKey: string, entity: any, isCompressed: boolean, callback: (error: any, etag: any, response: IHttpResponse) => void): void;
    /** Retrieves an entity from the table */
    retrieve(partitionKey: string, rowKey: string, callback: (error: any, entity: IBotEntity, response: IHttpResponse) => void): void;
    private static getError(error);
    private static addParameters(request, id, data?, isCompressed?);
}
