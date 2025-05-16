/**
 * AcademicGateway Implementation
 * Extends BaseGateway to provide authentication for Academic services
 */

const BaseGateway = require('./BaseGateway');

/**
 * Gateway for Academic authentication and authorization
 */
class AcademicGateway extends BaseGateway {
  /**
   * AcademicGateway constructor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super(options);
    this.academicService = options.academicService;
    
    if (!this.academicService) {
      throw new Error('academicService is required for AcademicGateway');
    }
  }

  /**
   * Perform authentication with SallyPort verification and academic credential validation
   * @param {Object} context - Authentication context
   * @returns {Promise<Object>} Authentication result
   * @protected
   */
  async _performAuthentication(context) {
    try {
      // Original authentication logic
      const authResult = await super._performAuthentication(context).catch(() => ({
        success: true, // Default success for base implementation since it throws an error
        status: 200
      }));
      
      // SallyPort verification logic block
      if (context.sallyPortToken) {
        try {
          const verificationResult = await this.sallyPortVerifier.verify(context.sallyPortToken);
          
          if (!verificationResult.isValid) {
            this.logger.warn(`SallyPort verification failed: ${verificationResult.reason}`, { 
              requestId: context.requestId,
              userId: context.userId 
            });
            
            return {
              success: false,
              status: 401,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid SallyPort token'
              }
            };
          }
          
          // Check for minimum auth level requirement (3.0 for academic)
          const MINIMUM_AUTH_LEVEL = 3.0;
          if (verificationResult.authLevel < MINIMUM_AUTH_LEVEL) {
            this.logger.warn(`Insufficient authentication level: ${verificationResult.authLevel}`, { 
              requestId: context.requestId,
              userId: context.userId,
              requiredLevel: MINIMUM_AUTH_LEVEL
            });
            
            return {
              success: false,
              status: 403,
              error: {
                code: 'INSUFFICIENT_AUTH_LEVEL',
                message: `Authentication level (${verificationResult.authLevel}) is below required level (${MINIMUM_AUTH_LEVEL})`
              }
            };
          }
          
          // Academic-specific verification
          if (context.academicCredentials) {
            const academicVerification = await this.academicService.verifyCredentials(context.academicCredentials);
            
            if (!academicVerification.verified) {
              this.logger.warn(`Academic verification failed: ${academicVerification.reason}`, { 
                requestId: context.requestId,
                userId: context.userId 
              });
              
              return {
                success: false,
                status: academicVerification.status || 401,
                error: {
                  code: 'ACADEMIC_VERIFICATION_FAILED',
                  message: academicVerification.reason || 'Academic credentials verification failed'
                }
              };
            }
            
            // Add academic verification data to context
            context.academicVerification = academicVerification;
            this.logger.info('Academic credentials verified', { 
              requestId: context.requestId,
              userId: context.userId,
              accessLevel: academicVerification.accessLevel
            });
          } else if (context.requireAcademicCredentials) {
            // If academic credentials are required but not provided
            this.logger.warn('Academic credentials required but not provided', { 
              requestId: context.requestId,
              userId: context.userId 
            });
            
            return {
              success: false,
              status: 400,
              error: {
                code: 'MISSING_ACADEMIC_CREDENTIALS',
                message: 'Academic credentials are required for this operation'
              }
            };
          }
          
          // Enhance context with sallyPort verification data
          context.sallyPortVerification = verificationResult;
          this.logger.info('SallyPort verification successful', { 
            requestId: context.requestId,
            userId: context.userId 
          });
        } catch (spError) {
          this.logger.error(`Error during SallyPort verification: ${spError.message}`, { 
            requestId: context.requestId,
            userId: context.userId,
            error: spError 
          });
          
          return {
            success: false,
            status: 500,
            error: {
              code: 'SALLYPORT_ERROR',
              message: 'Error during SallyPort verification'
            }
          };
        }
      }

      return authResult;
    } catch (error) {
      this.logger.error(`Authentication error in AcademicGateway: ${error.message}`, { 
        requestId: context.requestId,
        error 
      });
      
      return {
        success: false,
        status: 500,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Failed to authenticate request'
        }
      };
    }
  }

  /**
   * Get academic resources with authorization check
   * @param {Object} context - Request context with authentication data
   * @param {Object} options - Resource retrieval options
   * @returns {Promise<Object>} Resources or error
   */
  async getAcademicResources(context, options = {}) {
    try {
      // First authenticate the request
      const authResult = await this.authenticate(context);
      
      if (!authResult.success) {
        return authResult; // Return authentication error
      }
      
      // Check if user has academic verification with appropriate access
      if (!context.academicVerification || 
          !['read', 'write', 'admin'].includes(context.academicVerification.accessLevel)) {
        this.logger.warn('Insufficient academic access level', { 
          requestId: context.requestId,
          userId: context.userId,
          accessLevel: context.academicVerification?.accessLevel 
        });
        
        return {
          success: false,
          status: 403,
          error: {
            code: 'INSUFFICIENT_ACADEMIC_ACCESS',
            message: 'User does not have sufficient academic access privileges'
          }
        };
      }
      
      // Set access level in options
      const resourceOptions = {
        ...options,
        accessLevel: context.academicVerification.accessLevel
      };
      
      // Get resources from academic service
      const result = await this.academicService.getResources(resourceOptions);
      
      return {
        success: result.success,
        status: result.success ? 200 : 500,
        resources: result.resources,
        count: result.count,
        total: result.total,
        error: result.error
      };
    } catch (error) {
      this.logger.error(`Error getting academic resources: ${error.message}`, { 
        requestId: context.requestId,
        error 
      });
      
      return {
        success: false,
        status: 500,
        error: {
          code: 'RESOURCE_RETRIEVAL_ERROR',
          message: 'Failed to retrieve academic resources'
        }
      };
    }
  }

  /**
   * Submit academic contribution with authorization check
   * @param {Object} context - Request context with authentication data
   * @param {Object} contribution - The contribution data
   * @returns {Promise<Object>} Submission result or error
   */
  async submitAcademicContribution(context, contribution) {
    try {
      // First authenticate the request
      const authResult = await this.authenticate(context);
      
      if (!authResult.success) {
        return authResult; // Return authentication error
      }
      
      // Check if user has academic verification with write or admin access
      if (!context.academicVerification || 
          !['write', 'admin'].includes(context.academicVerification.accessLevel)) {
        this.logger.warn('Insufficient academic access for contribution', { 
          requestId: context.requestId,
          userId: context.userId,
          accessLevel: context.academicVerification?.accessLevel 
        });
        
        return {
          success: false,
          status: 403,
          error: {
            code: 'INSUFFICIENT_CONTRIBUTION_PRIVILEGES',
            message: 'User does not have sufficient privileges to submit contributions'
          }
        };
      }
      
      // Add user ID to contribution if not already present
      const enhancedContribution = {
        ...contribution,
        userId: contribution.userId || context.userId
      };
      
      // Submit contribution via academic service
      const result = await this.academicService.submitContribution(enhancedContribution);
      
      return {
        success: result.success,
        status: result.status || (result.success ? 201 : 500),
        contributionId: result.contributionId,
        message: result.message,
        error: result.error
      };
    } catch (error) {
      this.logger.error(`Error submitting academic contribution: ${error.message}`, { 
        requestId: context.requestId,
        error 
      });
      
      return {
        success: false,
        status: 500,
        error: {
          code: 'CONTRIBUTION_SUBMISSION_ERROR',
          message: 'Failed to submit academic contribution'
        }
      };
    }
  }
}

module.exports = AcademicGateway;
