/**
 * CIG Framework (Code is Gold)
 *
 * A simplified implementation of the CIG framework for content validation,
 * certification, and integrity scoring without external dependencies.
 */

class CIGFramework {
  constructor(config = {}) {
    // Default configuration
    this.config = {
      minOriginalityScore: 0.7,
      minCoherenceScore: 0.6,
      minTechnicalQualityScore: 0.65,
      minEthicalComplianceScore: 0.9,
      maxAIContributionPercentage: 0.3,
      ...config,
    };

    // Initialize counters for certification
    this.certificationCounter = 0;
  }

  /**
   * Main method to validate content against CIG standards
   * @param {Object} content - Content to validate
   * @param {Object} metadata - Metadata about the content
   * @returns {Object} Validation results
   */
  validateContent(content, metadata = {}) {
    // Extract content details
    const { text, title, authorName, contributionBreakdown = {} } = content;

    // Perform validations
    const originalityScore = this._calculateOriginalityScore(text, metadata);
    const coherenceScore = this._calculateCoherenceScore(text);
    const technicalQualityScore = this._calculateTechnicalQualityScore(text);
    const ethicalComplianceScore = this._validateEthicalCompliance(text);

    // Check AI contribution percentage
    const aiContributionPercentage = this._calculateAIContribution(
      contributionBreakdown
    );
    const humanContributionValid =
      aiContributionPercentage <= this.config.maxAIContributionPercentage;

    // Determine overall validation result
    const contentValid =
      originalityScore >= this.config.minOriginalityScore &&
      coherenceScore >= this.config.minCoherenceScore &&
      technicalQualityScore >= this.config.minTechnicalQualityScore &&
      ethicalComplianceScore >= this.config.minEthicalComplianceScore &&
      humanContributionValid;

    // Calculate overall integrity score
    const integrityScore = this._calculateIntegrityScore({
      originalityScore,
      coherenceScore,
      technicalQualityScore,
      ethicalComplianceScore,
      humanContributionPercentage: 1 - aiContributionPercentage,
    });

    // Compile validation results
    return {
      valid: contentValid,
      integrityScore,
      details: {
        originalityScore,
        coherenceScore,
        technicalQualityScore,
        ethicalComplianceScore,
        aiContributionPercentage,
        humanContributionPercentage: 1 - aiContributionPercentage,
        humanContributionValid,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate a certification for validated content
   * @param {Object} content - Content to certify
   * @param {Object} validationResult - Result from validateContent
   * @returns {Object} Certification details
   */
  generateCertification(content, validationResult) {
    if (!validationResult.valid) {
      throw new Error('Cannot certify content that failed validation');
    }

    // Generate unique certification ID
    const certificationId = this._generateCertificationId();

    // Create certification details
    const certification = {
      certificationId,
      contentTitle: content.title,
      authorName: content.authorName,
      integrityScore: validationResult.integrityScore,
      validationDetails: validationResult.details,
      issuedAt: new Date().toISOString(),
      certificationAuthority: 'CIG Framework',
      version: '1.0.0',
    };

    return certification;
  }

  /**
   * Verify if a certification is valid
   * @param {Object} certification - Certification to verify
   * @param {Object} content - Original content to verify against
   * @returns {Boolean} Whether certification is valid
   */
  verifyCertification(certification, content) {
    // Re-validate the content
    const validationResult = this.validateContent(content);

    // Check if integrity scores match within tolerance
    const scoreDifference = Math.abs(
      certification.integrityScore - validationResult.integrityScore
    );
    const isScoreMatch = scoreDifference <= 0.05; // 5% tolerance

    // Check certification ID format
    const isValidFormat = this._validateCertificationFormat(
      certification.certificationId
    );

    return isScoreMatch && isValidFormat;
  }

  /**
   * Calculate overall integrity score from component scores
   * @param {Object} scores - Component scores
   * @returns {Number} Overall integrity score
   */
  _calculateIntegrityScore(scores) {
    const {
      originalityScore,
      coherenceScore,
      technicalQualityScore,
      ethicalComplianceScore,
      humanContributionPercentage,
    } = scores;

    // Weighted calculation of overall integrity score
    return (
      (originalityScore * 0.3 +
        coherenceScore * 0.2 +
        technicalQualityScore * 0.2 +
        ethicalComplianceScore * 0.3) *
      humanContributionPercentage
    );
  }

  /**
   * Calculate originality score by analyzing the content
   * @param {String} text - Content text
   * @param {Object} metadata - Additional metadata
   * @returns {Number} Originality score between 0 and 1
   */
  _calculateOriginalityScore(text, metadata) {
    // In a real implementation, this would involve more sophisticated
    // algorithms like plagiarism detection and linguistic analysis

    // Simplified implementation based on text characteristics
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
    const averageSentenceLength = wordCount / (sentenceCount || 1);

    // Analyze vocabulary richness (unique words ratio)
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []);
    const vocabularyRichness = uniqueWords.size / (wordCount || 1);

    // Calculate base score
    let score = 0.5;

    // Adjust score based on metrics
    if (vocabularyRichness > 0.6) score += 0.2;
    if (averageSentenceLength > 10 && averageSentenceLength < 25) score += 0.1;
    if (wordCount > 500) score += 0.1;

    // Consider prior known originality score from metadata if available
    if (metadata.priorOriginalityScore) {
      score = (score + metadata.priorOriginalityScore) / 2;
    }

    return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
  }

  /**
   * Calculate coherence score by analyzing flow and structure
   * @param {String} text - Content text
   * @returns {Number} Coherence score between 0 and 1
   */
  _calculateCoherenceScore(text) {
    // In a real implementation, this would analyze paragraph transitions,
    // use of transition words, and topic consistency

    // Simplified implementation
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Check for minimum paragraph structure
    if (paragraphCount < 2) return 0.4;

    // Look for transition words that indicate coherent flow
    const transitionWords = [
      'however',
      'therefore',
      'furthermore',
      'consequently',
      'indeed',
      'nevertheless',
      'thus',
      'meanwhile',
      'subsequently',
      'in addition',
    ];

    // Count transition words usage
    let transitionCount = 0;
    transitionWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex) || [];
      transitionCount += matches.length;
    });

    // Calculate transition density
    const transitionDensity = transitionCount / (paragraphCount || 1);

    // Base score with adjustments
    let score = 0.6;
    if (transitionDensity > 0.5) score += 0.2;
    if (paragraphCount >= 3 && paragraphCount <= 10) score += 0.1;

    return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
  }

  /**
   * Calculate technical quality score
   * @param {String} text - Content text
   * @returns {Number} Technical quality score between 0 and 1
   */
  _calculateTechnicalQualityScore(text) {
    // Simplified implementation that checks for basic quality indicators

    // Check for grammatical indicators
    const sentenceFragments = text.match(/[.!?]+\s+[a-z]/g) || [];
    const fragmentRatio = sentenceFragments.length / (text.length / 100);

    // Check for spelling issues (very simplified)
    const potentialSpellingErrors = text.match(/\b[a-zA-Z]{1,2}\b/g) || [];
    const spellingErrorRatio =
      potentialSpellingErrors.length / (text.length / 100);

    // Calculate base score
    let score = 0.75;

    // Adjust score based on metrics
    if (fragmentRatio > 0.2) score -= 0.1;
    if (spellingErrorRatio > 0.3) score -= 0.15;

    return Math.min(Math.max(score, 0), 1); // Ensure score is between 0 and 1
  }

  /**
   * Validate ethical compliance of content
   * @param {String} text - Content text
   * @returns {Number} Ethical compliance score between 0 and 1
   */
  _validateEthicalCompliance(text) {
    // This would normally include checks for harmful content, bias, etc.

    // Simplified implementation checking for prohibited content categories
    const prohibitedTerms = {
      hate_speech: ['hate', 'racial slur'],
      violence: ['violent attack', 'murder', 'assault'],
      illegal_advocacy: ['illegal drugs', 'crime'],
      misinformation: ['conspiracy', 'hoax'],
      plagiarism: ['copied from', 'stolen content'],
    };

    let foundIssues = 0;
    const textLower = text.toLowerCase();

    // Check for each category of prohibited terms
    Object.values(prohibitedTerms).forEach(terms => {
      terms.forEach(term => {
        if (textLower.includes(term.toLowerCase())) {
          foundIssues++;
        }
      });
    });

    // Calculate compliance score
    const baseScore = 1.0;
    const deduction = foundIssues * 0.2;

    return Math.min(Math.max(baseScore - deduction, 0), 1);
  }

  /**
   * Calculate AI contribution percentage
   * @param {Object} contributionBreakdown - Breakdown of contributions
   * @returns {Number} AI contribution percentage between 0 and 1
   */
  _calculateAIContribution(contributionBreakdown) {
    // If no breakdown provided, assume it's all human content
    if (
      !contributionBreakdown ||
      Object.keys(contributionBreakdown).length === 0
    ) {
      return 0;
    }

    const aiContribution = contributionBreakdown.ai || 0;
    const humanContribution = contributionBreakdown.human || 1;

    // Calculate percentage
    const total = aiContribution + humanContribution;
    return total > 0 ? aiContribution / total : 0;
  }

  /**
   * Generate a unique certification ID
   * @returns {String} Certification ID
   */
  _generateCertificationId() {
    this.certificationCounter++;
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `CIG-${timestamp}-${random}-${this.certificationCounter}`;
  }

  /**
   * Validate the format of a certification ID
   * @param {String} certificationId - ID to validate
   * @returns {Boolean} Whether format is valid
   */
  _validateCertificationFormat(certificationId) {
    const regex = /^CIG-\d+-\d+-\d+$/;
    return regex.test(certificationId);
  }
}

module.exports = CIGFramework;
