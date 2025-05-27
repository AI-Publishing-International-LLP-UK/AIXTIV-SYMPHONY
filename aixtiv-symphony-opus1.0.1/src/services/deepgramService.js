import axios from 'axios';

/**
 * DeepgramService - Provides methods for interacting with the Deepgram API
 * for speech recognition and transcription.
 */
class DeepgramService {
  constructor() {
    this.apiKey = process.env.REACT_APP_DEEPGRAM_API_KEY;
    this.baseUrl = process.env.REACT_APP_DEEPGRAM_BASE_URL || 'https://api.deepgram.com/v1';
    this.defaultModel = process.env.REACT_APP_DEFAULT_MODEL || 'nova-3';
    this.defaultLanguage = process.env.REACT_APP_DEFAULT_LANGUAGE || 'en-US';
    
    if (!this.apiKey || this.apiKey === 'your_deepgram_api_key_here') {
      this.logError('Deepgram API key is not configured. Please set REACT_APP_DEEPGRAM_API_KEY in your .env file.');
    }
  }

  /**
   * Transcribe audio using Deepgram's REST API
   * 
   * @param {File|Blob|ArrayBuffer} audioData - Audio file or data to transcribe
   * @param {Object} options - Transcription options
   * @param {string} options.model - Model to use (e.g., 'nova-3', 'whisper')
   * @param {string} options.language - Language code (e.g., 'en-US')
   * @param {boolean} options.smartFormat - Whether to apply smart formatting
   * @param {boolean} options.punctuate - Whether to add punctuation
   * @param {boolean} options.diarize - Whether to detect different speakers
   * @param {number} options.maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioData, options = {}) {
    try {
      const model = options.model || this.defaultModel;
      const language = options.language || this.defaultLanguage;
      const smartFormat = options.smartFormat !== undefined ? options.smartFormat : true;
      const punctuate = options.punctuate !== undefined ? options.punctuate : true;
      const diarize = options.diarize !== undefined ? options.diarize : false;
      const maxRetries = options.maxRetries || 3;
      
      this.logInfo(`Starting transcription with model: ${model}, language: ${language}`);
      
      // Prepare query parameters
      const params = {
        model,
        language,
        smart_format: smartFormat,
        punctuate: punctuate,
        diarize: diarize
      };
      
      // Add any additional parameters from options
      Object.keys(options).forEach(key => {
        if (!['model', 'language', 'smartFormat', 'punctuate', 'diarize', 'maxRetries'].includes(key)) {
          params[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = options[key];
        }
      });
      
      return await this.sendRequest(audioData, params, maxRetries);
    } catch (error) {
      this.logError('Error in transcribeAudio:', error);
      throw error;
    }
  }

  /**
   * Send request to Deepgram API with retry logic
   * 
   * @param {File|Blob|ArrayBuffer} audioData - Audio data to send
   * @param {Object} params - Query parameters
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} attempt - Current attempt number (for internal use)
   * @returns {Promise<Object>} - API response
   */
  async sendRequest(audioData, params, maxRetries, attempt = 1) {
    try {
      // Prepare audio data based on type
      let data;
      let headers = {
        'Authorization': `Token ${this.apiKey}`,
      };
      
      if (audioData instanceof File || audioData instanceof Blob) {
        data = audioData;
        headers['Content-Type'] = audioData.type || 'audio/wav';
      } else if (audioData instanceof ArrayBuffer) {
        data = audioData;
        headers['Content-Type'] = 'audio/wav';
      } else if (typeof audioData === 'string' && audioData.startsWith('http')) {
        // If audioData is a URL, send it as a parameter
        params.url = audioData;
        data = {};
      } else {
        throw new Error('Unsupported audio data format');
      }
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/listen`,
        headers,
        params,
        data,
        timeout: 30000, // 30 seconds timeout
        maxContentLength: 100 * 1024 * 1024, // 100MB max content length
      });
      
      this.logInfo('Transcription completed successfully');
      return response.data;
    } catch (error) {
      // Handle network errors and Deepgram API errors
      if (error.response) {
        // Server responded with an error status
        const status = error.response.status;
        
        // Check if the error is recoverable and we should retry
        if (attempt <= maxRetries && (
          status === 429 || // Too Many Requests
          status === 500 || // Internal Server Error
          status === 502 || // Bad Gateway
          status === 503 || // Service Unavailable
          status === 504    // Gateway Timeout
        )) {
          const delayMs = this.calculateBackoff(attempt);
          this.logWarning(`Request failed with status ${status}, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
          
          await this.delay(delayMs);
          return this.sendRequest(audioData, params, maxRetries, attempt + 1);
        }
        
        // Specific error handling based on status codes
        if (status === 400) {
          throw new Error(`Bad request: ${error.response.data.error || 'Invalid request parameters'}`);
        } else if (status === 401) {
          throw new Error('Unauthorized: Invalid API key');
        } else if (status === 413) {
          throw new Error('Payload too large: Audio file exceeds maximum size limit');
        } else {
          throw new Error(`Deepgram API error (${status}): ${error.response.data.error || error.message}`);
        }
      } else if (error.request) {
        // No response received
        if (attempt <= maxRetries) {
          const delayMs = this.calculateBackoff(attempt);
          this.logWarning(`No response received, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
          
          await this.delay(delayMs);
          return this.sendRequest(audioData, params, maxRetries, attempt + 1);
        }
        throw new Error('No response received from Deepgram API');
      } else {
        // Something else went wrong
        throw error;
      }
    }
  }

  /**
   * Calculate exponential backoff delay
   * 
   * @param {number} attempt - Current attempt number
   * @returns {number} - Delay in milliseconds
   */
  calculateBackoff(attempt) {
    // Exponential backoff with jitter: 2^attempt * 100ms + random jitter
    const baseDelay = Math.pow(2, attempt) * 100;
    const jitter = Math.random() * 100;
    return Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
  }

  /**
   * Create a delay using Promise
   * 
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test different Deepgram models and compare results
   * 
   * @param {File|Blob|ArrayBuffer} audioData - Audio data to test
   * @returns {Promise<Object>} - Comparison results
   */
  async compareModels(audioData) {
    try {
      this.logInfo('Starting model comparison test');
      
      const models = ['nova-3', 'whisper'];
      const results = {};
      
      for (const model of models) {
        const startTime = performance.now();
        
        const result = await this.transcribeAudio(audioData, {
          model,
          smartFormat: true,
          punctuate: true
        });
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        results[model] = {
          transcript: result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '',
          confidence: result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
          processingTime,
          wordCount: (result.results?.channels?.[0]?.alternatives?.[0]?.transcript?.split(/\s+/) || []).length,
        };
        
        this.logInfo(`Model ${model} completed in ${processingTime.toFixed(2)}ms`);
      }
      
      return {
        models: results,
        summary: this.generateComparisonSummary(results)
      };
    } catch (error) {
      this.logError('Error in compareModels:', error);
      throw error;
    }
  }

  /**
   * Generate a summary of model comparison results
   * 
   * @param {Object} results - Model comparison results
   * @returns {Object} - Comparison summary
   */
  generateComparisonSummary(results) {
    const summary = {};
    
    // Find fastest model
    let fastestModel = null;
    let fastestTime = Infinity;
    
    // Find highest confidence model
    let highestConfidenceModel = null;
    let highestConfidence = -1;
    
    Object.entries(results).forEach(([model, data]) => {
      if (data.processingTime < fastestTime) {
        fastestTime = data.processingTime;
        fastestModel = model;
      }
      
      if (data.confidence > highestConfidence) {
        highestConfidence = data.confidence;
        highestConfidenceModel = model;
      }
    });
    
    summary.fastestModel = {
      model: fastestModel,
      processingTime: fastestTime
    };
    
    summary.highestConfidenceModel = {
      model: highestConfidenceModel,
      confidence: highestConfidence
    };
    
    // Calculate word differences
    if (Object.keys(results).length > 1) {
      summary.differences = {};
      const models = Object.keys(results);
      
      for (let i = 0; i < models.length; i++) {
        for (let j = i + 1; j < models.length; j++) {
          const model1 = models[i];
          const model2 = models[j];
          
          const words1 = results[model1].transcript.toLowerCase().split(/\s+/);
          const words2 = results[model2].transcript.toLowerCase().split(/\s+/);
          
          const differentWords = words1.filter(word => !words2.includes(word)).length + 
                                words2.filter(word => !words1.includes(word)).length;
          
          summary.differences[`${model1}_vs_${model2}`] = {
            differentWords,
            percentageDifference: differentWords / Math.max(words1.length, words2.length) * 100
          };
        }
      }
    }
    
    return summary;
  }

  /**
   * Log information message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  logInfo(message, data) {
    console.info(`[DeepgramService] ${message}`, data || '');
    // Future: integrate with FMS (Flight Memory System) logging
  }

  /**
   * Log warning message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  logWarning(message, data) {
    console.warn(`[DeepgramService] ${message}`, data || '');
    // Future: integrate with FMS logging
  }

  /**
   * Log error message
   * 
   * @param {string} message - Log message
   * @param {Error|Object} [error] - Error object or additional data
   */
  logError(message, error) {
    console.error(`[DeepgramService] ${message}`, error || '');
    // Future: integrate with FMS logging and error reporting
  }
}

// Create and export a singleton instance
const deepgramService = new DeepgramService();
export default deepgramService;

// Also export the class for testing or custom instantiation
export { DeepgramService };

