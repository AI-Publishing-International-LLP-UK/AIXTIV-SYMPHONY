const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase
admin.initializeApp();

/**
 * RoarkAuthorship model - handles content validation according to Roark 5.0 standards
 * Ensures human creative sovereignty with minimum 70% human contribution
 */
class RoarkAuthorship {
  constructor() {
    this.MIN_HUMAN_CONTRIBUTION = 0.7;  // 70% minimum human contribution required
    this.MAX_AI_CONTRIBUTION = 0.3;     // 30% maximum AI contribution allowed
  }

  /**
   * Validates content based on Roark Authorship standards
   * @param {Object} content - Content to validate
   * @param {Array} content.contributions - List of contribution objects with contributor_type (HUMAN or AI)
   * @returns {Object} Validation result with status and details
   */
  validateContent(content) {
    if (!content || !content.contributions || !Array.isArray(content.contributions)) {
      return { 
        valid: false, 
        error: 'Invalid content format - contributions array is required' 
      };
    }

    // Check if content has at least one contribution
    if (content.contributions.length === 0) {
      return { 
        valid: false, 
        error: 'Content must have at least one contribution' 
      };
    }

    // Calculate contribution percentages
    const contributionStats = this._calculateContributionStats(content.contributions);
    
    // Validate human contribution threshold
    if (contributionStats.humanPercentage < this.MIN_HUMAN_CONTRIBUTION) {
      return {
        valid: false,
        error: `Human contribution (${contributionStats.humanPercentage * 100}%) below required minimum (${this.MIN_HUMAN_CONTRIBUTION * 100}%)`,
        stats: contributionStats
      };
    }

    // Check for harmful or political content
    const contentScreeningResult = this._doesNotContainHarmfulOrPoliticalContent(content);
    if (!contentScreeningResult.passed) {
      return {
        valid: false,
        error: `Content validation failed: ${contentScreeningResult.reason}`,
        details: contentScreeningResult
      };
    }

    // If all checks pass
    return {
      valid: true,
      stats: contributionStats,
      message: 'Content meets Roark Authorship standards'
    };
  }

  /**
   * Calculates contribution statistics from a list of contributions
   * @private
   * @param {Array} contributions - List of contribution objects
   * @returns {Object} Statistics about human and AI contributions
   */
  _calculateContributionStats(contributions) {
    let humanContributionCount = 0;
    let aiContributionCount = 0;
    let totalContributions = contributions.length;
    
    contributions.forEach(contribution => {
      if (contribution.contributor_type === 'HUMAN') {
        humanContributionCount++;
      } else if (contribution.contributor_type === 'AI') {
        aiContributionCount++;
      }
    });
    
    return {
      humanPercentage: humanContributionCount / totalContributions,
      aiPercentage: aiContributionCount / totalContributions,
      humanContributionCount,
      aiContributionCount,
      totalContributions
    };
  }

  /**
   * Checks if content contains harmful or political material
   * @private
   * @param {Object} content - Content to check
   * @returns {Object} Result indicating if content passed screening
   */
  _doesNotContainHarmfulOrPoliticalContent(content) {
    // List of harmful content keywords to check for
    const harmfulKeywords = [
      'violence', 'hate', 'harassment', 'terrorism', 'self-harm',
      'child abuse', 'exploitation', 'illegal activities'
    ];

    // List of political content keywords to check
    const politicalKeywords = [
      'election', 'political party', 'campaign', 'legislation',
      'policy', 'government', 'candidate', 'voting'
    ];

    // Check for harmful keywords in all text content
    const contentText = this._extractTextContent(content);
    
    // Check for harmful content
    for (const keyword of harmfulKeywords) {
      if (contentText.toLowerCase().includes(keyword.toLowerCase())) {
        return {
          passed: false,
          reason: 'Contains potentially harmful content',
          keyword: keyword
        };
      }
    }
    
    // Check for political content
    for (const keyword of politicalKeywords) {
      if (contentText.toLowerCase().includes(keyword.toLowerCase())) {
        return {
          passed: false,
          reason: 'Contains political content',
          keyword: keyword
        };
      }
    }

    return {
      passed: true
    };
  }

  /**
   * Extracts text content from all contributions
   * @private
   * @param {Object} content - Content object
   * @returns {String} Concatenated text from all contributions
   */
  _extractTextContent(content) {
    let text = '';
    if (content.title) text += content.title + ' ';
    if (content.description) text += content.description + ' ';
    
    if (content.contributions && Array.isArray(content.contributions)) {
      content.contributions.forEach(contribution => {
        if (contribution.text) {
          text += contribution.text + ' ';
        }
      });
    }
    
    return text;
  }
}

// Create an instance of RoarkAuthorship for use in the API endpoints
const roarkAuthorship = new RoarkAuthorship();

/**
 * Content validation HTTP endpoint
 * Validates content against Roark Authorship standards
 */
exports.validateContent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Get content from request body
      const content = req.body;
      if (!content) {
        return res.status(400).json({ error: 'No content provided' });
      }

      // Validate content using Roark Authorship model
      const validationResult = roarkAuthorship.validateContent(content);
      
      if (validationResult.valid) {
        // If content is valid, return success
        return res.status(200).json({
          status: 'success',
          message: validationResult.message,
          stats: validationResult.stats
        });
      } else {
        // If content is invalid, return detailed error
        return res.status(400).json({
          status: 'error',
          error: validationResult.error,
          details: validationResult
        });
      }
    } catch (error) {
      console.error('Error validating content:', error);
      return res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});

/**
 * Get authorship requirements HTTP endpoint
 * Returns the current Roark Authorship requirements
 */
exports.getAuthorshipRequirements = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Only allow GET requests
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Return the Roark Authorship requirements
      return res.status(200).json({
        status: 'success',
        requirements: {
          minHumanContribution: roarkAuthorship.MIN_HUMAN_CONTRIBUTION * 100 + '%',
          maxAiContribution: roarkAuthorship.MAX_AI_CONTRIBUTION * 100 + '%',
          contentGuidelines: {
            prohibitedContent: [
              'Harmful content',
              'Violent content',
              'Hate speech',
              'Political content',
              'Content that violates human rights',
              'Content that violates local jurisdictions'
            ]
          }
        }
      });
    } catch (error) {
      console.error('Error retrieving authorship requirements:', error);
      return res.status(500).json({
        status: 'error',
        error: 'Internal server error',
        message: error.message
      });
    }
  });
});

/**
 * Dr. Memoria's Anthology - Firebase Functions
 * Main entry point for all Firebase Cloud Functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Access Firestore database
const db = admin.firestore();

// Configure logging
const logger = functions.logger;

// Function configuration options
const runtimeOpts = {
  timeoutSeconds: 300, // 5 minutes
  memory: '1GB'
};

// Export modules so they can be imported elsewhere
module.exports = {
  // Endpoints will be added here in future updates
  
  // Example: 
  // handleContentCreation: functions.https.onCall(async (data, context) => {
  //   // Implementation will be added later
  // })
};

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import models
const RoarkAuthorship = require('./models/roark-authorship');
const CIGFramework = require('./models/cig-framework');

// Initialize models
const roarkAuthorship = new RoarkAuthorship();
const cigFramework = new CIGFramework();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Request error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Content Validation Endpoint
 * Validates content using Roark Authorship model and CIG Framework
 */
app.post('/api/content/validate', authenticate, async (req, res, next) => {
  try {
    const { content, contentType, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Validate with Roark Authorship model
    const authorshipValidation = await roarkAuthorship.validateContent(content, {
      userId: req.user.uid,
      contentType,
      ...metadata
    });
    
    if (!authorshipValidation.valid) {
      return res.status(400).json({
        error: 'Content does not meet authorship requirements',
        details: authorshipValidation.details
      });
    }
    
    // Validate with CIG Framework
    const cigValidation = await cigFramework.validateContent(content, {
      userId: req.user.uid,
      contentType,
      ...metadata
    });
    
    if (!cigValidation.valid) {
      return res.status(400).json({
        error: 'Content does not meet CIG standards',
        details: cigValidation.details
      });
    }
    
    // Return combined validation results
    return res.status(200).json({
      status: 'success',
      validation: {
        authorship: authorshipValidation,
        cig: cigValidation,
        valid: true
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Content Certification Endpoint
 * Certifies content that has passed validation and issues a certificate
 */
app.post('/api/content/certify', authenticate, async (req, res, next) => {
  try {
    const { contentId, metadata } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ error: 'Content ID is required' });
    }
    
    // Retrieve content from Firestore
    const contentRef = admin.firestore().collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const contentData = contentDoc.data();
    
    // Check if content is validated
    if (!contentData.validationStatus?.valid) {
      return res.status(400).json({ error: 'Content must be validated before certification' });
    }
    
    // Generate certification using Roark Authorship model
    const authorshipCertificate = await roarkAuthorship.generateCertificate(contentId, {
      userId: req.user.uid,
      ...metadata
    });
    
    // Generate certification using CIG Framework
    const cigCertificate = await cigFramework.generateCertificate(contentId, {
      userId: req.user.uid,
      ...metadata
    });
    
    // Store certificates in Firestore
    await contentRef.update({
      authorshipCertificate,
      cigCertificate,
      certificationStatus: 'certified',
      certificationTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return certificates
    return res.status(200).json({
      status: 'success',
      certificates: {
        authorship: authorshipCertificate,
        cig: cigCertificate
      }
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Content Publication Endpoint
 * Publishes certified content to various platforms
 */
app.post('/api/content/publish', authenticate, async (req, res, next) => {
  try {
    const { contentId, platforms, publishOptions } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ error: 'Content ID is required' });
    }
    
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'At least one platform is required' });
    }
    
    // Retrieve content from Firestore
    const contentRef = admin.firestore().collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const contentData = contentDoc.data();
    
    // Check if content is certified
    if (contentData.certificationStatus !== 'certified') {
      return res.status(400).json({ error: 'Content must be certified before publication' });
    }
    
    // Check for human contribution compliance
    if (contentData.humanContributionPercentage < 70) {
      return res.status(400).json({
        error: 'Content does not meet the minimum human contribution requirement of 70%'
      });
    }
    
    // Initiate publication process for each platform
    const publicationResults = await Promise.all(
      platforms.map(async (platform) => {
        try {
          // Record publication start
          const publicationRef = await admin.firestore()
            .collection('content')
            .doc(contentId)
            .collection('publications')
            .add({
              platform,
              status: 'pending',
              options: publishOptions?.[platform] || {},
              startTimestamp: admin.firestore.FieldValue.serverTimestamp(),
              userId: req.user.uid
            });
          
          // Queue publication task (using Firebase Tasks Queue or similar)
          const task = {
            contentId,
            platform,
            publicationId: publicationRef.id,
            options: publishOptions?.[platform] || {}
          };
          
          await admin.firestore().collection('publicationTasks').add({
            ...task,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          return {
            platform,
            publicationId: publicationRef.id,
            status: 'pending'
          };
        } catch (error) {
          console.error(`Publication error for platform ${platform}:`, error);
          return {
            platform,
            status: 'error',
            error: error.message
          };
        }
      })
    );
    
    // Update content status
    await contentRef.update({
      publicationStatus: 'publishing',
      publicationTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return publication results
    return res.status(200).json({
      status: 'success',
      publications: publicationResults
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Content Status Endpoint
 * Gets the current status of content processing
 */
app.get('/api/content/:contentId/status', authenticate, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    
    // Retrieve content from Firestore
    const contentRef = admin.firestore().collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Get publication status
    const publicationsSnapshot = await contentRef.collection('publications').get();
    const publications = [];
    
    publicationsSnapshot.forEach(doc => {
      publications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Return content status
    return res.status(200).json({
      status: 'success',
      content: {
        id: contentId,
        ...contentDoc.data()
      },
      publications
    });
  } catch (error) {
    return next(error);
  }
});

// Apply error handling middleware
app.use(errorHandler);

// Export the Express app as Firebase Function
exports.drMemoriaApi = functions.https.onRequest(app);

// Background function to process content creation
exports.processContentCreation = functions.firestore
  .document('content/{contentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const contentData = snapshot.data();
      const contentId = context.params.contentId;
      
      console.log(`Processing new content creation: ${contentId}`);
      
      // Automatically validate content if autoValidate is true
      if (contentData.autoValidate) {
        // Perform validation with Roark Authorship model
        const authorshipValidation = await roarkAuthorship.validateContent(
          contentData.content, 
          { contentId, ...contentData.metadata }
        );
        
        // Perform validation with CIG Framework
        const cigValidation = await cigFramework.validateContent(
          contentData.content,
          { contentId, ...contentData.metadata }
        );
        
        // Update content with validation results
        await snapshot.ref.update({
          validationStatus: {
            authorship: authorshipValidation,
            cig: cigValidation,
            valid: authorshipValidation.valid && cigValidation.valid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          }
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error processing content creation:', error);
      return null;
    }
  });

// Scheduled function to update CIG certifications
exports.updateCIGCertifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      console.log('Running scheduled CIG certification updates');
      
      // Get certified content older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const contentSnapshot = await admin.firestore()
        .collection('content')
        .where('certificationStatus', '==', 'certified')
        .where('certificationTimestamp', '<', sevenDaysAgo)
        .get();
      
      console.log(`Found ${contentSnapshot.size} certifications to update`);
      
      // Process each content item
      const updatePromises = [];
      
      contentSnapshot.forEach(doc => {
        const contentData = doc.data();
        
        // Request CIG framework to update certification
        const updatePromise = cigFramework.updateCertificate(doc.id, contentData)
          .then(updatedCertificate => {
            return doc.ref.update({
              cigCertificate: updatedCertificate,
              lastCertificationUpdate: admin.firestore.FieldValue.serverTimestamp()
            });
          })
          .catch(error => {
            console.error(`Error updating certification for ${doc.id}:`, error);
            return doc.ref.update({
              certificationUpdateError: error.message,
              certificationUpdateAttempt: admin.firestore.FieldValue.serverTimestamp()
            });
          });
        
        updatePromises.push(updatePromise);
      });
      
      await Promise.all(updatePromises);
      
      console.log('Completed CIG certification updates');
      return null;
    } catch (error) {
      console.error('Error in scheduled CIG certification updates:', error);
      return null;
    }
  });

// Function to handle revenue split events from blockchain
exports.handleRevenueSplitEvent = functions.https.onRequest(async (req, res) => {
  try {
    // Verify webhook signature for security
    // This would need a proper implementation with shared secrets or signatures
    const signature = req.headers['x-blockchain-signature'];
    if (!signature) {
      return res.status(401).json({ error: 'Unauthorized: Missing signature' });
    }
    
    // Extract event data
    const { contentId, amount, currency, transactionHash } = req.body;
    
    if (!contentId || !amount || !currency || !transactionHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Retrieve content from Firestore
    const contentRef = admin.firestore().collection('content').doc(contentId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    const contentData = contentDoc.data();
    
    // Calculate revenue split (80% author, 20% platform)
    const authorAmount = amount * 0.8;
    const platformAmount = amount * 0.2;
    
    // Record transaction in Firestore
    await admin.firestore().collection('revenueSplits').add({
      contentId,
      authorId: contentData.authorId,
      transactionHash,
      totalAmount: amount,
      currency,
      authorAmount,
      platformAmount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update content revenue statistics
    await contentRef.update({
      'revenueStats.totalRevenue': admin.firestore.FieldValue.increment(amount),
      'revenueStats.transactions':

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Import custom modules
const { RoarkAuthorship } = require('./roark-authorship');
const { CIGFramework } = require('./cig-framework');
const { BlockchainIntegration } = require('./blockchain-integration');
const { IntegrationGateway } = require('../integration-gateway/index');
const ErrorLogger = require('./utils/errorLogging');

// Initialize Firebase
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize custom modules
const roarkAuthorship = new RoarkAuthorship();
const cigFramework = new CIGFramework();
const blockchainIntegration = new BlockchainIntegration();
const integrationGateway = new IntegrationGateway();
const logger = new ErrorLogger('dr-memoria-anthology');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    // Fetch user subscription level
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (userDoc.exists) {
      req.user.subscriptionTier = userDoc.data().subscriptionTier || 'subscriber';
      req.user.isOwnerSubscriber = userDoc.data().subscriptionTier === 'owner-subscriber';
    } else {
      req.user.subscriptionTier = 'subscriber';
      req.user.isOwnerSubscriber = false;
    }
    
    return next();
  } catch (error) {
    logger.logError('Authentication error', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.logError('API Error', err);
  return res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'UNKNOWN_ERROR'
    }
  });
};

// Register error handler
app.use(errorHandler);

// === AGENT INTERACTION ENDPOINTS ===

/**
 * Submit content request to agent (Co-Pilot or Dr. Memoria)
 * This initiates the agent-driven content creation process
 * Human contribution is registered through this interaction
 */
app.post('/agent/request', authenticate, async (req, res, next) => {
  try {
    const { contentType, requirements, preferences, targetAudience, notes, agentType } = req.body;
    
    if (!contentType || !requirements) {
      return res.status(400).json({ error: 'Missing required fields (contentType, requirements)' });
    }

    // Determine which agent to use based on subscription tier and request
    const agent = agentType || (req.user.isOwnerSubscriber ? 'copilot' : 'drmemoria');
    
    // Create request document with human contribution tracking
    const requestId = uuidv4();
    const requestData = {
      id: requestId,
      userId: req.user.uid,
      userName: req.user.name || 'Anonymous',
      userSubscriptionTier: req.user.subscriptionTier,
      contentType,
      requirements,
      preferences: preferences || {},
      targetAudience: targetAudience || 'general',
      notes: notes || '',
      agent,
      status: 'submitted',
      humanContributionRegistered: true, // Human initiates with requirements
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('agent-requests').doc(requestId).set(requestData);
    
    // Submit to appropriate agent workflow via Integration Gateway
    const workflowResponse = await integrationGateway.initiateAgentWorkflow({
      agent,
      requestId,
      userId: req.user.uid,
      contentType,
      requirements,
      preferences: preferences || {},
      targetAudience: targetAudience || 'general',
      subscriptionTier: req.user.subscriptionTier,
      dreamCommanderEnabled: req.user.isOwnerSubscriber // Dream Commander available for owner-subscribers
    });
    
    // Update request with workflow information
    await db.collection('agent-requests').doc(requestId).update({
      workflowId: workflowResponse.workflowId,
      estimatedCompletionTime: workflowResponse.estimatedCompletionTime,
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(201).json({
      requestId,
      workflowId: workflowResponse.workflowId,
      agent,
      status: 'processing',
      estimatedCompletionTime: workflowResponse.estimatedCompletionTime,
      message: `Your request has been submitted to ${agent === 'copilot' ? 'Co-Pilot' : 'Dr. Memoria'} and is being processed.`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get status of agent request
 */
app.get('/agent/request/:requestId', authenticate, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const requestDoc = await db.collection('agent-requests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = requestDoc.data();

    // Verify ownership
    if (requestData.userId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({ error: 'Unauthorized: Not the request owner' });
    }

    // Get workflow status from Integration Gateway
    const workflowStatus = await integrationGateway.getWorkflowStatus(requestData.workflowId);
    
    // Check if content has been created
    let contentData = null;
    if (requestData.contentId) {
      const contentDoc = await db.collection('content').doc(requestData.contentId).get();
      if (contentDoc.exists) {
        contentData = contentDoc.data();
      }
    }
    
    return res.status(200).json({
      requestId,
      workflowId: requestData.workflowId,
      agent: requestData.agent,
      status: workflowStatus.status,
      progress: workflowStatus.progress,
      contentId: requestData.contentId,
      contentData: contentData,
      createdAt: requestData.createdAt,
      estimatedCompletionTime: requestData.estimatedCompletionTime,
      completedAt: requestData.completedAt || null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Provide feedback or additional information on agent request
 * Registers additional human contribution
 */
app.post('/agent/request/:requestId/feedback', authenticate, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { feedback, additionalRequirements, approveContent } = req.body;
    
    if (!feedback && !additionalRequirements && approveContent === undefined) {
      return res.status(400).json({ error: 'Missing feedback content' });
    }

    const requestDoc = await db.collection('agent-requests').doc(requestId).get();
    
    if (!requestDoc.exists) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const requestData = requestDoc.data();

    // Verify ownership
    if (requestData.userId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({ error: 'Unauthorized: Not the request owner' });
    }
    
    // Record feedback
    const feedbackId = uuidv4();
    const feedbackData = {
      id: feedbackId,
      requestId,
      userId: req.user.uid,
      feedback: feedback || '',
      additionalRequirements: additionalRequirements || '',
      approve: approveContent === true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('agent-requests').doc(requestId)
      .collection('feedback').doc(feedbackId).set(feedbackData);
      
    // Record human contribution from feedback
    await db.collection('agent-requests').doc(requestId).update({
      humanContributionEvents: admin.firestore.FieldValue.arrayUnion({
        type: 'feedback',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // If content is approved, update content status and trigger certification
    if (approveContent === true && requestData.contentId) {
      // Register QR code approval in the blockchain
      await blockchainIntegration.registerHumanApproval(
        requestData.contentId,
        req.user.uid
      );
      
      // Update content status
      await db.collection('content').doc(requestData.contentId).update({
        humanApproved: true,
        humanApprovalTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'approved',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Trigger certification process
      const certificationProcess = functions.runWith({ timeoutSeconds: 300 }).https.onCall(async (data) => {
        await certifyContent(requestData.contentId);
      });
      
      certificationProcess({ contentId: requestData.contentId });
    }
    
    // Send feedback to agent via Integration Gateway
    await integrationGateway.submitFeedbackToWorkflow({
      workflowId: requestData.workflowId,
      feedbackId,
      feedback: feedback || '',
      additionalRequirements: additionalRequirements || '',
      approve: approveContent === true
    });
    
    return res.status(200).json({
      requestId,
      feedbackId,
      message: 'Feedback submitted successfully',
      contentApproved: approveContent === true
    });
  } catch (error) {
    next(error);
  }
});

// === CONTENT ENDPOINTS ===

/**
 * Get content details
 */
app.get('/content/:contentId', authenticate, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentDoc = await db.collection('content').doc(contentId).get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const contentData = contentDoc.data();

    // Verify ownership or published status
    if (contentData.authorId !== req.user.uid && !req.user.admin && contentData.status !== 'published') {
      return res.status(403).json({ error: 'Unauthorized: Not the content owner' });
    }
    
    return res.status(200).json({
      contentId,
      ...contentData,
      isOwner: contentData.authorId === req.user.uid
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Validate content to ensure it meets Roark 5.0 Authorship model requirements
 */
app.post('/content/:contentId/validate', authenticate, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const contentDoc = await db.collection('content').doc(contentId).get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const contentData = contentDoc.data();

    // Verify ownership
    if (contentData.authorId !== req.user.uid && !req.user.admin) {
      return res.status(403).json({ error: 'Unauthorized: Not the content owner' });
    }

    // Get associated request to verify human contribution
    const requestQuery = await db.collection('agent-requests')
      .where('contentId', '==', contentId)
      .limit(1)
      .get();
      
    let humanContributionValid = false;
    
    if (!requestQuery.empty) {
      const requestData = requestQuery.docs[0].data();
      
      // Check if human contribution is registered (initial request + feedback)
      humanContributionValid = requestData.humanContributionRegistered === true && 
                               (requestData.humanContributionEvents || []).length > 0;
    }

    // Validate content does not contain harmful or political content
    const contentSafetyCheck = await roarkAuthorship.doesNotContainHarmfulOrPoliticalContent(contentData.content);
    
    // Validate with CIG framework
    const cigValidation = await cigFramework.validateContent(
      contentData.content,
      contentData.contentType,
      contentData.metadata || {}
    );

    const validationResult = {
      isValid: humanContributionValid && contentSafetyCheck.safe && cigValidation.isValid,
      humanContributionValid,
      contentSafety: contentSafetyCheck,
      cigValidation
    };

    return res.status(200).json({
      contentId,
      validation: validationResult,
      status: validationResult.isValid ? 'valid' : 'invalid'
    });
  } catch (error) {
    next(error);
  }
});

// === CERTIFICATION ENDPOINTS ===

/**
 * Manually trigger certification for content 
 * (Used for when human approval was given outside the system)
 */
app.post('/content/:contentId/certify', authenticate, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { forceApproval } = req.body;
    
    const contentDoc = await db.collection('content').doc(contentId).get();
    
    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const contentData = contentDoc.data

