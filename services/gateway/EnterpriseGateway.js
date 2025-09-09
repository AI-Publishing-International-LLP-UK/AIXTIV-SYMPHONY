/**
 * 🏢 ENTERPRISE GATEWAY - SALLYPORT VERIFICATION 🏢
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Enterprise Services
 * Date: September 2, 2025
 */

const BaseGateway = require('./BaseGateway');

class EnterpriseGateway extends BaseGateway {
  constructor(enterpriseService) {
    super('Enterprise Services', enterpriseService);
        
    if (!enterpriseService) {
      throw new Error('EnterpriseGateway requires an enterprise service dependency');
    }
        
    this.enterpriseService = enterpriseService;
    this.securityLevel = 'EMERALD'; // Level 90 - Enterprise Administrative
        
    console.log('🏢 EnterpriseGateway initialized for Enterprise Services');
  }
    
  async _performAuthentication(credentials, options = {}) {
    console.log('🔐 Performing Enterprise authentication with SallyPort verification...');
        
    try {
      const { sallyPortToken, userContext = {}, ...otherCredentials } = credentials;
            
      if (!sallyPortToken) {
        return {
          success: false,
          message: 'SallyPort token is required for Enterprise authentication',
          code: 'MISSING_SALLYPORT_TOKEN',
          securityLevel: this.securityLevel,
          timestamp: new Date().toISOString()
        };
      }
            
      const sallyPortResult = await this.verifySallyPort(sallyPortToken, {
        ...userContext,
        service: 'enterprise',
        securityLevel: this.securityLevel,
        requiredPermissions: ['enterprise:access', 'admin:functions', 'enterprise:management']
      });
            
      if (!sallyPortResult.success) {
        console.log('❌ Enterprise SallyPort verification failed');
        return {
          success: false,
          message: 'SallyPort verification failed for Enterprise service',
          code: 'SALLYPORT_VERIFICATION_FAILED',
          securityLevel: this.securityLevel,
          details: sallyPortResult,
          timestamp: new Date().toISOString()
        };
      }
            
      // Additional Enterprise-level security validation
      const enterpriseValidation = await this._validateEnterpriseAccess(sallyPortResult.user);
            
      if (!enterpriseValidation.success) {
        return enterpriseValidation;
      }
            
      console.log('✅ Enterprise authentication successful with SallyPort verification');
      return {
        success: true,
        message: 'Enterprise authentication successful',
        user: sallyPortResult.user,
        sessionId: sallyPortResult.sessionId,
        securityLevel: this.securityLevel,
        permissions: [
          ...sallyPortResult.permissions,
          'enterprise:administration',
          'enterprise:analytics',
          'enterprise:compliance',
          'enterprise:security',
          'enterprise:integration'
        ],
        service: 'enterprise',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
        timestamp: new Date().toISOString()
      };
            
    } catch (error) {
      console.error('💥 Enterprise authentication error:', error);
      return {
        success: false,
        message: 'Enterprise authentication system error',
        code: 'AUTHENTICATION_SYSTEM_ERROR',
        error: error.message,
        securityLevel: this.securityLevel,
        timestamp: new Date().toISOString()
      };
    }
  }
    
  async _validateEnterpriseAccess(user) {
    try {
      // Enterprise-level role validation
      const enterpriseRoles = ['Enterprise Admin', 'EAO', 'Executive', 'Director', 'VP', 'CTO', 'CEO', 'Principal'];
      const userRole = user.role || '';
            
      if (!enterpriseRoles.some(role => userRole.includes(role))) {
        return {
          success: false,
          message: 'Insufficient privileges for Enterprise access',
          code: 'INSUFFICIENT_ENTERPRISE_PRIVILEGES',
          requiredRoles: enterpriseRoles,
          userRole: userRole,
          timestamp: new Date().toISOString()
        };
      }
            
      // Additional enterprise security checks
      const securityChecks = [
        user.email && user.email.includes('@'), // Valid email format
        user.id && user.id.length > 3, // Valid user ID
        user.name && user.name.length > 2 // Valid name
      ];
            
      if (!securityChecks.every(check => check)) {
        return {
          success: false,
          message: 'Enterprise security validation failed',
          code: 'ENTERPRISE_SECURITY_VALIDATION_FAILED',
          timestamp: new Date().toISOString()
        };
      }
            
      return {
        success: true,
        message: 'Enterprise access validation successful'
      };
            
    } catch (error) {
      console.error('Enterprise access validation error:', error);
      return {
        success: false,
        message: 'Enterprise access validation error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
    
  getStatus() {
    const baseStatus = super.getStatus();
        
    return {
      ...baseStatus,
      gatewayType: 'EnterpriseGateway',
      securityLevel: this.securityLevel,
      serviceType: 'enterprise',
      supportedRoles: ['Enterprise Admin', 'EAO', 'Executive', 'Director', 'VP', 'CTO', 'CEO'],
      features: [
        'SallyPort verification',
        'Enterprise administration',
        'Advanced analytics',
        'Compliance management',
        'Security oversight',
        'System integration',
        'Multi-tenant management'
      ]
    };
  }
}

module.exports = EnterpriseGateway;
