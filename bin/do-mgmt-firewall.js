/* eslint-disable no-console */
const program = require('commander');
const inquirer = require('inquirer');
const fw = require('../lib/firewall');

// Initialize the list array
let firewallList = [];

// Commander parses arguments
program
  .parse(process.argv);

(async () => {
  const firewalls = await fw.getFirewalls();

  firewalls.forEach((firewall) => {
    firewallList.push(firewall.name);
  });

  inquirer.prompt([
    {
      type: 'list',
      name: 'firewall',
      message: 'Choose a firewall to manage',
      choices: firewallList,
    },
  ])
    .then((answer) => {
      console.log(`You have selected firewall: ${answer.firewall}`);
    })
    .catch((error) => {
      console.log(error);
    });
})();
