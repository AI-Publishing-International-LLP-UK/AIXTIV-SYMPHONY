/**
 * 👥 TEAM GATEWAY - SALLYPORT VERIFICATION 👥
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Team Services
 * Date: September 2, 2025
 */

const BaseGateway = require('./BaseGateway');

class TeamGateway extends BaseGateway {
  constructor(teamService) {
    super('Team Services', teamService);
        
    if (!teamService) {
      throw new Error('TeamGateway requires a team service dependency');
    }
        
    this.teamService = teamService;
    this.securityLevel = 'SAPPHIRE'; // Level 70 - Team Access
        
    console.log('👥 TeamGateway initialized for Team Services');
  }
    
  async _performAuthentication(credentials, options = {}) {
    console.log('🔐 Performing Team authentication with SallyPort verification...');
        
    try {
      const { sallyPortToken, userContext = {}, ...otherCredentials } = credentials;
            
      if (!sallyPortToken) {
        return {
          success: false,
          message: 'SallyPort token is required for Team authentication',
          code: 'MISSING_SALLYPORT_TOKEN',
          securityLevel: this.securityLevel,
          timestamp: new Date().toISOString()
        };
      }
            
      const sallyPortResult = await this.verifySallyPort(sallyPortToken, {
        ...userContext,
        service: 'team',
        securityLevel: this.securityLevel,
        requiredPermissions: ['team:read', 'team:write']
      });
            
      if (!sallyPortResult.success) {
        console.log('❌ Team SallyPort verification failed');
        return {
          success: false,
          message: 'SallyPort verification failed for Team service',
          code: 'SALLYPORT_VERIFICATION_FAILED',
          securityLevel: this.securityLevel,
          details: sallyPortResult,
          timestamp: new Date().toISOString()
        };
      }
            
      console.log('✅ Team authentication successful with SallyPort verification');
      return {
        success: true,
        message: 'Team authentication successful',
        user: sallyPortResult.user,
        sessionId: sallyPortResult.sessionId,
        securityLevel: this.securityLevel,
        permissions: [
          ...sallyPortResult.permissions,
          'team:collaboration',
          'team:projects',
          'team:communication'
        ],
        service: 'team',
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        timestamp: new Date().toISOString()
      };
            
    } catch (error) {
      console.error('💥 Team authentication error:', error);
      return {
        success: false,
        message: 'Team authentication system error',
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
      gatewayType: 'TeamGateway',
      securityLevel: this.securityLevel,
      serviceType: 'team',
      supportedRoles: ['Team Member', 'Team Lead', 'Manager', 'Professional'],
      features: [
        'SallyPort verification',
        'Team collaboration',
        'Project management',
        'Team communication',
        'Resource sharing'
      ]
    };
  }
}

module.exports = TeamGateway;
