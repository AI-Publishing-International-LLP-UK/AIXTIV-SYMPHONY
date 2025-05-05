const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const vision = require('@google-cloud/vision');
const { aiplatform } = require('@google-cloud/aiplatform');

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app for API routes
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize clients
const ttsClient = new TextToSpeechClient();
const visionClient = new vision.ImageAnnotatorClient();
const storageClient = new Storage();
const pubsubClient = new PubSub();
const firestoreClient = admin.firestore();
const predictionClient = new aiplatform.v1.PredictionServiceClient();

/**
 * Configuration management
 * Loads configuration from YAML files in infrastructure/vision_lake
 */
const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../infrastructure/vision_lake/config.yaml');
    if (!fs.existsSync(configPath)) {
      console.warn('Config file not found, using default values');
      return {
        vision_api: {
          project: process.env.GCP_PROJECT || 'api-for-warp-drive',
          region: 'us-west1'
        },
        vertex_ai: {
          project: process.env.GCP_PROJECT || 'api-for-warp-drive',
          region: 'us-west1'
        },
        integration: {
          storage_bucket: 'vision-lake-processed-images',
          results_database: 'firestore',
          pubsub_topic: 'vision-lake-results',
          cache_ttl_seconds: 3600,
          firestore: {
            collection: 'vision_lake_results',
            ttl_days: 30
          }
        }
      };
    }
    
    return yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error(`Error loading config: ${error.message}`);
    return {
      vision_api: {
        project: process.env.GCP_PROJECT || 'api-for-warp-drive',
        region: 'us-west1'
      }
    };
  }
};

const config = loadConfig();

/**
 * Middleware to verify authentication
 */
const validateAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Check if user has required roles if specified in config
    if (config.integration && config.integration.authentication && config.integration.authentication.roles) {
      const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data() || {};
      const userRoles = userData.roles || [];
      
      const requiredRoles = config.integration.authentication.roles;
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      }
    }
    
    return next();
  } catch (error) {
    console.error(`Auth Error: ${error.message}`);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      vision: true,
      vertexai: true,
      storage: true,
      firestore: true,
      pubsub: true
    }
  });
});

/**
 * Vision API endpoints
 */
app.post('/vision/analyze', validateAuth, async (req, res) => {
  try {
    const { image, features = ['LABEL_DETECTION', 'TEXT_DETECTION'] } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }
    
    // Handle base64 encoded images
    let imageBuffer;
    let imageUri;
    
    if (typeof image === 'string') {
      if (image.startsWith('data:image')) {
        // Base64 encoded image
        const base64Data = image.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (image.startsWith('gs://') || image.startsWith('http://') || image.startsWith('https://')) {
        // GCS or HTTP URL
        imageUri = image;
      } else {
        return res.status(400).json({ error: 'Invalid image format' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    // Convert feature strings to proper format
    const requestFeatures = features.map(feature => ({
      type: feature
    }));
    
    // Prepare request
    const request = {
      image: {},
      features: requestFeatures
    };
    
    if (imageBuffer) {
      request.image.content = imageBuffer;
    } else if (imageUri) {
      request.image.source = { imageUri };
    }
    
    // Call Vision API
    const [result] = await visionClient.annotateImage(request);
    
    // Store results in Firestore
    await firestoreClient.collection(config.integration.firestore.collection).add({
      result,
      userId: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ttl: admin.firestore.Timestamp.fromMillis(
        Date.now() + (config.integration.firestore.ttl_days * 86400000)
      )
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Vision API Error: ${error.message}`);
    return res.status(500).json({ error: `Vision API Error: ${error.message}` });
  }
});

/**
 * Vertex AI API endpoints
 */
app.post('/vertexai/predict', validateAuth, async (req, res) => {
  try {
    const { endpoint, instances, parameters } = req.body;
    
    if (!endpoint || !instances) {
      return res.status(400).json({ error: 'Endpoint and instances are required' });
    }
    
    // Get endpoint configuration
    const endpointConfig = Object.entries(config.vertex_ai.endpoints)
      .find(([key, value]) => key === endpoint || value.display_name === endpoint);
    
    if (!endpointConfig) {
      return res.status(400).json({ error: `Endpoint ${endpoint} not found in configuration` });
    }
    
    const displayName = endpointConfig[1].display_name;
    
    // Format endpoint path
    const endpointPath = `projects/${config.vertex_ai.project}/locations/${config.vertex_ai.region}/endpoints/${displayName}`;
    
    // Prepare request
    const request = {
      endpoint: endpointPath,
      instances: instances,
      parameters: parameters || {}
    };
    
    // Call Vertex AI Prediction API
    const [response] = await predictionClient.predict(request);
    
    // Store results in Firestore
    await firestoreClient.collection('vertex_ai_results').add({
      response,
      endpoint,
      userId: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ttl: admin.firestore.Timestamp.fromMillis(Date.now() + (30 * 86400000)) // 30 days TTL
    });
    
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Vertex AI Error: ${error.message}`);
    return res.status(500).json({ error: `Vertex AI Error: ${error.message}` });
  }
});

/**
 * Text-to-Speech endpoint
 */
app.post('/tts/synthesize', validateAuth, async (req, res) => {
  try {
    const { text, voice = {}, audioConfig = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Set default voice and audio configuration
    const defaultVoice = {
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      name: 'en-US-Wavenet-F'
    };
    
    const defaultAudioConfig = {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0
    };
    
    // Merge with provided configuration
    const mergedVoice = { ...defaultVoice, ...voice };
    const mergedAudioConfig = { ...defaultAudioConfig, ...audioConfig };
    
    // Prepare request
    const request = {
      input: { text },
      voice: mergedVoice,
      audioConfig: mergedAudioConfig
    };
    
    // Call Text-to-Speech API
    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Store audio in storage bucket
    const fileName = `tts-${Date.now()}.mp3`;
    const bucket = storageClient.bucket('aixtiv-tts-output');
    const file = bucket.file(fileName);
    
    await file.save(response.audioContent);
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/aixtiv-tts-output/${fileName}`;
    
    // Store metadata in Firestore
    await firestoreClient.collection('tts_results').add({
      text,
      url: publicUrl,
      userId: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ttl: admin.firestore.Timestamp.fromMillis(Date.now() + (7 * 86400000)) // 7 days TTL
    });
    
    return res.status(200).json({
      audioContent: response.audioContent.toString('base64'),
      audioUrl: publicUrl
    });
  } catch (error) {
    console.error(`TTS Error: ${error.message}`);
    return res.status(500).json({ error: `TTS Error: ${error.message}` });
  }
});

/**
 * Multimodal analysis endpoint
 */
app.post('/multimodal/analyze', validateAuth, async (req, res) => {
  try {
    const { image, prompt, modelEndpoint = 'multimodal_analysis' } = req.body;
    
    if (!image || !prompt) {
      return res.status(400).json({ error: 'Image and prompt are required' });
    }
    
    // Get endpoint configuration
    const endpointConfig = config.vertex_ai.endpoints[modelEndpoint];
    if (!endpointConfig) {
      return res.status(400).json({ error: `Endpoint ${modelEndpoint} not found in configuration` });
    }
    
    // Handle base64 encoded images
    let imageBuffer;
    let imageUri;
    
    if (typeof image === 'string') {
      if (image.startsWith('data:image')) {
        // Base64 encoded image
        const base64Data = image.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Upload to Cloud Storage
        const fileName = `temp-${Date.now()}.jpg`;
        const bucket = storageClient.bucket(config.integration.storage_bucket);
        const file = bucket.file(fileName);
        
        await file.save(imageBuffer);
        
        imageUri = `gs://${config.integration.storage_bucket}/${fileName}`;
      } else if (image.startsWith('gs://') || image.startsWith('http://') || image.startsWith('https://')) {
        // GCS or HTTP URL
        imageUri = image;
      } else {
        return res.status(400).json({ error: 'Invalid image format' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    
    // Format endpoint path
    const endpointPath = `projects/${config.vertex_ai.project}/locations/${config.vertex_ai.region}/endpoints/${endpointConfig.display_name}`;
    
    // Format instances for multimodal analysis
    const instances = [
      {
        image: { imageUri },
        text: prompt
      }
    ];
    
    // Prepare request
    const request = {
      endpoint: endpointPath,
      instances: instances
    };
    
    // Call Vertex AI Prediction API
    const [response] = await predictionClient.predict(request);
    
    // Store results in Firestore
    await firestoreClient.collection('multimodal_results').add({
      response,
      prompt,
      imageUri,
      userId: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ttl: admin.firestore.Timestamp.fromMillis(Date.now() + (30 * 86400000)) // 30 days TTL
    });
    
    // Clean up temporary file if needed
    if (imageUri && imageUri.includes('temp-')) {
      const fileName = imageUri.split('/').pop();
      const bucket = storageClient.bucket(config.integration.storage_bucket);
      const file = bucket.file(fileName);
      
      await file.delete().catch(err => {
        console.warn(`Failed to delete temporary file: ${err.message}`);
      });
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error(`Multimodal Analysis Error: ${error.message}`);
    return res.status(500).json({ error: `Multimodal Analysis Error: ${error.message}` });
  }
});

// Export Firebase Functions
exports.api = functions.https.onRequest(app);

/**
 * Scheduled cleanup function
 */
exports.cleanupExpiredData = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const collections = [
      config.integration.firestore.collection,
      'vertex_ai_results',
      'tts_results',
      'multimodal_results'
    ];
    
    for (const collection of collections) {
      const expiredDocs = await firestoreClient.collection(collection)
        .where('ttl', '<', admin.firestore.Timestamp.fromMillis(Date.now()))
        .get();
      
      const batch = firestoreClient.batch();
      let count = 0;
      
      expiredDocs.forEach(doc => {
        batch.delete(doc.ref);
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`Cleaned up ${count} expired documents from ${collection}`);
      }
    }
    
    // Clean temporary storage files
    const buckets = [
      config.integration.storage_bucket,
      'aixtiv-tts-output'
    ];
    
    for (const bucketName of buckets) {
      const bucket = storageClient.bucket(bucketName);
      const [files] = await bucket.getFiles({
        prefix: 'temp-'
      });
      
      const oneDayAgo = Date.now() - 86400000; // 24 hours
      let deletedCount = 0;
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const created = new Date(metadata.timeCreated).getTime();
        
        if (created < oneDayAgo) {
          await file.delete();
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`Deleted ${deletedCount} old temporary files from ${bucketName}`);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Cleanup Error: ${error.message}`);
    return null;
  }
});

/**
 * Monitors Cloud Vision API usage and publishes metrics
 */
exports.monitorVisionUsage = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    const timestamp = Date.now();
    const oneHourAgo = timestamp - 3600000;
    
    // Query recent vision API calls
    const snapshot = await firestoreClient.collection(config.integration.firestore.collection)
      .where('timestamp', '>=', admin.firestore.Timestamp.fromMillis(oneHourAgo))
      .get();
    
    // Count API calls by feature type
    const featureCounts = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.result && data.result.labelAnnotations) {
        featureCounts.LABEL_DETECTION = (featureCounts.LABEL_DETECTION || 0) + 1;
      }
      if (data.result && data.result.textAnnotations) {
        featureCounts.TEXT_DETECTION = (featureCounts.TEXT_DETECTION || 0) + 1;
      }
      if (data.result && data.result.faceAnnotations) {
        featureCounts.FACE_DETECTION = (featureCounts.FACE_DETECTION || 0) + 1;
      }
      // Add other feature types as needed
    });
    
    // Publish metrics to PubSub
    const topic = pubsubClient.topic('vision-metrics');
    await topic.publish(Buffer.from(JSON.stringify({
      timestamp,
      hourlyUsage: {
        total: snapshot.size,
        byFeature: featureCounts
      }
    })));
    
    // Check if approaching limits
    if (snapshot.size > 1500) { // 1800 requests per minute limit, alert at 1500
      // Notify admins
      const adminTopic = pubsubClient.topic('vision-alerts');
      await adminTopic.publish(Buffer.from(JSON.stringify({
        timestamp,
        alert: 'HIGH_USAGE',
        message: `Vision API usage is high: ${snapshot.size} requests in the last hour`,
        level: 'WARNING'
      })));
    }
    
    return null;
  } catch (error) {
    console.error(`Monitor Error: ${error.message}`);
    return null;
  }
});

/**
 * Creates or updates configuration files when deployed
 */
exports.setupConfig = functions.https.onRequest(async (req, res) => {
  try {
    // Verify admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user is admin
    const userDoc = await firestoreClient.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data() || {};
    const userRoles = userData.roles || [];
    
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    // Get configuration from request body
    const { config: newConfig } = req.body;
    
    if (!newConfig) {
      return res.status(400).json({ error: 'Configuration is required' });
    }
    
    // Convert to YAML
    const yamlConfig = yaml.dump(newConfig);
    
    // Create infrastructure directory if it doesn't exist
    const infrastructureDir = path.join(__dirname, '../infrastructure');
    const visionLakeDir = path.join(infrastructureDir, 'vision_lake');
    
    if (!fs.existsSync(infrastructureDir)) {
      fs.mkdirSync(infrastructureDir, { recursive: true });
    }
    
    if (!fs.existsSync(visionLakeDir)) {
      fs.mkdirSync(visionLakeDir, { recursive: true });
    }
    
    // Write config file
    fs.writeFileSync(path.join(visionLakeDir, 'config.yaml'), yamlConfig);
    
    return res.status(200).json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error(`Setup Config Error: ${error.message}`);
    return res.status(500).json({ error: `Setup Config Error: ${error.message}` });
  }
});

/**
 * Triggers when new documents are added to vision_lake_results collection
 */
exports.processVisionResults = functions.firestore
  .document(`${config.integration.firestore.collection}/{docId}`)
  .onCreate(async (snapshot, context) => {
    try {
      const data = snapshot.data();
      
      // Skip processing if no result
      if (!data || !data.result) {
        return null;
      }
      
      // Publish to PubSub
      const topic = pubsubClient.topic(config.integration.pubsub_topic);
      await topic.publish(Buffer.from(JSON.stringify({
        id: context.params.docId,
        ...data,
        timestamp: Date.now()
      })));
      
      return null;
    } catch (error) {
      console.error(`Process Vision Results Error: ${error.message}`);
      return null;
    }
  });