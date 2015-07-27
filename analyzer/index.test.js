 var Q = require('q');
 var fs = require('fs');
 var async = require('async');


//

describe('analyzier tests', function(){

  var Runner = require('./');
  var path = require('path');

  it('test dockers', function(done){
    var folder = path.resolve(__dirname ,'./test');
    var r = new Runner(folder);

     r.on('docker', function(p){
       console.log('DOCKER FILE is :' + p);
     });
     r.start();
     r.done(done);

  });

  it('test stack', function(done){
    var folder = path.resolve(__dirname ,'./test');
    var r = new Runner(folder);

     r.on('stack', function(p){
       console.log('file is :' + p);

     });

     r.done(function(output){
       console.log(JSON.stringify(output));
     });

     r.start();
      r.done(done);
  });

  it('test multiple docker files', function(done){
    var folder = path.resolve(__dirname ,'./test');
    var r = new Runner(folder);

     r.on('docker:dockefiles', function(p){
       console.log('docker file was detected:' + p);
     });

     r.done(function(err, output){
       //console.log(JSON.stringify(output.dockerfiles));
     });

     r.start();
     r.done(done);
  });

  it('test fs', function(done){
    this.timeout(20000);
    var localDir = path.resolve(__dirname, "./index1.js");
     fs.exists(localDir, function(r){
     console.log('result is :' + r);
     done();
  });
});

it.only('test nfcall', function(done){
  this.timeout(20000);
  var localDir = path.resolve(__dirname, "./index1.js");
  function test(r){
   console.log('result is :' + r);
   done();
}
  Q.nfcall(fs.exists, localDir).then(test , test);

});

beforeEach(function(done){

  this.timeout(20000);
  var localDir = path.resolve(__dirname, "./test/repo");
  fs.exists(localDir, function(r){
   console.log('result is :' + r);
   var rmdir = require('rmdir');
   if (r)
   rmdir(localDir, function(err, dirs, files){
     console.log( dirs );
     console.log( files );
     console.log( 'all files are removed' );
     done(err);
   });
   else done();
 });
});

it('using git clone [node]' , function(done){
     console.log('git clone use case');

     var repoUrl = "https://github.com/codefresh-io/codefresh-io.git";
     var git = require('gift');
     var localDir = path.resolve(__dirname, "./test/repo");
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
 it.only('using git clone php' , function(done){
      console.log('git clone use case');

      var repoUrl = "https://github.com/zwij/wap_zaverecna.git";
      var git = require('gift');
      var localDir = path.resolve(__dirname, "./test/repo");
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
});
