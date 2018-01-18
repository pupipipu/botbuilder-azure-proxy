# Bot Builder Azure Node SDK with proxy

This is a modified version of BotBuilder-Azure Node JS SDK v3.0.4 with added proxy settings.

To add the proxy settings on AzureTableClient init
```javascript
/** for Azure Table Storage **/
// Add the proxy object on AzureTableClient init
var proxyConfig = {
  protocol: 'http:',
  host: '127.0.0.1', //proxy domain
  port: 8888 //proxy port
}
var azureTableClient = new azure.AzureTableClient(tableName, storageName, storageKey, proxyConfig);

/** for Azure Document Db **/
//Add proxy property
var documentDbOptions = {
    host: 'Your-Azure-DocumentDB-URI',
    masterKey: 'Your-Azure-DocumentDB-Key',
    database: 'botdocs',   
    collection: 'botdata',
    proxy:'http://127.0.0.1:8888' //full proxy url
};
var docDbClient = new azure.DocumentDbClient(documentDbOptions);
```

Original BotBuilder-Azure SDK
https://github.com/Microsoft/BotBuilder-Azure
