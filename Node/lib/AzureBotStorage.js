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
var async = require("async");
var Promise = require("promise");
var Consts = require("./Consts");
var zlib = require("zlib");
var azure = require('azure-storage');
var AzureBotStorage = /** @class */ (function () {
    function AzureBotStorage(options, storageClient) {
        this.options = options;
        this.storageClient = storageClient;
    }
    AzureBotStorage.prototype.client = function (storageClient) {
        this.storageClient = storageClient;
        return this;
    };
    /** Reads in data from storage. */
    AzureBotStorage.prototype.getData = function (context, callback) {
        var _this = this;
        // We initialize on every call, but only block on the first call. The reason for this is that we can't run asynchronous initialization in the class ctor
        this.initializeStorageClient().done(function () {
            // Build list of read commands
            var list = [];
            if (context.userId) {
                // Read userData
                if (context.persistUserData) {
                    list.push({
                        partitionKey: context.userId,
                        rowKey: Consts.Fields.UserDataField,
                        field: Consts.Fields.UserDataField
                    });
                }
                if (context.conversationId) {
                    // Read privateConversationData
                    list.push({
                        partitionKey: context.conversationId,
                        rowKey: context.userId,
                        field: Consts.Fields.PrivateConversationDataField
                    });
                }
            }
            if (context.persistConversationData && context.conversationId) {
                // Read conversationData
                list.push({
                    partitionKey: context.conversationId,
                    rowKey: Consts.Fields.ConversationDataField,
                    field: Consts.Fields.ConversationDataField
                });
            }
            // Execute reads in parallel
            var data = {};
            async.each(list, function (entry, cb) {
                _this.storageClient.retrieve(entry.partitionKey, entry.rowKey, function (error, entity, response) {
                    if (!error) {
                        if (entity) {
                            var botData = entity.data || {};
                            var isCompressed = entity.isCompressed || false;
                            if (isCompressed) {
                                // Decompress gzipped data
                                zlib.gunzip(new Buffer(botData, Consts.base64), function (err, result) {
                                    if (!err) {
                                        try {
                                            var txt = result.toString();
                                            data[entry.field + Consts.hash] = txt;
                                            data[entry.field] = txt != null ? JSON.parse(txt) : null;
                                        }
                                        catch (e) {
                                            err = e;
                                        }
                                    }
                                    cb(err);
                                });
                            }
                            else {
                                try {
                                    data[entry.field + Consts.hash] = botData ? JSON.stringify(botData) : null;
                                    data[entry.field] = botData != null ? botData : null;
                                }
                                catch (e) {
                                    error = e;
                                }
                                cb(error);
                            }
                        }
                        else {
                            data[entry.field + Consts.hash] = null;
                            data[entry.field] = null;
                            cb(error);
                        }
                    }
                    else {
                        cb(error);
                    }
                });
            }, function (err) {
                if (!err) {
                    callback(null, data);
                }
                else {
                    var m = err.toString();
                    callback(err instanceof Error ? err : new Error(m), null);
                }
            });
        }, function (err) { return callback(err, null); });
    };
    /** Writes out data to storage. */
    AzureBotStorage.prototype.saveData = function (context, data, callback) {
        var _this = this;
        // We initialize on every call, but only block on the first call. The reason for this is that we can't run asynchronous initialization in the class ctor
        var promise = this.initializeStorageClient();
        promise.done(function () {
            var list = [];
            function addWrite(field, partitionKey, rowKey, botData) {
                var hashKey = field + Consts.hash;
                var hash = JSON.stringify(botData);
                if (!data[hashKey] || hash !== data[hashKey]) {
                    data[hashKey] = hash;
                    list.push({ field: field, partitionKey: partitionKey, rowKey: rowKey, botData: botData, hash: hash });
                }
            }
            try {
                // Build list of write commands
                if (context.userId) {
                    if (context.persistUserData) {
                        // Write userData
                        addWrite(Consts.Fields.UserDataField, context.userId, Consts.Fields.UserDataField, data.userData);
                    }
                    if (context.conversationId) {
                        // Write privateConversationData
                        addWrite(Consts.Fields.PrivateConversationDataField, context.conversationId, context.userId, data.privateConversationData);
                    }
                }
                if (context.persistConversationData && context.conversationId) {
                    // Write conversationData
                    addWrite(Consts.Fields.ConversationDataField, context.conversationId, Consts.Fields.ConversationDataField, data.conversationData);
                }
                // Execute writes in parallel
                async.each(list, function (entry, errorCallback) {
                    if (_this.options.gzipData) {
                        zlib.gzip(entry.hash, function (err, result) {
                            if (!err && result.length > Consts.maxDataLength) {
                                err = new Error("Data of " + result.length + " bytes gzipped exceeds the " + Consts.maxDataLength + " byte limit. Can't post to: " + entry.url);
                                err.code = Consts.ErrorCodes.MessageSize;
                            }
                            if (!err) {
                                //Insert gzipped entry
                                _this.storageClient.insertOrReplace(entry.partitionKey, entry.rowKey, result.toString('base64'), true, function (error, eTag, response) {
                                    errorCallback(error);
                                });
                            }
                            else {
                                errorCallback(err);
                            }
                        });
                    }
                    else if (entry.hash.length < Consts.maxDataLength) {
                        _this.storageClient.insertOrReplace(entry.partitionKey, entry.rowKey, entry.botData, false, function (error, eTag, response) {
                            errorCallback(error);
                        });
                    }
                    else {
                        var err = new Error("Data of " + entry.hash.length + " bytes exceeds the " + Consts.maxDataLength + " byte limit. Consider setting connectors gzipData option. Can't post to: " + entry.url);
                        err.code = Consts.ErrorCodes.MessageSize;
                        errorCallback(err);
                    }
                }, function (err) {
                    if (callback) {
                        if (!err) {
                            callback(null);
                        }
                        else {
                            var m = err.toString();
                            callback(err instanceof Error ? err : new Error(m));
                        }
                    }
                });
            }
            catch (e) {
                if (callback) {
                    var err = e instanceof Error ? e : new Error(e.toString());
                    err.code = Consts.ErrorCodes.BadMessage;
                    callback(err);
                }
            }
        }, function (err) { return callback(err); });
    };
    AzureBotStorage.prototype.initializeStorageClient = function () {
        var _this = this;
        if (!this.initializeTableClientPromise) {
            // The first call will trigger the initialization of the table client, which creates the Azure table if it
            // does not exist. Subsequent calls will not block.
            this.initializeTableClientPromise = new Promise(function (resolve, reject) {
                _this.storageClient.initialize(function (error) {
                    if (error) {
                        reject(new Error('Failed to initialize azure table client. Error: ' + error.toString()));
                    }
                    else {
                        resolve(true);
                    }
                });
            });
        }
        return this.initializeTableClientPromise;
    };
    return AzureBotStorage;
}());
exports.AzureBotStorage = AzureBotStorage;
//# sourceMappingURL=AzureBotStorage.js.map