var events = require('events');
var os = require('options-stream');
var originaryRequest = require('http').request;

var Request = function(options){
  var _this = this;
  this.options = os({
    req:{
      timeout: null,
      error: {
        code: null,
        message: null
      }
    },
    resp: {
      timeout: null,
      error: {
        code: null,
        message: null
      },
      bodyChunks: [],
      statusCode: 200,
      headers: {}
    }
  },
  {
    req:{
      error: null
    },
    resp:{
      error:null
    }
  }, options);
  this.num = 0;
  this.getRequest = this.getHttpRequestMethod.bind(this);
};
Request.prototype.getHttpRequestMethod = function(httpOptions, cb){
  var chunks, respBodyChunks = this.options.resp.bodyChunks;
  if(Array.isArray(respBodyChunks[0])){
    chunks = respBodyChunks[this.num++];
  }else{
    chunks = respBodyChunks;
  }
  var _this = this;
  var reqError = this.options.req.error;
  var reqTimeout = this.options.req.timeout;
  var _mock = new mock({
    options: _this.options,
    chunks: chunks
  });
  this.mock = _mock;
  var req = _mock.getHttpRequestMethod(httpOptions, cb);

  if((reqError !== null) && (reqTimeout !== null)){
    setTimeout(function(){
      process.nextTick(function(){
        req.emit('error', reqError);
      });
    }, reqTimeout);
  }else if((reqError !== null) && (reqTimeout === null)){
    process.nextTick(function(){
      req.emit('error', reqError);
    });
  }
  return req;
}
var mock = function(opt){
  this.chunks = opt.chunks;
  var optionReq = opt.options.req;
  var optionResp = opt.options.resp;
  this.resp = new events.EventEmitter();
  this.req = new events.EventEmitter();
  this.reqError = optionReq.error;
  this.respError = optionResp.error;
  this.reqTimeout = optionReq.timeout;
  this.respTimeout = optionResp.timeout;
  this.options = opt.resp;
  var _this = this;

  this.resp.destroy = function(){
    this.chunks = [];
  };
  this.resp.headers = _this._setHeader(optionResp.headers);
  this.resp.statusCode = optionResp.statusCode;
  this.resp.setEncoding = function(encoding){
    return encoding;
  };
  if((this.respError !== null) && (this.respTimeout === null)){
    process.nextTick(function(){
      _this.resp.emit('error', _this.respError);
    });
  }else if((this.respError !== null) && (this.respTimeout !== null)){
    setTimeout(function(){
      process.nextTick(function(){
        _this.resp.emit('error', _this.respError);
      });
    }, _this.respTimeout);
  }
};
mock.prototype._setHeader = function(options){
  var headers = {};
  if(!Array.isArray(headers)){
    if(headers){
      for(var key in options){
        headers[key] = options[key];
      }
    }
  }
  return headers;
};
mock.prototype.getHeader = function(headers, name){
  if (!headers) return;
  var key = name.toLowerCase();
  return headers[key];
};
mock.prototype.getHttpRequestMethod = function(httpOptions, cb) {
  var defaultPort = httpOptions.defaultPort || 80;
  var host = httpOptions.hostname || 'localhost';
  var method = httpOptions.method || 'get';
  var path = httpOptions.path || '/';
  var port = httpOptions.port || defaultPort;
  var _this = this;

  if (httpOptions.setHost === undefined) {
    var setHost = true;
  }
  _this.req.url = path;
  _this.req.output = [];
  _this.method = _this.req.method =  method.toUpperCase();
  _this.req.headers = _this._setHeader(httpOptions.headers);

  if(host && !_this.getHeader(_this.req.headers,'host') && setHost){
    var hostHeader = host;
    if (port && +port !== defaultPort) {
      hostHeader += ':' + port;
    }
    _this.req.headers['host'] = hostHeader;
  }
  if(this.reqError === null){
    if(_this.reqTimeout !== null){
      setTimeout(function(){
        cb(_this.resp);
        _this.run();
      }, _this.reqTimeout);
    }else{
      cb(_this.resp);
      _this.run();
    }
  }
  _this.req.abort = function(){
    _this.req.headers = {};
    _this.req.output = [];
  };
  _this.req.write = function(data){
    _this.req.output.push(data);
  };
  _this.req.end = function(){};
  return _this.req;
};
mock.prototype.run = function(){
  var _this = this;
  var chunks = _this.chunks;
  var flag = 0, len = chunks.length, i;
  for (i = 0; i < len; i++){
    flag ++;
    var chunk = chunks[i];
    (function(chunk){
      process.nextTick(function(){
        var buffer = new Buffer(chunk);
        _this.resp.emit('data', buffer);
      });
      if(flag === len){
        process.nextTick(function(){
          if(_this.respTimeout && _this.respError === null){
            setTimeout(function(){
              _this.resp.emit('end');
            }, _this.respTimeout);
          }else{
            _this.resp.emit('end');
          }
        });
      }
    })(chunk);
  }
};

module.exports = function(options){
  return new Request(options);
};
module.exports.unmock = function(){
  return require('http').request = originaryRequest;
};
