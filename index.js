
var async = require('async');
var fs    = require('fs');
var path  = require('path');
var EventEmitter =   require('events').EventEmitter;
var util         =   require('util');
var _            =   require('lodash');

var runner = function (folder){
  EventEmitter.call(this);
  if(!fs.existsSync(folder)) throw 'folder does not exists';
  this.rules = [];
  this.folder = folder;
  this.stack = [];
  this.supported = ['js', 'cs', 'java', 'php'];
  this.dockerfiles = [];
  this.use(metaData);
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


runner.prototype.done = function(callback)
{
  this.on('done', callback);
};

function rule(folder, output, callback){
    output.rule1 = 'ok';
    callback(null, true);
}

function gitInfo(folder, output, callback){
    output.rule2 = 'ok';
    callback(null, true);
}

function metaData(folder, output ,next){
  var filewalker = require('filewalker');
  var emitter = this;
  filewalker(folder)
    .on('dir', function(p) {
      //console.log('dir:  %s', p);
    })
    .on('file', function(p, s) {
     var data = path.parse(p);

    if (data.base.toLowerCase().indexOf("dockerfile") !== -1){
      console.log('dockefile was detected:' + p);
      emitter.dockerfiles.push(data);
      return emitter.emit('docker', p);
    }
     if (data.base === 'package.json')

        return emitter.emit('nodejs', p);
    //  console.log('file: %s, %d bytes', data.base, s.size);
     var ext = data.ext.slice(- (data.ext.length - 1));

        if (_.indexOf(emitter.stack, ext) === -1 && _.indexOf(emitter.supported, ext)!== -1){
          console.log('stack found ' + ext);
          emitter.stack.push(ext);
          emitter.emit('stack', ext);
        }


    }).on('error', function(err) {
      console.error(err);
    })
    .on('done', function() {
      emitter.emit('done', null, emitter.stack);
      next();
    })
  .walk();
}

module.exports = runner;
