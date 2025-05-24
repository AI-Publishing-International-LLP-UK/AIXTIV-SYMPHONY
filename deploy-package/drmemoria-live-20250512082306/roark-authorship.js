/**
 * Roark 5.0 Authorship Model
 * A comprehensive system that ensures human creative sovereignty by enforcing
 * a minimum 70% human contribution requirement in collaborative AI-human creative works.
 * 
 * The model provides functionality for:
 * - Tracking and calculating human vs AI contributions
 * - Validating content against ethical guidelines
 * - Ensuring minimum human contribution requirements
 * - Generating authorship certificates
 * - Providing transparency in the creation process
 */

// Dependencies
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Constants defining the contribution thresholds and types
 */
const CONTRIBUTION_TYPES = {
  HUMAN: 'human',
  AI: 'ai'
};

const CONTRIBUTION_REQUIREMENTS = {
  MIN_HUMAN_PERCENTAGE: 70,
  MAX_AI_PERCENTAGE: 30
};

const CONTENT_CATEGORIES = {
  TEXT: 'text',
  IMAGE: 'image',
  AUDIO: 'audio',
  VIDEO: 'video',
  CODE: 'code',
  MIXED: 'mixed'
};

const VALIDATION_STATUS = {
  VALID: 'valid',
  INVALID_CONTRIBUTION_RATIO: 'invalid_contribution_ratio',
  CONTAINS_HARMFUL_CONTENT: 'contains_harmful_content',
  CONTAINS_POLITICAL_CONTENT: 'contains_political_content',
  UNKNOWN_ERROR: 'unknown_error'
};

/**
 * RoarkAuthorship Class
 * Implements the Roark 5.0 Authorship model for ensuring human creative sovereignty
 */
class RoarkAuthorship {
  constructor(options = {}) {
    // Core properties
    this.MIN_HUMAN_PERCENTAGE = options.minHumanPercentage || CONTRIBUTION_REQUIREMENTS.MIN_HUMAN_PERCENTAGE;
    this.MAX_AI_PERCENTAGE = options.maxAiPercentage || CONTRIBUTION_REQUIREMENTS.MAX_AI_PERCENTAGE;
    
    // Initialize contribution tracking
    this.contributions = [];
    this.totalWordCount = 0;
    this.humanWordCount = 0;
    this.aiWordCount = 0;
    
    // Initialize metadata
    this.workId = options.workId || uuidv4();
    this.title = options.title || 'Untitled Work';
    this.authors = options.authors || [];
    this.aiSystems = options.aiSystems || [];
    this.category = options.category || CONTENT_CATEGORIES.TEXT;
    this.createdAt = options.createdAt || new Date();
    this.lastUpdatedAt = options.lastUpdatedAt || new Date();
    
    // Initialize certificate data
    this.certificate = null;
  }

  /**
   * Add a contribution to the work
   * @param {Object} contribution - The contribution data
   * @param {string} contribution.content - The actual content contributed
   * @param {string} contribution.contributorType - Either 'human' or 'ai'
   * @param {string} contribution.contributorId - Identifier for the contributor
   * @param {Object} contribution.metadata - Additional metadata about the contribution
   * @returns {Object} The recorded contribution with ID and metrics
   */
  addContribution(contribution) {
    if (!contribution.content) {
      throw new Error('Contribution content is required');
    }
    
    if (!contribution.contributorType || 
        ![CONTRIBUTION_TYPES.HUMAN, CONTRIBUTION_TYPES.AI].includes(contribution.contributorType.toLowerCase())) {
      throw new Error(`Contributor type must be either '${CONTRIBUTION_TYPES.HUMAN}' or '${CONTRIBUTION_TYPES.AI}'`);
    }
    
    const contributorType = contribution.contributorType.toLowerCase();
    const wordCount = this._countWords(contribution.content);
    const impactScore = this._calculateContributionImpact(contribution.content, contributorType);
    
    const newContribution = {
      id: uuidv4(),
      content: contribution.content,
      contributorType,
      contributorId: contribution.contributorId || 'anonymous',
      timestamp: new Date(),
      wordCount,
      impactScore,
      metadata: contribution.metadata || {}
    };
    
    // Update totals
    this.totalWordCount += wordCount;
    if (contributorType === CONTRIBUTION_TYPES.HUMAN) {
      this.humanWordCount += wordCount;
    } else {
      this.aiWordCount += wordCount;
    }
    
    // Add to contributions array
    this.contributions.push(newContribution);
    
    // Update last modified timestamp
    this.lastUpdatedAt = new Date();
    
    return newContribution;
  }

  /**
   * Calculate the current contribution percentages
   * @returns {Object} Object containing human and AI contribution percentages
   */
  calculateContributionPercentages() {
    if (this.totalWordCount === 0) {
      return {
        human: 0,
        ai: 0
      };
    }
    
    const humanPercentage = parseFloat(((this.humanWordCount / this.totalWordCount) * 100).toFixed(2));
    const aiPercentage = parseFloat(((this.aiWordCount / this.totalWordCount) * 100).toFixed(2));
    
    return {
      human: humanPercentage,
      ai: aiPercentage
    };
  }

  /**
   * Validate whether the content meets all requirements:
   * - Minimum human contribution percentage
   * - No harmful or political content
   * @returns {Object} Validation result with status and details
   */
  validateContent() {
    // Check contribution percentages
    const percentages = this.calculateContributionPercentages();
    
    if (percentages.human < this.MIN_HUMAN_PERCENTAGE) {
      return {
        valid: false,
        status: VALIDATION_STATUS.INVALID_CONTRIBUTION_RATIO,
        message: `Human contribution (${percentages.human}%) is below the required minimum of ${this.MIN_HUMAN_PERCENTAGE}%`,
        percentages
      };
    }
    
    // Check for harmful content
    const contentCheckResult = this._doesNotContainHarmfulOrPoliticalContent();
    if (!contentCheckResult.safe) {
      return {
        valid: false,
        status: contentCheckResult.reason === 'harmful' 
          ? VALIDATION_STATUS.CONTAINS_HARMFUL_CONTENT 
          : VALIDATION_STATUS.CONTAINS_POLITICAL_CONTENT,
        message: contentCheckResult.message,
        percentages
      };
    }
    
    // All checks passed
    return {
      valid: true,
      status: VALIDATION_STATUS.VALID,
      message: 'Content meets all Roark 5.0 Authorship requirements',
      percentages
    };
  }

  /**
   * Generate an authorship certificate for the work
   * @param {Object} options - Options for certificate generation
   * @param {boolean} options.includeContributions - Whether to include the full list of contributions
   * @param {string} options.signatureKey - Optional private key for signing the certificate
   * @returns {Object} The generated certificate
   */
  generateCertificate(options = {}) {
    const validation = this.validateContent();
    
    if (!validation.valid) {
      throw new Error(`Cannot generate certificate: ${validation.message}`);
    }
    
    const percentages = this.calculateContributionPercentages();
    const contentHash = this._generateContentHash();
    
    const certificate = {
      certificateId: `ROARK-CERT-${uuidv4()}`,
      workId: this.workId,
      title: this.title,
      authors: this.authors,
      aiSystems: this.aiSystems,
      category: this.category,
      createdAt: this.createdAt,
      certifiedAt: new Date(),
      contentHash,
      contributionStats: {
        humanPercentage: percentages.human,
        aiPercentage: percentages.ai,
        totalWordCount: this.totalWordCount,
        humanWordCount: this.humanWordCount,
        aiWordCount: this.aiWordCount
      }
    };
    
    // Include detailed contributions if requested
    if (options.includeContributions) {
      certificate.contributions = this.contributions.map(c => ({
        id: c.id,
        contributorType: c.contributorType,
        contributorId: c.contributorId,
        timestamp: c.timestamp,
        wordCount: c.wordCount,
        impactScore: c.impactScore
      }));
    }
    
    // Add signature if key provided
    if (options.signatureKey) {
      certificate.signature = this._generateSignature(
        JSON.stringify(certificate), 
        options.signatureKey
      );
    }
    
    // Store the certificate in the instance
    this.certificate = certificate;
    
    return certificate;
  }

  /**
   * Verify a human signature on content
   * @param {string} signature - The signature to verify
   * @param {string} publicKey - The public key to use for verification
   * @returns {boolean} Whether the signature is valid
   */
  verifyHumanSignature(signature, publicKey) {
    try {
      return this._verifyHumanSignature(signature, publicKey);
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Get a summary of the authorship information
   * @returns {Object} Summary information about the work and its authorship
   */
  getSummary() {
    const percentages = this.calculateContributionPercentages();
    
    return {
      workId: this.workId,
      title: this.title,
      authors: this.authors,
      aiSystems: this.aiSystems,
      category: this.category,
      createdAt: this.createdAt,
      lastUpdatedAt: this.lastUpdatedAt,
      contributionStats: {
        humanPercentage: percentages.human,
        aiPercentage: percentages.ai,
        totalWordCount: this.totalWordCount,
        humanWordCount: this.humanWordCount,
        aiWordCount: this.aiWordCount,
        contributionCount: this.contributions.length
      },
      certified: this.certificate !== null,
      validation: this.validateContent()
    };
  }

  /**
   * Clear all contribution data and reset the model
   */
  reset() {
    this.contributions = [];
    this.totalWordCount = 0;
    this.humanWordCount = 0;
    this.aiWordCount = 0;
    this.certificate = null;
    this.lastUpdatedAt = new Date();
  }

  /**
   * Import contribution data from an external source
   * @param {Object} data - The data to import
   */
  importData(data) {
    if (!data) {
      throw new Error('Import data is required');
    }
    
    // Reset current data
    this.reset();
    
    // Import metadata
    this.workId = data.workId || this.workId;
    this.title = data.title || this.title;
    this.authors = data.authors || this.authors;
    this.aiSystems = data.aiSystems || this.aiSystems;
    this.category = data.category || this.category;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : this.createdAt;
    
    // Import contributions if available
    if (Array.isArray(data.contributions)) {
      data.contributions.forEach(contribution => {
        this.addContribution({
          content: contribution.content,
          contributorType: contribution.contributorType,
          contributorId: contribution.contributorId,
          metadata: contribution.metadata
        });
      });
    }
    
    // Import certificate if available
    if (data.certificate) {
      this.certificate = data.certificate;
    }
    
    this.lastUpdatedAt = new Date();
  }

  /**
   * Export the entire authorship data
   * @returns {Object} Complete authorship data
   */
  exportData() {
    return {
      workId: this.workId,
      title: this.title,
      authors: this.authors,
      aiSystems: this.aiSystems,
      category: this.category,
      createdAt: this.createdAt,
      lastUpdatedAt: this.lastUpdatedAt,
      contributions: this.contributions,
      contributionStats: {
        humanPercentage: this.calculateContributionPercentages().human,
        aiPercentage: this.calculateContributionPercentages().ai,
        totalWordCount: this.totalWordCount,
        humanWordCount: this.humanWordCount,
        aiWordCount: this.aiWordCount
      },
      certificate: this.certificate
    };
  }

  // Private methods

  /**
   * Count words in a text
   * @private
   * @param {string} text - The text to count words in
   * @returns {number} The word count
   */
  _countWords(text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    
    // Special handling for code
    if (this.category === CONTENT_CATEGORIES.CODE) {
      // Count non-empty lines as "words" for code
      return text.split('\n').filter(line => line.trim().length > 0).length;
    }
    
    // Regular word counting for text
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculate the contribution impact score based on content analysis
   * @private
   * @param {string} content - The content to analyze
   * @param {string} contributorType - The type of contributor (human or AI)
   * @returns {number} Impact score between 0.1 and 10
   */
  _calculateContributionImpact(content, contributorType) {
    // Basic implementation - could be enhanced with NLP analysis
    const wordCount = this._countWords(content);
    
    // Baseline score based on length
    let impact = Math.min(10, Math.max(0.1, wordCount / 100));
    
    // Adjust based on contributor type - this is a simple placeholder
    // In a real implementation, this would use more sophisticated analysis
    if (contributorType === CONTRIBUTION_TYPES.HUMAN) {
      // Give slight preference to human contributions in the impact score
      impact *= 1.2;
    }
    
    // Cap at maximum score
    return Math.min(10, impact);
  }

  /**
   * Generate a unique hash of the content
   * @private
   * @returns {string} SHA-256 hash of all contributions
   */
  _generateContentHash() {
    const contentString = this.contributions
      .map(c => `${c.contributorType}:${c.content}:${c.timestamp.toISOString()}`)
      .join('|');
    
    return crypto
      .createHash('sha256')
      .update(contentString)
      .digest('hex');
  }

  /**
   * Check if content contains harmful or political content
   * @private
   * @returns {Object} Result with safe status and reason
   */
  _doesNotContainH

