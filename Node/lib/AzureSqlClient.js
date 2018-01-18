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
var tedious_1 = require("tedious");
var AzureSqlClient = /** @class */ (function () {
    function AzureSqlClient(options) {
        this.options = options;
        if (typeof options.enforceTable == 'boolean') {
            this.options.enforceTable = options.enforceTable;
        }
        else {
            this.options.enforceTable = false;
        }
    }
    /** Initializes the SQL Server client */
    AzureSqlClient.prototype.initialize = function (callback) {
        var _this = this;
        var client = new tedious_1.Connection(this.options);
        client.on('connect', function (error) {
            if (error) {
                callback(AzureSqlClient.getError(error));
            }
            else {
                var checkTableRequest = new tedious_1.Request("IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.Tables WHERE TABLE_NAME = N'" + _this.options.options.table + "') BEGIN SELECT TOP 1 * FROM " + _this.options.options.table + " END", function (error, rowCount, rows) {
                    if (error) {
                        client.close();
                        callback(AzureSqlClient.getError(error));
                    }
                    else if (!rowCount) {
                        if (!_this.options.enforceTable) {
                            var error_1 = new Error("Table \"" + _this.options.options.table + "\" has not been found. Please create your Table before connecting your bot to it or set \"enforceTable\" to true in your AzureSqlClient configuration to create the table if it does not exist.");
                            client.close();
                            callback(AzureSqlClient.getError(error_1));
                        }
                        else {
                            var createTableRequest = new tedious_1.Request("CREATE TABLE " + _this.options.options.table + " (id NVARCHAR(200), data NVARCHAR(1000), isCompressed BIT)", function (error, rowCount, rows) {
                                client.close();
                                callback(AzureSqlClient.getError(error));
                            });
                            client.execSql(createTableRequest);
                        }
                    }
                    else {
                        client.close();
                        callback(null);
                    }
                });
                client.execSql(checkTableRequest);
            }
        });
    };
    /** Inserts or replaces an entity in the table */
    AzureSqlClient.prototype.insertOrReplace = function (partitionKey, rowKey, entity, isCompressed, callback) {
        var _this = this;
        var client = new tedious_1.Connection(this.options);
        client.on('connect', function (error) {
            if (error) {
                callback(AzureSqlClient.getError(error), null, null);
            }
            else {
                var getRequest = new tedious_1.Request("SELECT TOP 1 * FROM " + _this.options.options.table + " WHERE id=@id", function (err, rowCount, rows) {
                    if (err) {
                        client.close();
                        callback(AzureSqlClient.getError(err), null, null);
                    }
                    else {
                        if (rowCount) {
                            var updateRequest = new tedious_1.Request("UPDATE " + _this.options.options.table + " SET data=@data, isCompressed=@isCompressed WHERE id=@id", function (error, rowCount, rows) {
                                if (error) {
                                    client.close();
                                    callback(AzureSqlClient.getError(error), null, null);
                                }
                                else {
                                    client.close();
                                    callback(null, rows[0], rows[0]);
                                }
                            });
                            AzureSqlClient.addParameters(updateRequest, completeId_1, stringifiedEntity_1, isCompressed);
                            client.execSql(updateRequest);
                        }
                        else {
                            var insertRequest = new tedious_1.Request("INSERT INTO " + _this.options.options.table + " (id, data, isCompressed) VALUES (@id, @data, @isCompressed)", function (error, rowCount, rows) {
                                if (error) {
                                    client.close();
                                    callback(AzureSqlClient.getError(error), null, null);
                                }
                                else {
                                    client.close();
                                    callback(null, rows[0], rows[0]);
                                }
                            });
                            AzureSqlClient.addParameters(insertRequest, completeId_1, stringifiedEntity_1, isCompressed);
                            client.execSql(insertRequest);
                        }
                    }
                });
                var completeId_1 = partitionKey + ',' + rowKey;
                var stringifiedEntity_1 = JSON.stringify(entity);
                AzureSqlClient.addParameters(getRequest, completeId_1, stringifiedEntity_1, isCompressed);
                client.execSql(getRequest);
            }
        });
    };
    /** Retrieves an entity from the table */
    AzureSqlClient.prototype.retrieve = function (partitionKey, rowKey, callback) {
        var _this = this;
        var client = new tedious_1.Connection(this.options);
        client.on('connect', function (error) {
            if (error) {
                callback(AzureSqlClient.getError(error), null, null);
            }
            else {
                var request = new tedious_1.Request("SELECT TOP 1 * FROM " + _this.options.options.table + " WHERE id=@id", function (err, rowCount, rows) {
                    if (err) {
                        client.close();
                        callback(AzureSqlClient.getError(err), null, null);
                    }
                    else if (!rowCount) {
                        client.close();
                        callback(null, null, null);
                    }
                    else {
                        client.close();
                        var row = rows[0];
                        callback(null, row, rows[0]);
                    }
                });
                var id = partitionKey + ',' + rowKey;
                AzureSqlClient.addParameters(request, id);
                client.execSql(request);
            }
        });
    };
    AzureSqlClient.getError = function (error) {
        if (!error)
            return null;
        return new Error('Error Code: ' + error.code + ' Error Message: ' + error.message);
    };
    AzureSqlClient.addParameters = function (request, id, data, isCompressed) {
        request.addParameter('id', tedious_1.TYPES.NVarChar, id);
        request.addParameter('data', tedious_1.TYPES.NVarChar, data);
        request.addParameter('isCompressed', tedious_1.TYPES.Bit, isCompressed);
    };
    return AzureSqlClient;
}());
exports.AzureSqlClient = AzureSqlClient;
//# sourceMappingURL=AzureSqlClient.js.map