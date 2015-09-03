
describe ('repo analyzer', function(){
    var git     = require('gift');
    var  _      = require('lodash');
    var  Q      = require('q');
    var fs      = require('fs');
    var path    = require('path');
    var assert  = require('assert');
    var repos = {
        0: ["github.com", "Codefresh-Examples/lets-chat.git"],
        2: ["github.com", "Codefresh-Examples/jsbeautify.git"],
        "socketio": ["github.com", "Codefresh-Examples/socket-io.git"],
        "express": ["github.com", "Codefresh-Examples/express-angular.git"],
        "php": ["github.com", "zwij/wap_zaverecna.git"],
        "docker": ["github.com", "yaronr/dockerfile.git"],
        6: ["github.com", "codefresh-io/spigo.git"],
    };
    var testFolder = process.env.TEST_FOLDER || './test/repo';
    Q.longStackSupport = true;

    cloneFromGit = function(repoUrl , targetFolder){
        console.log('cloning repo ' + JSON.stringify(repoUrl) + ' to local folder: "' + targetFolder + '"');
        //return Q.nfcall(git.clone, "git@"+ repoUrl[0] +":"+ repoUrl[1], targetFolder).
        return Q.nfcall(git.clone, "https://"+ repoUrl[0] +"/"+ repoUrl[1], targetFolder).
            then(function(res) {
                console.log('cloned into "' + res.path + '"');
                return res
            });
    };

    function getRepoDirByKey(key) {
        return path.resolve(__dirname, testFolder, key.toString());
    }

    this.timeout(20000);

    var Runner = require('../analyzer');

    before(function(done){
        var localDir = getRepoDirByKey("");
        var q = Q;
        if (fs.existsSync(localDir)){
            console.log('removing folder from previous run');
            var rmdir = require('rmdir');

            q = Q.nfcall(rmdir, localDir).then(function(){
                console.log( 'all files were removed' );
            });
        }
        else {
            q = Q("");
        }

        var promises =  _.map(repos, function(repo, key){
            return q.then(function(res) {
                return cloneFromGit(repo, getRepoDirByKey(key));
            });
        });

        Q.all(promises).done(function(result){
            done();
        });/*,
        function(err){
            console.log('failed with err : ' + JSON.stringify(err));
            done(err);
        });*/
    });
    beforeEach(function(done){
        var devnull = fs.createWriteStream('/dev/null');
        Runner.prototype.logger = new console.Console(devnull, devnull);
        done();
    });

    it('run on multiple repos' , function(done){
        var promises = [];
        assert(Runner);
        _.forEach(repos, function(repo, key){
            var r = new Runner(getRepoDirByKey(key));
            var p = r.start().donepromise;
            promises.push(p);
        });

        Q.all(promises).done(function(result){
            done();
        });
    });
    it('finds dockerfiles', function(done){
        var localDir = getRepoDirByKey('docker');

        var r = new Runner(localDir);
        r.on('dockerfiles', function(data){
            var item = _.last(r.rules_data.dockerfiles);
            if ('awscli/Dockerfile' in item) {
                assert.deepEqual(data, item);
                assert.equal(data['awscli/Dockerfile'].dir, 'awscli');
            }

            item = _.last(r.rules_data.dockerfiles);
            if ('mesos/Dockerfile' in item) {
                assert.deepEqual(data, item);
                assert.equal(data['mesos/Dockerfile'].dir, 'mesos');
            }
        })
        .start()
        .donepromise.done(function (data) {
            assert(_.some(data.dockerfiles, 'awscli/Dockerfile'));
            assert(_.some(data.dockerfiles, 'mesos/Dockerfile'));
            done();
        });
    });
    it('finds package.json [express sample]', function(done){
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.on('packagesJson', function(data){
            var item = _.last(r.rules_data.packagesJson);
            if ('package.json' in item){
                assert.deepEqual(data, item);
                assert.equal(item['package.json'].scripts.start, 'node app.js');
            }
        })
        .start()
        .donepromise.done(function (data) {
            assert(_.some(data.packagesJson, 'package.json'));
            done()
        });
    });
    it.skip('finds package.json [socketio sample]', function(done){
        var localDir = getRepoDirByKey('socketio');

        var r = new Runner(localDir);
        r.on('packagesJson', function(data){
            var item = _.last(r.rules_data.packagesJson);
            if ('package.json' in item){
                assert.deepEqual(data, item);
                assert.equal(item['package.json'].scripts.start, 'node app.js');
            }
        })
        .start()
        .donepromise.done(function (data) {
            assert(_.some(data.packagesJson, 'package.json'));
            done()
        })
    });
    it('finds stack js', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.start()
        .on('stacks', function(data) {
            var item = _.last(r.rules_data.stacks);
            if ('js' == item){
                assert.equal(data, 'js');
            }
        })
        .donepromise.done(function (data) {
            assert.notStrictEqual(_.indexOf(data.stacks, 'js'), -1);
            assert.deepEqual(data.stacks, r.rules_data.stacks);
            done();
        });
    });
    it('finds stack php', function(done) {
        var localDir = getRepoDirByKey('php');

        var r = new Runner(localDir);
        r.start()
        .on('stacks', function(data) {
            var item = _.last(r.rules_data.stacks);
            if ('php' == item){
                assert.equal(data, 'php');
            }
        })
        .donepromise.done(function (data) {
            assert.notStrictEqual(_.indexOf(data.stacks, 'php'), -1);
            assert.deepEqual(data.stacks, r.rules_data.stacks);
            done();
        })
    });
    it('handles an exception in a rule[promise]', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.addRule('test', function (context, filepath, filedata, filestats) {
            throw new Error('test error');
        })
        .start()
        .donepromise.done(undefined, function (err) {
            assert(err instanceof Error);
            assert.equal(err.message, 'test error');
            done();
        });
    });
    it('handles an exception in a rule[event]', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.addRule('test', function (context, filepath, filedata, filestats) {
            throw new Error('test error');
        })
        .start()
        .once('error', function (err) {
            assert(err instanceof Error);
            assert.equal(err.message, 'test error');
            done();
        });
    });
    it('handles an "error" event in a rule[promise]', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.addRule('test', function (context, filepath, filedata, filestats) {
            r.emit('error', new Error('tested error'));
            r.emit('error', new Error('second error'));
            r.emit('error', new Error('third error'));
        })
        .start()
        .donepromise.done(undefined, function (err) {
            assert.equal(err.message, 'tested error');
            done();
        });
    });
    it('handles an "error" event in a rule[event]', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.addRule('test', function (context, filepath, filedata, filestats) {
            r.emit('error', new Error('tested error'));
            r.emit('error', new Error('second error'));
            r.emit('error', new Error('third error'));
        })
        .start()
        .once('error', function (err) {
            assert.equal(err.message, 'tested error');
            done();
        });
    });
    it('allows to return promise from a rule', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        var indicator = [false];
        r.addRule('test', function (context, filepath, filedata, filestats) {
            return Q('promised').delay(200).then(function() {
                indicator[0] = true;
            });
        })
        .start()
        .donepromise.done(function () {
            assert(indicator[0]);
            done();
        });
    });
    it('logs error events in logger');
    it ('#addRule rejects an existing rule name');
    it ('#addRule validates parametes');
});
