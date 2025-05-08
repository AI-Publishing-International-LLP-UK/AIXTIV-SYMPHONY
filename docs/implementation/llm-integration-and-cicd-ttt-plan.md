# Integration Gateway LLM Integration and CI/CD/TTT Implementation Plan

This document provides a comprehensive implementation plan for integrating the Integration Gateway with three major LLM providers (OpenAI, Anthropic Claude, and Google Vertex AI/DeepMind) while implementing CI/CD/TTT (Continuous Integration/Continuous Deployment/Continuous Testing, Tuning, and Training) for agent memory. The plan also covers integration with mini-LLMs and Owner CE Score functionality.

## 1. LLM Provider Integration Architecture

### 1.1. Unified LLM Adapter Interface

We'll create a unified interface for all LLM providers that standardizes interactions across different AI services:

```typescript
// src/adapters/llm/LLMAdapterInterface.ts
export interface LLMAdapterConfig {
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
  projectId?: string;
  defaultModel?: string;
  rateLimits?: {
    requestsPerMin: number;
    tokensPerMin: number;
  };
  modelMapping?: Record<string, any>;
}

export interface LLMCompletionParams {
  model?: string;
  prompt: string;
  systemMessage?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  examples?: Array<{ input: string; output: string }>;
  finalPrompt?: string;
}

export interface LLMEmbeddingParams {
  model?: string;
  text?: string;
  texts?: string[];
  dimensions?: number;
}

export interface LLMCompletionResult {
  text: string;
  finish_reason: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  latency_ms: number;
  provider: string;
  requestId: string;
}

export interface LLMEmbeddingResult {
  embeddings: number[][];
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
  model: string;
  latency_ms: number;
  provider: string;
  requestId: string;
}

export interface LLMHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency: number;
  models?: string[];
  modelCount?: number;
  version?: string;
  error?: string;
}

export interface LLMAdapter {
  connect(credentials: any): Promise<any>;
  healthCheck(connection: any): Promise<LLMHealthStatus>;
  generateCompletion(params: LLMCompletionParams, connection: any): Promise<LLMCompletionResult>;
  generateEmbedding(params: LLMEmbeddingParams, connection: any): Promise<LLMEmbeddingResult>;
  getModels(): Promise<string[]>;
  recordMetrics(operation: string, success: boolean, duration: number): void;
  getMetrics(): any;
  resetMetrics(): void;
}
```

### 1.2. Google Vertex AI Adapter Implementation

Building on the existing OpenAI and Claude adapters, we'll implement the Google Vertex AI adapter:

```typescript
// src/adapters/llm-adapters/vertex-ai-adapter.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { ServiceAdapter } = require('./base-service-adapter');

/**
 * Google Vertex AI Service Adapter
 */
class VertexAIAdapter extends ServiceAdapter {
  constructor(config) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://us-west1-aiplatform.googleapis.com/v1';
    this.projectId = config.projectId || 'api-for-warp-drive';
    this.location = config.location || 'us-west1';
    this.defaultModel = config.defaultModel || 'text-bison';
    this.modelMapping = config.modelMapping || {
      'gemini-pro': { name: 'gemini-pro', max_tokens: 8192, default_tokens: 2000 },
      'gemini-pro-vision': { name: 'gemini-pro-vision', max_tokens: 8192, default_tokens: 2000 },
      'text-bison': { name: 'text-bison@002', max_tokens: 8192, default_tokens: 2000 },
      'text-unicorn': { name: 'text-unicorn@001', max_tokens: 8192, default_tokens: 2000 },
      'embedding-gecko': { name: 'embedding-gecko@001', max_tokens: 2048, default_tokens: 2048 },
      'embedding-multimodal': { name: 'multimodalembedding@001', max_tokens: 2048, default_tokens: 2048 }
    };
    this.serviceName = 'Google Vertex AI';
  }

  /**
   * Connect to Vertex AI
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<Object>} Connection information
   */
  async connect(credentials) {
    try {
      console.log(`Connecting to Vertex AI service (${this.serviceId})...`);

      if (!credentials.apiKey) {
        throw new Error('API key is required for Vertex AI connection');
      }

      // Initialize HTTP client
      this.httpClient = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout for Vertex AI
      });

      // Test connection
      const testResult = await this.healthCheck({ credentials });

      if (!testResult.status === 'healthy') {
        throw new Error(`Connection test failed: ${testResult.message}`);
      }

      console.log(`Successfully connected to Vertex AI (${this.serviceId})`);

      // Return connection details
      return {
        status: 'connected',
        serviceId: this.serviceId,
        connectedAt: new Date(),
        projectId: this.projectId,
        location: this.location,
        models: Object.keys(this.modelMapping),
      };
    } catch (error) {
      console.error(`Failed to connect to Vertex AI (${this.serviceId}):`, error);
      throw new Error(`Vertex AI connection failed: ${this._formatError(error)}`);
    }
  }

  /**
   * Health check for Vertex AI
   * @param {Object} connection - Connection information
   * @returns {Promise<Object>} Health status
   */
  async healthCheck(connection) {
    try {
      const startTime = Date.now();

      // Create client if not already created
      if (!this.httpClient && connection.credentials) {
        this.httpClient = axios.create({
          baseURL: this.baseUrl,
          headers: {
            'Authorization': `Bearer ${connection.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // Lower timeout for health checks
        });
      }

      if (!this.httpClient) {
        throw new Error('HTTP client not initialized');
      }

      // List models as a health check
      const response = await this.httpClient.get(
        `/projects/${this.projectId}/locations/${this.location}/models`
      );

      const latency = Date.now() - startTime;

      // Check if we have access to expected models
      const availableModels = response.data.models.map(model => model.displayName);
      
      let hasExpectedModels = false;
      for (const modelId of Object.keys(this.modelMapping)) {
        const mappedModel = this.modelMapping[modelId].name;
        if (availableModels.some(model => model.includes(mappedModel))) {
          hasExpectedModels = true;
          break;
        }
      }

      if (!hasExpectedModels) {
        return {
          status: 'degraded',
          message: 'Connected but missing expected models',
          latency,
          models: availableModels,
        };
      }

      return {
        status: 'healthy',
        message: 'Vertex AI API is responding normally',
        latency,
        models: availableModels.slice(0, 10), // Just the first 10 to keep response size manageable
        modelCount: availableModels.length,
      };
    } catch (error) {
      console.error(`Vertex AI health check failed (${this.serviceId}):`, error);
      return {
        status: 'unhealthy',
        message: `Health check failed: ${this._formatError(error)}`,
        latency: 0,
        error: this._formatError(error),
      };
    }
  }

  /**
   * Generate completion using Vertex AI
   * @param {Object} params - Completion parameters
   * @param {Object} connection - Connection information
   * @returns {Promise<Object>} Completion result
   */
  async generateCompletion(params, connection) {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      console.log(`Generating completion (${requestId}) with Vertex AI (${this.serviceId})...`);

      // Map model if needed
      let model = params.model || this.defaultModel;
      let mappedModel;

      if (this.modelMapping[model]) {
        mappedModel = this.modelMapping[model].name;
      } else {
        // If model not found in mapping, use as-is
        mappedModel = model;
      }

      // Determine if this is a Gemini model
      const isGemini = mappedModel.includes('gemini');

      // Construct the API endpoint
      let endpoint;
      let requestBody;

      if (isGemini) {
        // Gemini API format
        endpoint = `/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${mappedModel}:generateContent`;
        
        // Build content array
        const content = [];
        
        // Add system message if provided
        if (params.systemMessage) {
          content.push({
            role: 'system',
            parts: [{ text: params.systemMessage }]
          });
        }
        
        // Add user message
        content.push({
          role: 'user',
          parts: [{ text: params.prompt }]
        });
        
        requestBody = {
          contents: content,
          generationConfig: {
            temperature: params.temperature ?? this.defaultTemp,
            topP: params.top_p ?? this.defaultTopP,
            maxOutputTokens: params.max_tokens || this.modelMapping[model]?.default_tokens || this.defaultMaxTokens,
            topK: 40
          }
        };
      } else {
        // Standard Vertex AI text model format
        endpoint = `/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${mappedModel}:predict`;
        
        // Prepare prompt
        let fullPrompt = params.prompt;
        if (params.systemMessage) {
          fullPrompt = `${params.systemMessage}\n\n${params.prompt}`;
        }
        
        requestBody = {
          instances: [{ content: fullPrompt }],
          parameters: {
            temperature: params.temperature ?? this.defaultTemp,
            topP: params.top_p ?? this.defaultTopP,
            maxOutputTokens: params.max_tokens || this.modelMapping[model]?.default_tokens || this.defaultMaxTokens,
            topK: 40
          }
        };
      }

      // Make API request with retry logic
      const maxRetries = 3;
      let retries = 0;
      let response;

      while (retries < maxRetries) {
        try {
          response = await this.httpClient.post(endpoint, requestBody);
          break; // Success, exit retry loop
        } catch (error) {
          retries++;
          
          // Check if we should retry
          const shouldRetry = this._shouldRetryRequest(error, retries, maxRetries);
          
          if (!shouldRetry) {
            throw error; // Don't retry, propagate error
          }
          
          // Exponential backoff with jitter
          const backoffTime = Math.min(100 * Math.pow(2, retries) + Math.random() * 100, 2000);
          console.log(`Retrying Vertex AI request (attempt ${retries}/${maxRetries}) after ${backoffTime}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }

      if (!response) {
        throw new Error(`Failed to get response after ${maxRetries} attempts`);
      }

      // Process response based on model type
      let result;
      
      if (isGemini) {
        const generatedContent = response.data.candidates[0].content;
        const text = generatedContent.parts.map(part => part.text).join('');
        
        result = {
          text,
          finish_reason: response.data.candidates[0].finishReason || 'stop',
          usage: {
            prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: (response.data.usageMetadata?.promptTokenCount || 0) + 
                          (response.data.usageMetadata?.candidatesTokenCount || 0)
          },
          model: mappedModel,
        };
      } else {
        result = {
          text: response.data.predictions[0].content,
          finish_reason: 'stop',  // Vertex AI doesn't provide finish reason
          usage: {
            prompt_tokens: response.data.metadata?.tokenCount || 0,
            completion_tokens: 0,  // Not provided by Vertex AI
            total_tokens: response.data.metadata?.tokenCount || 0
          },
          model: mappedModel,
        };
      }

      const duration = Date.now() - startTime;

      // Record metrics
      this.recordMetrics('generateCompletion', true, duration);

      console.log(`Vertex AI completion generated (${requestId}) in ${duration}ms`);

      return {
        ...result,
        latency_ms: duration,
        provider: 'vertexai',
        requestId,
      };
    } catch (error) {
      console.error(`Vertex AI completion failed (${requestId}):`, error);

      const duration = Date.now() - startTime;
      this.recordMetrics('generateCompletion', false, duration);

      throw new Error(`Vertex AI completion failed: ${this._formatError(error)}`);
    }
  }

  /**
   * Generate embeddings using Vertex AI
   * @param {Object} params - Embedding parameters
   * @param {Object} connection - Connection information
   * @returns {Promise<Object>} Embedding result
   */
  async generateEmbedding(params, connection) {
    const startTime =

