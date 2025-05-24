const axios = require('axios');
const config = require('../config/godaddy-api.json');

class GoDaddyService {
  constructor() {
    this.apiKey = process.env.GODADDY_API_KEY;
    this.apiSecret = process.env.GODADDY_API_SECRET;
    this.baseUrl = config.production.apiUrl;
  }

  async addDomain(domain, settings) {
    const url = `${this.baseUrl}/v1/domains/${domain}/records`;
    const headers = this.getHeaders();

    try {
      await axios.put(url, settings, { headers });
      return true;
    } catch (error) {
      console.error(`Failed to add domain ${domain}:`, error.message);
      throw error;
    }
  }

  async updateDNSRecords(domain, records) {
    const url = `${this.baseUrl}/v1/domains/${domain}/records`;
    const headers = this.getHeaders();

    try {
      await axios.put(url, records, { headers });
      return true;
    } catch (error) {
      console.error(
        `Failed to update DNS records for ${domain}:`,
        error.message
      );
      throw error;
    }
  }

  getHeaders() {
    return {
      Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
    };
  }
}

module.exports = new GoDaddyService();
