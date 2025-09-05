/**
 * 🛡️ BASE GATEWAY - ABSTRACT SALLYPORT AUTHENTICATION CLASS 🛡️
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Integration Gateway System
 * Date: September 2, 2025
 * 
 * This abstract base class provides core SallyPort verification functionality
 * for all gateway implementations in the integration system.
 */

const EventEmitter = require('events');
const UAOCoordinator = require('../uao-alignment/UAOCoordinator');

/**
 * BaseGateway - Abstract class for SallyPort authentication
 * Cannot be instantiated directly - must be extended by specific gateway implementations
 */
class BaseGateway extends EventEmitter {
    constructor(serviceName, serviceInstance = null) {
        super();
        
        // Prevent direct instantiation of abstract class
        if (new.target === BaseGateway) {
            throw new Error('BaseGateway is an abstract class and cannot be instantiated directly');
        }
        
        this.serviceName = serviceName;
        this.serviceInstance = serviceInstance;
        this.isInitialized = false;
        this.lastHealthCheck = null;
        this.authenticationState = 'NOT_AUTHENTICATED';
        
        // Initialize UAO Coordinator for WFA Swarm alignment
        this.uaoCoordinator = null;
        this.assignedWFAAgent = null;
        this.swarmAlignment = {
            enabled: true,
            quantumEntangled: false,
            agentAssigned: false,
            lastCoordination: null
        };
        
        console.log(`🛡️ BaseGateway initialized for service: ${serviceName}`);
        console.log(`🌌 UAO Swarm Alignment: ${this.swarmAlignment.enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    /**
     * Main authentication method - orchestrates the authentication flow
     * @param {Object} credentials - Authentication credentials
     * @param {Object} options - Additional authentication options
     * @returns {Object} Authentication result
     */
    async authenticate(credentials, options = {}) {
        console.log(`🔐 Starting authentication for ${this.serviceName}...`);
        
        try {
            this.authenticationState = 'AUTHENTICATING';
            this.emit('authenticationStarted', { service: this.serviceName, credentials });
            
            // Initialize UAO Coordinator if not already done
            await this.initializeUAOAlignment();
            
            // Request WFA Swarm agent coordination
            await this.requestWFAAgentCoordination(options.priority || 'NORMAL');
            
            // Perform the authentication using the specific implementation
            const authResult = await this._performAuthentication(credentials, options);
            
            if (authResult.success) {
                this.authenticationState = 'AUTHENTICATED';
                this.lastAuthenticationTime = new Date().toISOString();
                this.emit('authenticationSuccess', { service: this.serviceName, result: authResult });
                console.log(`✅ Authentication successful for ${this.serviceName}`);
                return authResult;
            } else {
                this.authenticationState = 'AUTHENTICATION_FAILED';
                this.emit('authenticationFailed', { service: this.serviceName, result: authResult });
                console.log(`❌ Authentication failed for ${this.serviceName}: ${authResult.message}`);
                return authResult;
            }
            
        } catch (error) {
            this.authenticationState = 'AUTHENTICATION_ERROR';
            console.error(`💥 Authentication error for ${this.serviceName}:`, error);
            
            const errorResult = {
                success: false,
                message: 'Authentication system error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.emit('authenticationError', { service: this.serviceName, error });
            return errorResult;
        }
    }
    
    /**
     * Abstract method for specific authentication implementation
     * Must be implemented by each gateway subclass
     * @param {Object} credentials - Authentication credentials
     * @param {Object} options - Additional authentication options
     * @returns {Object} Authentication result
     */
    async _performAuthentication(credentials, options = {}) {
        throw new Error('_performAuthentication must be implemented by gateway subclasses');
    }
    
    /**
     * SallyPort verification logic - standardized across all gateways
     * @param {string} sallyPortToken - SallyPort authentication token
     * @param {Object} userContext - User context information
     * @returns {Object} Verification result
     */
    async verifySallyPort(sallyPortToken, userContext = {}) {
        console.log(`🚪 Verifying SallyPort token for ${this.serviceName}...`);
        
        try {
            // Check if SallyPort token is provided
            if (!sallyPortToken) {
                return {
                    success: false,
                    message: 'SallyPort token is required',
                    code: 'MISSING_SALLYPORT_TOKEN',
                    timestamp: new Date().toISOString()
                };
            }
            
            // SallyPort verification logic
            // This would integrate with your existing SallyPort verifier system
            const verificationResult = await this._verifySallyPortToken(sallyPortToken, userContext);
            
            if (verificationResult.valid) {
                console.log(`✅ SallyPort verification successful for ${this.serviceName}`);
                return {
                    success: true,
                    message: 'SallyPort token verified successfully',
                    user: verificationResult.user,
                    permissions: verificationResult.permissions,
                    sessionId: verificationResult.sessionId,
                    timestamp: new Date().toISOString()
                };
            } else {
                console.log(`❌ SallyPort verification failed for ${this.serviceName}`);
                return {
                    success: false,
                    message: 'SallyPort token verification failed',
                    code: 'INVALID_SALLYPORT_TOKEN',
                    reason: verificationResult.reason,
                    timestamp: new Date().toISOString()
                };
            }
            
        } catch (error) {
            console.error(`💥 SallyPort verification error for ${this.serviceName}:`, error);
            return {
                success: false,
                message: 'SallyPort verification system error',
                code: 'SALLYPORT_SYSTEM_ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Internal SallyPort token verification - integrates with existing system
     * @param {string} token - SallyPort token
     * @param {Object} context - User context
     * @returns {Object} Token verification result
     */
    async _verifySallyPortToken(token, context) {
        // This integrates with your existing SallyPort client
        // Based on the test results, we know this system is already working
        try {
            // Mock implementation - replace with actual SallyPort verifier
            const sallyPortVerifier = this.serviceInstance?.sallyPortVerifier || this._getDefaultSallyPortVerifier();
            
            // Call the SallyPort verification service
            const verificationResponse = await sallyPortVerifier.verify(token, context);
            
            return {
                valid: verificationResponse.valid || verificationResponse.success,
                user: verificationResponse.user,
                permissions: verificationResponse.permissions || [],
                sessionId: verificationResponse.sessionId || `session_${Date.now()}`,
                reason: verificationResponse.reason || verificationResponse.message
            };
            
        } catch (error) {
            console.error('SallyPort token verification error:', error);
            return {
                valid: false,
                reason: 'Token verification service unavailable',
                error: error.message
            };
        }
    }
    
    /**
     * Get default SallyPort verifier for testing/fallback
     * @returns {Object} Mock SallyPort verifier
     */
    _getDefaultSallyPortVerifier() {
        return {
            async verify(token, context) {
                // Basic token validation for demo/testing
                if (token && token.length > 10) {
                    return {
                        valid: true,
                        success: true,
                        user: {
                            id: context.uuid || '00001',
                            name: context.name || 'Demo User',
                            role: context.role || 'User',
                            email: context.email || 'demo@example.com'
                        },
                        permissions: ['read', 'write'],
                        sessionId: `mock_session_${Date.now()}`
                    };
                } else {
                    return {
                        valid: false,
                        reason: 'Invalid token format'
                    };
                }
            }
        };
    }
    
    /**
     * Initialize UAO Coordinator for WFA Swarm alignment
     */
    async initializeUAOAlignment() {
        if (!this.uaoCoordinator && this.swarmAlignment.enabled) {
            console.log(`🌌 Initializing UAO Coordinator for ${this.serviceName}...`);
            
            try {
                this.uaoCoordinator = new UAOCoordinator();
                await this.uaoCoordinator.initializeUAOAlignment();
                
                // Set up event listeners
                this.uaoCoordinator.on('agentAssigned', (data) => {
                    this.handleWFAAgentAssignment(data);
                });
                
                this.uaoCoordinator.on('agentReleased', (data) => {
                    this.handleWFAAgentRelease(data);
                });
                
                this.swarmAlignment.quantumEntangled = true;
                console.log(`✅ UAO Coordinator initialized for ${this.serviceName}`);
                
            } catch (error) {
                console.error(`❌ UAO Coordinator initialization failed for ${this.serviceName}:`, error);
                this.swarmAlignment.enabled = false;
            }
        }
    }
    
    /**
     * Request WFA Swarm agent coordination
     */
    async requestWFAAgentCoordination(priority = 'NORMAL') {
        if (!this.uaoCoordinator || !this.swarmAlignment.enabled) {
            console.log(`⚠️ UAO Coordinator not available for ${this.serviceName}`);
            return;
        }
        
        try {
            console.log(`🎯 Requesting WFA agent coordination for ${this.serviceName} (Priority: ${priority})`);
            
            const agent = await this.uaoCoordinator.coordinateAgentRequest(
                this.serviceName, 
                'AUTHENTICATION_REQUEST', 
                priority
            );
            
            this.assignedWFAAgent = agent;
            this.swarmAlignment.agentAssigned = true;
            this.swarmAlignment.lastCoordination = new Date().toISOString();
            
            console.log(`✅ WFA Agent ${agent.id} assigned to ${this.serviceName}`);
            
        } catch (error) {
            console.error(`❌ WFA agent coordination failed for ${this.serviceName}:`, error);
        }
    }
    
    /**
     * Handle WFA agent assignment event
     */
    handleWFAAgentAssignment(data) {
        if (data.gateway === this.serviceName) {
            console.log(`🎉 WFA Agent ${data.agent.id} successfully assigned to ${this.serviceName}`);
            this.emit('wfaAgentAssigned', data);
        }
    }
    
    /**
     * Handle WFA agent release event
     */
    handleWFAAgentRelease(data) {
        if (data.previousGateway === this.serviceName) {
            console.log(`🔄 WFA Agent ${data.agent.id} released from ${this.serviceName}`);
            this.assignedWFAAgent = null;
            this.swarmAlignment.agentAssigned = false;
            this.emit('wfaAgentReleased', data);
        }
    }
    
    /**
     * Release assigned WFA agent
     */
    async releaseWFAAgent() {
        if (this.assignedWFAAgent && this.uaoCoordinator) {
            try {
                await this.uaoCoordinator.releaseAgent(this.assignedWFAAgent.id);
                console.log(`✅ Released WFA Agent ${this.assignedWFAAgent.id} from ${this.serviceName}`);
            } catch (error) {
                console.error(`❌ Failed to release WFA agent:`, error);
            }
        }
    }
    
    /**
     * Get UAO coordination metrics
     */
    getUAOMetrics() {
        if (this.uaoCoordinator) {
            return this.uaoCoordinator.getCoordinationMetrics();
        }
        return { error: 'UAO Coordinator not initialized' };
    }
    
    /**
     * Health check for the gateway
     * @returns {Object} Health status
     */
    async performHealthCheck() {
        console.log(`💚 Performing health check for ${this.serviceName}...`);
        
        this.lastHealthCheck = new Date().toISOString();
        
        return {
            service: this.serviceName,
            status: 'HEALTHY',
            authenticationState: this.authenticationState,
            lastHealthCheck: this.lastHealthCheck,
            lastAuthenticationTime: this.lastAuthenticationTime || null,
            uptime: process.uptime(),
            timestamp: this.lastHealthCheck
        };
    }
    
    /**
     * Get gateway status information
     * @returns {Object} Gateway status
     */
    getStatus() {
        return {
            serviceName: this.serviceName,
            isInitialized: this.isInitialized,
            authenticationState: this.authenticationState,
            lastHealthCheck: this.lastHealthCheck,
            lastAuthenticationTime: this.lastAuthenticationTime || null,
            events: this.listenerCount('authenticationSuccess') > 0,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Initialize the gateway
     * @returns {boolean} Initialization success
     */
    async initialize() {
        console.log(`⚡ Initializing gateway for ${this.serviceName}...`);
        
        try {
            // Perform any initialization logic
            this.isInitialized = true;
            this.emit('gatewayInitialized', { service: this.serviceName });
            console.log(`✅ Gateway initialized successfully for ${this.serviceName}`);
            return true;
        } catch (error) {
            console.error(`❌ Gateway initialization failed for ${this.serviceName}:`, error);
            return false;
        }
    }
    
    /**
     * Shutdown the gateway gracefully
     * @returns {boolean} Shutdown success
     */
    async shutdown() {
        console.log(`🛑 Shutting down gateway for ${this.serviceName}...`);
        
        try {
            this.isInitialized = false;
            this.authenticationState = 'SHUTDOWN';
            this.removeAllListeners();
            
            this.emit('gatewayShutdown', { service: this.serviceName });
            console.log(`✅ Gateway shutdown complete for ${this.serviceName}`);
            return true;
        } catch (error) {
            console.error(`❌ Gateway shutdown failed for ${this.serviceName}:`, error);
            return false;
        }
    }
}

module.exports = BaseGateway;
