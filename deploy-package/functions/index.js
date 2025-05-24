/**
 * ASOOS API Functions
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import function implementations
const symphonyApp = require('./symphony-api/app');
const anthologyApp = require('./anthology-api/index');

// Configure regional settings
const runtimeOpts = {
  region: 'us-west1',
  memory: '512MB',
  timeoutSeconds: 60
};

// Export the Symphony API
exports.symphonyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(symphonyApp);

// Export the Anthology API
exports.anthologyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(anthologyApp);

// Google Drive integration functions
exports.handleDriveChanges = functions
  .runWith(runtimeOpts)
  .pubsub.topic('drive-updates')
  .onPublish(async (message) => {
    const fileData = message.json;
    console.log('Received Drive update:', fileData);
    
    // Process file update
    const db = admin.firestore();
    await db.collection('drive_files').add({
      fileId: fileData.fileId,
      name: fileData.name,
      mimeType: fileData.mimeType,
      updateTime: new Date(),
      processed: false
    });
    
    return null;
  });

// Process Drive files function
exports.processDriveFiles = functions
  .runWith(runtimeOpts)
  .firestore
  .document('drive_files/{fileId}')
  .onCreate(async (snap, context) => {
    const fileData = snap.data();
    console.log('Processing new Drive file:', fileData);
    
    // Add processing logic here
    
    // Mark as processed
    await snap.ref.update({ processed: true, processedAt: new Date() });
    return null;
  });
