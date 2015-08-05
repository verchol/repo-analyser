var express = require('express');
var git = require('gift');
var router = express.Router();
var path  = require('path');
var Runner = require('../analyzer');

/* GET home page. */
router.get('/ping', function(req, res) {
   console.log('ping');
   return res.send('ok');
});

router.post('/clone', function(req, res){

  if (!req.body.repoName || !req.body.gitUrl)
      return res.send(400 , 'bad input');
  var localDir = path.resolve(__dirname, "./test/repo", req.body.repoName);

  console.log('clonning repo to ' + localDir);
  var repoUrl = req.body.gitUrl;
  git.clone(repoUrl, localDir, function (err, _repo){

  console.log('repo created');
  res.send(localDir);

});
});
router.post('/parse', function(req, res){
   console.log('parsing repo: ' + req.body.repoName);
  if (!req.body.repoName)
      return res.send(400 , 'bad input');
  var localDir = path.resolve(__dirname, "./test/repo", req.body.repoName);
  var runner = new Runner(localDir);
  runner.start().done(function(data){
    console.log('parse:data' + JSON.stringify(data));
    res.send(data);
  });

});


router.post('/', function(req, res) {
    res.send(400, "error , add git action to api");
});
module.exports = router;
