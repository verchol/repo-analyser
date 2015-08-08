
describe ('git test', function(){
var git     = require('gift');
var  _      = require('lodash');
var  Q      = require('q');
var path    = require('path');
var assert  = require('assert');
var repos = [
  "https://github.com/Codefresh-Examples/lets-chat.git",
  "https://github.com/Codefresh-Examples/socket-io.git",
  "https://github.com/Codefresh-Examples/jsbeautify.git",
  "https://github.com/Codefresh-Examples/express-angular.git",
  "https://github.com/zwij/wap_zaverecna.git",
  "https://github.com/yaronr/dockerfile.git",
  "https://github.com/codefresh-io/spigo.git"
];
var docker = 5;
var js = 1;
var testFolder = process.env.TEST_FOLDER || './test/repo';

function only(index)
{
  repos = repos.slice(index, index + 1);
}
it.skip('set docker repo' , function(){
    only(js);
    console.log(JSON.stringify(docker));
});

it('just git clone', function(done){
  this.timeout(20000);
  var index = 0;
  var promises =  _.map(repos, function(repo){

      console.log('cloing repo :' + JSON.stringify(repo));
      index++;
      var defer = Q.defer();
      var localDir = path.resolve(__dirname, testFolder, index.toString());
      console.log('local folder:' + localDir);
      git.clone(repo, localDir, function (err, _repo){
      console.log('repo created err:' + err);

      if (err) return defer.reject(err);
        defer.resolve(_repo);
      });

      return defer.promise;
    });

    Q.all(promises).then(function(result){
      console.log('cloned with result : ' + JSON.stringify(result));
      done();},
      function(err){
        done(err);});
});
it('run on spigo repo' , function(done){
  this.timeout(10000);

  index = 0;
  var promises = [];
  var Runner = require('../analyzer');
  assert(Runner);

  var localDir = path.resolve(__dirname, testFolder, index.toString());

  var r = new Runner(localDir);
  var p = r.start();
  r.on('packageJson', function(data){
    console.log('package json found :'  + data);
  });

});

it('using git clone [node]' , function(done){
     console.log('git clone use case');

     var repoUrl = "https://github.com/codefresh-io/codefresh-io.git";
     var git = require('gift');
     var localDir = path.resolve(__dirname, testFolder);
     this.timeout(2000000);

     console.log('clonning repo to ' + localDir);
     git.clone(repoUrl, localDir, function (err, _repo){
     console.log('repo created');

      if (err)
        done(err);

      var r = new Runner(localDir);
      r.on('docker:dockefiles', function(p){
         console.log('docker file was detected:' + p);
       });
       r.start();
       r.done(function(err, data){
         done(err);});
     });
 });

 it('using git clone php' , function(done){
      console.log('git clone use case');
      var Runner = require('../analyzer');
      assert(Runner);

      var repoUrl = "https://github.com/zwij/wap_zaverecna.git";
      var git = require('gift');
      var localDir = path.resolve(__dirname, testFolder);
      this.timeout(2000000);

      console.log('clonning repo to ' + localDir);
      git.clone(repoUrl, localDir, function (err, _repo){
      console.log('repo created');

       if (err)
         done(err);

       var r = new Runner(localDir);
       r.on('docker:dockefiles', function(p){
          console.log('docker file was detected:' + p);
        });
        r.start();
        r.done(function(err, data){
          done(err);});
      });
  });

it('run on multiple repos' , function(done){
  this.timeout(10000);

  index = 0;
  var promises = [];
  var Runner = require('../analyzer');
  assert(Runner);
  _.forEach(repos, function(r){
  index++;
  var defer = Q.defer();
  var localDir = path.resolve(__dirname, testFolder, index.toString());
  done();
  var r = new Runner(localDir);
  var p = r.start();
  r.on('packageJson', function(data){
    console.log('repo name is :' + r);
    console.log('package json found :'  + data);
  });
  promises.push(p);
});


  Q.all(promises).then(function(result){
    _.forEach(result, function(r){
        console.log('cloned with result : ' + JSON.stringify(r));
    });

    done();},
    function(err){
      done(err);});

});
});
