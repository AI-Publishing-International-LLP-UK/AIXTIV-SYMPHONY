const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Hello world function to test deployment
exports.helloWorld = functions.https.onRequest((request, response) => {
response.send("Hello from AIXTIV SYMPHONY Functions!");
});

// Cloud Function to sync data between systems
exports.syncPlatformData = functions.firestore
.document('campaigns/{campaignId}')
.onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const campaignId = context.params.campaignId;
    
    console.log(`Campaign ${campaignId} updated`);
    // Add your sync logic here
    
    return null;
});

// Scheduled function to run publishing tasks
exports.scheduledPublishing = functions.pubsub
.schedule('every 30 minutes')
.onRun((context) => {
    console.log('Running scheduled publishing task');
    // Add your publishing logic here
    
    return null;
});
