
var request = require('request');
var assert  = require('assert');

describe('git api test', function(){
  it('sanity', function(){
     var git = require('./git');
     assert.ok(git);
  });

  it('ping test', function(){
    var url = "http://127.0.0.1:3000";
    request.get(url + '/git/ping', function(req, res){
        console.log(req);
    });
  });
  it('check parser', function(){

  });
  it('git clone socket-io', function(done){
    this.timeout(20000);
    var url = "http://127.0.0.1:3000";
    var gitUrl =   "https://github.com/Codefresh-Examples/socket-io.git";
    request.post(url + '/git/clone', {form:{'gitUrl': gitUrl, 'repoName': 'socket-io'}}, function(req, res){
        console.log(res);
        done();
    });
  });

  it('git clone socket-io', function(done){
    this.timeout(20000);
    var url = "http://127.0.0.1:3000";
    var gitUrl =   "https://github.com/Codefresh-Examples/socket-io.git";
    request.post(url + '/git/clone', {form:{'gitUrl': gitUrl, 'repoName': 'socket-io'}}, function(req, res){
        console.log(res);
        done();
    });
  });

});
