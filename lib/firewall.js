const superagent = require('superagent');
const ora = require('ora');
const config = require('./configuration-manager');

async function getFirewalls() {
  const fwLookupSpinner = ora('Retrieving Firewall data').start();
  try {
    const token = await config.getToken();
    const res = await superagent.get('https://api.digitalocean.com/v2/firewalls')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    fwLookupSpinner.succeed();
    return res.body.firewalls;
  } catch (error) {
    fwLookupSpinner.fail();
    return error;
  }
}

async function modifyRule(firewallObj) {
  const cleanFWData = ora('Cleaning Firewall portdata (0 = "all")').start();
  const firewall = {
    name: firewallObj.name,
    inbound_rules: firewallObj.inbound_rules,
    outbound_rules: firewallObj.outbound_rules,
    droplet_ids: [],
    tags: [],
  };

  for (let i = 0; i < firewall.inbound_rules.length; i++) {
    if (firewall.inbound_rules[i].ports === '0') {
      firewall.inbound_rules[i].ports = 'all';
    }

    if (firewall.inbound_rules[i].protocol === 'icmp') {
      delete firewall.inbound_rules[i].ports;
    }
  }

  for (let i = 0; i < firewall.outbound_rules.length; i++) {
    if (firewall.outbound_rules[i].ports === '0') {
      firewall.outbound_rules[i].ports = 'all';
    }

    if (firewall.outbound_rules[i].protocol === 'icmp') {
      delete firewall.outbound_rules[i].ports;
    }
  }
  cleanFWData.succeed();

  const fwAddRuleSpinner = ora(`Adding rule for ${firewallObj.name}`).start();
  try {
    const token = await config.getToken();
    const res = await superagent.put(`https://api.digitalocean.com/v2/firewalls/${firewallObj.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(firewall);
    fwAddRuleSpinner.succeed();
    return res;
  } catch (error) {
    fwAddRuleSpinner.fail();
    console.log(error);
    return error;
  }
}

async function deleteRule(firewallObj, ruleAsString, ruleType) {
  const cleanFWData = ora('Cleaning Firewall portdata (0 = "all")').start();
  const ruleAsJSON = JSON.parse(ruleAsString);
  if (ruleAsJSON.ports === '0') {
    ruleAsJSON.ports = 'all';
  }

  if (ruleAsJSON.protocol === 'icmp') {
    delete ruleAsJSON.ports;
  }
  cleanFWData.succeed();

  const fwRemoveRuleSpinner = ora(`Removing rule for ${firewallObj.name}`).start();
  try {
    const body = {
      [ruleType]: [ruleAsJSON],
    };
    console.log(body);
    const token = await config.getToken();
    const res = await superagent.delete(`https://api.digitalocean.com/v2/firewalls/${firewallObj.id}/rules`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(body);
    fwRemoveRuleSpinner.succeed();
    return res;
  } catch (error) {
    fwRemoveRuleSpinner.fail();
    console.log(error);
    return error;
  }
}

async function addRule(firewallObj, rule, ruleType) {
  const cleanFWData = ora('Cleaning Firewall portdata (0 = "all")').start();
  const ruleAsJSON = rule;

  if (ruleAsJSON.ports === '0') {
    ruleAsJSON.ports = 'all';
  }

  if (ruleAsJSON.protocol === 'icmp') {
    delete ruleAsJSON.ports;
  }
  cleanFWData.succeed();

  const fwAddRuleSpinner = ora(`Adding rule for ${firewallObj.name}`).start();
  try {
    const body = {
      [ruleType]: [ruleAsJSON],
    };
    console.log(body);
    const token = await config.getToken();
    const res = await superagent.post(`https://api.digitalocean.com/v2/firewalls/${firewallObj.id}/rules`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(body);
    fwAddRuleSpinner.succeed();
    return res;
  } catch (error) {
    fwAddRuleSpinner.fail();
    console.log(error);
    return error;
  }
}

module.exports = {
  getFirewalls,
  addRule,
  deleteRule,
  modifyRule,
};
