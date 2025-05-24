/**
 * REST API routes for Speech Services
 * Provides endpoints for text-to-speech, speech-to-text, and language capabilities
 * to support the multilingual voice features in the ASOOS UI
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import GoogleSpeechService from './google-speech-service';
import { 
  authenticateRequest, 
  requirePermissions 
} from '../auth/oauth2-middleware';

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `speech-upload-${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed') as any);
    }
  }
});

/**
 * @route   GET /api/speech/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', async (req, res) => {
  try {
    const languages = GoogleSpeechService.getSupportedLanguages();
    res.json({
      success: true,
      languages
    });
  } catch (error) {
    console.error('Error getting supported languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/speech/voices/:languageCode
 * @desc    Get voices for a language
 * @access  Public
 */
router.get('/voices/:languageCode', async (req, res) => {
  try {
    const { languageCode } = req.params;
    const voices = GoogleSpeechService.getVoicesForLanguage(languageCode);
    
    res.json({
      success: true,
      languageCode,
      voices
    });
  } catch (error) {
    console.error(`Error getting voices for language ${req.params.languageCode}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/speech/tts
 * @desc    Text-to-Speech endpoint
 * @access  Private (requires api.speech.write scope)
 */
router.post('/tts', requirePermissions.speech.write, async (req, res) => {
  try {
    const { text, languageCode, voiceType } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const result = await GoogleSpeechService.textToSpeech(
      text,
      languageCode || 'en-US',
      voiceType || 'FEMALE'
    );
    
    // Serve the audio file
    res.setHeader('Content-Type', 'audio/mp3');
    res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
    
    // Read the file and send it
    const audioContent = await promisify(fs.readFile)(result.audioFile);
    res.send(audioContent);
    
    // Clean up temporary file
    await promisify(fs.unlink)(result.audioFile).catch(() => {});
    
  } catch (error) {
    console.error('Error in text-to-speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert text to speech',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/speech/tts/base64
 * @desc    Text-to-Speech endpoint (base64 return)
 * @access  Private (requires api.speech.write scope)
 */
router.post('/tts/base64', requirePermissions.speech.write, async (req, res) => {
  try {
    const { text, languageCode, voiceType } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const result = await GoogleSpeechService.textToSpeech(
      text,
      languageCode || 'en-US',
      voiceType || 'FEMALE'
    );
    
    // Return base64 audio and metadata
    res.json({
      success: true,
      audioContent: result.audioContent, // Base64 encoded audio
      metadata: result.metadata
    });
    
    // Clean up temporary file
    await promisify(fs.unlink)(result.audioFile).catch(() => {});
    
  } catch (error) {
    console.error('Error in text-to-speech (base64):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert text to speech',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/speech/stt/upload
 * @desc    Speech-to-Text endpoint (file upload)
 * @access  Private (requires api.speech.write scope)
 */
router.post('/stt/upload', requirePermissions.speech.write, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required'
      });
    }
    
    const { languageCode } = req.body;
    const audioBuffer = await promisify(fs.readFile)(req.file.path);
    
    const result = await GoogleSpeechService.speechToText(
      audioBuffer,
      languageCode || 'en-US',
      {
        encoding: req.body.encoding,
        sampleRateHertz: parseInt(req.body.sampleRate, 10) || 16000
      }
    );
    
    res.json({
      success: true,
      transcription: result.transcription,
      confidence: result.confidence,
      metadata: result.metadata
    });
    
    // Clean up temporary file
    await promisify(fs.unlink)(req.file.path).catch(() => {});
    
  } catch (error) {
    console.error('Error in speech-to-text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert speech to text',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/speech/stt/base64
 * @desc    Speech-to-Text endpoint (base64 audio)
 * @access  Private (requires api.speech.write scope)
 */
router.post('/stt/base64', requirePermissions.speech.write, async (req, res) => {
  try {
    const { audio, languageCode, encoding, sampleRate } = req.body;
    
    if (!audio) {
      return res.status(400).json({
        success: false,
        error: 'Base64 audio content is required'
      });
    }
    
    const result = await GoogleSpeechService.speechToText(
      audio, // Base64 encoded audio
      languageCode || 'en-US',
      {
        encoding: encoding || 'LINEAR16',
        sampleRateHertz: parseInt(sampleRate as string, 10) || 16000
      }
    );
    
    res.json({
      success: true,
      transcription: result.transcription,
      confidence: result.confidence,
      metadata: result.metadata
    });
    
  } catch (error) {
    console.error('Error in speech-to-text (base64):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert speech to text',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/speech/detect-language
 * @desc    Detect language endpoint
 * @access  Private (requires api.speech.read scope)
 */
router.post('/detect-language', requirePermissions.speech.read, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    const result = await GoogleSpeechService.detectLanguage(text);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error in language detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect language',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/speech/translate
 * @desc    Translate text endpoint
 * @access  Private (requires api.speech.write scope)
 */
router.post('/translate', requirePermissions.speech.write, async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Target language is required'
      });
    }
    
    const result = await GoogleSpeechService.translateText(
      text,
      targetLanguage,
      sourceLanguage || ''
    );
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error in translation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate text',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;