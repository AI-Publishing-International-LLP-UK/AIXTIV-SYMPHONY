/**
 * Functions Migration Script
 * This file will be used to migrate all functions from us-central1 to us-west1
 * 
 * Functions to migrate:
 * - authorizeAgentResource
 * - claudeCodeGenerate
 * - cleanupPRAccess
 * - contextStorage
 * - fixPRAccess
 * - modelMetrics
 * - processNlpCommand
 * - sallyPortVerify
 * - syncPilotDataToPinecone
 * - validateLinkedInProfile
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  onCall, 
  onRequest, 
  HttpsError 
} from 'firebase-functions/v2/https';
import { 
  onDocumentWritten,
  onDocumentCreated
} from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';

// Initialize app if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

// Common configuration for all functions - set region to us-west1
const functionConfig = {
  region: 'us-west1',
  memory: '256MiB'
};

// ========== Function Implementations ==========

// 1. authorizeAgentResource (callable -> callable)
export const authorizeAgentResource = onCall(
  functionConfig,
  async (request) => {
    logger.info('authorizeAgentResource function called', request);
    // Implement the same logic as the original function
    return { authorized: true, message: 'Agent resource authorized' };
  }
);

// 2. claudeCodeGenerate (https -> https)
export const claudeCodeGenerate = onRequest(
  functionConfig,
  async (req, res) => {
    logger.info('claudeCodeGenerate function called', req.path);
    // Implement the same logic as the original function
    res.json({ 
      status: 'ok', 
      message: 'Claude code generated successfully',
      timestamp: new Date().toISOString()
    });
  }
);

// 3. cleanupPRAccess (callable -> callable)
export const cleanupPRAccess = onCall(
  functionConfig,
  async (request) => {
    logger.info('cleanupPRAccess function called', request);
    // Implement the same logic as the original function
    return { cleaned: true, message: 'PR access cleaned up' };
  }
);

// 4. contextStorage (https -> https)
export const contextStorage = onRequest(
  functionConfig,
  async (req, res) => {
    logger.info('contextStorage function called', req.path);
    // Implement the same logic as the original function
    res.json({ 
      status: 'ok', 
      message: 'Context stored successfully',
      timestamp: new Date().toISOString()
    });
  }
);

// 5. fixPRAccess (callable -> callable)
export const fixPRAccess = onCall(
  functionConfig,
  async (request) => {
    logger.info('fixPRAccess function called', request);
    // Implement the same logic as the original function
    return { fixed: true, message: 'PR access fixed' };
  }
);

// 6. modelMetrics (https -> https)
export const modelMetrics = onRequest(
  functionConfig,
  async (req, res) => {
    logger.info('modelMetrics function called', req.path);
    // Implement the same logic as the original function
    res.json({ 
      status: 'ok', 
      message: 'Model metrics processed',
      timestamp: new Date().toISOString()
    });
  }
);

// 7. processNlpCommand (callable -> callable)
export const processNlpCommand = onCall(
  functionConfig,
  async (request) => {
    logger.info('processNlpCommand function called', request);
    // Implement the same logic as the original function
    return { processed: true, message: 'NLP command processed' };
  }
);

// 8. sallyPortVerify (callable -> callable)
export const sallyPortVerify = onCall(
  functionConfig,
  async (request) => {
    logger.info('sallyPortVerify function called', request);
    // Implement the same logic as the original function
    return { verified: true, message: 'SallyPort verified' };
  }
);

// 9. syncPilotDataToPinecone (firestore trigger -> firestore trigger)
export const syncPilotDataToPinecone = onDocumentWritten(
  {
    document: 'pilots/{pilotId}',
    region: 'us-west1'
  },
  async (event) => {
    logger.info('syncPilotDataToPinecone function triggered', event);
    // Implement the same logic as the original function
    return null;
  }
);

// 10. validateLinkedInProfile (callable -> callable)
export const validateLinkedInProfile = onCall(
  functionConfig,
  async (request) => {
    logger.info('validateLinkedInProfile function called', request);
    // Implement the same logic as the original function
    return { validated: true, message: 'LinkedIn profile validated' };
  }
);