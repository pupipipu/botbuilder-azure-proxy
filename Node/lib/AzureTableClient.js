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
var azure = require('azure-storage');
var AzureTableClient = /** @class */ (function () {
    function AzureTableClient(tableName, accountName, accountKey, proxy) {
        // Development storage is used if no accountName and key are provided
        if (!accountName && !accountKey) {
            this.useDevelopmentStorage = true;
        }
        else if (accountName && !accountKey) {
            this.connectionString = accountName;
        }
        else if (!accountName || !accountKey) {
            throw Error('Storage account name and account key are mandatory when not using development storage');
        }
        if (proxy) {
            this.proxy = proxy;
        }
        this.accountName = accountName;
        this.accountKey = accountKey;
        this.tableName = tableName;
    }
    /** Initializes the Azure Table client */
    AzureTableClient.prototype.initialize = function (callback) {
        var tableService = this.buildTableService();
        tableService.createTableIfNotExists(this.tableName, function (error, result, response) {
            callback(AzureTableClient.getError(error, response));
        });
    };
    /** Inserts or replaces an entity in the table */
    AzureTableClient.prototype.insertOrReplace = function (partitionKey, rowKey, data, isCompressed, callback) {
        var tableService = this.buildTableService();
        var entityGenerator = azure.TableUtilities.entityGenerator;
        var entity = {
            PartitionKey: entityGenerator.String(partitionKey),
            RowKey: entityGenerator.String(rowKey),
            Data: entityGenerator.String((data instanceof String) ? data : JSON.stringify(data)),
            IsCompressed: entityGenerator.Boolean(isCompressed)
        };
        tableService.insertOrReplaceEntity(this.tableName, entity, { checkEtag: false }, function (error, result, response) {
            callback(AzureTableClient.getError(error, response), result, response);
        });
    };
    /** Retrieves an entity from the table */
    AzureTableClient.prototype.retrieve = function (partitionKey, rowKey, callback) {
        var tableService = this.buildTableService();
        tableService.retrieveEntity(this.tableName, partitionKey, rowKey, function (error, result, response) {
            //404 on retrieve means the entity does not exist. Just return null
            if (response.statusCode == Consts.HttpStatusCodes.NotFound) {
                callback(null, null, response);
            }
            else {
                callback(AzureTableClient.getError(error, response), AzureTableClient.toBotEntity(result), response);
            }
        });
    };
    AzureTableClient.toBotEntity = function (tableResult) {
        if (!tableResult) {
            return null;
        }
        var entity = {
            data: {},
            isCompressed: tableResult.IsCompressed['_'] || false,
            rowKey: tableResult.RowKey['_'] || '',
            partitionKey: tableResult.PartitionKey['_'] || ''
        };
        if (tableResult.Data['_'] && entity.isCompressed) {
            entity.data = tableResult.Data['_'];
        }
        else if (tableResult.Data['_'] && !entity.isCompressed) {
            entity.data = JSON.parse(tableResult.Data['_']);
        }
        return entity;
    };
    AzureTableClient.prototype.buildTableService = function () {
        var tableService = null;
        // Dev Storage
        if (this.useDevelopmentStorage) {
            tableService = azure.createTableService(Consts.developmentConnectionString);
        }
        else if (this.connectionString) {
            tableService = azure.createTableService(this.connectionString);
        }
        else {
            tableService = azure.createTableService(this.accountName, this.accountKey);
        }
        if (this.proxy) {
            tableService.setProxy(this.proxy);
        }
        return tableService.withFilter(new azure.ExponentialRetryPolicyFilter());
    };
    AzureTableClient.getError = function (error, response) {
        if (!error)
            return null;
        var message = 'Failed to perform the requested operation on Azure Table. Message: ' + error.message + '. Error code: ' + error.code;
        if (response) {
            message += '. Http status code: ';
            message += response.statusCode;
        }
        return new Error(message);
    };
    return AzureTableClient;
}());
exports.AzureTableClient = AzureTableClient;
//# sourceMappingURL=AzureTableClient.js.map