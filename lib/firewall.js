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
  const fwAddRuleSpinner = ora(`Adding inbound rule for ${firewallObj.name}`).start();
  try {
    const token = await config.getToken();
    const res = await superagent.put(`https://api.digitalocean.com/v2/firewalls/${firewallObj.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(firewallObj);
    fwAddRuleSpinner.succeed();
    return res;
  } catch (error) {
    fwAddRuleSpinner.fail();
    return error;
  }
}

module.exports = { getFirewalls, addInboundRule };
