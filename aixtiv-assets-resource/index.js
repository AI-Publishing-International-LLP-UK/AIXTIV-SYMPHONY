/**
 * AIXTIV SYMPHONY SOLUTION
 * Main Integration Index
 *
 * This file serves as the main entry point for the AIXTIV SYMPHONY solution,
 * coordinating the various components and exporting the complete API.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp(functions.config().firebase);
}

// Import all modules
const utils = require('./utils');
const dreamCommanderModule = require('./dream-commander-controller');
const q4dLenzModule = require('./agent-adapter');
const blockchainModule = require('./blockchain-authorization');
const middlewareModule = require('./middleware-layer');
const apiModule = require('./api-integration-module');
const learningModule = require('./co-pilot-learning-system');
const linkedInModule = require('./linkedin-integration');

// Export all functions and APIs
module.exports = {
  // API Integration Module (main API)
  api: apiModule.apiIntegration,

  // Dream Commander Controller
  dreamCommander: dreamCommanderModule,

  // Q4D-Lenz Controller
  q4dLenz: functions.region('us-west1').https.onRequest(app => {
    app.use('/api/q4d-lenz', q4dLenzModule.q4dLenz);
    return app;
  }),

  // Blockchain Authorization
  blockchain: blockchainModule.blockchainAuth,

  // Middleware Layer
  middleware: middlewareModule.middlewareApi,

  // Learning System
  learning: learningModule.learningApi,

  // LinkedIn Integration
  linkedin: linkedInModule.linkedInApi,

  // Scheduled Tasks

  // Update search index daily
  updateSearchIndex: functions.pubsub
    .schedule('every day 01:00')
    .timeZone('America/Los_Angeles')
    .onRun(async context => {
      try {
        console.log('Starting scheduled search index update');

        // Implementation would go here in a real system

        console.log('Search index update completed');
        return null;
      } catch (error) {
        console.error('Error updating search index:', error);
        return null;
      }
    }),

  // Process pending feedback daily
  processPendingFeedback: functions.pubsub
    .schedule('every day 02:00')
    .timeZone('America/Los_Angeles')
    .onRun(async context => {
      try {
        console.log('Starting scheduled feedback processing');

        const learningSystem = new learningModule.CoPilotLearningSystem();

        // Get unprocessed feedback
        const snapshot = await admin
          .firestore()
          .collection('feedbacks')
          .where('processed', '==', false)
          .limit(100)
          .get();

        console.log(`Found ${snapshot.docs.length} unprocessed feedbacks`);

        // Process each feedback
        const promises = snapshot.docs.map(doc => {
          return learningSystem.processFeedback(doc.id);
        });

        await Promise.all(promises);

        console.log('Feedback processing completed');
        return null;
      } catch (error) {
        console.error('Error processing pending feedback:', error);
        return null;
      }
    }),

  // Generate daily prompts for active users
  generateDailyPrompts: functions.pubsub
    .schedule('every day 06:00')
    .timeZone('America/Los_Angeles')
    .onRun(async context => {
      try {
        console.log('Starting daily prompt generation');

        const dreamCommanderCoordinator =
          new middlewareModule.DreamCommanderCoordinator();

        // Get active users
        const snapshot = await admin
          .firestore()
          .collection('ownerSubscribers')
          .where('status', '==', 'active')
          .where('dailyPrompts', '==', true) // Only for users who opted in
          .limit(500)
          .get();

        console.log(
          `Found ${snapshot.docs.length} active users for daily prompts`
        );

        // Generate prompts
        const promises = snapshot.docs.map(doc => {
          return dreamCommanderCoordinator.generatePrompt(doc.id, {
            context: {
              type: 'daily',
            },
          });
        });

        await Promise.all(promises);

        console.log('Daily prompt generation completed');
        return null;
      } catch (error) {
        console.error('Error generating daily prompts:', error);
        return null;
      }
    }),

  // Firestore Triggers

  // Process new owner registration
  onNewOwnerCreated: functions.firestore
    .document('ownerSubscribers/{ownerSubscriberId}')
    .onCreate(async (snapshot, context) => {
      try {
        const ownerData = snapshot.data();
        const ownerSubscriberId = context.params.ownerSubscriberId;

        console.log(`New owner registered: ${ownerSubscriberId}`);

        // Initialize default agent for the owner
        const q4dLenzCoordinator = new middlewareModule.Q4DLenzCoordinator();

        await q4dLenzCoordinator.initializeAgent({
          agentId: `default-agent-${ownerSubscriberId}`,
          ownerSubscriberId,
          lenzType: 'professional',
        });

        // Generate initial prompt
        const dreamCommanderCoordinator =
          new middlewareModule.DreamCommanderCoordinator();

        await dreamCommanderCoordinator.generatePrompt(ownerSubscriberId, {
          context: {
            type: 'welcome',
          },
        });

        return null;
      } catch (error) {
        console.error('Error processing new owner registration:', error);
        return null;
      }
    }),

  // Process new feedback
  onNewFeedbackCreated: functions.firestore
    .document('feedbacks/{feedbackId}')
    .onCreate(async (snapshot, context) => {
      try {
        const feedbackData = snapshot.data();
        const feedbackId = context.params.feedbackId;

        // Only process if not already processed
        if (!feedbackData.processed) {
          console.log(`Processing new feedback: ${feedbackId}`);

          // Process the feedback
          const learningSystem = new learningModule.CoPilotLearningSystem();
          await learningSystem.processFeedback(feedbackId);
        }

        return null;
      } catch (error) {
        console.error('Error processing new feedback:', error);
        return null;
      }
    }),
};
