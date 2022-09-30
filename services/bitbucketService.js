(function (bitbucketService) {

    const fs = require("fs");
    const path = require("path");
    const async = require("async");
    const httpRequest = require("request-promise");
    const _ = require("underscore");
    const process = require("child_process");
    const parentprocess = require('process');

    var oauth = null;
    var repositoryEndpointUrl = null;
    var repositoryOwner = null;
    var backupDir = null;

    bitbucketService.init = function (oauthProvider, repositoryEndpoint, owner, backupFolder) {
        oauth = oauthProvider;
        repositoryEndpointUrl = repositoryEndpoint;
        repositoryOwner = owner;
        backupDir = path.normalize(backupFolder + "/");

        ensureBackupFolderExists();
    };

    function makeBackupFolder() {
        fs.mkdirSync(backupDir);
    }

    function doesBackupFolderExist() {
        try {
            var folderStats = fs.statSync(backupDir);
            return true;
        } catch (ex) {
            return false;
        }
    }

    function ensureBackupFolderExists() {
        if (!doesBackupFolderExist()) {
            makeBackupFolder();
        }
    }
    const fetchDataFn = async(url)=>{
        return new Promise(function (resolve, reject) {
            var hasNextPage = false;
            var repositories = [];
        httpRequest({
            uri: url,
            auth: {
                bearer: oauth.getAccessTokenSync()
            },
            json: true
        })
            .then(function (data) {
                var repos = _.each(data.values, function (repository) {
                    var cloneLinks = repository.links.clone;
                    if (cloneLinks) {
                        var httpsLink = _.first(_.filter(cloneLinks, function (l) { return l.name == "https"; }));
                        repositories.push({ name: repository.name, url: httpsLink.href });
                    }

                });
                hasNextPage = data.next ? true : false;
                if (hasNextPage)
                {
                    repositoryListingPageUri = data.next;
                    fetchDataFn(repositoryListingPageUri);
                }else resolve(repositories);

            })
            .catch(function (err) {
                console.log(err);
                reject(err);
            });
        });
    }

    bitbucketService.getRepositories = function () {

        return new Promise(async function (resolve, reject) {
            try {


              
                var repositoryListingPageUri = repositoryEndpointUrl + repositoryOwner;
                const fetchData = await fetchDataFn(repositoryListingPageUri);
              console.log(fetchData);
              resolve(fetchData);
            } catch (error) {
                console.log(error)
                reject(error);
            }
        });



    };
    async function sh(cmd, backup) {
        return new Promise(function (resolve, reject) {
          process.exec(cmd, async (err, stdout, stderr) => {
            if (err) {
                console.log(err);
              reject(err);
            } else {
              resolve({ stdout, stderr });
            }
          });
        });
      }

    bitbucketService.cloneRepositoryWithToken = async function (repository) {

        var backupFolder = backupDir + repository.name;
        var findPattern = "//" + repositoryOwner + "@bitbucket.org/";
        var replaceString = "//x-token-auth:" + oauth.getAccessTokenSync() + "@bitbucket.org/";
        var cloneUrl = repository.url.replace(findPattern, replaceString);

        await sh(`git clone ${cloneUrl} ${backupFolder}`, backupFolder);
        // var shellFolderChange =  await sh('./'+backupFolder);
        // // var shellFetchCommand = await sh("git remote update");
        // console.log(shellFolderChange);
        // var shellcheckoutCommand = await  process.exec("git fetch --all");

        // // var shellFolderChange =  await parentprocess.chdir('./'+backupFolder);
        // // console.log(shellFolderChange);
        // // // var shellFetchCommand = await sh("git remote update");
        // // // console.log(shellFetchCommand);
        // // var shellcheckoutCommand = await sh("git fetch --all");
        // // console.log(shellcheckoutCommand);

        // // var shellFolderChange2 =  await parentprocess.chdir("../../");
        // // console.log(shellFolderChange2);
        return backupFolder;
    };
    bitbucketService.fetchRepository = async function (repository) {
        var backupFolder = repository.name;
        var shellcheckoutCommandls = await sh("ls");
        console.log(shellcheckoutCommandls);
        var shellFolderChange =  await parentprocess.chdir('./'+backupFolder);
        console.log(shellFolderChange);
        // var shellFolderCheck =  await parentprocess.cwd();
        // console.log(shellFolderCheck);
        // var shellcheckoutCommand = await sh("git fetch --all");
        // console.log(shellcheckoutCommand);
        // var shellBranch = await sh("git branch -r");
        // console.log(shellBranch);
        // var shellFolderCheckBack =  await parentprocess.chdir('../');
        // console.log(shellFolderCheckBack);
        // var shellFolderCheck =  await parentprocess.cwd();
        // console.log(shellFolderCheck);
        // var shellFolderChange =  await sh('./'+backupFolder);
        // // var shellFetchCommand = await sh("git remote update");
        // var shellcheckoutCommand = await  process.exec("git fetch --all");

        // // var shellFolderChange =  await parentprocess.chdir('./'+backupFolder);
        // // console.log(shellFolderChange);
        // // // var shellFetchCommand = await sh("git remote update");
        // // // console.log(shellFetchCommand);
        // // var shellcheckoutCommand = await sh("git fetch --all");
        // // console.log(shellcheckoutCommand);

        // // var shellFolderChange2 =  await parentprocess.chdir("../../");
        // // console.log(shellFolderChange2);
        return backupFolder;
    };

})(module.exports);