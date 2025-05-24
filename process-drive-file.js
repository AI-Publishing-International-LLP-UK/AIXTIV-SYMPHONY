// Process Drive File directly
// This script creates a document in Firestore directly

const admin = require('firebase-admin');
const serviceAccount = require('./functions/key.json');

// Generate a random ID
function generateId() {
  return 'file_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// File metadata
const fileId = generateId();
const fileData = {
  fileId: fileId,
  name: "Test Document.docx",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  createdTime: admin.firestore.FieldValue.serverTimestamp(),
  processed: false
};

// Get Firestore instance
const db = admin.firestore();

// Add file to Firestore
console.log('Adding file to Firestore:', fileData);

// Add to drive_files collection
db.collection('drive_files').add(fileData)
  .then(docRef => {
    console.log('Document written with ID:', docRef.id);
    
    // Process the file (just a simulation)
    console.log('Processing file:', fileData.fileId);
    
    // Mark as processed
    return docRef.update({
      processed: true,
      processedTime: admin.firestore.FieldValue.serverTimestamp()
    });
  })
  .then(() => {
    console.log('File processed successfully');
    console.log('Check Firestore to verify:');
    console.log('https://console.firebase.google.com/project/api-for-warp-drive/firestore/data/drive_files');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });