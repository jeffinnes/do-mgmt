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

async function addInboundRule(firewallObj) {
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

  const fwAddRuleSpinner = ora(`Adding inbound rule for ${firewallObj.name}`).start();
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
    return error;
  }
}

module.exports = { getFirewalls, addInboundRule };
