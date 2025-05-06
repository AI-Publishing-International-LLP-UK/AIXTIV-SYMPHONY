const vision = require('@google-cloud/vision');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');
const { aiplatform } = require('@google-cloud/aiplatform');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const config = yaml.load(
  fs.readFileSync(
    path.join(__dirname, '../../infrastructure/vision_lake/config.yaml'),
    'utf8'
  )
);

/**
 * Dr. Lucy Vision Service
 * Integrates Cloud Vision API and Vertex AI for advanced image processing
 *
 * This service provides a robust interface to Google Cloud Vision API and Vertex AI,
 * supporting image analysis, object detection, OCR, and multimodal AI processing.
 */
class VisionService {
  constructor() {
    // Initialize clients
    this.visionClient = new vision.ImageAnnotatorClient({
      projectId: config.vision_api.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.storageClient = new Storage({
      projectId: config.vision_api.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.firestoreClient = new Firestore({
      projectId: config.vision_api.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.pubsubClient = new PubSub({
      projectId: config.vision_api.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.vertexClient = new aiplatform.PredictionServiceClient({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    // Set up collections
    this.resultsCollection = this.firestoreClient.collection(
      config.integration.firestore.collection
    );

    // Configure bucket
    this.storageBucket = this.storageClient.bucket(
      config.integration.storage_bucket
    );

    // Set up pubsub topic
    this.pubsubTopic = this.pubsubClient.topic(config.integration.pubsub_topic);

    // Cache for API results
    this.resultsCache = new Map();

    console.log(
      `Vision Service initialized for project: ${config.vision_api.project}`
    );
  }

  /**
   * Analyze an image using Google Cloud Vision API
   * @param {string|Buffer} image - Image file path, URL, or buffer
   * @param {Array<string>} features - Vision features to detect
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(image, features = ['LABEL_DETECTION', 'TEXT_DETECTION']) {
    try {
      // Convert feature strings to proper format
      const requestFeatures = features.map(feature => ({
        type: feature,
      }));

      // Generate cache key
      const cacheKey =
        typeof image === 'string'
          ? `${image}:${features.join(',')}`
          : `buffer:${Buffer.from(image).toString('base64').substring(0, 40)}:${features.join(',')}`;

      // Check cache
      if (this.resultsCache.has(cacheKey)) {
        const cachedResult = this.resultsCache.get(cacheKey);
        if (
          Date.now() - cachedResult.timestamp <
          config.integration.cache_ttl_seconds * 1000
        ) {
          return cachedResult.data;
        }
      }

      // Prepare request
      const request = {
        image: {},
        features: requestFeatures,
      };

      // Handle different image input types
      if (typeof image === 'string') {
        if (image.startsWith('gs://')) {
          request.image.source = { imageUri: image };
        } else if (
          image.startsWith('http://') ||
          image.startsWith('https://')
        ) {
          request.image.source = { imageUri: image };
        } else {
          // Assume local file path
          request.image.content = fs.readFileSync(image);
        }
      } else {
        // Assume buffer
        request.image.content = image;
      }

      // Call Vision API
      const [result] = await this.visionClient.annotateImage(request);

      // Store in cache
      this.resultsCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result,
      });

      // Save to Firestore
      await this.storeResults(cacheKey, result);

      // Publish to PubSub
      await this.publishResults(cacheKey, result);

      return result;
    } catch (error) {
      console.error(`Vision API Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process image with Vertex AI multimodal models
   * @param {string|Buffer} image - Image file path, URL, or buffer
   * @param {string} prompt - Prompt for the AI model
   * @param {string} modelEndpoint - Endpoint name from config
   * @returns {Promise<Object>} AI processing results
   */
  async processWithVertexAI(
    image,
    prompt,
    modelEndpoint = 'multimodal_analysis'
  ) {
    try {
      // Get endpoint configuration
      const endpointConfig = config.vertex_ai.endpoints[modelEndpoint];
      if (!endpointConfig) {
        throw new Error(`Endpoint ${modelEndpoint} not found in configuration`);
      }

      // Format location
      const location = config.vertex_ai.region;

      // Upload image to storage if needed
      let imageUri;
      if (typeof image === 'string' && image.startsWith('gs://')) {
        imageUri = image;
      } else {
        // Upload to Cloud Storage
        const filename = `temp-${Date.now()}.jpg`;
        const file = this.storageBucket.file(filename);

        if (typeof image === 'string') {
          if (image.startsWith('http://') || image.startsWith('https://')) {
            // Fetch remote image and upload
            const response = await fetch(image);
            const buffer = await response.buffer();
            await file.save(buffer);
          } else {
            // Upload local file
            await file.save(fs.readFileSync(image));
          }
        } else {
          // Upload buffer
          await file.save(image);
        }

        imageUri = `gs://${config.integration.storage_bucket}/${filename}`;
      }

      // Call Vertex AI Prediction API
      const endpointPath = `projects/${config.vertex_ai.project}/locations/${location}/endpoints/${endpointConfig.display_name}`;

      const request = {
        endpoint: endpointPath,
        instances: [
          {
            image: { imageUri },
            prompt,
          },
        ],
      };

      const [response] = await this.vertexClient.predict(request);

      // Clean up temporary file if needed
      if (imageUri.includes('temp-') && !imageUri.startsWith(image)) {
        const filename = imageUri.split('/').pop();
        await this.storageBucket.file(filename).delete();
      }

      return response;
    } catch (error) {
      console.error(`Vertex AI Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store results in Firestore
   * @param {string} id - Unique identifier for the result
   * @param {Object} result - Analysis result to store
   * @returns {Promise<void>}
   */
  async storeResults(id, result) {
    try {
      await this.resultsCollection.doc(id).set({
        result,
        timestamp: Date.now(),
        ttl: Date.now() + config.integration.firestore.ttl_days * 86400000,
      });
    } catch (error) {
      console.error(`Firestore Error: ${error.message}`);
      // Don't throw error to prevent disrupting the main workflow
    }
  }

  /**
   * Publish results to PubSub
   * @param {string} id - Unique identifier for the result
   * @param {Object} result - Analysis result to publish
   * @returns {Promise<void>}
   */
  async publishResults(id, result) {
    try {
      await this.pubsubTopic.publish(
        Buffer.from(
          JSON.stringify({
            id,
            result,
            timestamp: Date.now(),
          })
        )
      );
    } catch (error) {
      console.error(`PubSub Error: ${error.message}`);
      // Don't throw error to prevent disrupting the main workflow
    }
  }

  /**
   * Get analysis result by ID
   * @param {string} id - Result identifier
   * @returns {Promise<Object|null>} Analysis result or null if not found
   */
  async getResultById(id) {
    try {
      const doc = await this.resultsCollection.doc(id).get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (error) {
      console.error(`Firestore Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * List recent analysis results
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array<Object>>} Recent analysis results
   */
  async listRecentResults(limit = 10) {
    try {
      const snapshot = await this.resultsCollection
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error(`Firestore Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up expired cache and storage
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      // Clean cache
      const now = Date.now();
      for (const [key, value] of this.resultsCache.entries()) {
        if (
          now - value.timestamp >
          config.integration.cache_ttl_seconds * 1000
        ) {
          this.resultsCache.delete(key);
        }
      }

      // Clean Firestore
      const expiredDocs = await this.resultsCollection
        .where('ttl', '<', Date.now())
        .get();

      const batch = this.firestoreClient.batch();
      expiredDocs.forEach(doc => {
        batch.delete(doc.ref);
      });

      if (expiredDocs.size > 0) {
        await batch.commit();
        console.log(`Cleaned up ${expiredDocs.size} expired results`);
      }
    } catch (error) {
      console.error(`Cleanup Error: ${error.message}`);
    }
  }
}

module.exports = new VisionService();
