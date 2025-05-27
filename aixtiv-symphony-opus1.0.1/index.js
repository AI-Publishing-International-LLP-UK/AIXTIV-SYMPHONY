const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineString, defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

// Set the region
const region = "us-west1";

// Basic Firestore function example
exports.delegateTask = onDocumentCreated({
  region: region,
  document: "tasks/{taskId}"
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  
  const taskData = snapshot.data();
  console.log("New task created:", taskData);
  
  // Example processing logic
  return snapshot.ref.update({
    status: "processing",
    processingTimestamp: admin.firestore.FieldValue.serverTimestamp()
  });
});

// Hello world function for testing
exports.helloWorld = onRequest({
  region: region
}, (request, response) => {
  response.send("Hello from Aixtiv Symphony Opus1.0.1 Functions!");
});

// Metrics handler example
exports.metricsHandler = onRequest({
  region: region
}, (request, response) => {
  response.json({
    status: "success",
    message: "Metrics handler is working",
    timestamp: new Date().toISOString()
  });
});
