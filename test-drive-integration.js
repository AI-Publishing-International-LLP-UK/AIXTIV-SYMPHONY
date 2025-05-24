// Test script for Google Drive integration
// This script publishes a test message to the drive-updates PubSub topic

const { exec } = require('child_process');

// Create a random ID without requiring uuid package
function generateId() {
  return 'file_' + Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Create a sample Drive file update message
const fileId = generateId();
const message = {
  fileId: fileId,
  name: "Test Document.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  driveId: "coaching2100",
  updateTime: new Date().toISOString()
};

// Convert to base64 as required by PubSub
const messageBase64 = Buffer.from(JSON.stringify(message)).toString('base64');

// Command to publish to PubSub
const cmd = `gcloud pubsub topics publish drive-updates --message='${messageBase64}'`;

console.log('Publishing test message to drive-updates topic:');
console.log(JSON.stringify(message, null, 2));

// Execute the command
exec(cmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`Message published successfully: ${stdout}`);
  console.log('Check Firebase console logs to see if the function processed the message:');
  console.log('https://console.firebase.google.com/project/api-for-warp-drive/functions/logs');
  
  // Instructions to check Firestore
  console.log('\nTo check if the document was created in Firestore:');
  console.log('1. Open Firebase console: https://console.firebase.google.com/project/api-for-warp-drive/firestore');
  console.log('2. Navigate to the "drive_files" collection');
  console.log(`3. Look for a document with fileId: ${fileId}`);
});