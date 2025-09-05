/**
 * OAuth2 Client
 * 
 * Central OAuth2 client implementation that handles authentication flows, 
 * token management, and requests for the Integration Gateway.
 * 
 * (c) 2025 Copyright AI Publishing International LLP All Rights Reserved.
 * Developed with assistance from the Pilots of Vision Lake and
 * Claude Code Generator. This is Human Driven and 100% Human Project
 * Amplified by attributes of AI Technology.
 */

const fetch = require('node-fetch');
const crypto = require('crypto');
const chalk = require('chalk');

/**
 * OAuth2 client for handling authentication flows
 */
class OAuth2Client {
  constructor(options) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.tokenEndpoint = options.tokenEndpoint;
    this.authEndpoint = options.authEndpoint;
    this.scopes = options.scopes || [];
    this.tokenStore = options.tokenStore;
    this.provider = options.provider;
    this.timeout = options.timeout || 30000; // 30 second default timeout
  }

  /**
   * Generate authorization URL for OAuth2 flow
   * @param {string} state - Optional state parameter for security
   * @returns {Promise<string>} Authorization URL
   */
  async getAuthorizationUrl(state = null) {
    const stateValue = state || crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state: stateValue
    });

    // Store state for validation
    await this.tokenStore.saveState(this.provider, stateValue);

    return `${this.authEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code
   * @param {string} state - State parameter for validation
   * @returns {Promise<Object>} Token data
   */
  async getTokenFromCode(code, state = null) {
    try {
      // Validate state if provided
      if (state) {
        const storedState = await this.tokenStore.getState(this.provider);
        if (storedState !== state) {
          throw new Error('Invalid state parameter - possible CSRF attack');
        }
      }

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri
        }),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token request failed (${response.status}): ${errorText}`);
      }

      const tokenData = await response.json();
      
      // Add expiration timestamp
      if (tokenData.expires_in) {
        tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
      }

      await this.tokenStore.saveToken(this.provider, tokenData);
      
      // Clean up state
      if (state) {
        await this.tokenStore.removeState(this.provider);
      }

      return tokenData;
    } catch (error) {
      console.error(chalk.red(`[OAuth2] Token exchange failed for ${this.provider}:`), error.message);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object>} New token data
   */
  async refreshToken() {
    try {
      const currentToken = await this.tokenStore.getToken(this.provider);
      if (!currentToken || !currentToken.refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentToken.refresh_token,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        timeout: this.timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth2 token refresh failed (${response.status}): ${errorText}`);
      }

      const tokenData = await response.json();
      
      // Preserve refresh token if not returned
      if (!tokenData.refresh_token && currentToken.refresh_token) {
        tokenData.refresh_token = currentToken.refresh_token;
      }

      // Add expiration timestamp
      if (tokenData.expires_in) {
        tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
      }

      await this.tokenStore.saveToken(this.provider, tokenData);
      return tokenData;
    } catch (error) {
      console.error(chalk.red(`[OAuth2] Token refresh failed for ${this.provider}:`), error.message);
      throw error;
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   * @returns {Promise<Object>} Token data
   */
  async getAccessToken() {
    try {
      const token = await this.tokenStore.getToken(this.provider);
      
      if (!token) {
        throw new Error(`No access token available for provider ${this.provider}`);
      }

      // Check if token is expired (with 5-minute buffer)
      const expirationBuffer = 5 * 60 * 1000; // 5 minutes
      if (token.expires_at && token.expires_at < (Date.now() + expirationBuffer)) {
        console.log(chalk.yellow(`[OAuth2] Token expiring soon for ${this.provider}, refreshing...`));
        return await this.refreshToken();
      }

      return token;
    } catch (error) {
      console.error(chalk.red(`[OAuth2] Failed to get access token for ${this.provider}:`), error.message);
      throw error;
    }
  }

  /**
   * Make authenticated HTTP request with OAuth2 token
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} HTTP response
   */
  async fetchWithToken(url, options = {}) {
    try {
      const token = await this.getAccessToken();
      
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token.access_token}`
      };

      const response = await fetch(url, {
        ...options,
        headers,
        timeout: options.timeout || this.timeout
      });

      // Handle token expiration
      if (response.status === 401) {
        console.log(chalk.yellow(`[OAuth2] Received 401 for ${this.provider}, attempting token refresh...`));
        
        try {
          const newToken = await this.refreshToken();
          const retryHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newToken.access_token}`
          };

          return await fetch(url, {
            ...options,
            headers: retryHeaders,
            timeout: options.timeout || this.timeout
          });
        } catch (refreshError) {
          console.error(chalk.red(`[OAuth2] Token refresh failed, returning original 401 response`));
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error(chalk.red(`[OAuth2] Authenticated request failed for ${this.provider}:`), error.message);
      throw error;
    }
  }

  /**
   * Revoke access token
   * @returns {Promise<void>}
   */
  async revokeToken() {
    try {
      const token = await this.tokenStore.getToken(this.provider);
      if (!token) {
        return;
      }

      // Try to revoke token with provider if revocation endpoint is available
      if (this.revokeEndpoint) {
        try {
          await fetch(this.revokeEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${token.access_token}`
            },
            body: new URLSearchParams({
              token: token.access_token,
              client_id: this.clientId
            }),
            timeout: this.timeout
          });
        } catch (revokeError) {
          console.warn(chalk.yellow(`[OAuth2] Token revocation failed for ${this.provider}:`, revokeError.message));
        }
      }

      // Remove token from local storage
      await this.tokenStore.removeToken(this.provider);
      console.log(chalk.green(`[OAuth2] Token revoked for ${this.provider}`));
    } catch (error) {
      console.error(chalk.red(`[OAuth2] Failed to revoke token for ${this.provider}:`), error.message);
      throw error;
    }
  }

  /**
   * Check if we have a valid token
   * @returns {Promise<boolean>} Whether we have a valid token
   */
  async hasValidToken() {
    try {
      const token = await this.tokenStore.getToken(this.provider);
      if (!token) {
        return false;
      }

      // Check if token is expired
      if (token.expires_at && token.expires_at < Date.now()) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token info for debugging
   * @returns {Promise<Object>} Token information (without sensitive data)
   */
  async getTokenInfo() {
    try {
      const token = await this.tokenStore.getToken(this.provider);
      if (!token) {
        return { hasToken: false };
      }

      return {
        hasToken: true,
        hasRefreshToken: !!token.refresh_token,
        expiresAt: token.expires_at ? new Date(token.expires_at).toISOString() : null,
        scopes: token.scope ? token.scope.split(' ') : this.scopes,
        isExpired: token.expires_at ? token.expires_at < Date.now() : false
      };
    } catch (error) {
      return { hasToken: false, error: error.message };
    }
  }
}

module.exports = OAuth2Client;
