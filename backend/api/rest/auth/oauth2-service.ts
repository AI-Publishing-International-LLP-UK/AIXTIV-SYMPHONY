/**
 * REST API OAuth2 Service
 * Provides OAuth2 authentication for REST API endpoints
 */

import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * OAuth2 Configuration Interface
 */
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
  authorizationEndpoint: string;
  userInfoEndpoint: string;
  scope: string;
  redirectUri: string;
}

/**
 * Client Credentials Grant Response
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Service Authentication Configuration
 */
export interface ServiceAuthConfig {
  clientId: string;
  clientSecret: string;
  scope: string;
}

/**
 * JWT Token Payload
 */
export interface TokenPayload {
  sub: string;
  iss: string;
  aud: string[];
  exp: number;
  iat: number;
  scope?: string;
  [key: string]: any;
}

/**
 * OAuth2 Service for REST API Authentication
 */
export class OAuth2Service {
  private config: OAuth2Config;
  private cachedTokens: Map<string, { token: string; expiresAt: number }> = new Map();

  constructor(config: OAuth2Config) {
    this.config = config;
  }

  /**
   * Get the OAuth2 configuration
   */
  getConfig(): OAuth2Config {
    return this.config;
  }

  /**
   * Generate the authorization URL for user authentication
   */
  generateAuthorizationUrl(state: string, redirectUri?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri || this.config.redirectUri,
      state,
      scope: this.config.scope,
    });

    return `${this.config.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange an authorization code for tokens
   */
  async exchangeCodeForToken(code: string, redirectUri?: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: redirectUri || this.config.redirectUri,
      });

      const response = await axios.post(
        this.config.tokenEndpoint, 
        params, 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Request client credentials grant for service-to-service authentication
   */
  async getClientCredentialsToken(config: ServiceAuthConfig): Promise<string> {
    const cacheKey = `${config.clientId}:${config.scope}`;
    const cachedToken = this.cachedTokens.get(cacheKey);

    // Return cached token if it's still valid
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.token;
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: config.scope,
      });

      const response = await axios.post(
        this.config.tokenEndpoint, 
        params, 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, expires_in } = response.data;

      // Cache the token with expiration
      const expiresAt = Date.now() + (expires_in * 1000) - 60000; // Expire 1 minute early
      this.cachedTokens.set(cacheKey, { token: access_token, expiresAt });

      return access_token;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      throw new Error('Failed to obtain client credentials token');
    }
  }

  /**
   * Refresh an expired token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });

      const response = await axios.post(
        this.config.tokenEndpoint, 
        params, 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Validate a JWT token
   */
  validateToken(token: string): TokenPayload | null {
    try {
      // In a real implementation, this would verify the JWT signature
      // This is a simplified implementation for demonstration
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        return null;
      }

      const decodedPayload = JSON.parse(
        Buffer.from(payload, 'base64').toString('utf-8')
      );

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp && decodedPayload.exp < now) {
        return null;
      }

      return decodedPayload;
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  }

  /**
   * Add authorization to request config
   */
  addAuthToRequest(config: AxiosRequestConfig, token: string): AxiosRequestConfig {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }

  /**
   * Generate a secure random token for CSRF protection
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * Default OAuth2 configuration for ASOOS
 */
export const defaultOAuth2Config: OAuth2Config = {
  clientId: process.env.OAUTH_CLIENT_ID || 'api-for-warp-drive',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
  tokenEndpoint: process.env.OAUTH_TOKEN_ENDPOINT || 'https://oauth.aixtiv-api.us-west1.run.app/token',
  authorizationEndpoint: process.env.OAUTH_AUTH_ENDPOINT || 'https://oauth.aixtiv-api.us-west1.run.app/authorize',
  userInfoEndpoint: process.env.OAUTH_USERINFO_ENDPOINT || 'https://oauth.aixtiv-api.us-west1.run.app/userinfo',
  scope: process.env.OAUTH_SCOPE || 'api.products api.video api.speech',
  redirectUri: process.env.OAUTH_REDIRECT_URI || 'https://api-for-warp-drive.us-west1.run.app/auth/callback',
};

// Export a singleton instance with default configuration
export const oauth2Service = new OAuth2Service(defaultOAuth2Config);