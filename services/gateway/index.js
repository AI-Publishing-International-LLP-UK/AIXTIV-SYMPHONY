/**
 * 🛡️ INTEGRATION GATEWAY SYSTEM - COMPLETE EXPORT MODULE 🛡️
 * 
 * CLASSIFICATION: DIAMOND SAO APEX SECURITY
 * Created for ASOOS Symphony - Integration Gateway System
 * Date: September 2, 2025
 * 
 * This module exports all gateway classes for use throughout the integration system.
 * All gateways implement SallyPort verification with multi-level security architecture.
 */

// Import all gateway classes
const BaseGateway = require('./BaseGateway');
const OwnerSubscriberGateway = require('./OwnerSubscriberGateway');
const TeamGateway = require('./TeamGateway');
const GroupGateway = require('./GroupGateway');
const PractitionerGateway = require('./PractitionerGateway');
const EnterpriseGateway = require('./EnterpriseGateway');

/**
 * Gateway Factory - Creates appropriate gateway instances
 */
class GatewayFactory {
  /**
     * Create a gateway instance based on service type
     * @param {string} serviceType - Type of service (owner-subscriber, team, group, practitioner, enterprise)
     * @param {Object} serviceInstance - Service dependency instance
     * @returns {BaseGateway} Gateway instance
     */
  static createGateway(serviceType, serviceInstance) {
    switch (serviceType.toLowerCase()) {
    case 'owner-subscriber':
    case 'owner':
    case 'subscriber':
      return new OwnerSubscriberGateway(serviceInstance);
                
    case 'team':
      return new TeamGateway(serviceInstance);
                
    case 'group':
      return new GroupGateway(serviceInstance);
                
    case 'practitioner':
    case 'professional':
      return new PractitionerGateway(serviceInstance);
                
    case 'enterprise':
    case 'admin':
      return new EnterpriseGateway(serviceInstance);
                
    default:
      throw new Error(`Unknown service type: ${serviceType}. Supported types: owner-subscriber, team, group, practitioner, enterprise`);
    }
  }
    
  /**
     * Get all available gateway types
     * @returns {Array} Available gateway types
     */
  static getAvailableGatewayTypes() {
    return [
      'owner-subscriber',
      'team', 
      'group',
      'practitioner',
      'enterprise'
    ];
  }
    
  /**
     * Get security levels for each gateway type
     * @returns {Object} Security level mapping
     */
  static getSecurityLevels() {
    return {
      'owner-subscriber': 'ONYX (Level 30)',
      'team': 'SAPPHIRE (Level 70)',
      'group': 'OPAL (Level 50)',
      'practitioner': 'SAPPHIRE (Level 70)',
      'enterprise': 'EMERALD (Level 90)'
    };
  }
    
  /**
     * Validate service configuration
     * @param {string} serviceType - Service type
     * @param {Object} serviceInstance - Service instance
     * @returns {Object} Validation result
     */
  static validateServiceConfiguration(serviceType, serviceInstance) {
    const result = {
      valid: false,
      errors: [],
      warnings: []
    };
        
    // Check if service type is supported
    if (!this.getAvailableGatewayTypes().includes(serviceType.toLowerCase())) {
      result.errors.push(`Unsupported service type: ${serviceType}`);
    }
        
    // Check if service instance is provided
    if (!serviceInstance) {
      result.warnings.push('No service instance provided - gateway will use fallback mechanisms');
    }
        
    // Validate service instance has required methods
    if (serviceInstance && typeof serviceInstance === 'object') {
      const recommendedMethods = ['validateAccess', 'authenticate', 'getStatus'];
      const missingMethods = recommendedMethods.filter(method => 
        typeof serviceInstance[method] !== 'function'
      );
            
      if (missingMethods.length > 0) {
        result.warnings.push(`Service instance missing recommended methods: ${missingMethods.join(', ')}`);
      }
    }
        
    result.valid = result.errors.length === 0;
    return result;
  }
}

// Export all gateway classes and factory
module.exports = {
  // Base Gateway
  BaseGateway,
    
  // Specific Gateway Implementations
  OwnerSubscriberGateway,
  TeamGateway,
  GroupGateway,
  PractitionerGateway,
  EnterpriseGateway,
    
  // Gateway Factory
  GatewayFactory,
    
  // Convenience function for creating gateways
  createGateway: GatewayFactory.createGateway.bind(GatewayFactory),
    
  // Information functions
  getAvailableGatewayTypes: GatewayFactory.getAvailableGatewayTypes.bind(GatewayFactory),
  getSecurityLevels: GatewayFactory.getSecurityLevels.bind(GatewayFactory),
  validateServiceConfiguration: GatewayFactory.validateServiceConfiguration.bind(GatewayFactory)
};

console.log('🛡️ Integration Gateway System loaded successfully');
console.log('Available gateways:', module.exports.getAvailableGatewayTypes());
console.log('Security levels:', module.exports.getSecurityLevels());
