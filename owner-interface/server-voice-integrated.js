#!/usr/bin/env node

/**
 * 💎 MOCOA OWNER INTERFACE SERVER WITH ELEVENLABS VOICE INTEGRATION
 * 
 * Sacred Mission: Complete server implementation with ElevenLabs voice capabilities
 * Authority: Mr. Phillip Corey Roark (0000001) - Diamond SAO Exclusive
 * Integration: MOCOA + ElevenLabs + Voice Generation + API endpoints
 * 
 * @classification DIAMOND_SAO_COMMAND_CENTER
 * @date 2025-08-30
 * @author Victory36 + Diamond SAO Operational Center
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import ElevenLabsManager from './elevenlabs-manager.js';
import OwnerInterfaceVoiceIntegration from './owner-interface-voice-integration.js';
import { initializeRIXAgents } from './elevenlabs-conversational-agents-enhanced.js';
import fs from 'fs/promises';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize Voice Integration Components
let elevenLabsManager;
let voiceIntegration;
let rixAgents = null;

// Application configuration
const config = {
  port: process.env.PORT || 8080,
  projectId: process.env.GCP_PROJECT_ID || 'api-for-warp-drive',
  environment: process.env.NODE_ENV || 'development',
  diamondSAO: {
    id: '0000001',
    name: 'Mr. Phillip Corey Roark',
    authority: 'Diamond SAO Command Center'
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.elevenlabs.io", "https://*.googleapis.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
    },
  },
}));

// CORS configuration for voice API access
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'https://*.2100.cool'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static('.'));
app.use('/audio', express.static(path.join(__dirname, 'owner-interface-audio')));
app.use('/voice-responses', express.static(path.join(__dirname, 'voice-responses')));

/**
 * Initialize ElevenLabs and Voice Integration Systems
 */
async function initializeVoiceIntegration() {
  try {
    console.log('🎤 Initializing ElevenLabs Voice Integration...');
    
    // Initialize ElevenLabs Manager
    elevenLabsManager = new ElevenLabsManager();
    await elevenLabsManager.initializeClient();
    
    // Initialize Owner Interface Voice Integration
    voiceIntegration = new OwnerInterfaceVoiceIntegration();
    await voiceIntegration.initialize();
    
    console.log('✅ ElevenLabs Voice Integration initialized successfully');
    
    // Initialize RIX Agents (optional - may fail if API limits exceeded)
    try {
      console.log('🤖 Initializing RIX Conversational Agents...');
      rixAgents = await initializeRIXAgents();
      console.log('✅ RIX Agents initialized successfully');
    } catch (error) {
      console.warn('⚠️  RIX Agents initialization failed:', error.message);
      console.warn('   Voice generation will still work, but conversational agents won\'t be available');
    }
    
  } catch (error) {
    console.error('❌ Voice Integration initialization failed:', error.message);
    console.error('   Server will continue but voice features may not work properly');
  }
}

// =================================================================================
// HEALTH AND STATUS ENDPOINTS
// =================================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mocoa-current.html'));
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mocoa-owner-interface-voice-integrated',
    voice_integration: elevenLabsManager?.initialized || false,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/status', (req, res) => {
  res.json({
    status: 'operational',
    authority: config.diamondSAO.name,
    voice_integration: {
      elevenlabs_initialized: elevenLabsManager?.initialized || false,
      voice_integration_ready: voiceIntegration !== undefined,
      rix_agents_available: rixAgents !== null
    },
    environment: config.environment,
    timestamp: new Date().toISOString()
  });
});

// =================================================================================
// ELEVENLABS VOICE API ENDPOINTS
// =================================================================================

/**
 * Generate voice using ElevenLabs TTS
 */
app.post('/api/elevenlabs/generate-voice', async (req, res) => {
  try {
    const { text, voiceType, options } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
        message: 'Please provide text to convert to speech'
      });
    }
    
    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long',
        message: 'Text must be 5000 characters or less'
      });
    }
    
    if (!elevenLabsManager?.initialized) {
      return res.status(503).json({
        success: false,
        error: 'Voice service unavailable',
        message: 'ElevenLabs integration is not properly initialized'
      });
    }
    
    console.log(`🎤 Voice generation request: ${voiceType || 'default'} voice, ${text.length} chars`);
    
    let voiceResult;
    switch (voiceType?.toLowerCase()) {
      case 'diamond':
      case 'sao':
        voiceResult = await elevenLabsManager.generateDiamondSAOVoice(text, options);
        break;
      case 'moca':
      case 'mocoa':
        voiceResult = await elevenLabsManager.generateMocaVoice(text, options);
        break;
      default:
        voiceResult = await elevenLabsManager.generateOwnerInterfaceVoice(text, options);
        break;
    }
    
    // Convert audio buffer to base64 for transmission
    const audioBase64 = voiceResult.audioBuffer.toString('base64');
    
    res.json({
      success: true,
      text: voiceResult.text,
      voiceId: voiceResult.voiceId,
      audioBase64: audioBase64,
      audioSize: voiceResult.audioBuffer.length,
      settings: voiceResult.settings,
      authority: voiceResult.authority,
      timestamp: voiceResult.timestamp
    });
    
  } catch (error) {
    console.error('❌ Voice generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Voice generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Generate voice for specific owner interface actions
 */
app.post('/api/voice/interface-action', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required',
        message: 'Please specify the interface action'
      });
    }
    
    if (!voiceIntegration) {
      return res.status(503).json({
        success: false,
        error: 'Voice integration unavailable',
        message: 'Owner interface voice integration is not initialized'
      });
    }
    
    console.log(`🖥️ Interface action voice request: ${action}`);
    
    const result = await voiceIntegration.generateCustomInterfaceResponse(action, data);
    
    // Convert audio buffer to base64
    const audioBase64 = result.audioBuffer.toString('base64');
    
    res.json({
      success: true,
      action: result.action,
      data: result.data,
      filename: result.filename,
      audioBase64: audioBase64,
      audioSize: result.audioBuffer.length,
      timestamp: result.timestamp,
      authority: result.authority
    });
    
  } catch (error) {
    console.error('❌ Interface action voice error:', error);
    res.status(500).json({
      success: false,
      error: 'Interface voice generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get pre-generated interface messages
 */
app.get('/api/voice/interface-messages', async (req, res) => {
  try {
    if (!voiceIntegration) {
      return res.status(503).json({
        success: false,
        error: 'Voice integration unavailable'
      });
    }
    
    const status = await voiceIntegration.getInterfaceVoiceStatus();
    
    res.json({
      success: true,
      preGeneratedMessages: status.preGeneratedMessages,
      audioStats: status.audioStats,
      initialized: status.initialized,
      authority: status.authority,
      timestamp: status.timestamp
    });
    
  } catch (error) {
    console.error('❌ Interface messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve interface messages',
      message: error.message
    });
  }
});

/**
 * Play specific pre-generated interface message
 */
app.post('/api/voice/play-message', async (req, res) => {
  try {
    const { messageKey, data } = req.body;
    
    if (!messageKey) {
      return res.status(400).json({
        success: false,
        error: 'Message key is required'
      });
    }
    
    if (!voiceIntegration) {
      return res.status(503).json({
        success: false,
        error: 'Voice integration unavailable'
      });
    }
    
    const result = await voiceIntegration.getVoiceResponseForWeb(messageKey, data);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Play message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to play message',
      message: error.message
    });
  }
});

/**
 * Get available ElevenLabs voices
 */
app.get('/api/elevenlabs/voices', async (req, res) => {
  try {
    if (!elevenLabsManager?.initialized) {
      return res.status(503).json({
        success: false,
        error: 'ElevenLabs service unavailable'
      });
    }
    
    const result = await elevenLabsManager.getAvailableVoices();
    res.json(result);
    
  } catch (error) {
    console.error('❌ Voices retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voices',
      message: error.message
    });
  }
});

/**
 * Get ElevenLabs service status
 */
app.get('/api/elevenlabs/status', async (req, res) => {
  try {
    if (!elevenLabsManager) {
      return res.status(503).json({
        success: false,
        error: 'ElevenLabs manager not initialized'
      });
    }
    
    const status = await elevenLabsManager.getElevenLabsStatus();
    res.json(status);
    
  } catch (error) {
    console.error('❌ ElevenLabs status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ElevenLabs status',
      message: error.message
    });
  }
});

// =================================================================================
// RIX CONVERSATIONAL AGENTS ENDPOINTS
// =================================================================================

/**
 * Get available RIX agents
 */
app.get('/api/rix/agents', (req, res) => {
  if (!rixAgents) {
    return res.status(503).json({
      success: false,
      error: 'RIX agents unavailable',
      message: 'Conversational agents are not initialized'
    });
  }
  
  res.json({
    success: true,
    agents: rixAgents,
    total_agents: Object.keys(rixAgents).length,
    timestamp: new Date().toISOString()
  });
});

/**
 * Create conversation session with RIX agent
 */
app.post('/api/rix/conversation/create', async (req, res) => {
  try {
    const { agentType } = req.body;
    
    if (!rixAgents || !rixAgents[agentType]) {
      return res.status(404).json({
        success: false,
        error: 'Agent not available',
        message: `RIX agent '${agentType}' is not available`,
        available_agents: rixAgents ? Object.keys(rixAgents) : []
      });
    }
    
    // In a real implementation, you would create a conversation session
    // For now, we'll return the agent info
    const agent = rixAgents[agentType];
    
    res.json({
      success: true,
      conversation_id: `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      agent: agent,
      message: `Conversation session created with ${agent.name}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ RIX conversation creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
      message: error.message
    });
  }
});

// =================================================================================
// UTILITY ENDPOINTS
// =================================================================================

/**
 * Cleanup old audio files
 */
app.post('/api/voice/cleanup', async (req, res) => {
  try {
    if (!voiceIntegration) {
      return res.status(503).json({
        success: false,
        error: 'Voice integration unavailable'
      });
    }
    
    const cleanedCount = await voiceIntegration.cleanupOldAudioFiles();
    
    res.json({
      success: true,
      cleaned_files: cleanedCount,
      message: `Cleaned up ${cleanedCount} old audio files`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

/**
 * Get voice configuration
 */
app.get('/api/voice/config', (req, res) => {
  if (!elevenLabsManager) {
    return res.status(503).json({
      success: false,
      error: 'Voice service unavailable'
    });
  }
  
  res.json({
    success: true,
    voiceConfig: elevenLabsManager.voiceConfig,
    integrations: elevenLabsManager.integrations,
    authority: config.diamondSAO.name,
    timestamp: new Date().toISOString()
  });
});

// =================================================================================
// ERROR HANDLING MIDDLEWARE
// =================================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    path: req.path,
    method: req.method,
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

// =================================================================================
// SERVER STARTUP
// =================================================================================

async function startServer() {
  try {
    console.log('🚀 Starting MOCOA Owner Interface with ElevenLabs Voice Integration...');
    console.log(`🏛️  Authority: ${config.diamondSAO.name} (${config.diamondSAO.id})`);
    console.log(`🌍 Environment: ${config.environment}`);
    console.log(`📡 GCP Project: ${config.projectId}`);
    
    // Initialize voice integration
    await initializeVoiceIntegration();
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('✅ SERVER READY');
      console.log('═══════════════════════════════════════════════');
      console.log(`🌐 Server running on port ${config.port}`);
      console.log(`🎤 ElevenLabs Voice Integration: ${elevenLabsManager?.initialized ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`🖥️  Owner Interface Voice: ${voiceIntegration ? 'READY' : 'UNAVAILABLE'}`);
      console.log(`🤖 RIX Conversational Agents: ${rixAgents ? 'AVAILABLE' : 'UNAVAILABLE'}`);
      console.log('');
      console.log('🎯 API Endpoints:');
      console.log('   POST /api/elevenlabs/generate-voice - Generate voice with TTS');
      console.log('   POST /api/voice/interface-action - Generate interface action voice');
      console.log('   POST /api/voice/play-message - Play pre-generated message');
      console.log('   GET  /api/elevenlabs/voices - Get available voices');
      console.log('   GET  /api/elevenlabs/status - ElevenLabs service status');
      console.log('   GET  /api/rix/agents - Available RIX agents');
      console.log('   POST /api/rix/conversation/create - Create RIX conversation');
      console.log('');
      console.log(`🔷 Ready to serve Diamond SAO Command Center`);
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
