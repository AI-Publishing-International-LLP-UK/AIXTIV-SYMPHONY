import { getApps } from 'firebase-admin/app';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { handleDriveChanges, processDriveFiles } from './drive-integration/index.js';
import {
  authorizeAgentResource,
  claudeCodeGenerate,
  cleanupPRAccess,
  contextStorage,
  fixPRAccess,
  modelMetrics,
  processNlpCommand,
  sallyPortVerify,
  syncPilotDataToPinecone,
  validateLinkedInProfile
} from './migration.js';

// Do not initialize app here, it's done in the drive-integration module

// Export all functions
export {
  // Drive integration functions
  handleDriveChanges,
  processDriveFiles,

  // Migrated functions from us-central1 to us-west1
  authorizeAgentResource,
  claudeCodeGenerate,
  cleanupPRAccess,
  contextStorage,
  fixPRAccess,
  modelMetrics,
  processNlpCommand,
  sallyPortVerify,
  syncPilotDataToPinecone,
  validateLinkedInProfile
};

// Basic API function
export const api = onRequest(
  { region: 'us-west1' },
  (req, res) => {
    logger.info('API request received', req.path);
    res.json({
      status: 'ok',
      service: 'API Gateway',
      timestamp: new Date().toISOString()
    });
  }
);

// ASOOS API function
export const asoosApi = onRequest(
  { region: 'us-west1' },
  (req, res) => {
    logger.info('ASOOS API request received', req.path);
    res.json({
      status: 'ok',
      service: 'ASOOS API Gateway',
      version: '1.0.1',
      timestamp: new Date().toISOString()
    });
  }
);
