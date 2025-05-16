/**
 * AcademicService Implementation
 * Handles academic-related operations including credential verification,
 * resource access, and contribution submissions
 */

const logger = require('../common/logger');

/**
 * Service for handling academic operations
 */
class AcademicService {
  /**
   * AcademicService constructor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.logger = options.logger || logger;
    this.allowedInstitutions = options.allowedInstitutions || [
      'mit.edu',
      'harvard.edu',
      'stanford.edu',
      'berkeley.edu',
      'ox.ac.uk',
      'cam.ac.uk',
      'ethz.ch',
      'caltech.edu',
      'imperial.ac.uk',
      'princeton.edu',
      'uchicago.edu',
      'columbia.edu',
      'toronto.edu'
    ];
    this.academicDomains = options.academicDomains || [
      '.edu',
      '.ac.uk',
      '.ac.jp',
      '.ac.nz',
      '.ac.za',
      '.edu.au',
      '.edu.sg',
      '.eth.ch'
    ];
    this.resources = options.resources || [];
    this.database = options.database || null;
  }

  /**
   * Verify academic credentials
   * @param {Object} credentials - Academic credentials to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyCredentials(credentials) {
    try {
      if (!credentials) {
        return {
          verified: false,
          reason: 'No credentials provided',
          status: 400
        };
      }

      const { institution, email, role, id } = credentials;
      
      // Check required fields
      if (!institution || !email) {
        return {
          verified: false,
          reason: 'Missing required credential fields',
          status: 400
        };
      }
      
      // Check if email domain matches institution
      const emailDomain = email.substring(email.lastIndexOf('@') + 1);
      if (!email.includes('@') || !this._isValidAcademicEmail(email)) {
        return {
          verified: false,
          reason: 'Invalid academic email format',
          status: 400
        };
      }

      // Check if institution is in allowed list
      if (!this._isAllowedInstitution(institution) && !this.allowedInstitutions.includes(emailDomain)) {
        return {
          verified: false,
          reason: 'Institution not in allowed list',
          status: 403
        };
      }
      
      // Determine access level based on role
      let accessLevel = 'read'; // Default access level
      
      if (role) {
        if (role.toLowerCase().includes('admin')) {
          accessLevel = 'admin';
        } else if (role.toLowerCase().includes('faculty') || 
                  role.toLowerCase().includes('professor') || 
                  role.toLowerCase().includes('researcher')) {
          accessLevel = 'write';
        }
      }
      
      // Log successful verification
      this.logger.info('Academic credentials verified', { 
        institution,
        emailDomain,
        accessLevel,
        userId: id
      });
      
      return {
        verified: true,
        accessLevel,
        institution,
        emailDomain,
        role,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Error verifying academic credentials: ${error.message}`, { error });
      
      return {
        verified: false,
        reason: 'Error processing academic credentials',
        status: 500,
        error: error.message
      };
    }
  }

  /**
   * Get academic resources
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Resources with metadata
   */
  async getResources(options = {}) {
    try {
      const { 
        filters = {}, 
        limit = 10, 
        offset = 0, 
        accessLevel = 'read',
        sort = { field: 'createdAt', order: 'desc' }
      } = options;
      
      // Simulate database query
      let resources = [...this.resources];
      let total = resources.length;
      
      // Apply filters if any
      if (Object.keys(filters).length > 0) {
        resources = resources.filter(resource => {
          return Object.entries(filters).every(([key, value]) => {
            // Handle array values (OR condition)
            if (Array.isArray(value)) {
              return value.includes(resource[key]);
            }
            // Handle string/number/boolean values (exact match)
            return resource[key] === value;
          });
        });
      }
      
      // Apply access level restrictions
      resources = resources.filter(resource => {
        if (accessLevel === 'admin') {
          return true; // Admin can access all resources
        } else if (accessLevel === 'write') {
          return resource.accessLevel !== 'admin'; // Writers can access write and read resources
        } else {
          return resource.accessLevel === 'read'; // Readers can only access read resources
        }
      });
      
      // Apply sorting
      if (sort && sort.field) {
        resources.sort((a, b) => {
          if (a[sort.field] < b[sort.field]) return sort.order === 'asc' ? -1 : 1;
          if (a[sort.field] > b[sort.field]) return sort.order === 'asc' ? 1 : -1;
          return 0;
        });
      }
      
      // Apply pagination
      const paginatedResources = resources.slice(offset, offset + limit);
      
      this.logger.info('Retrieved academic resources', { 
        count: paginatedResources.length,
        total: resources.length,
        filters,
        accessLevel
      });
      
      return {
        success: true,
        resources: paginatedResources,
        count: paginatedResources.length,
        total: resources.length
      };
    } catch (error) {
      this.logger.error(`Error retrieving academic resources: ${error.message}`, { error });
      
      return {
        success: false,
        error: {
          code: 'RESOURCE_RETRIEVAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Submit academic contribution
   * @param {Object} contribution - Contribution data
   * @returns {Promise<Object>} Submission result
   */
  async submitContribution(contribution) {
    try {
      if (!contribution) {
        return {
          success: false,
          status: 400,
          error: {
            code: 'MISSING_CONTRIBUTION',
            message: 'No contribution data provided'
          }
        };
      }
      
      // Validate required fields
      const requiredFields = ['title', 'content', 'userId'];
      const missingFields = requiredFields.filter(field => !contribution[field]);
      
      if (missingFields.length > 0) {
        return {
          success: false,
          status: 400,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: `Missing required fields: ${missingFields.join(', ')}`
          }
        };
      }
      
      // Generate contribution ID
      const contributionId = `contribution_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Add metadata
      const enhancedContribution = {
        ...contribution,
        contributionId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Simulate saving to database
      if (this.database) {
        await this.database.saveContribution(enhancedContribution);
      }
      
      this.logger.info('Academic contribution submitted', { 
        contributionId,
        userId: contribution.userId,
        title: contribution.title
      });
      
      return {
        success: true,
        status: 201,
        contributionId,
        message: 'Contribution submitted successfully and pending review'
      };
    } catch (error) {
      this.logger.error(`Error submitting academic contribution: ${error.message}`, { error });
      
      return {
        success: false,
        status: 500,
        error: {
          code: 'CONTRIBUTION_SUBMISSION_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Check if an institution is in the allowed list
   * @param {string} institution - Institution to check
   * @returns {boolean} Whether institution is allowed
   * @private
   */
  _isAllowedInstitution(institution) {
    return this.allowedInstitutions.some(allowed => 
      institution.toLowerCase().includes(allowed));
  }

  /**
   * Check if email is from a valid academic domain
   * @param {string} email - Email to check
   * @returns {boolean} Whether email is from academic domain
   * @private
   */
  _isValidAcademicEmail(email) {
    if (!email || !email.includes('@')) {
      return false;
    }
    
    const domain = email.substring(email.lastIndexOf('@') + 1);
    
    return this.academicDomains.some(academicDomain => 
      domain.endsWith(academicDomain)) || 
      this.allowedInstitutions.includes(domain);
  }
}

module.exports = AcademicService;
