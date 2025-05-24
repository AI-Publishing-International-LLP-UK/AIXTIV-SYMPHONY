/**
 * Gateway Factory Module
 *
 * This module implements a factory pattern for creating the appropriate
 * IntegrationGateway instance based on tier type. Provides support for
 * all 5 subscription tiers with proper error handling.
 */

const {
  OwnerSubscriberGateway,
  TeamGateway,
  GroupGateway,
  PractitionerGateway,
  EnterpriseGateway,
} = require('./gateway-implementations');

const { Logger } = require('../utils/logger');
const logger = new Logger('GatewayFactory');

/**
 * Tier types supported by the Aixtiv Symphony Opus1 system
 * @enum {string}
 */
const TierType = {
  OWNER_SUBSCRIBER: 'owner_subscriber',
  TEAM: 'team',
  GROUP: 'group',
  PRACTITIONER: 'practitioner',
  ENTERPRISE: 'enterprise',
};

/**
 * Factory class for creating IntegrationGateway instances based on tier type
 */
class GatewayFactory {
  /**
   * Creates an instance of GatewayFactory
   * @param {Object} options Configuration options
   * @param {Object} options.secretManager Reference to the secret manager
   * @param {Object} options.configProvider Reference to the config provider
   */
  constructor(options = {}) {
    this.secretManager = options.secretManager;
    this.configProvider = options.configProvider;

    // Cache for gateway instances to improve performance
    this.gatewayCache = new Map();

    // Default factory settings
    this.settings = {
      enableCaching: true,
      cacheTTL: 3600000, // 1 hour in milliseconds
      ...options.settings,
    };

    logger.info(
      'GatewayFactory initialized with cache enabled:',
      this.settings.enableCaching
    );
  }

  /**
   * Creates an appropriate gateway instance based on the specified tier type
   *
   * @param {string} tierType The type of tier (from TierType enum)
   * @param {Object} context Additional context information
   * @param {string} context.userId ID of the user requesting the gateway
   * @param {string} context.orgId ID of the organization
   * @param {Object} [options={}] Additional options for gateway creation
   * @returns {Object} An instance of the appropriate IntegrationGateway
   * @throws {Error} If the tier type is invalid or gateway creation fails
   */
  createGateway(tierType, context, options = {}) {
    // Validate inputs
    if (!tierType) {
      const error = new Error('Tier type must be specified');
      logger.error('Failed to create gateway: missing tier type', { error });
      throw error;
    }

    if (!context || !context.userId) {
      const error = new Error('User context is required');
      logger.error('Failed to create gateway: missing user context', { error });
      throw error;
    }

    // Normalize tier type to lowercase for case-insensitive matching
    const normalizedTierType = tierType.toLowerCase();

    try {
      // Check if we have a cached instance that can be reused
      const cacheKey = this._generateCacheKey(normalizedTierType, context);
      if (this.settings.enableCaching && this.gatewayCache.has(cacheKey)) {
        const cachedGateway = this.gatewayCache.get(cacheKey);

        // Only return cached gateway if it's still valid
        if (this._isCacheValid(cachedGateway)) {
          logger.debug('Returning cached gateway instance', {
            tierType: normalizedTierType,
            userId: context.userId,
          });
          return cachedGateway.instance;
        }

        // Remove expired cache entry
        this.gatewayCache.delete(cacheKey);
      }

      // Create a new gateway instance based on tier type
      const gatewayInstance = this._instantiateGateway(
        normalizedTierType,
        context,
        options
      );

      // Cache the new instance if caching is enabled
      if (this.settings.enableCaching) {
        this.gatewayCache.set(cacheKey, {
          instance: gatewayInstance,
          createdAt: Date.now(),
          expiresAt: Date.now() + this.settings.cacheTTL,
        });
      }

      logger.info('Created new gateway instance', {
        tierType: normalizedTierType,
        userId: context.userId,
        cached: this.settings.enableCaching,
      });

      return gatewayInstance;
    } catch (error) {
      logger.error('Failed to create gateway', {
        tierType: normalizedTierType,
        userId: context.userId,
        error: error.message,
        stack: error.stack,
      });

      throw new Error(
        `Failed to create gateway for tier ${tierType}: ${error.message}`
      );
    }
  }

  /**
   * Clears the gateway cache
   * @param {string} [tierType] Optional tier type to clear specific cache entries
   * @returns {number} Number of cache entries cleared
   */
  clearCache(tierType) {
    if (tierType) {
      // Clear only entries for the specified tier type
      const normalizedTierType = tierType.toLowerCase();
      let clearedCount = 0;

      for (const [key, value] of this.gatewayCache.entries()) {
        if (key.startsWith(normalizedTierType)) {
          this.gatewayCache.delete(key);
          clearedCount++;
        }
      }

      logger.info(
        `Cleared ${clearedCount} cache entries for tier type: ${normalizedTierType}`
      );
      return clearedCount;
    } else {
      // Clear all entries
      const count = this.gatewayCache.size;
      this.gatewayCache.clear();
      logger.info(`Cleared all ${count} gateway cache entries`);
      return count;
    }
  }

  /**
   * Gets all supported tier types
   * @returns {Array<string>} Array of supported tier types
   */
  getSupportedTierTypes() {
    return Object.values(TierType);
  }

  /**
   * Private method to instantiate the appropriate gateway based on tier type
   *
   * @private
   * @param {string} tierType The normalized tier type
   * @param {Object} context User context information
   * @param {Object} options Additional options
   * @returns {Object} An instance of the appropriate IntegrationGateway
   * @throws {Error} If the tier type is not supported
   */
  _instantiateGateway(tierType, context, options) {
    const baseOptions = {
      secretManager: this.secretManager,
      configProvider: this.configProvider,
      userId: context.userId,
      orgId: context.orgId,
      ...options,
    };

    switch (tierType) {
      case TierType.OWNER_SUBSCRIBER:
        return new OwnerSubscriberGateway(baseOptions);

      case TierType.TEAM:
        return new TeamGateway(baseOptions);

      case TierType.GROUP:
        return new GroupGateway(baseOptions);

      case TierType.PRACTITIONER:
        return new PractitionerGateway(baseOptions);

      case TierType.ENTERPRISE:
        return new EnterpriseGateway(baseOptions);

      default:
        throw new Error(`Unsupported tier type: ${tierType}`);
    }
  }

  /**
   * Generates a cache key for a gateway instance
   *
   * @private
   * @param {string} tierType The tier type
   * @param {Object} context The user context
   * @returns {string} A unique cache key
   */
  _generateCacheKey(tierType, context) {
    return `${tierType}:${context.userId}:${context.orgId || 'no-org'}`;
  }

  /**
   * Checks if a cached gateway is still valid
   *
   * @private
   * @param {Object} cachedGateway The cached gateway entry
   * @returns {boolean} True if the cached gateway is still valid
   */
  _isCacheValid(cachedGateway) {
    return cachedGateway && cachedGateway.expiresAt > Date.now();
  }
}

module.exports = {
  GatewayFactory,
  TierType,
};
