const axios = require('axios');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const config = require('../config/godaddy-api.json');

/**
 * GoDaddy API Service with Google Cloud Secret Manager integration
 * This service handles DNS record updates for domains through the GoDaddy API.
 * Credentials are securely retrieved from Google Cloud Secret Manager.
 */
class GoDaddyService {
  constructor() {
    // Initialize properties
    this.secretManagerClient = new SecretManagerServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'api-for-warp-drive';
    this.apiKey = null;
    this.apiSecret = null;
    this.baseUrl = config.production.apiUrl;
    this.keySecretName = config.production.keySecretName; // 'godaddy-api-key'
    this.secretSecretName = config.production.secretSecretName; // 'godaddy-api-secret'
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the service by retrieving credentials from Secret Manager
   * This is called automatically when needed and caches the credentials
   */
  async initialize() {
    // Return existing initialization if in progress
    if (this.initPromise) return this.initPromise;

    // Create a new initialization promise
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        console.log(
          '[GODADDY] Initializing service with Secret Manager credentials...'
        );

        // Check for environment variables first (for local development/testing)
        if (process.env.GODADDY_API_KEY && process.env.GODADDY_API_SECRET) {
          console.log('[GODADDY] Using credentials from environment variables');
          this.apiKey = process.env.GODADDY_API_KEY;
          this.apiSecret = process.env.GODADDY_API_SECRET;
        } else {
          // Get credentials from Secret Manager
          console.log(
            `[GODADDY] Retrieving credentials from Secret Manager in project: ${this.projectId}`
          );

          const [apiKey, apiSecret] = await Promise.all([
            this.getSecret(this.keySecretName),
            this.getSecret(this.secretSecretName),
          ]);

          this.apiKey = apiKey;
          this.apiSecret = apiSecret;

          console.log(
            '[GODADDY] Successfully retrieved credentials from Secret Manager'
          );
        }

        this.initialized = true;
        resolve(true);
      } catch (error) {
        console.error('[GODADDY] Failed to initialize:', error);
        this.initPromise = null; // Reset promise so initialization can be attempted again
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Retrieve a secret from Google Cloud Secret Manager
   * @param {string} secretName - The name of the secret
   * @returns {Promise<string>} - The secret value
   */
  async getSecret(secretName) {
    try {
      const secretPath = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.secretManagerClient.accessSecretVersion({
        name: secretPath,
      });

      // Extract the secret payload
      const secretValue = version.payload.data.toString('utf8');

      if (!secretValue) {
        throw new Error(`Secret ${secretName} is empty`);
      }

      return secretValue;
    } catch (error) {
      console.error(`[GODADDY] Error accessing secret ${secretName}:`, error);
      throw new Error(
        `Failed to access secret ${secretName}: ${error.message}`
      );
    }
  }

  /**
   * Ensure the service is initialized before making API calls
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('GoDaddy API credentials not available');
    }
  }

  /**
   * Add a domain to GoDaddy
   * @param {string} domain - The domain name
   * @param {object} settings - Domain settings
   * @returns {Promise<boolean>} - Success indicator
   */
  async addDomain(domain, settings) {
    await this.ensureInitialized();

    const url = `${this.baseUrl}/domains/${domain}/records`;
    const headers = this.getHeaders();

    try {
      await axios.put(url, settings, { headers });
      return true;
    } catch (error) {
      console.error(`[GODADDY] Failed to add domain ${domain}:`, error.message);
      throw error;
    }
  }

  /**
   * Update DNS records for a domain
   * @param {string} domain - The domain name
   * @param {Array} records - DNS records to update
   * @returns {Promise<boolean>} - Success indicator
   */
  async updateDNSRecords(domain, records) {
    await this.ensureInitialized();

    const url = `${this.baseUrl}/domains/${domain}/records`;
    const headers = this.getHeaders();

    try {
      await axios.put(url, records, { headers });
      console.log(`[GODADDY] Successfully updated DNS records for ${domain}`);
      return true;
    } catch (error) {
      console.error(
        `[GODADDY] Failed to update DNS records for ${domain}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Get authorization headers for GoDaddy API requests
   * @returns {object} - Headers object
   */
  getHeaders() {
    return {
      Authorization: `sso-key ${this.apiKey}:${this.apiSecret}`,
      'Content-Type': 'application/json',
    };
  }
}

module.exports = new GoDaddyService();
