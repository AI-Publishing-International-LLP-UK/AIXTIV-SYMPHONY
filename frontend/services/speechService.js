/**
 * Speech Service for ASOOS Frontend
 * 
 * Provides client-side integration with Google Cloud Speech APIs
 * through the backend REST API endpoints
 */

import axios from 'axios';

// API endpoint URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const SPEECH_API = `${API_BASE_URL}/api/speech`;

// Speech Recognition Instance
let recognitionInstance = null;

class SpeechService {
  /**
   * Get supported languages
   * @returns {Promise<Array>} List of supported languages
   */
  static async getSupportedLanguages() {
    try {
      const response = await axios.get(`${SPEECH_API}/languages`);
      return response.data.languages || [];
    } catch (error) {
      console.error('Error fetching languages:', error);
      throw error;
    }
  }

  /**
   * Get voices for a language
   * @param {string} languageCode - Language code (e.g., 'en-US')
   * @returns {Promise<Array>} List of available voices
   */
  static async getVoicesForLanguage(languageCode) {
    try {
      const response = await axios.get(`${SPEECH_API}/voices/${languageCode}`);
      return response.data.voices || [];
    } catch (error) {
      console.error(`Error fetching voices for ${languageCode}:`, error);
      throw error;
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert to speech
   * @param {string} languageCode - Language code (e.g., 'en-US')
   * @param {string} voiceType - Voice type (FEMALE, MALE, NEUTRAL)
   * @returns {Promise<Object>} Object with audio URL and metadata
   */
  static async textToSpeech(text, languageCode = 'en-US', voiceType = 'FEMALE') {
    try {
      // Get audio as base64
      const response = await axios.post(`${SPEECH_API}/tts/base64`, {
        text,
        languageCode,
        voiceType
      });

      // Convert base64 to audio object
      if (response.data.success && response.data.audioContent) {
        // Create audio from base64
        const audioBlob = this.base64ToBlob(
          response.data.audioContent,
          'audio/mp3'
        );
        const audioUrl = URL.createObjectURL(audioBlob);

        return {
          audioUrl,
          audioBlob,
          metadata: response.data.metadata
        };
      } else {
        throw new Error('Failed to get audio content');
      }
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  }

  /**
   * Play text as speech
   * @param {string} text - Text to speak
   * @param {string} languageCode - Language code
   * @param {string} voiceType - Voice type
   * @returns {Promise<HTMLAudioElement>} Audio element that is playing
   */
  static async speak(text, languageCode = 'en-US', voiceType = 'FEMALE') {
    try {
      const { audioUrl } = await this.textToSpeech(text, languageCode, voiceType);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      
      // Return promise that resolves when audio finishes
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
          resolve(audio);
        };
        
        audio.onerror = (err) => {
          URL.revokeObjectURL(audioUrl); // Clean up
          reject(err);
        };
        
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('Error in speak function:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using file upload
   * @param {File} audioFile - Audio file to transcribe
   * @param {string} languageCode - Language code
   * @returns {Promise<Object>} Transcription results
   */
  static async speechToTextFromFile(audioFile, languageCode = 'en-US') {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('languageCode', languageCode);
      
      const response = await axios.post(`${SPEECH_API}/stt/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in speech-to-text from file:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using base64 audio
   * @param {string} base64Audio - Base64 encoded audio
   * @param {string} languageCode - Language code
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Transcription results
   */
  static async speechToTextFromBase64(base64Audio, languageCode = 'en-US', options = {}) {
    try {
      const response = await axios.post(`${SPEECH_API}/stt/base64`, {
        audio: base64Audio,
        languageCode,
        encoding: options.encoding,
        sampleRate: options.sampleRate
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in speech-to-text from base64:', error);
      throw error;
    }
  }

  /**
   * Start speech recognition in the browser
   * @param {function} onResultCallback - Callback for transcription results
   * @param {string} languageCode - Language code
   * @returns {Object} Recognition control object
   */
  static startSpeechRecognition(onResultCallback, languageCode = 'en-US') {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition is not supported in this browser');
    }
    
    // Use browser's built-in speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // Stop any existing recognition
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    
    // Create new recognition instance
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = languageCode;
    
    // Set up event handlers
    recognitionInstance.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;
      const confidence = lastResult[0].confidence;
      
      onResultCallback({
        transcript,
        isFinal,
        confidence,
        metadata: {
          languageCode,
          timestamp: new Date().toISOString()
        }
      });
    };
    
    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onResultCallback({
        error: event.error,
        metadata: {
          languageCode,
          timestamp: new Date().toISOString()
        }
      });
    };
    
    // Start recognition
    recognitionInstance.start();
    
    // Return control object
    return {
      stop: () => {
        if (recognitionInstance) {
          recognitionInstance.stop();
          recognitionInstance = null;
        }
      },
      isRunning: () => {
        return !!recognitionInstance;
      }
    };
  }

  /**
   * Detect language of text
   * @param {string} text - Text to detect language of
   * @returns {Promise<Object>} Language detection results
   */
  static async detectLanguage(text) {
    try {
      const response = await axios.post(`${SPEECH_API}/detect-language`, { text });
      return response.data;
    } catch (error) {
      console.error('Error detecting language:', error);
      throw error;
    }
  }

  /**
   * Translate text to another language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional)
   * @returns {Promise<Object>} Translation results
   */
  static async translateText(text, targetLanguage, sourceLanguage = '') {
    try {
      const response = await axios.post(`${SPEECH_API}/translate`, {
        text,
        targetLanguage,
        sourceLanguage
      });
      
      return response.data;
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }

  /**
   * Helper function to convert base64 to Blob
   * @param {string} base64 - Base64 string
   * @param {string} mimeType - MIME type
   * @returns {Blob} Converted blob
   */
  static base64ToBlob(base64, mimeType) {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([arrayBuffer], { type: mimeType });
  }
}

export default SpeechService;