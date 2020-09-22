/* eslint-disable no-console */
const program = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
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
  ]).then((answer) => {
    // Display Firewall Info then prompt for actions
    const filteredFirewallArray = firewalls.filter((f) => f.name === answer.firewall);
    const selectedFirewall = filteredFirewallArray[0];
    console.log(selectedFirewall);

    /* console.log(`Name: ${selectedFirewall.name}`);
    console.log(`ID: ${selectedFirewall.id}`);
    console.log('Inbound Rules:');
    selectedFirewall.inbound_rules.forEach((inRule) => console.log(inRule));
    console.log('Outbound Rules:');
    selectedFirewall.outbound_rules.forEach((outRule) => console.log(outRule));
    if (selectedFirewall.pending_changes.length > 0) {
      console.log('PENDING CHANGES:');
      selectedFirewall.pending_changes.forEach((pendingChange) => console.log(pendingChange));
    }
    console.log(''); */

    // Choose an action to take on the firewall
    inquirer.prompt([
      {
        type: 'list',
        name: 'actionToTake',
        message: `Choose an action to take on ${selectedFirewall.name}`,
        choices: ['Modify an existing rule',
          'Add a rule',
          'Remove a rule',
          'Exit',
        ],
      },
    ]).then((actionChoice) => {
      // ToDo
      if (actionChoice.actionToTake === 'Modify an existing rule') {
        console.log('Modifiy logic');
      }

      // If the user wants to add a rule
      if (actionChoice.actionToTake === 'Add a rule') {
        inquirer.prompt([
          {
            type: 'list',
            name: 'ruleDirection',
            message: 'Inbound or Outbound rule?',
            choices: ['Inbound', 'Outbound'],
            default: 'Inbound',
          },
          {
            type: 'list',
            name: 'protocol',
            message: 'Select protocol:',
            choices: ['tcp', 'udp'],
            default: 'tcp',
          },
          {
            type: 'input',
            name: 'ports',
            message: 'Enter a single port (80), range of ports (8000-9000), or leave blank to allow all ports:',
            default: 'all',
          },
          {
            type: 'input',
            name: 'addresses',
            message: 'Addresses to allow traffic to or from. Separate addresses with a comma, defaults to all IPv4 and IPv6:',
            default: '0.0.0.0/0, ::/0',
          },
        ]).then(async (ruleAnswers) => {
          const ports = ruleAnswers.ports.trim();
          const addresses = ruleAnswers.addresses.split(',');

          for (let i = 0; i < addresses.length; i++) {
            addresses[i] = addresses[i].trim();
          }

          if (ruleAnswers.ruleDirection === 'Inbound') {
            selectedFirewall.inbound_rules.push({
              protocol: ruleAnswers.protocol,
              ports: ports,
              sources: { addresses: addresses },
            });
            const addRuleResult = await fw.addInboundRule(selectedFirewall);
            console.log('done');
          } else {
            // Call outbound rule creator
          }
        }).catch((error) => {
          console.log(error);
        });
      }

      // ToDo
      if (actionChoice.actionToTake === 'Remove a rule') {
        console.log('Remove logic');
      }

    }).catch((error) => {
      console.log(error);
    });
  }).catch((error) => {
    console.log(error);
  });
})();
