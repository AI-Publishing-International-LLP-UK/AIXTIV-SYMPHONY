const admin = require('firebase-admin');
const axios = require('axios');

class FirebaseDomainService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'api-for-warp-drive';
  }

  async getAccessToken() {
    try {
      const token = await admin.app().options.credential.getAccessToken();
      return token.access_token;
    } catch (error) {
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  async addDomain(domain, siteId) {
    const token = await this.getAccessToken();
    const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains`;

    const payload = {
      domainName: domain,
      type: 'USER_OWNED',
      site: `sites/${siteId}`,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        data: response.data,
        dnsRecords: response.data.dnsRecords || [],
      };
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      throw new Error(
        `Failed to add domain to Firebase: ${JSON.stringify(errorDetails)}`
      );
    }
  }

  async getDomainStatus(domain, siteId) {
    const token = await this.getAccessToken();
    const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains/${domain}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get domain status: ${error.message}`);
    }
  }

  async verifyDomain(domain, siteId) {
    const token = await this.getAccessToken();
    const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains/${domain}:verifyDomain`;

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to verify domain: ${error.message}`);
    }
  }

  async deleteDomain(domain, siteId) {
    const token = await this.getAccessToken();
    const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/domains/${domain}`;

    try {
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete domain: ${error.message}`);
    }
  }
}

module.exports = new FirebaseDomainService();
