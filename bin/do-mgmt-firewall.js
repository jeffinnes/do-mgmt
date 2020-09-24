/* eslint-disable no-console */
const program = require('commander');
const inquirer = require('inquirer');
const fw = require('../lib/firewall');

// Initialize the list array
const firewallList = [];

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

    console.log(`Name: ${selectedFirewall.name}`);
    console.log(`ID: ${selectedFirewall.id}`);
    console.log('Inbound Rules:');
    selectedFirewall.inbound_rules.forEach((inRule) => console.log(inRule));
    console.log('Outbound Rules:');
    selectedFirewall.outbound_rules.forEach((outRule) => console.log(outRule));
    if (selectedFirewall.pending_changes.length > 0) {
      console.log('PENDING CHANGES:');
      selectedFirewall.pending_changes.forEach((pendingChange) => console.log(pendingChange));
    }
    console.log('');

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
      // ToDo If the user wants to MODIFY a rule
      if (actionChoice.actionToTake === 'Modify an existing rule') {
        inquirer.prompt([
          {
            type: 'list',
            name: 'ruleDirection',
            message: 'Select a rule to modify',
            choices: ['Inbound', 'Outbound'],
          },
        ]).then(async (directionAnswer) => {
          const choices = [];

          if (directionAnswer.ruleDirection === 'Inbound') {
            // Turn each rule into a string and prepend the array index + 1
            // then push into choices array
            for (let i = 0; i < selectedFirewall.inbound_rules.length; i += 1) {
              choices.push(`${i + 1}. ${JSON.stringify(selectedFirewall.inbound_rules[i])}`);
            }
          } else {
            for (let i = 0; i < selectedFirewall.outbound_rules.length; i += 1) {
              choices.push(`${i + 1}. ${JSON.stringify(selectedFirewall.outbound_rules[i])}`);
            }
          }

          inquirer.prompt([
            {
              type: 'list',
              name: 'rule',
              message: `Select an ${directionAnswer.ruleDirection} rule to modify`,
              choices: choices,
            },
          ]).then(async (selectedRule) => {
            const ruleData = selectedRule.rule.split('. ');
            ruleData[0] = Number.parseInt(ruleData[0], 10) - 1;
            ruleData[1] = JSON.parse(ruleData[1]);
            if (ruleData[1].ports === 0) {
              ruleData[1].ports = 'all';
            }

            console.log(`Currently the rule is set as\n${JSON.stringify(ruleData[1])}\nPlease answer the questions below to modify the rule (default values are the current setting)`);

            let modQuestions = [
              {
                type: 'list',
                name: 'protocol',
                message: 'Select protocol:',
                choices: ['tcp', 'udp'],
                default: ruleData[1].protocol,
              },
              {
                type: 'input',
                name: 'ports',
                message: 'Enter a single port (80), range of ports (8000-9000), or "all":',
                default: ruleData[1].ports,
              },
              {
                type: 'input',
                name: 'addresses',
                message: 'Addresses to allow traffic to or from. Separate addresses with a comma.',
                default: '',
              },
            ];

            if (directionAnswer.ruleDirection === 'Inbound') {
              modQuestions[2].default = `${ruleData[1].sources.addresses}`;
            } else {
              modQuestions[2].default = `${ruleData[1].destinations.addresses}`;
            }

            inquirer.prompt(modQuestions).then(async (ruleAnswers) => {
              const ports = ruleAnswers.ports.trim();
              const addresses = ruleAnswers.addresses.split(',');

              for (let i = 0; i < addresses.length; i += 1) {
                addresses[i] = addresses[i].trim();
              }

              if (directionAnswer.ruleDirection === 'Inbound') {
                selectedFirewall.inbound_rules[ruleData[0]] = {
                  protocol: ruleAnswers.protocol,
                  ports: ports,
                  sources: { addresses: addresses },
                };
                const addRuleResult = await fw.modifyRule(selectedFirewall);
                console.log('done');
              } else {
                selectedFirewall.outbound_rules[ruleData[0]] = {
                  protocol: ruleAnswers.protocol,
                  ports: ports,
                  destinations: { addresses: addresses },
                };
                const addRuleResult = await fw.modifyRule(selectedFirewall);
                console.log('done');
              }
            }).catch((error) => {
              console.log(error);
            });
          }).catch((error) => {
            console.log(error);
          });
        }).catch((error) => {
          console.log(error);
        });
      }



      // If the user wants to add a rule
      if (actionChoice.actionToTake === 'Add a rule') {
        inquirer.prompt([
          {
            type: 'list',
            name: 'ruleDirection',
            message: 'Add an Inbound or Outbound rule?',
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

          for (let i = 0; i < addresses.length; i += 1) {
            addresses[i] = addresses[i].trim();
          }

          if (ruleAnswers.ruleDirection === 'Inbound') {
            const rule = {
              protocol: ruleAnswers.protocol,
              ports: ports,
              sources: { addresses: addresses },
            };
            const addRuleResult = await fw.addRule(selectedFirewall, rule, 'inbound_rules');
            console.log('done');
          } else {
            const rule = {
              protocol: ruleAnswers.protocol,
              ports: ports,
              destinations: { addresses: addresses },
            };
            const addRuleResult = await fw.addRule(selectedFirewall, rule, 'outbound_rules');
            console.log('done');
          }
        }).catch((error) => {
          console.log(error);
        });
      }

      // If the user wants to REMOVE a rule
      if (actionChoice.actionToTake === 'Remove a rule') {
        inquirer.prompt([
          {
            type: 'list',
            name: 'ruleDirection',
            message: 'Remove an Inbound or Outbound rule?',
            choices: ['Inbound', 'Outbound'],
          },
        ]).then((removeDirectionAnswer) => {
          if (removeDirectionAnswer.ruleDirection === 'Inbound') {
            const inboundRulesAsStrings = [];
            selectedFirewall.inbound_rules.forEach((rule) => {
              inboundRulesAsStrings.push(JSON.stringify(rule));
            });

            inquirer.prompt([
              {
                type: 'list',
                name: 'rule',
                message: 'Select an INBOUND rule to remove',
                choices: inboundRulesAsStrings,
                default: 'none',
              },
            ]).then(async (ruleToRemove) => {
              const removeRuleResult = await fw.deleteRule(selectedFirewall, ruleToRemove.rule, 'inbound_rules');
              console.log('done');
            }).catch((error) => {
              console.log(error);
            });
          } else {
            const outboundRulesAsStrings = [];
            selectedFirewall.outbound_rules.forEach((rule) => {
              outboundRulesAsStrings.push(JSON.stringify(rule));
            });

            inquirer.prompt([
              {
                type: 'list',
                name: 'rule',
                message: 'Select an OUTBOUND rule to remove',
                choices: outboundRulesAsStrings,
                default: 'none',
              },
            ]).then(async (ruleToRemove) => {
              const removeRuleResult = await fw.deleteRule(selectedFirewall, ruleToRemove.rule, 'outbound_rules');
              console.log('done');
            }).catch((error) => {
              console.log(error);
            });
          }
        }).catch((error) => {
          console.log(error);
        });
      }
    }).catch((error) => {
      console.log(error);
    });
  }).catch((error) => {
    console.log(error);
  });
})();
