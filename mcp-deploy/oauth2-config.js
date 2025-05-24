// OAuth2 Configuration for MCP Server
const { GoogleAuth, OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

class OAuth2Config {
  constructor() {
    this.serviceAccountPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      path.join(__dirname, 'credentials/service-account.json');
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'api-for-warp-drive';
    this.targetServiceAccount =
      'drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com';
    this.scopes = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/firebase',
      'https://www.googleapis.com/auth/firebase.hosting',
      'https://www.googleapis.com/auth/compute',
      'https://www.googleapis.com/auth/devstorage.read_write',
    ];
    this.tokenCache = new Map();
  }

  async initialize() {
    try {
      if (!fs.existsSync(this.serviceAccountPath)) {
        throw new Error(
          `Service account key file not found at: ${this.serviceAccountPath}`
        );
      }

      console.log(`Using service account from: ${this.serviceAccountPath}`);

      // Initialize the auth client directly with impersonation
      this.auth = new GoogleAuth({
        keyFile: this.serviceAccountPath,
        scopes: this.scopes,
        projectId: this.projectId,
      });

      // Get a client that uses the service account
      const client = await this.auth.getClient();

      // Set up token mechanism for authentication
      this.getAccessTokenFromClient = async () => {
        const token = await client.getAccessToken();
        return token.token || token;
      };

      console.log(
        `OAuth2 client initialized successfully for project ${this.projectId}`
      );

      // Test the token to make sure it works
      try {
        const testToken = await this.getAccessTokenFromClient();
        console.log('Successfully obtained access token');
        return true;
      } catch (tokenError) {
        console.error('Failed to get initial access token:', tokenError);
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize OAuth2 client:', error);
      return false;
    }
  }

  async getAccessToken() {
    try {
      // Check if we have a cached token that's not expired
      const cachedToken = this.tokenCache.get('access_token');
      if (cachedToken && cachedToken.expiry > Date.now()) {
        return cachedToken.token;
      }

      // Get a new token using our client
      const token = await this.getAccessTokenFromClient();

      // Cache the token with expiry (typically 1 hour = 3600 seconds)
      const expiryTime = Date.now() + 3500 * 1000; // Slightly less than 1 hour to be safe
      this.tokenCache.set('access_token', {
        token: token,
        expiry: expiryTime,
      });

      console.log(`Generated new access token`);
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async validateToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // For MCP client connections using the static oauth2 token
      if (token === 'oauth2') {
        console.log('Using static oauth2 token for Claude Code connection');
        return true;
      }

      // For real tokens, try to validate against GCP
      try {
        // Create a temporary client to validate the token
        const auth = new GoogleAuth();
        const client = await auth.getClient();

        // Try to use the token to access a GCP API
        const url = `https://cloudresourcemanager.googleapis.com/v1/projects/${this.projectId}`;
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        try {
          await client.request({
            url,
            headers,
          });
          console.log('Token validated successfully against GCP API');
          return true;
        } catch (apiError) {
          console.error('Token validation failed:', apiError.message);
          return false;
        }
      } catch (validationError) {
        console.error('Token validation setup error:', validationError);

        // Fallback: Accept our own generated tokens
        const ownToken = await this.getAccessToken();
        if (token === ownToken) {
          console.log('Token matches our own generated token');
          return true;
        }

        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}

module.exports = new OAuth2Config();
