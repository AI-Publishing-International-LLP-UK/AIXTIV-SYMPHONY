/**
 * Google TTS/STT Service for ASOOS
 * 
 * Provides integration with Google Cloud Text-to-Speech and Speech-to-Text APIs
 * for multilingual voice capabilities in the ASOOS UI
 */

const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;
const fs = require('fs');
const util = require('util');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const os = require('os');

// Initialize clients
const ttsClient = new textToSpeech.TextToSpeechClient();
const sttClient = new speech.SpeechClient();
const translateClient = new Translate();

// Define supported languages
const SUPPORTED_LANGUAGES = {
  'en-US': {
    name: 'English (United States)',
    voices: {
      FEMALE: 'en-US-Wavenet-F',
      MALE: 'en-US-Wavenet-D',
      NEUTRAL: 'en-US-Wavenet-A'
    },
    defaultVoice: 'en-US-Wavenet-F'
  },
  'en-GB': {
    name: 'English (United Kingdom)',
    voices: {
      FEMALE: 'en-GB-Wavenet-C',
      MALE: 'en-GB-Wavenet-B',
      NEUTRAL: 'en-GB-Wavenet-A'
    },
    defaultVoice: 'en-GB-Wavenet-C'
  },
  'es-ES': {
    name: 'Spanish (Spain)',
    voices: {
      FEMALE: 'es-ES-Wavenet-C',
      MALE: 'es-ES-Wavenet-B',
      NEUTRAL: 'es-ES-Wavenet-A'
    },
    defaultVoice: 'es-ES-Wavenet-C'
  },
  'es-MX': {
    name: 'Spanish (Mexico)',
    voices: {
      FEMALE: 'es-US-Wavenet-A',
      MALE: 'es-US-Wavenet-B',
      NEUTRAL: 'es-US-Wavenet-A'
    },
    defaultVoice: 'es-US-Wavenet-A'
  },
  'fr-FR': {
    name: 'French (France)',
    voices: {
      FEMALE: 'fr-FR-Wavenet-E',
      MALE: 'fr-FR-Wavenet-D',
      NEUTRAL: 'fr-FR-Wavenet-A'
    },
    defaultVoice: 'fr-FR-Wavenet-E'
  },
  'fr-CA': {
    name: 'French (Canada)',
    voices: {
      FEMALE: 'fr-CA-Wavenet-B',
      MALE: 'fr-CA-Wavenet-A',
      NEUTRAL: 'fr-CA-Wavenet-A'
    },
    defaultVoice: 'fr-CA-Wavenet-B'
  },
  'de-DE': {
    name: 'German',
    voices: {
      FEMALE: 'de-DE-Wavenet-C',
      MALE: 'de-DE-Wavenet-B',
      NEUTRAL: 'de-DE-Wavenet-A'
    },
    defaultVoice: 'de-DE-Wavenet-C'
  },
  'it-IT': {
    name: 'Italian',
    voices: {
      FEMALE: 'it-IT-Wavenet-A',
      MALE: 'it-IT-Wavenet-D',
      NEUTRAL: 'it-IT-Wavenet-A'
    },
    defaultVoice: 'it-IT-Wavenet-A'
  },
  'pt-BR': {
    name: 'Portuguese (Brazil)',
    voices: {
      FEMALE: 'pt-BR-Wavenet-A',
      MALE: 'pt-BR-Wavenet-B',
      NEUTRAL: 'pt-BR-Wavenet-A'
    },
    defaultVoice: 'pt-BR-Wavenet-A'
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    voices: {
      FEMALE: 'cmn-CN-Wavenet-A',
      MALE: 'cmn-CN-Wavenet-B',
      NEUTRAL: 'cmn-CN-Wavenet-A'
    },
    defaultVoice: 'cmn-CN-Wavenet-A'
  },
  'ja-JP': {
    name: 'Japanese',
    voices: {
      FEMALE: 'ja-JP-Wavenet-B',
      MALE: 'ja-JP-Wavenet-D',
      NEUTRAL: 'ja-JP-Wavenet-A'
    },
    defaultVoice: 'ja-JP-Wavenet-B'
  },
  'ko-KR': {
    name: 'Korean',
    voices: {
      FEMALE: 'ko-KR-Wavenet-B',
      MALE: 'ko-KR-Wavenet-C',
      NEUTRAL: 'ko-KR-Wavenet-A'
    },
    defaultVoice: 'ko-KR-Wavenet-B'
  },
  'hi-IN': {
    name: 'Hindi',
    voices: {
      FEMALE: 'hi-IN-Wavenet-A',
      MALE: 'hi-IN-Wavenet-B',
      NEUTRAL: 'hi-IN-Wavenet-A'
    },
    defaultVoice: 'hi-IN-Wavenet-A'
  }
};

/**
 * Text-to-Speech Service
 */
class GoogleSpeechService {
  /**
   * Get supported languages for TTS/STT
   * @returns {Object} Supported languages with metadata
   */
  static getSupportedLanguages() {
    return Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => ({
      code,
      name: info.name,
      hasMultipleVoices: Object.keys(info.voices).length > 1
    }));
  }

  /**
   * Get available voices for a specific language
   * @param {string} languageCode - Language code (e.g., 'en-US')
   * @returns {Array} Available voices for the language
   */
  static getVoicesForLanguage(languageCode) {
    const language = SUPPORTED_LANGUAGES[languageCode];
    
    if (!language) {
      throw new Error(`Language ${languageCode} not supported`);
    }
    
    return Object.entries(language.voices).map(([type, name]) => ({
      type,
      name,
      isDefault: name === language.defaultVoice
    }));
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert to speech
   * @param {string} languageCode - Language code (e.g., 'en-US')
   * @param {string} voiceType - Voice type (FEMALE, MALE, NEUTRAL)
   * @returns {Promise<Object>} Object containing audio content and metadata
   */
  static async textToSpeech(text, languageCode, voiceType = 'FEMALE') {
    try {
      if (!text) {
        throw new Error('Text is required');
      }
      
      // Validate language code
      if (!SUPPORTED_LANGUAGES[languageCode]) {
        languageCode = 'en-US'; // Default to English if unsupported
      }
      
      // Get voice
      const language = SUPPORTED_LANGUAGES[languageCode];
      const voice = language.voices[voiceType] || language.defaultVoice;
      
      // Configure request
      const request = {
        input: { text },
        voice: { 
          languageCode, 
          name: voice,
          ssmlGender: voiceType
        },
        audioConfig: { 
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0,
          volumeGainDb: 0
        },
      };
      
      // Call Google TTS API
      const [response] = await ttsClient.synthesizeSpeech(request);
      
      // Generate a unique filename
      const outputFile = path.join(os.tmpdir(), `tts-${uuidv4()}.mp3`);
      
      // Write the audio content to a file
      await promisify(fs.writeFile)(outputFile, response.audioContent, 'binary');
      
      return {
        audioFile: outputFile,
        audioContent: response.audioContent.toString('base64'),
        metadata: {
          languageCode,
          voice,
          voiceType,
          textLength: text.length,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in textToSpeech:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text
   * @param {Buffer|string} audioContent - Audio content as Buffer or base64 string
   * @param {string} languageCode - Language code (e.g., 'en-US')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Transcription results
   */
  static async speechToText(audioContent, languageCode, options = {}) {
    try {
      if (!audioContent) {
        throw new Error('Audio content is required');
      }
      
      // Validate language code
      if (!SUPPORTED_LANGUAGES[languageCode]) {
        languageCode = 'en-US'; // Default to English if unsupported
      }
      
      // Ensure audioContent is Buffer
      const audioBuffer = Buffer.isBuffer(audioContent) 
        ? audioContent 
        : Buffer.from(audioContent, 'base64');
      
      // Configure request
      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding: options.encoding || 'LINEAR16',
          sampleRateHertz: options.sampleRateHertz || 16000,
          languageCode,
          model: 'latest_long',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          useEnhanced: true,
          maxAlternatives: 1
        },
      };
      
      // Call Google STT API
      const [response] = await sttClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');
      
      return {
        transcription,
        confidence: response.results[0]?.alternatives[0]?.confidence || 0,
        metadata: {
          languageCode,
          timestamp: new Date().toISOString(),
          alternatives: response.results.map(result => ({
            transcript: result.alternatives[0].transcript,
            confidence: result.alternatives[0].confidence
          }))
        }
      };
    } catch (error) {
      console.error('Error in speechToText:', error);
      throw error;
    }
  }

  /**
   * Stream speech to text for real-time transcription
   * @param {function} dataCallback - Callback for each piece of transcription data
   * @param {string} languageCode - Language code (e.g., 'en-US')
   * @param {Object} options - Additional options
   * @returns {Object} Stream control objects
   */
  static streamSpeechToText(dataCallback, languageCode, options = {}) {
    try {
      // Validate language code
      if (!SUPPORTED_LANGUAGES[languageCode]) {
        languageCode = 'en-US'; // Default to English if unsupported
      }
      
      // Configure request
      const config = {
        encoding: options.encoding || 'LINEAR16',
        sampleRateHertz: options.sampleRateHertz || 16000,
        languageCode,
        model: 'latest_long',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        useEnhanced: true,
        maxAlternatives: 1,
        interimResults: true // Get interim results
      };
      
      // Create a recognize stream
      const stream = sttClient
        .streamingRecognize({ config })
        .on('error', error => console.error('Stream error:', error))
        .on('data', data => {
          const transcript = data.results[0].alternatives[0].transcript;
          const isFinal = data.results[0].isFinal;
          
          dataCallback({
            transcript,
            isFinal,
            confidence: data.results[0].alternatives[0].confidence,
            metadata: {
              languageCode,
              timestamp: new Date().toISOString()
            }
          });
        })
        .on('end', () => {
          console.log('Streaming recognition ended');
        });
      
      return {
        stream,
        write: (content) => stream.write(content),
        end: () => stream.end()
      };
    } catch (error) {
      console.error('Error in streamSpeechToText:', error);
      throw error;
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to detect language of
   * @returns {Promise<Object>} Detected language information
   */
  static async detectLanguage(text) {
    try {
      if (!text) {
        throw new Error('Text is required');
      }
      
      // Call Google Translate API for language detection
      const [result] = await translateClient.detect(text);
      
      // Handle multiple detections
      const detections = Array.isArray(result) ? result : [result];
      
      return {
        detectedLanguages: detections.map(detection => ({
          languageCode: detection.language,
          confidence: detection.confidence,
          isSupported: !!SUPPORTED_LANGUAGES[detection.language]
        })),
        primaryLanguage: detections[0].language,
        confidence: detections[0].confidence
      };
    } catch (error) {
      console.error('Error in detectLanguage:', error);
      throw error;
    }
  }

  /**
   * Translate text to another language
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language code
   * @param {string} sourceLanguage - Source language code (optional, will auto-detect if not provided)
   * @returns {Promise<Object>} Translation results
   */
  static async translateText(text, targetLanguage, sourceLanguage = '') {
    try {
      if (!text) {
        throw new Error('Text is required');
      }
      
      if (!targetLanguage) {
        throw new Error('Target language is required');
      }
      
      // Call Google Translate API
      const options = {
        to: targetLanguage
      };
      
      if (sourceLanguage) {
        options.from = sourceLanguage;
      }
      
      const [translation] = await translateClient.translate(text, options);
      
      // If source language was auto-detected, get it
      let detectedSourceLanguage = sourceLanguage;
      if (!sourceLanguage) {
        const [detection] = await translateClient.detect(text);
        detectedSourceLanguage = detection.language;
      }
      
      return {
        originalText: text,
        translatedText: translation,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in translateText:', error);
      throw error;
    }
  }
}

module.exports = GoogleSpeechService;