   var Runner = require('./');
   var Q = require('q');
   var path = require('path');
   var fs = require('fs');
   debugger;

     var localDir = path.resolve(__dirname, "./index.js");


     function yes(r){
       console.log('yes result is :' + r);
    }
    function no(r){
           console.log('no result is :' + r);
        }

    //return  fs.exists(localDir, yes);
    return  Q.nfcall(fs.exists, localDir).then(yes , no);



/*

   var r = new Runner('./test');
   r.on('docker', function(p){
     console.log('DOCKER FILE is :' + p);

   });
   r.start();
   r.done(function(e, p){
     console.log(p);
   });*/
