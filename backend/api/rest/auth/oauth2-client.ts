/**
 * OAuth2 Client for API Consumers
 * Provides a client for consuming REST APIs with OAuth2 authentication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { oauth2Service, ServiceAuthConfig, TokenResponse } from './oauth2-service';

/**
 * OAuth2 API Client Options
 */
export interface OAuth2ClientOptions {
  baseURL: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  tokenEndpoint: string;
  autoRefresh?: boolean;
}

/**
 * OAuth2 API Client for consuming REST APIs
 */
export class OAuth2Client {
  private axios: AxiosInstance;
  private options: OAuth2ClientOptions;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  constructor(options: OAuth2ClientOptions) {
    this.options = options;
    
    // Create axios instance
    this.axios = axios.create({
      baseURL: options.baseURL,
    });

    // Add request interceptor for authentication
    this.axios.interceptors.request.use(async (config) => {
      // Add authentication token to request
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for token refresh
    if (options.autoRefresh) {
      this.axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          
          // If the error is 401 (Unauthorized) and we haven't already tried to refresh
          if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              // Try to refresh the token
              await this.refreshAccessToken();
              
              // Update the authorization header with the new token
              originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
              
              // Retry the original request
              return this.axios(originalRequest);
            } catch (refreshError) {
              // If refresh fails, clear tokens and return the original error
              this.clearTokens();
              return Promise.reject(error);
            }
          }
          
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Get the current access token, obtaining a new one if necessary
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if it's still valid
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }

    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Try to refresh with refresh token if available
    if (this.refreshToken) {
      this.refreshPromise = this.refreshAccessToken()
        .catch(() => this.requestClientCredentialsToken())
        .finally(() => {
          this.refreshPromise = null;
        });
      return this.refreshPromise;
    }

    // Otherwise get a new token with client credentials
    this.refreshPromise = this.requestClientCredentialsToken()
      .finally(() => {
        this.refreshPromise = null;
      });
    return this.refreshPromise;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        this.options.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.options.clientId,
          client_secret: this.options.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = response.data as TokenResponse;
      this.accessToken = access_token;
      
      if (refresh_token) {
        this.refreshToken = refresh_token;
      }
      
      this.tokenExpiresAt = Date.now() + (expires_in * 1000) - 60000; // Expire 1 minute early
      
      return access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Clear tokens on refresh failure
      this.clearTokens();
      
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Request a new token using client credentials
   */
  private async requestClientCredentialsToken(): Promise<string> {
    const serviceConfig: ServiceAuthConfig = {
      clientId: this.options.clientId,
      clientSecret: this.options.clientSecret,
      scope: this.options.scope,
    };

    try {
      const token = await oauth2Service.getClientCredentialsToken(serviceConfig);
      this.accessToken = token;
      this.tokenExpiresAt = Date.now() + 3600000 - 60000; // Assume 1 hour expiry, minus 1 minute
      return token;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      this.clearTokens();
      throw new Error('Failed to obtain client credentials token');
    }
  }

  /**
   * Clear cached tokens
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Set tokens manually (e.g., from user authentication)
   */
  setTokens(accessToken: string, refreshToken: string | null = null, expiresIn: number = 3600): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000) - 60000; // Expire 1 minute early
  }

  /**
   * Make an authenticated HTTP request
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axios.request<T>(config);
  }

  /**
   * Make an authenticated GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axios.get<T>(url, config);
  }

  /**
   * Make an authenticated POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axios.post<T>(url, data, config);
  }

  /**
   * Make an authenticated PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axios.put<T>(url, data, config);
  }

  /**
   * Make an authenticated DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axios.delete<T>(url, config);
  }
}

/**
 * Create an OAuth2 client with default configuration
 */
export function createOAuth2Client(options: Partial<OAuth2ClientOptions> = {}): OAuth2Client {
  return new OAuth2Client({
    baseURL: options.baseURL || 'https://api-for-warp-drive.us-west1.run.app',
    clientId: options.clientId || process.env.OAUTH_CLIENT_ID || 'api-for-warp-drive',
    clientSecret: options.clientSecret || process.env.OAUTH_CLIENT_SECRET || '',
    scope: options.scope || 'api.products api.video api.speech',
    tokenEndpoint: options.tokenEndpoint || 'https://oauth.aixtiv-api.us-west1.run.app/token',
    autoRefresh: options.autoRefresh !== undefined ? options.autoRefresh : true,
  });
}