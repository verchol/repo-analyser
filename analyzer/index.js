
var async = require('async');
var fs    = require('fs');
var path  = require('path');
var EventEmitter =   require('events').EventEmitter;
var util         =   require('util');
var _            =   require('lodash');
var Q            =   require('q');
var git          =   require('gift');
var filewalker   =   require('filewalker');

/*
 * We're mixing EventEmitter's events with promises (Q's flavor) here. Not the
 * best of ideas in hindsight.
 *
 * We are, though, separating concerns. The promise - runner.donepromise comes
 * into existance only after runner.start() is called, and it's sole purpose is
 * to notify the user of the FINAL status: success or failure, and provide the
 * usual relevant context in each case.
 *
 * The additional functionality that events provide is primarily topical events
 * per rule match, access to more data in case of errors, and pluggablity for
 * future functionality.
 **/

var runner = function (folder){
    EventEmitter.call(this);
    if(!fs.existsSync(folder)) this.logger.warn('folder does not exists');
    this.rules = {};
    this.rules_data = {};
    this.folder = folder;
    this.addRule('dockerfiles', function (context, filepath, filedata, filestats) {
        if ((filedata.base.toLowerCase().indexOf("dockerfile") !== -1) || (filedata.base.toLowerCase().indexOf("docker-compose") !== -1)){
            var ns = {};
            ns[filepath] = filedata;
            return ns;
        }
    });
    this.addRule('packagesJson', function (context, filepath, filedata, filestats) {
        if (filedata.base === 'package.json'){
            return Q.nfcall(fs.readFile, path.resolve(this.folder, filepath))
                .then(JSON.parse)
                .then(function (data) {
                    var ns = {};
                    ns[filepath] = data;
                    return ns;
                });
        }
    });
    this.addRule('gruntfiles', function (context, filepath, filedata, filestats) {
        if (filedata.base.toLowerCase().indexOf("gruntfile") !== -1){
            var ns = {};
            ns[filepath] = filepath;
            return ns;
        }
    });
    this.addRule('stacks', function (context, filepath, filedata, filestats) {
        supported = ['js', 'cs', 'java', 'php'];
        var ext = filedata.ext.slice(- (filedata.ext.length - 1));
        if (_.indexOf(supported, ext)!== -1){
            return ext;
        }
    }, {'unique': true});
};

util.inherits(runner, EventEmitter);
runner.prototype.logger = console;

/* name: the rule name. Used in a number of places: the namespace in the
 *          collector object, the name of the event triggered each time a rule
 *          matches (pending options), internally
 * rule: function(context, filepath, filedata, filestats), expected to return a
 *          'record' if the rule matched, or a (Q) promise of one.
 * options: an object; currently only the 'unique' property is supported
 *              'unique': collector will contain unique matches, and the
 *              corresponding event will only fire once
 */
runner.prototype.addRule = function(name, rule, options)
{
    if (_.has(this.rules, name)) {
        this.emit('error', new Error('Rule named "'+name+'" already exists'));
    } else {
        this.rules[name] = {
            'callback': rule,
            'options': _.defaults({}, options, { 'unique': false })
        };
        this.rules_data[name] = []
    }
    return this;
};

/*
 * Once all relevant rules were added via addRule() (and friends), call this to
 * do the actual processing. Once called a 'donepromise' property will be
 * available containing a 'done' promise. However that - and extra -
 * functionality can also be accesed via subsribing to events:
 *      error: currently all errors are considered as fatal for the purposes of
 *              reporting 'done', but this may change in the future. However, in
 *              any case, if more than one error was found, this is the way to
 *              access it.
 *              argument: relevant error
 *      done:  fires once all processing has finished.
 *              NOTE: Other events may still fire afterwards (in the next Tick)
 *              argument: the object containing the collectors for all rules,
 *                  namespaced with the name of each rule.
 *      <rule names>: fires each time a rule matches. The relevant collector
 *              will also have been updated by the time the event fires.
 *              argument: the single match, as returned by the rule. Depending
 *                  on circumstances the relevant collector may - or may not -
 *                  be more useful.
 */
runner.prototype.start = function(){
    this.context = {};
    var self = this;
    var ondone = Q.defer()
    this.donepromise = ondone.promise;

    this.once('error', ondone.reject);
    // this is also essential because the error propagation can only use 'once',
    // which may leave consequent errors unhandled and thus crash the app.
    //  TODO: no logger handler, with on instead of once
    this.on('error', this.logger.error);
    var file_queue = async.queue(function (task, done) {
        //ondone.notify(task.p);
        Q.nfcall(async.forEachOfSeries, self.rules, function iterator(rule, name, done) {
            Q(rule.callback.call(self, self.context, task.p, task.filedata, task.s))
            .then(function (data) {
                if (data) {
                    if (!rule.options.unique || _.indexOf(self.rules_data[name], data) === -1) {
                        self.rules_data[name].push(data);
                        self.emit(name, data);
                    }
                }
                return null;
            })
            .then(done).fail(done);
        })
        .thenResolve(null)
        .then(done).fail(done);
    });
    filewalker(this.folder)
    .on('file', function(p, s) {
        var filedata = path.parse(p);
        file_queue.push({'filedata': filedata, 'p': p, 's': s}, function (err) {
                if (err)
                    self.emit('error', err);
            });
    })
    .on('error', function(err) {
        self.emit('error', err);
    })
    .on('done', function() {
        file_queue.drain = function() {
            ondone.resolve(self.rules_data);
            self.emit('done', self.rules_data);
        }
        if (file_queue.idle())
            file_queue.drain()
    })
    .walk();
    return this;
};

module.exports = runner;
