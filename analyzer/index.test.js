 var Q = require('q');
 var fs = require('fs');
 var async = require('async');
 var path = require('path');
 var git = require('gift');

//
describe.only('check Runner ', function(){
  beforeEach(function(done){

    this.timeout(20000);
    var localDir = path.resolve(__dirname, "./test/repo");
    if (fs.existsSync(localDir)){
     console.log('removing folder from previous run');
     var rmdir = require('rmdir');

     rmdir(localDir, function(err, dirs, files){
       console.log( dirs );
       console.log( files );
       console.log( 'all files are removed' );
       done(err);
     });
   }
    else done();

  });

  it.only('Runner live chat repo', function(done){
    this.timeout(20000);
    var Runner = require('./');
    var path = require('path');
    var localDir = path.resolve(__dirname, "./test/lets-chat");
    var r = new Runner(localDir);
    console.log('repo was created');
    var p = r.start();
    p.then(function(){}, function(){}, function(f){/*console.log('progress:' + f)*/});
    r.done(done);
    r.on('docker:dockefiles', function(p){
       console.log('docker file was detected:' + p);
     });

    });
return;
  it('just git clone', function(done){
    this.timeout(20000);
    var repoUrl = "https://github.com/Codefresh-Examples/lets-chat.git";
    var localDir = path.resolve(__dirname, "./test/repo");
    console.log('local folder:' + localDir);
    git.clone(repoUrl, localDir, function (err, _repo){
    console.log('repo created err:' + err);
    return done(err);
  });
});



  it('Runner->cloneFromGit', function(done){
    this.timeout(20000);
    var Runner = require('./');
    var path = require('path');
    var r = new Runner();
    var repoUrl = "https://github.com/Codefresh-Examples/lets-chat.git";
    var localDir = path.resolve(__dirname, "./test/repo");
    r.cloneFromGit(repoUrl, localDir).then(function(){
       console.log('repo was created');
       r.start();
       return Q.when(r.done(done));
      }).catch(function (err) {
      console.log('catch !!');
      console.log('err:' + err);
      return err;
    // Handle any error from all above steps
}).done(function(err){
      console.log('error:' + err);
      done(new Error(err));
    });

  });
});
return;
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

it('test nfcall', function(done){
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
  it.only('using git clone multiple docker files' , function(done){
       console.log('git clone use case');

       var repoUrl = "https://github.com/zwij/wap_zaverecna.git";
       var git = require('gift');
       var localDir = path.resolve(__dirname, "../");
       this.timeout(2000000);

       var r = new Runner(localDir);
        r.on('docker:dockefiles', function(p){
           console.log('docker file was detected:' + p);
         });
         r.start();
         r.done(function(err, data){
           done(err);});
       });

});
