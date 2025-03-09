import textToSpeech from '@google-cloud/text-to-speech';
import { Storage } from '@google-cloud/storage';
const client = new textToSpeech.TextToSpeechClient();
const storage = new Storage();

/**
 * Service to handle Text-to-Speech functionality
 */
class TTSService {
  constructor() {
    this.bucketName = process.env.STORAGE_BUCKET || 'api-for-warp-drive.appspot.com'; // Your default Firebase Storage bucket
  }

  /**
   * Convert text to speech and store in Firebase Storage
   * @param {string} text - The text to convert to speech
   * @param {Object} options - Options for the TTS conversion
   * @returns {Promise<Object>} - Object containing the URL of the audio file
   */
  async textToSpeech(text, options = {}) {
    try {
      // Default TTS request options
      const request = {
        input: { text },
        voice: options.voice || {
          languageCode: 'en-US',
          ssmlGender: 'NEUTRAL',
          name: 'en-US-Neural2-F'
        },
        audioConfig: options.audioConfig || {
          audioEncoding: 'MP3'
        }
      };

      // Perform the text-to-speech request
      const [response] = await client.synthesizeSpeech(request);

      // Generate a unique filename
      const fileName = `tts-${Date.now()}.mp3`;
      const filePath = options.storagePath ? `${options.storagePath}/${fileName}` : `tts/${fileName}`;

      // Upload to Firebase Storage
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);
      await file.save(response.audioContent, {
        metadata: {
          contentType: 'audio/mp3'
        }
      });

      // Make file publicly accessible
      await file.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;

      return {
        success: true,
        audioUrl: publicUrl,
        fileName,
        filePath
      };
    } catch (error) {
      console.error('TTS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List available voices
   * @param {string} languageCode - Language code for which to list voices
   * @returns {Promise<Object>} - Object containing the list of available voices
   */
  async listVoices(languageCode = 'en-US') {
    try {
      const [response] = await client.listVoices({ languageCode });
      return {
        success: true,
        voices: response.voices
      };
    } catch (error) {
      console.error('Error listing voices:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert SSML text to speech and store in Firebase Storage
   * @param {string} ssml - The SSML text to convert to speech
   * @param {Object} options - Options for the TTS conversion
   * @returns {Promise<Object>} - Object containing the URL of the audio file
   */
  async ssmlToSpeech(ssml, options = {}) {
    try {
      // Default TTS request options with SSML input
      const request = {
        input: { ssml },
        voice: options.voice || {
          languageCode: 'en-US',
          ssmlGender: 'NEUTRAL',
          name: 'en-US-Neural2-F'
        },
        audioConfig: options.audioConfig || {
          audioEncoding: 'MP3'
        }
      };

      // The rest of the process is the same as textToSpeech
      const [response] = await client.synthesizeSpeech(request);

      const fileName = `tts-ssml-${Date.now()}.mp3`;
      const filePath = options.storagePath ? `${options.storagePath}/${fileName}` : `tts/${fileName}`;

      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(filePath);
      await file.save(response.audioContent, {
        metadata: {
          contentType: 'audio/mp3'
        }
      });

      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;

      return {
        success: true,
        audioUrl: publicUrl,
        fileName,
        filePath
      };
    } catch (error) {
      console.error('SSML TTS error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new TTSService();
