# Bot Builder Azure Node SDK with proxy

This is a modified version of BotBuilder-Azure Node JS SDK v3.0.4 with added proxy settings.

To add the proxy settings on AzureTableClient init
```javascript
// Add the proxy object on AzureTableClient init
var proxyConfig = {
  protocol: 'http:',
  host: '127.0.0.1', //proxy domain
  port: 8888 //proxy port
}
var azureTableClient = new azure.AzureTableClient(tableName, storageName, storageKey, proxyConfig);
```

Original BotBuilder-Azure SDK
https://github.com/Microsoft/BotBuilder-Azure
