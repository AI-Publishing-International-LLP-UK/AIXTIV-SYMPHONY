// Secure Anthropic API Handler
// Integrates with GCP Secret Manager to access Anthropic API securely
// Used for CLI interactions with Claude

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const https = require('https');

class AnthropicAPIHandler {
  constructor() {
    this.secretClient = new SecretManagerServiceClient();
    this.secretName = 'anthropicadmin-asoos-2100-cool';
    this.apiKey = null;
    this.lastFetch = null;
    this.expiryTime = 60 * 60 * 1000; // 1 hour expiry for cached key
  }

  async getAPIKey() {
    try {
      // Check if we need to refresh the API key
      const now = Date.now();
      if (!this.apiKey || !this.lastFetch || (now - this.lastFetch > this.expiryTime)) {
        console.log('Fetching fresh Anthropic API key from GCP Secret Manager');
        
        // Access the latest version of the secret from the secrets manager and for project id: api-for-warp-drive
        const [version] = await this.secretClient.accessSecretVersion({
          name: `projects/api-for-warp-drive/secrets/${this.secretName}/versions/latest`,
        });
        
        // Extract the key from the response and trim whitespace
        this.apiKey = version.payload.data.toString().trim();
        this.lastFetch = now;
      }
      
      return this.apiKey;
    } catch (error) {
      console.error('Error fetching Anthropic API key:', error);
      throw new Error('Failed to retrieve API key');
    }
  }

  async queryClaude(prompt, options = {}) {
    try {
      const apiKey = await this.getAPIKey();
      
      // Set default options
      const defaultOptions = {
        model: 'claude-4-sonnet-20241022',
        maxTokens: 1000,
        temperature: 0.7,
        system: "You are Claude, an AI assistant integrated with the ASOOS Diamond SAO CLI system."
      };
      
      const queryOptions = { ...defaultOptions, ...options };
      
      const postData = JSON.stringify({
        model: queryOptions.model,
        max_tokens: queryOptions.maxTokens,
        temperature: queryOptions.temperature,
        system: queryOptions.system,
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.anthropic.com',
          port: 443,
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed);
              } catch (err) {
                reject(new Error('Failed to parse response JSON'));
              }
            } else {
              reject(new Error(`Anthropic API error: ${res.statusCode} - ${data}`));
            }
          });
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        req.write(postData);
        req.end();
      });
      
      return result;
    } catch (error) {
      console.error('Error querying Claude:', error);
      throw error;
    }
  }
}

module.exports = { AnthropicAPIHandler };
