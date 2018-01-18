import { IStorageClient, IHttpResponse, IBotEntity } from './IStorageClient';
import { DatabaseMeta, CollectionMeta, RetrievedDocument, QueryIterator, UniqueId, RequestOptions, RequestCallback, NewDocument, Collection, SqlQuerySpec, FeedOptions } from 'documentdb';
export interface IDocumentDbOptions {
    host: string;
    masterKey: string;
    database: string;
    collection: string;
    proxy?: string;
}
export interface IDocDbEntity extends IBotEntity {
    id: string;
}
export declare class DocumentDbClient implements IStorageClient {
    private options;
    private client;
    private database;
    private collection;
    private proxy;
    constructor(options: IDocumentDbOptions);
    /** Initializes the DocumentDb client */
    initialize(callback: (error: Error) => void): void;
    /** Inserts or replaces an entity in the table */
    insertOrReplace(partitionKey: string, rowKey: string, entity: any, isCompressed: boolean, callback: (error: Error, etag: any, response: IHttpResponse) => void): void;
    /** Retrieves an entity from the table */
    retrieve(partitionKey: string, rowKey: string, callback: (error: Error, entity: IBotEntity, response: IHttpResponse) => void): void;
    private static getError(error);
    private getOrCreateDatabase(callback);
    private getOrCreateCollection(callback);
}
export interface IDocumentClient {
    createDatabase(body: UniqueId, options: RequestOptions, callback: RequestCallback<DatabaseMeta>): void;
    upsertDocument<TDocument>(collectionSelfLink: string, document: NewDocument<TDocument>, options: RequestOptions, callback: RequestCallback<RetrievedDocument<TDocument>>): void;
    createCollection(databaseLink: string, body: Collection, options: RequestOptions, callback: RequestCallback<CollectionMeta>): void;
    queryDocuments<TDocument>(collectionLink: string, query: string | SqlQuerySpec, options?: FeedOptions): QueryIterator<RetrievedDocument<TDocument>>;
    queryDatabases(query: string | SqlQuerySpec): QueryIterator<DatabaseMeta>;
    queryCollections(databaseLink: string, query: string | SqlQuerySpec): QueryIterator<CollectionMeta>;
}
