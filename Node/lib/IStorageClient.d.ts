export interface IStorageClient {
    initialize(callback: (error: any) => void): void;
    insertOrReplace(partitionKey: string, rowKey: string, entity: any, isCompressed: boolean, callback: (error: any, etag: any, response: IHttpResponse) => void): void;
    retrieve(partitionKey: string, rowKey: string, callback: (error: any, entity: IBotEntity, response: IHttpResponse) => void): void;
    accountName: string;
    tableName: string;
}
export interface IBotEntity {
    data: any;
    isCompressed: boolean;
}
export interface IHttpResponse {
    isSuccessful: boolean;
    statusCode: string;
}
export interface IStorageError {
    code: string;
    message: string;
    statusCode: string;
}
export interface IAzureTableClient extends IStorageClient {
}
