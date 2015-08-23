
var async = require('async');
var fs    = require('fs');
var path  = require('path');
var EventEmitter =   require('events').EventEmitter;
var util         =   require('util');
var _            =   require('lodash');
var Q            =   require('q');
var git          =   require('gift');
var filewalker   =   require('filewalker');

var runner = function (folder){
    EventEmitter.call(this);
    if(!fs.existsSync(folder)) console.warn('folder does not exists');
    this.rules = [];
    this.folder = folder;
    this.stack = [];
    this.supported = ['js', 'cs', 'java', 'php'];
    this.dockerfiles = [];
    this.gruntfiles = [];
    this.packageJson = [];
    this.addRule(metaData);
};

util.inherits(runner, EventEmitter);
runner.prototype.addRule = function(rule)
{
    this.rules.push(rule);
};

runner.prototype.start = function(){
    this.context = {};
    var self = this;
    //this.handle = defer;

    // 'error' event may be triggered by user generated content (e.g. user's bad
    // code) and we need to decide how to handle that.
    // The other problem with the event is that it may be triggred, but also
    // might not.
    var onerror = Q.ninvoke(self, 'on', 'error');
    return Q.nfcall(async.eachSeries, this.rules, function iterator(rule, done) {
            try {
                rule.call(self, self.folder, self.context);
                done();
            } catch (e) {
                done(e)
            }
        }).thenResolve([self.dockerfiles, self.stack, self.gruntfiles, self.packageJson]);
};

var parsePackage = function(data){
    var t = JSON.parse(fs.readFileSync(data));

    function delay(ms) {
        var deferred = Q.defer();
        setTimeout(deferred.resolve, ms);
        return deferred.promise;
    }
    return delay(2000);
};

runner.prototype.done = function(callback)
{
    this.on('done', callback);
};

function rule(folder, output){
    output.rule1 = 'ok';
}

function gitInfo(folder, output){
    output.rule2 = 'ok';
}

function metaData(folder, output){

    var emitter = this;
    filewalker(folder)
    .on('dir', function(p) {
        //console.log('dir:  %s', p);
    })
    .on('file', function(p, s) {
        var data = path.parse(p);
        //emitter.handle.notify(p);

        if ((data.base.toLowerCase().indexOf("dockerfile") !== -1) || (data.base.toLowerCase().indexOf("docker-compose") !== -1)){
            emitter.dockerfiles.push(p);
            return emitter.emit('docker', data);
        }
        if (data.base === 'package.json'){
            emitter.packageJson.push(p);
            parsePackage(path.resolve(folder, p)).done(function(data){emitter.emit('packageJson', data)}, function(err){
                emitter.emit('error', err);
            });
            //emitter.emit('nodejs', p);
        }

        if (data.base.toLowerCase().indexOf("gruntfile") !== -1){
            console.log('gruntfile was detected:' + p);
            emitter.gruntfiles.push(p);
            return emitter.emit('gruntfile', p);
        }
        //  console.log('file: %s, %d bytes', data.base, s.size);
        var ext = data.ext.slice(- (data.ext.length - 1));
        if (_.indexOf(emitter.stack, ext) === -1 && _.indexOf(emitter.supported, ext)!== -1){
            emitter.stack.push(ext);
            emitter.emit('stack', ext);
        }

    }).on('error', function(err) {
        console.error(err);
        emitter.emit('error', err);
    })
    .on('done', function() {
        emitter.emit('done', null, emitter.stack);
    })
    .walk();
}

module.exports = runner;
