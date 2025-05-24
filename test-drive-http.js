// Test script for Google Drive integration using HTTP function
// This script calls the driveIntegrationTrigger HTTP function directly

const { exec } = require('child_process');

// Create a random ID without requiring uuid package
function generateId() {
  return 'file_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Create a sample Drive file data
const fileId = generateId();
const fileData = {
  fileId: fileId,
  name: "Test Document via HTTP.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

// Command to call the HTTP function
const cmd = `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(fileData)}' https://us-west1-api-for-warp-drive.cloudfunctions.net/driveIntegrationTrigger`;

console.log('Calling driveIntegrationTrigger function:');
console.log(JSON.stringify(fileData, null, 2));

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
  
  console.log(`\nFunction response:`);
  try {
    // Try to parse and pretty-print the JSON response
    const response = JSON.parse(stdout);
    console.log(JSON.stringify(response, null, 2));
  } catch (e) {
    // If it's not JSON, just print the raw output
    console.log(stdout);
  }
  
  console.log('\nTo check if the document was created in Firestore:');
  console.log('1. Open Firebase console: https://console.firebase.google.com/project/api-for-warp-drive/firestore');
  console.log('2. Navigate to the "drive_files" collection');
  console.log(`3. Look for a document with fileId: ${fileId}`);
});