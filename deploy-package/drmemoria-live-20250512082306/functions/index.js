const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Hello World function
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.json({
    message: "Hello from Dr. Memoria's Anthology!",
    timestamp: new Date().toISOString()
  });
});

// SallyPort authentication (placeholder)
exports.sallyPortAuth = functions.https.onCall((data, context) => {
  // This would normally authenticate a user
  // For now, it's just a placeholder
  return {
    success: false,
    message: "SallyPort authentication is not yet implemented."
  };
});

// Get featured anthology items (placeholder)
exports.getFeaturedItems = functions.https.onRequest((request, response) => {
  response.json({
    items: [
      {
        id: "item1",
        title: "The Memory Palace",
        description: "A curated collection of historical memories.",
        type: "written"
      },
      {
        id: "item2",
        title: "Echoes of Tomorrow",
        description: "Visual stories of future predictions.",
        type: "visual"
      },
      {
        id: "item3",
        title: "Voices of the Past",
        description: "Oral histories from different cultures.",
        type: "oral"
      }
    ]
  });
});
