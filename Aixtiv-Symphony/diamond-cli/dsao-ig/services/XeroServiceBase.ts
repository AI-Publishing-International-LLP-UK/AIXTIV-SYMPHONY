/**
 * XeroServiceBase - Base class for Xero API integrations
 * 
 * Provides common functionality for multi-entity Xero operations including:
 * - Tenant management and OAuth2 authentication
 * - Rate limiting and error handling
 * - Token management and refresh
 * - Comprehensive logging and monitoring
 * - Entity-specific configurations
 */

import { XeroClient } from 'xero-node';
import { Logger } from '../core/logger';

export interface XeroEntityConfig {
  provider: string;
  entity: string;
  entityName: string;
  entityType: string;
  region: string;
  description: string;
  oauth2: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revokeEndpoint: string;
    userInfoEndpoint: string;
    responseType: string;
    grantType: string;
  };
  client: {
    clientIdSecretName: string;
    clientSecretSecretName: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
  };
  scopes: string[];
  endpoints: Record<string, string>;
  tokenManagement: {
    tokenRefreshThreshold: number;
    maxRetries: number;
    retryDelay: number;
    tokenStorageKey: string;
    stateStorageKey: string;
  };
  rateLimiting: {
    requestsPerMinute: number;
    requestsPerDay: number;
    burstLimit: number;
  };
  security: {
    enforceHttps: boolean;
    validateState: boolean;
    validateNonce: boolean;
    pkceRequired: boolean;
    tokenEncryption: boolean;
  };
  entitySpecific: {
    tenantId: string | null;
    baseCurrency: string;
    countryCode: string;
    timeZone: string;
    taxConfiguration: Record<string, any>;
    complianceRequirements: string[];
  };
}

export interface XeroApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  rateLimitRemaining?: number;
}

export abstract class XeroServiceBase {
  protected xeroClient: XeroClient | null = null;
  protected logger: Logger;
  protected config: XeroEntityConfig;
  protected tenantId: string;
  protected isInitialized: boolean = false;
  protected lastTokenRefresh: Date | null = null;
  protected requestCount: number = 0;
  protected rateLimitWindow: Date = new Date();

  constructor(tenantId: string, config: XeroEntityConfig) {
    this.tenantId = tenantId;
    this.config = config;
    this.logger = new Logger(`xero-service-${config.entity}`);
    
    // Update tenant in entity config if provided
    if (tenantId && this.config.entitySpecific) {
      this.config.entitySpecific.tenantId = tenantId;
    }
    
    this.logger.info(`Initializing Xero service for ${config.entityName} (${config.entity})`);
  }

  /**
   * Initialize the Xero client with OAuth2 credentials
   */
  protected async initialize(): Promise<void> {
    if (this.isInitialized && this.xeroClient) {
      return;
    }

    try {
      // Retrieve secrets from secure storage
      const clientId = await this.getSecret(this.config.client.clientIdSecretName);
      const clientSecret = await this.getSecret(this.config.client.clientSecretSecretName);

      // Initialize Xero client
      this.xeroClient = new XeroClient({
        clientId,
        clientSecret,
        redirectUris: [this.config.client.redirectUri],
        scopes: this.config.scopes,
        state: this.generateState(),
        pkce: this.config.security.pkceRequired
      });

      // Set tenant context if available
      if (this.tenantId) {
        await this.xeroClient.setTokenSet({
          access_token: await this.getStoredToken(),
          refresh_token: await this.getStoredRefreshToken(),
          token_type: 'Bearer',
          expires_at: await this.getTokenExpiry()
        });
      }

      this.isInitialized = true;
      this.logger.info(`Successfully initialized Xero client for ${this.config.entityName}`);
      
    } catch (error) {
      this.logger.error('Failed to initialize Xero client', { 
        error: error.message, 
        entity: this.config.entity,
        tenantId: this.tenantId 
      });
      throw new Error(`Xero initialization failed for ${this.config.entity}: ${error.message}`);
    }
  }

  /**
   * Execute API request with rate limiting and error handling
   */
  protected async executeApiRequest<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<XeroApiResponse<T>> {
    await this.initialize();
    await this.checkRateLimit();
    await this.refreshTokenIfNeeded();

    let retries = 0;
    const maxRetries = this.config.tokenManagement.maxRetries;

    while (retries <= maxRetries) {
      try {
        this.logger.debug(`Executing ${operationName} (attempt ${retries + 1})`);
        
        const result = await operation();
        this.requestCount++;
        
        this.logger.info(`Successfully executed ${operationName}`, {
          entity: this.config.entity,
          tenantId: this.tenantId,
          attempt: retries + 1
        });

        return {
          success: true,
          data: result,
          statusCode: 200
        };
        
      } catch (error: any) {
        this.logger.error(`Failed to execute ${operationName}`, {
          error: error.message,
          attempt: retries + 1,
          statusCode: error.response?.status,
          entity: this.config.entity
        });

        // Handle specific error types
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
        } else if (error.response?.status === 429) {
          // Rate limited, wait and retry
          await this.handleRateLimit(error);
        } else if (error.response?.status >= 500) {
          // Server error, retry with backoff
          await this.delay(this.config.tokenManagement.retryDelay * (retries + 1));
        } else if (retries === maxRetries) {
          // Final attempt failed
          return {
            success: false,
            error: error.message,
            statusCode: error.response?.status || 500
          };
        }

        retries++;
      }
    }

    return {
      success: false,
      error: `Operation failed after ${maxRetries + 1} attempts`,
      statusCode: 500
    };
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = new Date();
    const windowDuration = 60 * 1000; // 1 minute
    
    // Reset counter if window has passed
    if (now.getTime() - this.rateLimitWindow.getTime() > windowDuration) {
      this.requestCount = 0;
      this.rateLimitWindow = now;
    }

    // Check if we're approaching rate limit
    if (this.requestCount >= this.config.rateLimiting.requestsPerMinute) {
      const waitTime = windowDuration - (now.getTime() - this.rateLimitWindow.getTime());
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`, {
        entity: this.config.entity,
        requestCount: this.requestCount
      });
      await this.delay(waitTime);
      this.requestCount = 0;
      this.rateLimitWindow = new Date();
    }
  }

  /**
   * Handle rate limit response from API
   */
  private async handleRateLimit(error: any): Promise<void> {
    const retryAfter = error.response?.headers?.['retry-after'] || 60;
    this.logger.warn(`API rate limited, waiting ${retryAfter} seconds`, {
      entity: this.config.entity,
      retryAfter
    });
    await this.delay(retryAfter * 1000);
  }

  /**
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.lastTokenRefresh) {
      this.lastTokenRefresh = new Date();
      return;
    }

    const now = new Date();
    const timeSinceRefresh = now.getTime() - this.lastTokenRefresh.getTime();
    const refreshThreshold = this.config.tokenManagement.tokenRefreshThreshold * 1000;

    if (timeSinceRefresh > refreshThreshold) {
      await this.refreshToken();
    }
  }

  /**
   * Refresh OAuth2 token
   */
  private async refreshToken(): Promise<void> {
    try {
      if (!this.xeroClient) {
        throw new Error('Xero client not initialized');
      }

      this.logger.info('Refreshing Xero access token', { entity: this.config.entity });
      await this.xeroClient.refreshToken();
      await this.storeTokens();
      this.lastTokenRefresh = new Date();
      
    } catch (error) {
      this.logger.error('Failed to refresh token', {
        error: error.message,
        entity: this.config.entity
      });
      throw error;
    }
  }

  /**
   * Generate secure state parameter for OAuth2
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Abstract methods to be implemented by concrete classes
  protected abstract getSecret(secretName: string): Promise<string>;
  protected abstract getStoredToken(): Promise<string>;
  protected abstract getStoredRefreshToken(): Promise<string>;
  protected abstract getTokenExpiry(): Promise<number>;
  protected abstract storeTokens(): Promise<void>;

  /**
   * Get current tenant ID
   */
  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Get entity configuration
   */
  public getConfig(): XeroEntityConfig {
    return { ...this.config };
  }

  /**
   * Health check method
   */
  public async healthCheck(): Promise<{ status: string; entity: string; initialized: boolean }> {
    return {
      status: this.isInitialized ? 'healthy' : 'not-initialized',
      entity: this.config.entity,
      initialized: this.isInitialized
    };
  }
}
