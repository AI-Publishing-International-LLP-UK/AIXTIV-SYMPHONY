const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Basic Firestore function example
exports.delegateTask = functions.region("us-west1").firestore
  .document("tasks/{taskId}")
  .onCreate((snapshot, _context) => {
    const taskData = snapshot.data();
    console.log("New task created:", taskData);
    
    // Example processing logic
    return snapshot.ref.update({
      status: "processing",
      processingTimestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// Hello world function for testing
exports.helloWorld = functions.region("us-west1").https.onRequest((request, response) => {
  response.send("Hello from Aixtiv Symphony Opus1.0.1 Functions!");
});

// Metrics handler example
exports.metricsHandler = functions.region("us-west1").https.onRequest((request, response) => {
  response.json({
    status: "success",
    message: "Metrics handler is working",
    timestamp: new Date().toISOString()
  });
});
