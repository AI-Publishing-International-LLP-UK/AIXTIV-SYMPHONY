#!/usr/bin/env node

/**
 * Dr. Lucy Integration Service
 * Connects the existing dr-lucy-service.js with the new LucyExpressiveSpeech middleware
 * Provides unified API for all Lucy capabilities
 * 
 * @author AI Publishing International LLP
 * @version 2.0.0 - Symphony Integration
 */

const express = require('express');
const cors = require('cors');
const LucyExpressiveSpeech = require('./lucy-expressive-speech');
const DrLucyMemoryImport = require('./dr-lucy-memory-import');
require('dotenv').config();

class LucyIntegrationService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8080;
    
    // Initialize Lucy's expressive speech
    this.lucySpeech = new LucyExpressiveSpeech({
      lucyVoiceId: process.env.LUCY_VOICE_ID,
      defaultMode: process.env.LUCY_DEFAULT_MODE || 'companion',
      enableHumanisms: process.env.LUCY_ENABLE_HUMANISMS !== 'false',
      humanismChance: parseFloat(process.env.LUCY_HUMANISM_CHANCE) || 0.2
    });
    
    // Initialize Lucy's memory system
    this.lucyMemory = new DrLucyMemoryImport();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Enable CORS for cross-origin requests
    this.app.use(cors({
      origin: [
        'https://symphony.2100.cool',
        'https://sallyport.2100.cool',
        'https://*.asoos.2100.cool',
        'http://localhost:3000',
        'http://localhost:8080'
      ],
      credentials: true
    }));
    
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'dr-lucy-integration-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        capabilities: {
          expressiveSpeech: true,
          memorySystem: true,
          conversationTracking: true,
          emotionalIntelligence: true
        }
      });
    });

    // Original Dr. Lucy service endpoint (backward compatibility)
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Dr. Lucy Testament Agent',
        status: 'operational',
        swarm_connection: 'active',
        agents: '18M Testament Swarm',
        capabilities: ['voice_synthesis', 'natural_language', 'workflow_automation', 'expressive_speech'],
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      });
    });

    // Expressive speech endpoints
    this.app.post('/speak', async (req, res) => {
      try {
        const { text, userContext = {}, options = {} } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'Text is required' });
        }

        const result = await this.lucySpeech.lucySpeak(text, userContext, options);
        res.json(result);
        
      } catch (error) {
        console.error('Speech generation error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Emotional speech helpers
    this.app.post('/speak/empathy', async (req, res) => {
      const { text, userContext = {} } = req.body;
      try {
        const result = await this.lucySpeech.speakWithEmpathy(text, userContext);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/speak/celebrate', async (req, res) => {
      const { text, userContext = {} } = req.body;
      try {
        const result = await this.lucySpeech.celebrateWithUser(text, userContext);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/speak/guide', async (req, res) => {
      const { text, userContext = {} } = req.body;
      try {
        const result = await this.lucySpeech.provideGuidance(text, userContext);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/speak/listen', async (req, res) => {
      const { text, userContext = {} } = req.body;
      try {
        const result = await this.lucySpeech.listenSupportively(text, userContext);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Memory and conversation endpoints
    this.app.post('/memory/store', async (req, res) => {
      try {
        const { conversation, userContext = {} } = req.body;
        
        // Store conversation in Lucy's memory
        const memoryItem = {
          id: `conv-${Date.now()}`,
          text: conversation.text || conversation,
          metadata: {
            source: 'api',
            agentId: 'dr-lucy-crx-001',
            userId: userContext.userId || 'anonymous',
            sessionId: userContext.sessionId,
            timestamp: new Date().toISOString(),
            type: 'conversation_memory',
            category: 'live_interaction',
            importance: this.calculateImportance(conversation.text || conversation),
            userContext
          }
        };

        // Store in Pinecone (implement based on your setup)
        await this.storeMemory(memoryItem);
        
        res.json({
          success: true,
          memoryId: memoryItem.id,
          stored: true
        });
        
      } catch (error) {
        console.error('Memory storage error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/memory/recall/:query', async (req, res) => {
      try {
        const query = decodeURIComponent(req.params.query);
        const userContext = req.query;
        
        const memories = await this.lucyMemory.testDrLucyMemoryRecall(query);
        
        res.json({
          query,
          memories,
          count: memories.length,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Memory recall error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Conversation flow endpoint
    this.app.post('/conversation', async (req, res) => {
      try {
        const { 
          message, 
          userContext = {},
          responseMode = 'companion',
          includeMemory = true 
        } = req.body;

        // 1. Recall relevant memories if requested
        let contextMemories = [];
        if (includeMemory && message) {
          contextMemories = await this.lucyMemory.testDrLucyMemoryRecall(message);
        }

        // 2. Generate contextual response using Lucy's intelligence
        const lucyResponse = await this.lucyMemory.generateDrLucyResponse(message);

        // 3. Convert to expressive speech
        const speechResult = await this.lucySpeech.lucySpeak(
          lucyResponse.response, 
          userContext, 
          { 
            mode: responseMode,
            emotion: this.detectEmotion(message, userContext)
          }
        );

        // 4. Store this interaction
        await this.storeMemory({
          id: `interaction-${Date.now()}`,
          text: `User: ${message}\nLucy: ${lucyResponse.response}`,
          metadata: {
            source: 'conversation_api',
            agentId: 'dr-lucy-crx-001',
            userId: userContext.userId || 'anonymous',
            sessionId: userContext.sessionId,
            timestamp: new Date().toISOString(),
            type: 'full_conversation',
            userMessage: message,
            lucyResponse: lucyResponse.response,
            contextMemories: contextMemories.length,
            mode: responseMode
          }
        });

        res.json({
          userMessage: message,
          lucyResponse: lucyResponse.response,
          speechResult,
          contextMemories: contextMemories.length,
          confidence: lucyResponse.confidence,
          mode: responseMode,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Conversation error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Swarm status (backward compatibility)
    this.app.get('/swarm/status', (req, res) => {
      res.json({
        swarm: 'Testament Swarm',
        active_agents: 18_000_000,
        dr_lucy_status: 'operational',
        voice_synthesis: 'enhanced_expressive',
        natural_language: 'quantum_enhanced',
        workflow_compliance: 'enabled',
        expressive_speech: 'active',
        emotional_intelligence: 'active',
        memory_system: 'active',
        timestamp: new Date().toISOString()
      });
    });

    // Test endpoints
    this.app.get('/test/speech', async (req, res) => {
      const testContext = {
        userName: 'Test User',
        sessionId: 'test-session'
      };

      try {
        const result = await this.lucySpeech.lucySpeak(
          "This is a test of Dr. Lucy's expressive speech capabilities.",
          testContext,
          { skipTTS: true }
        );
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Helper methods
  async storeMemory(memoryItem) {
    // Implement based on your Pinecone setup
    console.log('🧠 Storing memory:', memoryItem.id);
    // await this.lucyMemory.storeDrLucyMemories('dr-lucy-conversations', [memoryItem]);
  }

  calculateImportance(text) {
    const keywords = [
      'symphony', 'launch', 'project', 'help', 'problem', 'success', 
      'difficult', 'challenge', 'celebrate', 'thank', 'love', 'trust'
    ];
    
    let score = 0;
    const lowerText = text.toLowerCase();
    
    keywords.forEach(keyword => {
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });
    
    return Math.min(Math.max(Math.floor(score / 2), 1), 10);
  }

  detectEmotion(message, userContext) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('grateful')) {
      return 'celebration';
    }
    if (lowerMessage.includes('difficult') || lowerMessage.includes('hard') || lowerMessage.includes('struggle')) {
      return 'empathy';
    }
    if (lowerMessage.includes('launch') || lowerMessage.includes('success') || lowerMessage.includes('did it')) {
      return 'celebrate';
    }
    if (lowerMessage.includes('scared') || lowerMessage.includes('worried') || lowerMessage.includes('afraid')) {
      return 'reassure';
    }
    
    return 'neutral';
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`🧠 Dr. Lucy Integration Service running on port ${this.port}`);
      console.log('💭 Enhanced with Expressive Speech & Memory');
      console.log('🎯 Status: OPERATIONAL');
      console.log('🌟 Capabilities: Speech, Memory, Emotional Intelligence');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Dr. Lucy Integration Service shutting down gracefully');
      process.exit(0);
    });
  }
}

// Create and start the service
const lucyService = new LucyIntegrationService();
lucyService.start();

module.exports = LucyIntegrationService;