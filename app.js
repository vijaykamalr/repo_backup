var oauth = require("./services/oauthService.js");
var bitbucket = require("./services/bitbucketService.js");
var parsedArgs = require("minimist")(process.argv);
var _ = require("underscore");
const parentprocess = require('process');
const childprocess = require("child_process");

const tokenEndpoint = "https://bitbucket.org/site/oauth2/access_token";
const repositoryEndpoint = "https://api.bitbucket.org/2.0/repositories/";

var repoOwner = "vijaykamalr75";
var backupDirectory = parsedArgs.backupFolder || "./backup/";
const hasClone = parsedArgs.type;
if (!repoOwner) {
    console.log("A repository owner parameter (--owner mybitbucketname) is required");
    process.exit(1);
}
async function sh(cmd) {
    return new Promise(function (resolve, reject) {
        childprocess.exec(cmd, async (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}
if(hasClone === 'fetch'){
    oauth.init(tokenEndpoint, repoOwner)
    .then(async function (token) {

        bitbucket.init(oauth, repositoryEndpoint, repoOwner, backupDirectory);
        const repos = await bitbucket.getRepositories();
        return repos;

    })
   .then(async function (repos) {
        setTimeout(async () => {
            const repoFolder =   await parentprocess.cwd();
            await repos.map(async (repodata) => {
                var backupFolder = repodata.name;
                console.log('----2-----' + backupFolder);
                var shellFolderChange = await parentprocess.chdir(repoFolder+'/backup/' + backupFolder);
                console.log(shellFolderChange);
                var shellFolderCheck = await parentprocess.cwd();
                console.log('---cms--' + shellFolderCheck);
                await childprocess.exec("git fetch --all");
                await childprocess.exec("git branch -r");
                await parentprocess.chdir('../../');
                var shellFolderCheck = await parentprocess.cwd();
                console.log('--check' + shellFolderCheck);
                setTimeout(() => {
                    console.log('----3-----' + backupFolder);
                    return repodata;
                }, 10);
            })
        }, 5000);
     

    })
    .catch(function (err) {
        console.log(err);
    });
}else{
    oauth.init(tokenEndpoint, repoOwner)
    .then(async function (token) {

        bitbucket.init(oauth, repositoryEndpoint, repoOwner, backupDirectory);
        const repos = await bitbucket.getRepositories();
        return repos;

    })
    .then(async function (repositories) {
        console.log("Found " + repositories.length + " repositories");
        console.log("Cloning repositories");
        // await bitbucket.fetchRepository(repositories[5])
        await repositories.map(async (repodata) => {
            await bitbucket.cloneRepositoryWithToken(repodata);
        });
        return repositories

    })
    .catch(function (err) {
        console.log(err);
    });
}
