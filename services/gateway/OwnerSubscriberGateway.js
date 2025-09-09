/**
 * 🏛️ OWNER SUBSCRIBER GATEWAY - SALLYPORT VERIFICATION 🏛️
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Owner Subscriber Services
 * Date: September 2, 2025
 * 
 * This gateway handles authentication and authorization for Owner Subscriber services
 * with full SallyPort verification integration.
 */

const BaseGateway = require('./BaseGateway');

/**
 * OwnerSubscriberGateway - Handles Owner Subscriber service authentication
 * Extends BaseGateway with specific SallyPort verification for owner subscriber services
 */
class OwnerSubscriberGateway extends BaseGateway {
  constructor(ownerSubscriberService) {
    super('Owner Subscriber Services', ownerSubscriberService);
        
    if (!ownerSubscriberService) {
      throw new Error('OwnerSubscriberGateway requires an owner subscriber service dependency');
    }
        
    this.ownerSubscriberService = ownerSubscriberService;
    this.securityLevel = 'ONYX'; // Level 30 - Owner Subscriber
        
    console.log('🏛️ OwnerSubscriberGateway initialized for Owner Subscriber Services');
  }
    
  /**
     * Perform specific authentication for Owner Subscriber services
     * Implements SallyPort verification with owner subscriber context
     * @param {Object} credentials - Authentication credentials including SallyPort token
     * @param {Object} options - Additional authentication options
     * @returns {Object} Authentication result
     */
  async _performAuthentication(credentials, options = {}) {
    console.log('🔐 Performing Owner Subscriber authentication with SallyPort verification...');
        
    try {
      // Extract SallyPort token from credentials
      const { sallyPortToken, userContext = {}, ...otherCredentials } = credentials;
            
      if (!sallyPortToken) {
        return {
          success: false,
          message: 'SallyPort token is required for Owner Subscriber authentication',
          code: 'MISSING_SALLYPORT_TOKEN',
          securityLevel: this.securityLevel,
          timestamp: new Date().toISOString()
        };
      }
            
      // Perform SallyPort verification
      const sallyPortResult = await this.verifySallyPort(sallyPortToken, {
        ...userContext,
        service: 'owner-subscriber',
        securityLevel: this.securityLevel,
        requiredPermissions: ['owner:read', 'subscriber:access']
      });
            
      if (!sallyPortResult.success) {
        console.log('❌ Owner Subscriber SallyPort verification failed');
        return {
          success: false,
          message: 'SallyPort verification failed for Owner Subscriber service',
          code: 'SALLYPORT_VERIFICATION_FAILED',
          securityLevel: this.securityLevel,
          details: sallyPortResult,
          timestamp: new Date().toISOString()
        };
      }
            
      // Additional Owner Subscriber specific validation
      const ownerValidation = await this._validateOwnerSubscriberAccess(
        sallyPortResult.user,
        otherCredentials,
        options
      );
            
      if (!ownerValidation.success) {
        return ownerValidation;
      }
            
      // Authentication successful
      console.log('✅ Owner Subscriber authentication successful with SallyPort verification');
      return {
        success: true,
        message: 'Owner Subscriber authentication successful',
        user: sallyPortResult.user,
        sessionId: sallyPortResult.sessionId,
        securityLevel: this.securityLevel,
        permissions: [
          ...sallyPortResult.permissions,
          'owner:dashboard',
          'subscriber:management',
          'billing:access'
        ],
        service: 'owner-subscriber',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        timestamp: new Date().toISOString()
      };
            
    } catch (error) {
      console.error('💥 Owner Subscriber authentication error:', error);
      return {
        success: false,
        message: 'Owner Subscriber authentication system error',
        code: 'AUTHENTICATION_SYSTEM_ERROR',
        error: error.message,
        securityLevel: this.securityLevel,
        timestamp: new Date().toISOString()
      };
    }
  }
    
  /**
     * Validate Owner Subscriber specific access requirements
     * @param {Object} user - Verified user from SallyPort
     * @param {Object} credentials - Additional credentials
     * @param {Object} options - Authentication options
     * @returns {Object} Validation result
     */
  async _validateOwnerSubscriberAccess(user, credentials, options) {
    try {
      // Check if user has owner subscriber role
      const allowedRoles = ['Owner Subscriber', 'CEO', 'Principal', 'Owner', 'Subscriber'];
      const userRole = user.role || '';
            
      if (!allowedRoles.some(role => userRole.includes(role))) {
        return {
          success: false,
          message: 'Insufficient permissions for Owner Subscriber services',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: userRole,
          timestamp: new Date().toISOString()
        };
      }
            
      // Validate with owner subscriber service
      if (this.ownerSubscriberService && this.ownerSubscriberService.validateAccess) {
        const serviceValidation = await this.ownerSubscriberService.validateAccess(user, credentials);
                
        if (!serviceValidation.valid) {
          return {
            success: false,
            message: 'Owner Subscriber service validation failed',
            code: 'SERVICE_VALIDATION_FAILED',
            details: serviceValidation,
            timestamp: new Date().toISOString()
          };
        }
      }
            
      return {
        success: true,
        message: 'Owner Subscriber access validation successful'
      };
            
    } catch (error) {
      console.error('Owner Subscriber access validation error:', error);
      return {
        success: false,
        message: 'Owner Subscriber access validation error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
    
  /**
     * Get Owner Subscriber Gateway specific status
     * @returns {Object} Gateway status with owner subscriber specifics
     */
  getStatus() {
    const baseStatus = super.getStatus();
        
    return {
      ...baseStatus,
      gatewayType: 'OwnerSubscriberGateway',
      securityLevel: this.securityLevel,
      serviceType: 'owner-subscriber',
      supportedRoles: ['Owner Subscriber', 'CEO', 'Principal', 'Owner', 'Subscriber'],
      requiredPermissions: ['owner:read', 'subscriber:access'],
      features: [
        'SallyPort verification',
        'Owner dashboard access',
        'Subscriber management',
        'Billing access',
        'Multi-level security'
      ]
    };
  }
}

module.exports = OwnerSubscriberGateway;
