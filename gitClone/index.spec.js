
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
        "node": ["github.com", "codefresh-io/codefresh-io.git"]
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

    it('run on multiple repos' , function(done){
        var promises = [];
        assert(Runner);
        _.forEach(repos, function(repo, key){
            var r = new Runner(getRepoDirByKey(key));
            var p = r.start();
            promises.push(p);
        });

        Q.all(promises).done(function(result){
            done();
        });
    });
    it('finds dockerfiles', function(done){
        var localDir = getRepoDirByKey('docker');

        var r = new Runner(localDir);
        var p = r.start();
        r.done(function () {
            assert.notStrictEqual(_.indexOf(r.dockerfiles, 'awscli/Dockerfile'), -1)
            assert.notStrictEqual(_.indexOf(r.dockerfiles, 'mesos/Dockerfile'), -1)
            done();
        });

        r.on('docker', function(data){
            var index = _.indexOf(r.dockerfiles, 'awscli/Dockerfile');
            if (index != -1 && index == r.dockerfiles.length-1) {
                assert.equal(data.dir, 'awscli');
            }

            index = _.indexOf(r.dockerfiles, 'mesos/Dockerfile');
            if (index != -1 && index == r.dockerfiles.length-1) {
                assert.equal(data.dir, 'mesos');
            }
        });
    });
    it('finds package.json [express sample]', function(done){
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        var p = r.start();
        r.done(function () {
            assert.notStrictEqual(_.indexOf(r.packageJson, 'package.json'), -1)
        });

        r.on('packageJson', function(data){
            index = _.indexOf(r.packageJson, 'package.json');
            if (index != -1 && index == r.packageJson.length-1) {
                assert.equal(data.scripts.start, 'node app.js');
                done()
            }
        });
    });
    it('finds package.json [socketio sample]', function(done){
        var localDir = getRepoDirByKey('socketio');

        var r = new Runner(localDir);
        var p = r.start();
        r.done(function () {
            assert.notStrictEqual(_.indexOf(r.packageJson, 'package.json'), -1)
            done();
        });

        r.on('packageJson', function(data){
            index = _.indexOf(r.packageJson, 'package.json');
            if (index != -1 && index == r.packageJson.length-1) {
                assert.equal(data.scripts.start, 'node app.js');
            }
        });
    });
    it('finds stack js', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        var p = r.start();
        r.done(function () {
            assert.notStrictEqual(_.indexOf(r.stack, 'js'), -1)
            done();
        });
    });
    it('finds stack php', function(done) {
        var localDir = getRepoDirByKey('php');

        var r = new Runner(localDir);
        var p = r.start();
        r.done(function () {
            assert.notStrictEqual(_.indexOf(r.stack, 'php'), -1)
            done();
        });
    });
    it('handles an exception in a rule', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.addRule(function(folder, context) {
            throw new Error('test error');
        });
        var p = r.start();
        p.done(undefined, function (err) {
            assert(err instanceof Error);
            assert.equal(err.message, 'test error');
            done();
        });
    });
    it('handles an "error" event in a rule', function(done) {
        var localDir = getRepoDirByKey('express');

        var r = new Runner(localDir);
        r.addRule(function(folder, context) {
            r.emit('error', 'test error');
        });
        var p = r.start();
        p.done(undefined, function (err) {
            assert.equal(err, 'test error');
            done();
        });
    });

});
