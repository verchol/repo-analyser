
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
    if(!fs.existsSync(folder)) this.logger.warn('folder does not exists');
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
runner.prototype.logger = console;
runner.prototype.addRule = function(rule)
{
    this.rules.push(rule);
};

runner.prototype.start = function(){
    this.context = {};
    var self = this;
    //this.handle = defer;

    // this is also essential because the error propagation can only use 'once',
    // which may leave consequent errors unhandled and thus crash the app.
    self.on('error', self.logger.error);
    function errorHandler(err) {
        if (err) {
            if (!errorHandler.storedError) {
                errorHandler.storedError = err;
            }
        } else {
            return function() {
                if (errorHandler.storedError) {
                    return Q.reject(errorHandler.storedError)
                }
            }
        }
    }
    var onerror = Q.ninvoke(self, 'once', 'error').fail(errorHandler);
    return Q.nfcall(async.eachSeries, this.rules, function iterator(rule, done) {
            Q(rule.call(self, self.folder, self.context)).thenResolve(null).then(done).fail(done);
        }).then(errorHandler()).thenResolve([self.dockerfiles, self.stack, self.gruntfiles, self.packageJson]);
};

var parsePackage = function(data){
    return Q.nfcall(fs.readFile, data).then(JSON.parse) ;
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
        //emitter.logger.trace('dir:  %s', p);
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
            emitter.logger.info('gruntfile was detected:' + p);
            emitter.gruntfiles.push(p);
            return emitter.emit('gruntfile', p);
        }
        //  emitter.logger.trace('file: %s, %d bytes', data.base, s.size);
        var ext = data.ext.slice(- (data.ext.length - 1));
        if (_.indexOf(emitter.stack, ext) === -1 && _.indexOf(emitter.supported, ext)!== -1){
            emitter.stack.push(ext);
            emitter.emit('stack', ext);
        }

    }).on('error', function(err) {
        emitter.emit('error', err);
    })
    .on('done', function() {
        emitter.emit('done', null, emitter.stack);
    })
    .walk();
}

module.exports = runner;
