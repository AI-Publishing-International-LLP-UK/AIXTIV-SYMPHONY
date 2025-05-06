const { aiplatform } = require('@google-cloud/aiplatform');
const { PredictionServiceClient } = aiplatform.v1;
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { PubSub } = require('@google-cloud/pubsub');
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
 * Dr. Lucy Vertex AI Service
 * Provides advanced AI capabilities through Google Cloud's Vertex AI platform
 *
 * This service enables interaction with custom Vertex AI endpoints, models, and pipelines
 * to support advanced AI functionality within the Aixtiv Symphony ecosystem.
 */
class VertexService {
  constructor() {
    // Initialize clients
    this.predictionClient = new PredictionServiceClient({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.aiplatformClient = new aiplatform.v1.ModelServiceClient({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.endpointServiceClient = new aiplatform.v1.EndpointServiceClient({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.firestoreClient = new Firestore({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.storageClient = new Storage({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    this.pubsubClient = new PubSub({
      projectId: config.vertex_ai.project,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    // Set up collections
    this.resultsCollection =
      this.firestoreClient.collection('vertex_ai_results');

    // Configure bucket
    this.storageBucket = this.storageClient.bucket('aixtiv-vertex-ai-data');

    // Set up pubsub topic
    this.pubsubTopic = this.pubsubClient.topic('vertex-ai-predictions');

    // Cache for model predictions
    this.resultsCache = new Map();

    // Format location for API calls
    this.location = config.vertex_ai.region;

    // Build endpoint map from config
    this.endpoints = {};
    Object.entries(config.vertex_ai.endpoints).forEach(([key, value]) => {
      this.endpoints[key] = value.display_name;
    });

    console.log(
      `Vertex AI Service initialized for project: ${config.vertex_ai.project}`
    );
  }

  /**
   * Call Vertex AI endpoint with structured data
   * @param {string} endpointName - Name of the endpoint from config
   * @param {Object} instances - Data instances to send to model
   * @param {Object} parameters - Additional parameters for prediction
   * @returns {Promise<Object>} Prediction results
   */
  async predict(endpointName, instances, parameters = {}) {
    try {
      // Get endpoint from config map
      const displayName = this.endpoints[endpointName];
      if (!displayName) {
        throw new Error(`Endpoint ${endpointName} not found in configuration`);
      }

      // Format endpoint path
      const endpointPath = `projects/${config.vertex_ai.project}/locations/${this.location}/endpoints/${displayName}`;

      // Generate cache key
      const instancesStr = JSON.stringify(instances);
      const paramsStr = JSON.stringify(parameters);
      const cacheKey = `${endpointName}:${instancesStr}:${paramsStr}`;

      // Check cache
      if (this.resultsCache.has(cacheKey)) {
        const cachedResult = this.resultsCache.get(cacheKey);
        if (Date.now() - cachedResult.timestamp < 300000) {
          // 5 minute cache
          return cachedResult.data;
        }
      }

      // Prepare request
      const request = {
        endpoint: endpointPath,
        instances: instances,
        parameters: parameters,
      };

      // Call Vertex AI Prediction API
      const [response] = await this.predictionClient.predict(request);

      // Store in cache
      this.resultsCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response,
      });

      // Store result in Firestore
      await this.storeResult(cacheKey, {
        endpointName,
        instances,
        parameters,
        response: response,
      });

      // Publish to PubSub
      await this.publishResult(cacheKey, {
        endpointName,
        response: response,
      });

      return response;
    } catch (error) {
      console.error(`Vertex AI Prediction Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate text using a large language model
   * @param {string} prompt - Text prompt for the model
   * @param {string} modelEndpoint - Endpoint name from config (e.g., 'super_claude')
   * @param {Object} parameters - Generation parameters like temperature, topK, etc.
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt, modelEndpoint = 'super_claude', parameters = {}) {
    try {
      // Default parameters if not provided
      const defaultParams = {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.95,
      };

      // Merge parameters
      const mergedParams = { ...defaultParams, ...parameters };

      // Format instances for text generation
      const instances = [
        {
          prompt: prompt,
        },
      ];

      // Call predict method
      const response = await this.predict(
        modelEndpoint,
        instances,
        mergedParams
      );

      // Extract generated text from response
      if (response && response.predictions && response.predictions.length > 0) {
        return response.predictions[0].content || response.predictions[0];
      }

      throw new Error('No predictions returned from model');
    } catch (error) {
      console.error(`Text Generation Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process an image with multimodal AI
   * @param {string|Buffer} image - Image URL, GCS path, or buffer
   * @param {string} prompt - Text prompt for analyzing the image
   * @param {string} modelEndpoint - Endpoint name from config
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(image, prompt, modelEndpoint = 'multimodal_analysis') {
    try {
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

        imageUri = `gs://aixtiv-vertex-ai-data/${filename}`;
      }

      // Format instances for multimodal analysis
      const instances = [
        {
          image: { imageUri },
          text: prompt,
        },
      ];

      // Call predict method
      const response = await this.predict(modelEndpoint, instances);

      // Clean up temporary file if needed
      if (imageUri.includes('temp-') && !imageUri.startsWith(image)) {
        const filename = imageUri.split('/').pop();
        await this.storageBucket
          .file(filename)
          .delete()
          .catch(err => {
            console.warn(`Failed to delete temporary file: ${err.message}`);
          });
      }

      return response;
    } catch (error) {
      console.error(`Image Analysis Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available endpoints in the project
   * @returns {Promise<Array<Object>>} List of available endpoints
   */
  async listEndpoints() {
    try {
      const parent = `projects/${config.vertex_ai.project}/locations/${this.location}`;
      const [endpoints] = await this.endpointServiceClient.listEndpoints({
        parent,
      });

      return endpoints.map(endpoint => ({
        name: endpoint.displayName,
        id: endpoint.name.split('/').pop(),
        description: endpoint.description || '',
        deployedModels: endpoint.deployedModels || [],
      }));
    } catch (error) {
      console.error(`List Endpoints Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available models in the project
   * @returns {Promise<Array<Object>>} List of available models
   */
  async listModels() {
    try {
      const parent = `projects/${config.vertex_ai.project}/locations/${this.location}`;
      const [models] = await this.aiplatformClient.listModels({ parent });

      return models.map(model => ({
        name: model.displayName,
        id: model.name.split('/').pop(),
        description: model.description || '',
        createTime: model.createTime.toISOString(),
        updateTime: model.updateTime.toISOString(),
      }));
    } catch (error) {
      console.error(`List Models Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Store result in Firestore
   * @param {string} id - Unique identifier for the result
   * @param {Object} result - Prediction result to store
   * @returns {Promise<void>}
   */
  async storeResult(id, result) {
    try {
      await this.resultsCollection.doc(id).set({
        ...result,
        timestamp: Date.now(),
        ttl: Date.now() + 30 * 86400000, // 30 days TTL
      });
    } catch (error) {
      console.error(`Firestore Error: ${error.message}`);
      // Don't throw error to prevent disrupting the main workflow
    }
  }

  /**
   * Publish result to PubSub
   * @param {string} id - Unique identifier for the result
   * @param {Object} result - Prediction result to publish
   * @returns {Promise<void>}
   */
  async publishResult(id, result) {
    try {
      await this.pubsubTopic.publish(
        Buffer.from(
          JSON.stringify({
            id,
            ...result,
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
   * Get prediction result by ID
   * @param {string} id - Result identifier
   * @returns {Promise<Object|null>} Prediction result or null if not found
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
   * List recent prediction results
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array<Object>>} Recent prediction results
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
        if (now - value.timestamp > 300000) {
          // 5 minutes
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

      // Clean temporary storage files
      const [files] = await this.storageBucket.getFiles({
        prefix: 'temp-',
      });

      const oneDayAgo = now - 86400000; // 24 hours
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const created = new Date(metadata.timeCreated).getTime();

        if (created < oneDayAgo) {
          await file.delete();
          console.log(`Deleted old temporary file: ${file.name}`);
        }
      }
    } catch (error) {
      console.error(`Cleanup Error: ${error.message}`);
    }
  }
}

module.exports = new VertexService();
