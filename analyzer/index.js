
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
    var defer = Q.defer();
    this.handle = defer;
    async.eachSeries(this.rules, function iterator(rule, callback) {
        rule.call(self, self.folder, self.context, callback);
    }, function done(err, result) {
        (err) ? console.log('!!!err:' + err)  : "";

        if (err)
            return defer.reject(err);

        var ret  = [self.dockerfiles, self.stack, self.gruntfiles, self.packageJson];

        defer.resolve(ret);
    });

    return defer.promise;
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

function rule(folder, output, callback){
    output.rule1 = 'ok';
    callback(null, true);
}

function gitInfo(folder, output, callback){
    output.rule2 = 'ok';
    callback(null, true);
}

function metaData(folder, output ,next){

    var emitter = this;
    filewalker(folder)
    .on('dir', function(p) {
        //console.log('dir:  %s', p);
    })
    .on('file', function(p, s) {
        var data = path.parse(p);
        emitter.handle.notify(p);

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
        next();
    })
    .walk();
}

module.exports = runner;
