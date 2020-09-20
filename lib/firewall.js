const superagent = require('superagent');
const config = require('./configuration-manager');

async function getFirewalls() {
  try {
    const token = await config.getToken();
    const res = await superagent.get('https://api.digitalocean.com/v2/firewalls')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    return res.body.firewalls;
  } catch (error) {
    return error;
  }
}

module.exports = { getFirewalls };
