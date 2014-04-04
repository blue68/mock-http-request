var expect = require('expect.js');
var request =  require('../lib/mock-http-request');
var Url = require('url');

describe('mock-http-request', function(){

  describe('sample', function(){
    it('normal', function(done){
      var options = {
        req:{
          timeout: null
        },
        resp: {
          timeout: null,
          bodyChunks: ['a', 'b'],
          statusCode: 200,
          headers: {'Content-Type':'text/html'}
        }
      };

      var req = request(options);
      expect(req.options.resp.bodyChunks).to.be.ok();
      expect(req.options.resp.bodyChunks).to.eql(['a', 'b']);

      var opts = {
        hostname: 'localhost',
        method: 'get',
        port: '80',
        path: '/r'
      };
      req.getHttpRequestMethod(opts, function(res){
        var chunks = [];
        res.on('data', function(chunk){
          chunks.push(chunk.toString());
        });
        res.on('end', function(){
          expect(chunks).to.eql(['a','b']);
        });
      });
      var mock = req.mock;
      expect(mock.req.url).to.be('/r');
      expect(mock.req.method).to.be('GET');
      expect(mock.req.headers.host).to.be('localhost');
      mock.req.abort();
      expect(mock.req.headers).to.be.empty();
      mock.resp.destroy();
      expect(mock.resp.chunks).to.be.empty();

      expect(mock.method).to.be('GET');
      expect(mock.resp.statusCode).to.be(200);
      expect(mock.resp.headers).to.eql({'Content-Type':'text/html'});
      var opts2 = {
        hostname: 'localhost',
        method: 'get',
        port: '8080',
        path: '/r'
      };
      req.getHttpRequestMethod(opts2, function(res){
        var chunks = [];
        res.on('data', function(chunk){
          chunks.push(chunk.toString());
        });
        res.on('end', function(){
          expect(chunks).to.eql(['a','b']);
        });
      });
      var mock2 = req.mock;
      done();
    });
    it("reqTimeout & respTimeout", function(done){
      this.timeout(2000);
      var options = {
        req:{
          timeout: 500
        },
        resp: {
          timeout: 500,
          error: null,
          bodyChunks: ['a', 'b'],
          statusCode: 200,
          headers: {'Content-Type':'text/html'}
        }
      };

      var req = request(options);
      expect(req.options.resp.bodyChunks).to.be.ok();
      expect(req.options.resp.bodyChunks).to.eql(['a', 'b']);

      var opts = {
        hostname: 'localhost',
        method: 'get',
        port: '80',
        path: '/r'
      };
      req.getHttpRequestMethod(opts, function(res){
        var chunks = [];
        res.on('data', function(chunk){
          chunks.push(chunk.toString());
        });
        res.on('end', function(){
          expect(chunks).to.eql(['a','b']);
          done();
        });
      });
    });

    it('request timeout && error', function(done){
      var options = {
        req:{
          timeout: 500,
          error: {
            code: 502,
            message: 'bad gateway'
          }
        },
        resp: {
          bodyChunks: ['a', 'b'],
          statusCode: 200,
          headers: {'Content-Type':'text/html'}
        }
      };

      var req = request(options);
      expect(req.options.resp.bodyChunks).to.be.ok();
      expect(req.options.resp.bodyChunks).to.eql(['a', 'b']);

      var opts = {
        hostname: 'localhost',
        method: 'get',
        port: '80',
        path: '/r'
      };
      req.getHttpRequestMethod(opts, function(res){});
      setTimeout(function(){
        req.mock.req.on('error', function(error){
          expect(error.code).to.be(502);
          expect(error.message).to.be('bad gateway');
          done();
        });
      }, 500);
    });
    it('request timeout is null and error is not null', function(done){
      var options = {
        req:{
          error: {
            code: 502,
            message: 'bad gateway'
          }
        },
        resp: {
          bodyChunks: ['a', 'b'],
          statusCode: 200,
          headers: {'Content-Type':'text/html'}
        }
      };

      var req = request(options);
      expect(req.options.resp.bodyChunks).to.be.ok();
      expect(req.options.resp.bodyChunks).to.eql(['a', 'b']);

      var opts = {
        hostname: 'localhost',
        method: 'get',
        port: '80',
        path: '/r'
      };
      req.getHttpRequestMethod(opts, function(res){});
      req.mock.req.on('error', function(error){
        expect(error.code).to.be(502);
        expect(error.message).to.be('bad gateway');
        done();
      });
    });
    it('response timeout && error ', function(done){
      var options = {
        req:{
          timeout: null
        },
        resp: {
          timeout: 500,
          error:{
            code: 500,
            message: 'Internal Server Error'
          }
        }
      };
      var req = request(options);
      var opts = {
        hostname: 'localhost',
        method: 'get',
        port: '80',
        path: '/r'
      };
      req.getHttpRequestMethod(opts, function(res){
        var chunks = [];
        setTimeout(function(){
          res.on('error', function(error){
            expect(error.code).to.be(500);
            expect(error.message).to.be('Internal Server Error');
            done();
          });
        }, 500);
      });
    });
    it('response error is not null and timeout is null', function(done){
      var options = {
        req:{
          timeout: null
        },
        resp: {
          timeout: null,
          error:{
            code: 500,
            message: 'Internal Server Error'
          }
        }
      };

      var req = request(options);
      var opts = {
        hostname: 'localhost',
        method: 'get',
        port: '80',
        path: '/r'
      };
      req.getHttpRequestMethod(opts, function(res){
        var chunks = [];
        res.on('error', function(error){
          expect(error.code).to.be(500);
          expect(error.message).to.be('Internal Server Error');
          done();
        });
      });
    });

  });
});
