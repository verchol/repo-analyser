
var async = require('async');
var fs    = require('fs');
var path  = require('path');
var EventEmitter =   require('events').EventEmitter;
var util         =   require('util');

var runner = function (folder){
  EventEmitter.call(this);
  if(!fs.existsSync(folder)) throw 'folder does not exists';
  this.rules = [];
  this.folder = folder;
};
util.inherits(runner, EventEmitter);
runner.prototype.use = function(rule)
{
  console.log('rule added');
  this.rules.push(rule);
};

runner.prototype.start = function(){
  this.context = {};
  var self = this;
  async.eachSeries(this.rules, function iterator(rule, callback) {
      rule.call(self, self.folder, self.context, callback);
}, function done() {
    console.log('all rules completed');
    console.log(JSON.stringify(self));
});
};

var r = new runner(path.resolve('../'));
r.use(function(folder, output, callback){
    output.rule1 = 'ok';
    callback(null, true);
});

r.use(function(folder, output, callback){
    output.rule2 = 'ok';
    callback(null, true);
});

r.use(function(folder, output ,callback){
  var filewalker = require('filewalker');
  var emitter = this;
  filewalker(folder)
    .on('dir', function(p) {
      console.log('dir:  %s', p);
    })
    .on('file', function(p, s) {
     var data = path.parse(p);
     if (data.base === 'package.json')
        emitter.emit('package.json', p);
    //  console.log('file: %s, %d bytes', data.base, s.size);
    })
    .on('error', function(err) {
      console.error(err);
    })
    .on('done', function() {

      console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
      callback();
    })
  .walk();
});
r.on('package.json', function(p){
  console.log('package found ' + p);
})
r.start();
