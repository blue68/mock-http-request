Mock-http-request
================
```
    npm install mock-http-request
```

```
    var mockHttpRequest = require('mock-http-request');
    //下面代码为每个case中具体用法
    //正常请求配置
    var options = {
        resp: {
            timeout: null,
            error: null,
            bodyChunks: ['a', 'b'],
            statusCode: 200,
            heaers: {}
        }
    };
    //404
    var options = {
        resp:{
            bodyChunks: ['Not Found'],
            statusCode: '404'
        }
    };
    //504: gateway timeout
    var options = {
        req:{
            timeout: 1000
        },
        resp:{
            timeout:1500,
            bodyChunks: [],
            statusCode: '504'
        }
    };
    //502: bad gateway
    var options = {
        req:{
            timeout: 500,
            error:{
              code: '502',
              message: 'bad gateway'
           }
        },
        resp:{
            bodyChunks: [],
            statusCode: '502'
        }
    };
    //500:Internal Server Error
    var options = {
        resp:{
            bodyChunks: [],
            statusCode: '500',
            timeout: 500,
            error: {
              code: '500',
              message: 'Internal Server Error'
            }
        }
    };
    var backedRequest = mockHttpRequest(options);
    require('http').request = backedRequest.getRequest;
    //还原request
    after(function(){
        mockHttpRequest.unmock();
    });
    afterEach(function(){
        mockHttpRequest.unmock();
    });
```