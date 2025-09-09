#!/usr/bin/env node

/**
 * 💎 OAUTH2 ELEVENLABS ENTERPRISE SERVER
 * 
 * Sacred Mission: Complete OAuth2-secured voice and AI server implementation
 * Authority: Mr. Phillip Corey Roark (0000001) - Diamond SAO Exclusive
 * Server: OAuth2 + ElevenLabs Complete Suite + Enterprise Security + Real-time APIs
 * 
 * @classification DIAMOND_SAO_COMMAND_CENTER
 * @date 2025-09-03
 * @author Victory36 + Diamond SAO Operational Center
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import multer from 'multer';
import { OAuth2ElevenLabsEnterprise, ElevenLabsServiceLayer } from './oauth2-elevenlabs-enterprise-integration.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize OAuth2 ElevenLabs Enterprise System
const oauth2System = new OAuth2ElevenLabsEnterprise();
const elevenLabsServices = new ElevenLabsServiceLayer(oauth2System);

// Configuration
const config = {
  port: process.env.PORT || 8080,
  environment: process.env.NODE_ENV || 'development',
  projectId: process.env.GCP_PROJECT_ID || 'api-for-warp-drive'
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'https://api.elevenlabs.io', 'wss://api.elevenlabs.io', 'https://*.googleapis.com'],
      mediaSrc: ['\'self\'', 'blob:', 'data:'],
    },
  },
}));

// CORS configuration for OAuth2 and voice APIs
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080', 
      'https://mocoa.api-for-warp-drive.com',
      'https://auth.api-for-warp-drive.com',
      /\.2100\.cool$/,
      /\.api-for-warp-drive\.com$/
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return origin === allowed;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload handling for audio/video
const upload = multer({ 
  dest: '/tmp/uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5
  }
});

// OAuth2 middleware
const requireAuth = oauth2System.createOAuth2Middleware();

// Static file serving
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/audio', express.static(path.join(__dirname, 'audio-output')));

/**
 * =================================================================================
 * OAUTH2 AUTHENTICATION ENDPOINTS
 * =================================================================================
 */

/**
 * Initiate OAuth2 authorization
 */
app.get('/auth/login', (req, res) => {
  try {
    const { authUrl, state } = oauth2System.generateAuthorizationUrl();
    
    res.json({
      success: true,
      authorization_url: authUrl,
      state: state,
      scopes: oauth2System.oauth2Config.scopes,
      message: 'Redirect user to authorization_url to begin OAuth2 flow'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'OAuth2 initialization failed',
      message: error.message
    });
  }
});

/**
 * OAuth2 callback endpoint
 */
app.get('/auth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'OAuth2 authorization failed',
        message: error,
        error_description: req.query.error_description
      });
    }
    
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or state parameter'
      });
    }
    
    // Exchange code for token
    const { userId, tokenInfo } = await oauth2System.exchangeCodeForToken(code, state);
    
    res.json({
      success: true,
      message: 'OAuth2 authentication successful',
      user: {
        id: userId,
        authority: tokenInfo.authority,
        scopes: tokenInfo.scopes,
        expires_at: new Date(tokenInfo.expiresAt).toISOString()
      },
      access_token: tokenInfo.accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor((tokenInfo.expiresAt - Date.now()) / 1000)
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'OAuth2 callback failed',
      message: error.message
    });
  }
});

/**
 * Get current user information
 */
app.get('/auth/user', requireAuth, (req, res) => {
  const clientInfo = oauth2System.elevenLabsClients.get(req.user.userId);
  
  res.json({
    success: true,
    user: {
      id: req.user.userId,
      authority: req.user.authority,
      scopes: req.user.scopes
    },
    elevenlabs_client: {
      initialized: !!clientInfo,
      authority: clientInfo?.authority,
      base_url: clientInfo?.config?.baseUrl
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Logout and revoke tokens
 */
app.post('/auth/logout', requireAuth, (req, res) => {
  const userId = req.user.userId;
  
  // Clean up user session
  oauth2System.tokenStore.delete(userId);
  oauth2System.elevenLabsClients.delete(userId);
  
  res.json({
    success: true,
    message: 'User logged out successfully',
    timestamp: new Date().toISOString()
  });
});

/**
 * =================================================================================
 * TEXT-TO-SPEECH ENDPOINTS
 * =================================================================================
 */

/**
 * Generate speech from text
 */
app.post('/api/tts/generate', 
  requireAuth, 
  oauth2System.requireScope('elevenlabs:tts'),
  async (req, res) => {
    try {
      const { text, voiceId, model, voice_settings } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required'
        });
      }
      
      if (text.length > 5000) {
        return res.status(400).json({
          success: false,
          error: 'Text too long',
          message: 'Text must be 5000 characters or less'
        });
      }
      
      const options = {
        voiceId: voiceId,
        model: model,
        ...voice_settings
      };
      
      const result = await elevenLabsServices.generateSpeech(req.user.userId, text, options);
      
      // Convert audio buffer to base64 for transmission
      const audioBase64 = result.audioBuffer.toString('base64');
      
      res.json({
        success: true,
        text: result.text,
        voice_id: result.voiceId,
        model: result.model,
        audio_base64: audioBase64,
        audio_size: result.size,
        timestamp: result.timestamp,
        user_authority: req.user.authority
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'TTS generation failed',
        message: error.message
      });
    }
  }
);

/**
 * Get available voices
 */
app.get('/api/tts/voices', 
  requireAuth, 
  oauth2System.requireScope('elevenlabs:tts'),
  async (req, res) => {
    try {
      const { client, authority } = oauth2System.getUserElevenLabsClient(req.user.userId);
      
      // Return configured voices based on authority level
      const voiceConfig = {
        default: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Professional female voice' },
        owner_interface: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Authoritative male voice' },
        moca: { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Warm and engaging voice' },
        diamond_sao: { id: 'VR6AewLTigWG4xSOukaG', name: 'Josh', description: 'Diamond SAO authority voice' }
      };
      
      // Diamond SAO gets access to all voices
      const availableVoices = authority === 'Diamond SAO' ? voiceConfig : {
        default: voiceConfig.default,
        moca: voiceConfig.moca
      };
      
      res.json({
        success: true,
        voices: Object.values(availableVoices),
        configured_voices: availableVoices,
        user_authority: authority,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve voices',
        message: error.message
      });
    }
  }
);

/**
 * =================================================================================
 * SPEECH-TO-TEXT ENDPOINTS
 * =================================================================================
 */

/**
 * Transcribe audio to text
 */
app.post('/api/stt/transcribe',
  requireAuth,
  oauth2System.requireScope('elevenlabs:speech_to_text'),
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Audio file is required'
        });
      }
      
      const audioBuffer = await fs.readFile(req.file.path);
      const options = {
        language: req.body.language || 'auto',
        model: req.body.model || 'scribe_v1'
      };
      
      const result = await elevenLabsServices.transcribeAudio(req.user.userId, audioBuffer, options);
      
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      
      res.json({
        success: true,
        transcript: result.transcript,
        language: result.language,
        confidence: result.confidence,
        file_info: {
          original_name: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        timestamp: result.timestamp
      });
      
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      res.status(500).json({
        success: false,
        error: 'Transcription failed',
        message: error.message
      });
    }
  }
);

/**
 * =================================================================================
 * VOICE CHANGER ENDPOINTS
 * =================================================================================
 */

/**
 * Change voice in audio
 */
app.post('/api/voice-changer/convert',
  requireAuth,
  oauth2System.requireScope('elevenlabs:voice_changer'),
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Audio file is required'
        });
      }
      
      const { target_voice_id } = req.body;
      if (!target_voice_id) {
        return res.status(400).json({
          success: false,
          error: 'Target voice ID is required'
        });
      }
      
      const audioBuffer = await fs.readFile(req.file.path);
      const result = await elevenLabsServices.changeVoice(req.user.userId, audioBuffer, target_voice_id);
      
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      
      const audioBase64 = result.audioBuffer.toString('base64');
      
      res.json({
        success: true,
        original_voice: result.originalVoice,
        target_voice: result.targetVoice,
        audio_base64: audioBase64,
        timestamp: result.timestamp
      });
      
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      res.status(500).json({
        success: false,
        error: 'Voice change failed',
        message: error.message
      });
    }
  }
);

/**
 * =================================================================================
 * SOUND EFFECTS ENDPOINTS
 * =================================================================================
 */

/**
 * Generate sound effects
 */
app.post('/api/sound-effects/generate',
  requireAuth,
  oauth2System.requireScope('elevenlabs:sound_effects'),
  async (req, res) => {
    try {
      const { prompt, duration } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Sound effect prompt is required'
        });
      }
      
      const options = { duration: duration || 'auto' };
      const result = await elevenLabsServices.generateSoundEffect(req.user.userId, prompt, options);
      
      res.json({
        success: true,
        prompt: result.prompt,
        duration: result.duration,
        effects_generated: result.effects.length,
        timestamp: result.timestamp
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Sound effect generation failed',
        message: error.message
      });
    }
  }
);

/**
 * =================================================================================
 * MUSIC GENERATION ENDPOINTS  
 * =================================================================================
 */

/**
 * Generate music
 */
app.post('/api/music/generate',
  requireAuth,
  oauth2System.requireScope('elevenlabs:music'),
  async (req, res) => {
    try {
      const { prompt, duration, genre, instrumental } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: 'Music prompt is required'
        });
      }
      
      const options = {
        duration: duration || 'auto',
        genre: genre,
        instrumental: instrumental || false
      };
      
      const result = await elevenLabsServices.generateMusic(req.user.userId, prompt, options);
      
      res.json({
        success: true,
        prompt: result.prompt,
        duration: result.duration,
        genre: result.genre,
        instrumental: result.instrumental,
        timestamp: result.timestamp
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Music generation failed',
        message: error.message
      });
    }
  }
);

/**
 * =================================================================================
 * REAL-TIME STREAMING ENDPOINTS
 * =================================================================================
 */

/**
 * Create WebSocket streaming connection
 */
app.post('/api/streaming/create',
  requireAuth,
  oauth2System.requireScope('elevenlabs:streaming'),
  async (req, res) => {
    try {
      const { voice_id, model } = req.body;
      
      const options = {
        voiceId: voice_id,
        model: model || 'eleven_flash_v2_5'
      };
      
      const connection = elevenLabsServices.createStreamingConnection(req.user.userId, options);
      
      res.json({
        success: true,
        connection_id: connection.connectionId,
        voice_id: connection.voiceId,
        model: connection.model,
        websocket_ready: true,
        user_authority: req.user.authority,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Streaming connection failed',
        message: error.message
      });
    }
  }
);

/**
 * =================================================================================
 * SYSTEM STATUS AND MANAGEMENT ENDPOINTS
 * =================================================================================
 */

/**
 * System health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'OAuth2 ElevenLabs Enterprise Server',
    version: oauth2System.version,
    environment: config.environment,
    timestamp: new Date().toISOString()
  });
});

/**
 * System status (requires authentication)
 */
app.get('/api/system/status', requireAuth, (req, res) => {
  const status = oauth2System.getSystemStatus();
  res.json(status);
});

/**
 * Diamond SAO administrative status (requires Diamond SAO authority)
 */
app.get('/api/admin/status',
  requireAuth,
  oauth2System.requireScope('diamond_sao:maximum_authority'),
  (req, res) => {
    const status = oauth2System.getSystemStatus();
    
    res.json({
      ...status,
      administrative_access: true,
      diamond_sao_authority: req.user.authority,
      detailed_metrics: {
        active_sessions_detail: Array.from(oauth2System.activeSessions.values()),
        active_tokens_detail: Array.from(oauth2System.tokenStore.values()).map(token => ({
          userId: token.userId,
          authority: token.authority,
          scopes: token.scopes,
          created: new Date(token.created).toISOString(),
          expires: new Date(token.expiresAt).toISOString()
        })),
        websocket_connections: oauth2System.wsConnections.size
      }
    });
  }
);

/**
 * =================================================================================
 * INTERFACE SERVING
 * =================================================================================
 */

// Serve main MOCOA interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mocoa-current.html'));
});

// Serve other interface variants
app.get('/live', (req, res) => {
  res.sendFile(path.join(__dirname, 'live-interface.html'));
});

app.get('/quantum', (req, res) => {
  res.sendFile(path.join(__dirname, 'quantum-dashboard.html'));
});

/**
 * =================================================================================
 * ERROR HANDLING MIDDLEWARE
 * =================================================================================
 */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /auth/login',
      'GET /auth/callback', 
      'GET /auth/user',
      'POST /auth/logout',
      'POST /api/tts/generate',
      'GET /api/tts/voices',
      'POST /api/stt/transcribe',
      'POST /api/voice-changer/convert',
      'POST /api/sound-effects/generate',
      'POST /api/music/generate',
      'POST /api/streaming/create',
      'GET /health',
      'GET /api/system/status'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: config.environment === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

/**
 * =================================================================================
 * SERVER STARTUP
 * =================================================================================
 */

async function startServer() {
  try {
    console.log('🚀 Starting OAuth2 ElevenLabs Enterprise Server...');
    console.log(`🏛️  Authority: ${oauth2System.diamondSAO.name} (${oauth2System.diamondSAO.id})`);
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`📡 GCP Project: ${config.projectId}`);
    
    // Initialize OAuth2 system
    await oauth2System.initialize();
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('✅ SERVER READY');
      console.log('═══════════════════════════════════════════════');
      console.log(`🌐 Server running on port ${config.port}`);
      console.log('🔐 OAuth2 Authentication: ACTIVE');
      console.log('🎤 ElevenLabs Integration: COMPLETE SUITE');
      console.log('🛡️  Enterprise Security: MAXIMUM');
      console.log('');
      console.log('🎯 OAuth2 Flow:');
      console.log('   1. GET /auth/login - Get authorization URL');
      console.log('   2. Redirect user to authorization URL');
      console.log('   3. User authorizes and returns to callback');
      console.log('   4. Include Bearer token in API requests');
      console.log('');
      console.log('🎤 ElevenLabs Capabilities:');
      console.log('   ✅ Text-to-Speech (TTS)');
      console.log('   ✅ Speech-to-Text (STT)');
      console.log('   ✅ Voice Changer');
      console.log('   ✅ Sound Effects');
      console.log('   ✅ Music Generation');
      console.log('   ✅ Real-time Streaming');
      console.log('   ✅ Enterprise Security');
      console.log('');
      console.log('🔷 Ready to serve Diamond SAO Command Center');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('💥 Critical startup error:', error);
  process.exit(1);
});

export default app;
