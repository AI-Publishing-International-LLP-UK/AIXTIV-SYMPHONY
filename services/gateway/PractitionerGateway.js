/**
 * 👨‍⚕️ PRACTITIONER GATEWAY - SALLYPORT VERIFICATION 👨‍⚕️
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Practitioner Services
 * Date: September 2, 2025
 */

const BaseGateway = require('./BaseGateway');

class PractitionerGateway extends BaseGateway {
    constructor(practitionerService) {
        super('Practitioner Services', practitionerService);
        
        if (!practitionerService) {
            throw new Error('PractitionerGateway requires a practitioner service dependency');
        }
        
        this.practitionerService = practitionerService;
        this.securityLevel = 'SAPPHIRE'; // Level 70 - Professional Access
        
        console.log('👨‍⚕️ PractitionerGateway initialized for Practitioner Services');
    }
    
    async _performAuthentication(credentials, options = {}) {
        console.log('🔐 Performing Practitioner authentication with SallyPort verification...');
        
        try {
            const { sallyPortToken, userContext = {}, ...otherCredentials } = credentials;
            
            if (!sallyPortToken) {
                return {
                    success: false,
                    message: 'SallyPort token is required for Practitioner authentication',
                    code: 'MISSING_SALLYPORT_TOKEN',
                    securityLevel: this.securityLevel,
                    timestamp: new Date().toISOString()
                };
            }
            
            const sallyPortResult = await this.verifySallyPort(sallyPortToken, {
                ...userContext,
                service: 'practitioner',
                securityLevel: this.securityLevel,
                requiredPermissions: ['practitioner:access', 'professional:tools']
            });
            
            if (!sallyPortResult.success) {
                console.log('❌ Practitioner SallyPort verification failed');
                return {
                    success: false,
                    message: 'SallyPort verification failed for Practitioner service',
                    code: 'SALLYPORT_VERIFICATION_FAILED',
                    securityLevel: this.securityLevel,
                    details: sallyPortResult,
                    timestamp: new Date().toISOString()
                };
            }
            
            console.log('✅ Practitioner authentication successful with SallyPort verification');
            return {
                success: true,
                message: 'Practitioner authentication successful',
                user: sallyPortResult.user,
                sessionId: sallyPortResult.sessionId,
                securityLevel: this.securityLevel,
                permissions: [
                    ...sallyPortResult.permissions,
                    'practitioner:tools',
                    'professional:resources',
                    'client:management',
                    'compliance:access'
                ],
                service: 'practitioner',
                expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('💥 Practitioner authentication error:', error);
            return {
                success: false,
                message: 'Practitioner authentication system error',
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
            gatewayType: 'PractitionerGateway',
            securityLevel: this.securityLevel,
            serviceType: 'practitioner',
            supportedRoles: ['Practitioner', 'Professional', 'Consultant', 'Expert'],
            features: [
                'SallyPort verification',
                'Professional tools access',
                'Client management',
                'Compliance monitoring',
                'Professional resources',
                'Certification management'
            ]
        };
    }
}

module.exports = PractitionerGateway;
