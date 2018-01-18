"use strict";
//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Builder SDK Github:
// https://github.com/Microsoft/BotBuilder
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
Object.defineProperty(exports, "__esModule", { value: true });
var Consts = require("./Consts");
var documentdb_1 = require("documentdb");
var DocumentDbClient = /** @class */ (function () {
    function DocumentDbClient(options) {
        this.options = options;
        if (options.proxy) {
            this.proxy = options.proxy;
        }
    }
    /** Initializes the DocumentDb client */
    DocumentDbClient.prototype.initialize = function (callback) {
        var _this = this;
        var connPolicy = null;
        //add proxy
        if (this.proxy) {
            connPolicy = {
                'ProxyUrl': this.proxy
            };
        }
        var client = new documentdb_1.DocumentClient(this.options.host, { masterKey: this.options.masterKey }, connPolicy);
        // DocumentDb public typings are not correct, so we cast to this interface to have the correct typings
        this.client = client;
        this.getOrCreateDatabase(function (error, database) {
            if (error) {
                callback(DocumentDbClient.getError(error));
            }
            else {
                _this.database = database;
                _this.getOrCreateCollection(function (error, collection) {
                    if (error) {
                        callback(DocumentDbClient.getError(error));
                    }
                    else {
                        _this.collection = collection;
                        callback(null);
                    }
                });
            }
        });
    };
    /** Inserts or replaces an entity in the table */
    DocumentDbClient.prototype.insertOrReplace = function (partitionKey, rowKey, entity, isCompressed, callback) {
        var docDbEntity = { id: partitionKey + ',' + rowKey, data: entity, isCompressed: isCompressed };
        this.client.upsertDocument(this.collection._self, docDbEntity, {}, function (error, collection, responseHeaders) {
            callback(DocumentDbClient.getError(error), null, responseHeaders);
        });
    };
    /** Retrieves an entity from the table */
    DocumentDbClient.prototype.retrieve = function (partitionKey, rowKey, callback) {
        var id = partitionKey + ',' + rowKey;
        var querySpec = {
            query: Consts.DocDbRootQuery,
            parameters: [{
                    name: Consts.DocDbIdParam,
                    value: id
                }]
        };
        var iterator = this.client.queryDocuments(this.collection._self, querySpec, {});
        iterator.toArray(function (error, result, responseHeaders) {
            if (error) {
                callback(DocumentDbClient.getError(error), null, null);
            }
            else if (result.length == 0) {
                callback(null, null, null);
            }
            else {
                var document_1 = result[0];
                callback(null, document_1, null);
            }
        });
    };
    DocumentDbClient.getError = function (error) {
        if (!error)
            return null;
        return new Error('Error Code: ' + error.code + ' Error Body: ' + error.body);
    };
    DocumentDbClient.prototype.getOrCreateDatabase = function (callback) {
        var _this = this;
        var querySpec = {
            query: Consts.DocDbRootQuery,
            parameters: [{
                    name: Consts.DocDbIdParam,
                    value: this.options.database
                }]
        };
        this.client.queryDatabases(querySpec).toArray(function (error, result, responseHeaders) {
            if (error) {
                callback(error, null);
            }
            else if (result.length == 0) {
                _this.client.createDatabase({ id: _this.options.database }, {}, function (error, database) {
                    if (error) {
                        callback(error, null);
                    }
                    else {
                        callback(null, database);
                    }
                });
            }
            else {
                callback(null, result[0]);
            }
        });
    };
    DocumentDbClient.prototype.getOrCreateCollection = function (callback) {
        var _this = this;
        var querySpec = {
            query: Consts.DocDbRootQuery,
            parameters: [{
                    name: Consts.DocDbIdParam,
                    value: this.options.collection
                }]
        };
        this.client.queryCollections(this.database._self, querySpec).toArray(function (error, result, responseHeaders) {
            if (error) {
                callback(error, null);
            }
            else if (result.length == 0) {
                _this.client.createCollection(_this.database._self, { id: _this.options.collection }, {}, function (error, collection) {
                    if (error) {
                        callback(error, null);
                    }
                    else {
                        callback(null, collection);
                    }
                });
            }
            else {
                callback(null, result[0]);
            }
        });
    };
    return DocumentDbClient;
}());
exports.DocumentDbClient = DocumentDbClient;
//# sourceMappingURL=DocumentDbClient.js.map