/**
 * Firestore Initialization Script
 * 
 * This script initializes the Firestore database with Vision Space scenes.
 * Run this script using Node.js after deploying to Firebase:
 * 
 * node scripts/initialize-firestore.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json'); // Download from Firebase console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'api-for-warp-drive.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Vision scenes data
const scenes = [
  {
    id: 'visualization_center',
    name: 'Visualization Center',
    description: 'Central hub for data visualization and strategic insights',
    active: true
  },
  {
    id: 'vision_space',
    name: 'Vision Space',
    description: 'Main interface for the Vision Lake experience',
    active: true
  },
  {
    id: 'pilots_lounge',
    name: 'Pilots Lounge',
    description: 'The central meeting space for the Vision Lake Fleet pilots',
    active: true
  },
  {
    id: 'gift_shop',
    name: 'Gift Shop',
    description: 'Explore and obtain Vision Lake memorabilia and souvenirs',
    active: true
  },
  {
    id: 'academy',
    name: 'The Academy',
    description: 'Training and educational center for Vision Lake pilots',
    active: true
  },
  {
    id: 'pilots_of_vision_lake',
    name: 'The Pilots of Vision Lake',
    description: 'Gallery showcasing the distinguished pilots of Vision Lake',
    active: true
  },
  {
    id: 'compass_field',
    name: 'Compass Field',
    description: 'Navigate through the strategic direction compass of Vision Lake',
    active: true
  },
  {
    id: 'flight_memory_system',
    name: 'Flight Memory System',
    description: 'Archive of all flight records and mission histories',
    active: true
  },
  {
    id: 'jet_port',
    name: 'Jet Port',
    description: 'Launching and landing facility for the Vision Lake Fleet',
    active: true
  }
];

// Function to upload an image to Firebase Storage
async function uploadImageToStorage(localFilePath, storagePath) {
  try {
    await bucket.upload(localFilePath, {
      destination: storagePath,
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    console.log(`Uploaded ${localFilePath} to ${storagePath}`);
    return storagePath;
  } catch (error) {
    console.error(`Error uploading ${localFilePath}:`, error);
    return null;
  }
}

// Function to add a scene to Firestore
async function addSceneToFirestore(scene) {
  try {
    const sceneRef = db.collection('vision_scenes').doc(scene.id);
    await sceneRef.set(scene);
    console.log(`Added scene ${scene.name} to Firestore`);
  } catch (error) {
    console.error(`Error adding scene ${scene.name}:`, error);
  }
}

// Main initialization function
async function initializeFirestore() {
  console.log('Initializing Firestore with Vision Space scenes...');
  
  // Process each scene
  for (const scene of scenes) {
    try {
      // Try to upload image if it exists
      const localImagePath = `./public/assets/images/scenes/${scene.id.replace(/_/g, '-')}.jpg`;
      const storagePath = `scenes/${scene.id.replace(/_/g, '-')}.jpg`;
      
      try {
        // Try to upload the image
        const uploadedPath = await uploadImageToStorage(localImagePath, storagePath);
        if (uploadedPath) {
          scene.backgroundRef = uploadedPath;
        }
      } catch (uploadError) {
        console.warn(`Image for ${scene.name} not found or couldn't be uploaded. Using default configurations.`);
      }
      
      // Add scene to Firestore
      await addSceneToFirestore(scene);
    } catch (error) {
      console.error(`Error processing scene ${scene.name}:`, error);
    }
  }
  
  console.log('Firestore initialization complete!');
}

// Run initialization
initializeFirestore()
  .then(() => {
    console.log('Initialization completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });