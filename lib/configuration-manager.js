const Configstore = require('configstore');
const inquirer = require('inquirer');
const pkg = require('../package.json');

const config = new Configstore(pkg.name);

async function getToken() {
  const token = await config.get('apiToken');

  // If the token is already set, break out early
  if (token) {
    return token;
  }

  const answers = await inquirer.prompt([
    { type: 'input', name: 'token', message: 'Enter your Digital Ocean API token:' },
  ]);

  config.set('apiToken', answers.token);
  return answers.token;
}

async function setToken() {
  const answers = await inquirer.prompt([
    { type: 'input', name: 'token', message: 'Enter your Digital Ocean API token:' },
  ]);

  config.set('apiToken', answers.token);
}

function clearToken() {
  config.delete('apiToken');
}

module.exports = { getToken, clearToken, setToken };
