/**
 * 🏢 GROUP GATEWAY - SALLYPORT VERIFICATION 🏢
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Group Services
 * Date: September 2, 2025
 */

const BaseGateway = require('./BaseGateway');

class GroupGateway extends BaseGateway {
  constructor(groupService) {
    super('Group Services', groupService);
        
    if (!groupService) {
      throw new Error('GroupGateway requires a group service dependency');
    }
        
    this.groupService = groupService;
    this.securityLevel = 'OPAL'; // Level 50 - Group Access
        
    console.log('🏢 GroupGateway initialized for Group Services');
  }
    
  async _performAuthentication(credentials, options = {}) {
    console.log('🔐 Performing Group authentication with SallyPort verification...');
        
    try {
      const { sallyPortToken, userContext = {}, ...otherCredentials } = credentials;
            
      if (!sallyPortToken) {
        return {
          success: false,
          message: 'SallyPort token is required for Group authentication',
          code: 'MISSING_SALLYPORT_TOKEN',
          securityLevel: this.securityLevel,
          timestamp: new Date().toISOString()
        };
      }
            
      const sallyPortResult = await this.verifySallyPort(sallyPortToken, {
        ...userContext,
        service: 'group',
        securityLevel: this.securityLevel,
        requiredPermissions: ['group:access', 'group:collaborate']
      });
            
      if (!sallyPortResult.success) {
        console.log('❌ Group SallyPort verification failed');
        return {
          success: false,
          message: 'SallyPort verification failed for Group service',
          code: 'SALLYPORT_VERIFICATION_FAILED',
          securityLevel: this.securityLevel,
          details: sallyPortResult,
          timestamp: new Date().toISOString()
        };
      }
            
      console.log('✅ Group authentication successful with SallyPort verification');
      return {
        success: true,
        message: 'Group authentication successful',
        user: sallyPortResult.user,
        sessionId: sallyPortResult.sessionId,
        securityLevel: this.securityLevel,
        permissions: [
          ...sallyPortResult.permissions,
          'group:resources',
          'group:collaboration',
          'group:shared-spaces'
        ],
        service: 'group',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        timestamp: new Date().toISOString()
      };
            
    } catch (error) {
      console.error('💥 Group authentication error:', error);
      return {
        success: false,
        message: 'Group authentication system error',
        code: 'AUTHENTICATION_SYSTEM_ERROR',
        error: error.message,
        securityLevel: this.securityLevel,
        timestamp: new Date().toISOString()
      };
    }
  }
    
  getStatus() {
    const baseStatus = super.getStatus();
        
    return {
      ...baseStatus,
      gatewayType: 'GroupGateway',
      securityLevel: this.securityLevel,
      serviceType: 'group',
      supportedRoles: ['Group Member', 'Group Admin', 'Coordinator'],
      features: [
        'SallyPort verification',
        'Group resources',
        'Shared collaboration spaces',
        'Group communication',
        'Resource pooling'
      ]
    };
  }
}

module.exports = GroupGateway;
