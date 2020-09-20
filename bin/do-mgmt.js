#! /usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .command('configure', 'Set app configurations')
  .command('firewall', 'Manages Firewall Settings')
  .parse(process.argv);
