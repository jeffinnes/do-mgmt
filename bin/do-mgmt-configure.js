const program = require('commander');
const configMgr = require('../lib/configuration-manager');

program
  .option('-r --read', 'Reads and displays current saved token. Will prompt for an API token if one is not set')
  .option('-s --set-token <token>', 'Sets a new API token; This will overwrite an existing token')
  .option('-c --clear', 'Clears Token if one exists')
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

if (program.read) {
  configMgr.getToken()
    .then((result) => {
      console.log(result);
    });
}

if (program.setToken) {
  configMgr.setToken();
}

if (program.clear) {
  configMgr.clearToken();
}
