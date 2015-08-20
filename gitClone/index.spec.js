
describe ('repo analyzer', function(){
    var git     = require('gift');
    var  _      = require('lodash');
    var  Q      = require('q');
    var fs      = require('fs');
    var path    = require('path');
    var assert  = require('assert');
    var repos = {
        0: ["github.com", "Codefresh-Examples/lets-chat.git"],
        "js": ["github.com", "Codefresh-Examples/socket-io.git"],
        2: ["github.com", "Codefresh-Examples/jsbeautify.git"],
        3: ["github.com", "Codefresh-Examples/express-angular.git"],
        "php": ["github.com", "zwij/wap_zaverecna.git"],
        "docker": ["github.com", "yaronr/dockerfile.git"],
        6: ["github.com", "codefresh-io/spigo.git"],
        "node": ["github.com", "codefresh-io/codefresh-io.git"]
    };
    var testFolder = process.env.TEST_FOLDER || './test/repo';

    cloneFromGit = function(repoUrl , targetFolder){
        console.log('cloning repo ' + JSON.stringify(repoUrl) + ' to local folder: "' + targetFolder + '"');
        return Q.nfcall(git.clone, "https://"+ repoUrl[0] +"/"+ repoUrl[1], targetFolder).then(function(res) { console.log("cloned");});
        //return Q.nfcall(git.clone, "git@"+ repoUrl[0] +":"+ repoUrl[1], targetFolder);
    };

    function getRepoDirByKey(key) {
        return path.resolve(__dirname, testFolder, key.toString());
    }

    this.timeout(20000);
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

        return Q.all(promises).done(function(result){
            console.log('cloned with result : ' + JSON.stringify(result));
            done();
        });/*,
        function(err){
            console.log('failed with err : ' + JSON.stringify(err));
            done(err);
        });*/
    });
    it.skip('run on spigo repo' , function(done){
        index = 1;
        var promises = [];
        var Runner = require('../analyzer');
        assert(Runner);

        var localDir = getRepoDirByKey(index);

        var r = new Runner(localDir);
        var p = r.start();
        r.on('packageJson', function(data){
            console.log('package json found :'  + data);
        });

    });

    it.skip('using  [node]' , function(done){
        var r = new Runner(getRepoDirByKey("node"));
        r.on('docker:dockefiles', function(p){
            console.log('docker file was detected:' + p);
        });
        r.start();
        r.done(function(err, data){
            done(err);});
    });

    it.skip('using php' , function(done){
        var Runner = require('../analyzer');
        assert(Runner);

        var localDir = getRepoDirByKey("php");

        var r = new Runner(localDir);
        r.on('docker:dockefiles', function(p){
            console.log('docker file was detected:' + p);
        });
        r.start();
        r.done(function(err, data){
            done(err);});
    });

    it('run on multiple repos' , function(done){
        var promises = [];
        var Runner = require('../analyzer');
        assert(Runner);
        _.forEach(repos, function(repo, key){
            var r = new Runner(getRepoDirByKey(key));
            var p = r.start();
            r.on('packageJson', function(data){
                console.log('repo name is :' + r);
                console.log('package json found :'  + data);
            });
            promises.push(p);
        });

        Q.all(promises).then(function(result){
            _.forEach(result, function(r){
                console.log('run with result : ' + JSON.stringify(r));
            });

            done();
        },
        done);

    });
    it('finds dockerfiles', function(done){
        var Runner = require('../analyzer');
        assert(Runner);
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

});
