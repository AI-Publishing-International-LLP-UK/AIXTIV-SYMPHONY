import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';

// Initialize app if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

// Handle Google Drive file changes
export const handleDriveChanges = onMessagePublished(
  {
    topic: 'drive-updates',
    region: 'us-west1'
  },
  async (event) => {
    const message = event.data.message;
    logger.info('Received Drive update:', message);
    
    // Add file to Firestore
    const db = getFirestore();
    await db.collection('drive_files').add({
      fileId: message.fileId,
      name: message.name,
      mimeType: message.mimeType,
      createdTime: Timestamp.now(),
      processed: false
    });
    
    logger.info('File added to processing queue:', message.fileId);
    return null;
  }
);

// Process Drive files
export const processDriveFiles = onDocumentCreated(
  {
    document: 'drive_files/{fileId}',
    region: 'us-west1'
  },
  async (event) => {
    const fileData = event.data.data();
    logger.info('Processing new Drive file:', fileData.fileId);
    
    // Process file based on mime type
    if (fileData.mimeType?.includes('text')) {
      // Process text file
      logger.info('Processing text file');
    } else if (fileData.mimeType?.includes('spreadsheet')) {
      // Process spreadsheet
      logger.info('Processing spreadsheet');
    } else if (fileData.mimeType?.includes('presentation')) {
      // Process presentation
      logger.info('Processing presentation');
    }
    
    // Mark as processed
    await event.data.ref.update({processed: true});
    logger.info('File processed successfully');
    return null;
  }
);