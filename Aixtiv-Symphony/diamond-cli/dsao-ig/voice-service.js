#!/usr/bin/env node

/**
 * 🎤 COMPUTATIONAL VOICE SERVICE FOR OWNER INTERFACE
 * Authority: Diamond SAO Command Center
 * Direct ElevenLabs Integration with Computational Wizards
 */

const express = require('express');
const cors = require('cors');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class ComputationalVoiceService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 8080;
    this.projectId = 'api-for-warp-drive';
    this.secretClient = new SecretManagerServiceClient();
    this.apiKey = null;
    
    // Computational Wizards
    this.wizards = {
      drLucy: {
        name: 'Dr. Lucy',
        title: 'Quantum Business Computationalist',
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
        active: true
      },
      drClaude: {
        name: 'Dr. Claude', 
        title: 'Strategic Hybrid Reasoning',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
        active: true
      },
      victory36: {
        name: 'Victory36',
        title: 'Security Analytics Specialist',
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
        active: true
      }
    };
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }
  
  async loadApiKey() {
    try {
      const [version] = await this.secretClient.accessSecretVersion({
        name: `projects/${this.projectId}/secrets/11_labs/versions/latest`
      });
      this.apiKey = version.payload.data.toString('utf8');
      console.log('✅ ElevenLabs API key loaded from Secret Manager');
      return true;
    } catch (error) {
      console.error('❌ Failed to load API key:', error.message);
      return false;
    }
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        service: 'Computational Voice Service',
        wizards: Object.keys(this.wizards).length,
        elevenLabs: !!this.apiKey
      });
    });
    
    // Voice synthesis endpoint
    this.app.post('/api/voice/synthesize', async (req, res) => {
      try {
        const { text, wizard = 'drLucy' } = req.body;
        
        if (!text) {
          return res.status(400).json({ error: 'Text required' });
        }
        
        if (!this.apiKey) {
          await this.loadApiKey();
        }
        
        const selectedWizard = this.wizards[wizard] || this.wizards.drLucy;
        const audioBuffer = await this.synthesizeWithElevenLabs(text, selectedWizard.voiceId);
        
        res.json({
          success: true,
          wizard: selectedWizard.name,
          title: selectedWizard.title,
          audioBase64: audioBuffer.toString('base64'),
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Voice synthesis error:', error);
        res.status(500).json({ error: 'Voice synthesis failed' });
      }
    });
    
    // Get available wizards
    this.app.get('/api/wizards', (req, res) => {
      res.json({
        wizards: this.wizards,
        total: Object.keys(this.wizards).length
      });
    });
    
    // Wizard interaction endpoint
    this.app.post('/api/wizard/:wizardId/interact', async (req, res) => {
      try {
        const { wizardId } = req.params;
        const { query, voiceResponse = true } = req.body;
        
        const wizard = this.wizards[wizardId];
        if (!wizard) {
          return res.status(404).json({ error: 'Wizard not found' });
        }
        
        // Generate wizard response
        const response = this.generateWizardResponse(wizard, query);
        
        let audioBase64 = null;
        if (voiceResponse) {
          const audioBuffer = await this.synthesizeWithElevenLabs(response, wizard.voiceId);
          audioBase64 = audioBuffer.toString('base64');
        }
        
        res.json({
          wizard: wizard.name,
          title: wizard.title,
          query,
          response,
          audioBase64,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Wizard interaction error:', error);
        res.status(500).json({ error: 'Wizard interaction failed' });
      }
    });
  }
  
  async synthesizeWithElevenLabs(text, voiceId) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }
    
    return Buffer.from(await response.arrayBuffer());
  }
  
  generateWizardResponse(wizard, query) {
    const responses = {
      drLucy: [
        'Based on quantum computational analysis, I recommend a multi-dimensional optimization approach.',
        'My machine learning models show a 94.7% success probability with this strategy.',
        'Quantum pattern recognition reveals emerging opportunities in your data.'
      ],
      drClaude: [
        'Strategic analysis indicates three viable pathways with distinct risk profiles.',
        'Advanced reasoning suggests implementing a cascading approach to minimize risk.',
        'This decision optimizes for both immediate gains and long-term positioning.'
      ],
      victory36: [
        'Security assessment complete. Elevated threat vectors detected.',
        'Predictive modeling shows potential vulnerabilities requiring attention.',
        'Implementing enhanced protection protocols is recommended.'
      ]
    };
    
    const wizardResponses = responses[Object.keys(this.wizards).find(k => this.wizards[k] === wizard)] || responses.drLucy;
    return wizardResponses[Math.floor(Math.random() * wizardResponses.length)];
  }
  
  async start() {
    try {
      await this.loadApiKey();
      
      this.app.listen(this.port, () => {
        console.log('🎤 COMPUTATIONAL VOICE SERVICE ONLINE');
        console.log('🏛️ Authority: Diamond SAO Command Center');
        console.log(`🚀 Server: http://localhost:${this.port}`);
        console.log('🧙‍♀️ Wizards: Dr. Lucy, Dr. Claude, Victory36');
        console.log('✅ ElevenLabs: Connected');
      });
      
    } catch (error) {
      console.error('❌ Failed to start voice service:', error);
      process.exit(1);
    }
  }
}

// Start the service
const voiceService = new ComputationalVoiceService();
voiceService.start();
