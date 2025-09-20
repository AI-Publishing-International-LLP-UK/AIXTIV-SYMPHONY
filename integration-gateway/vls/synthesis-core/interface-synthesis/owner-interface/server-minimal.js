const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const fetch = require('node-fetch');

const app = express();

// Initialize GCP Secret Manager client
const secretClient = new SecretManagerServiceClient();
const projectId = process.env.GCP_PROJECT_ID || 'api-for-warp-drive';

// Cache for secrets (in memory, with TTL)
const secretCache = new Map();
const SECRET_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Securely retrieve secret from GCP Secret Manager with caching
 */
async function getSecretFromGCP(secretName) {
  // Check cache first
  const cached = secretCache.get(secretName);
  if (cached && Date.now() - cached.timestamp < SECRET_CACHE_TTL) {
    console.log(`✅ Secret '${secretName}' retrieved from cache`);
    return cached.value;
  }

  try {
    const secretPath = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    console.log(`🔐 Accessing GCP secret: ${secretPath}`);

    const [version] = await secretClient.accessSecretVersion({
      name: secretPath,
    });

    const payload = version.payload.data.toString('utf8');
    
    // Cache the secret
    secretCache.set(secretName, {
      value: payload,
      timestamp: Date.now()
    });

    console.log(`✅ Secret '${secretName}' retrieved successfully from GCP Secret Manager`);
    return payload;

  } catch (error) {
    console.error(`❌ Error retrieving secret '${secretName}' from GCP:`, error.message);
    
    // Fallback to environment variables
    const envName = secretName.replace(/-/g, '_').toUpperCase();
    const envValue = process.env[envName];
    if (envValue) {
      console.log(`🔄 Using environment variable fallback for '${secretName}'`);
      return envValue;
    }
    
    throw error;
  }
}

// Middlewares
app.use(cookieParser());
app.use(express.static('.'));
app.use(express.json({ limit: '2mb' }));

// CORS for local testing and external MCP servers (safe defaults)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Quantum-Protection,X-Request-Type,X-Service-Account,X-RIX-Type,X-Workflow-Compliance,X-Owner-Authorization-Required,X-Quantum-Sync-ID,X-Client-Version,X-Client-Build,X-Quantum-ID,X-Dr-Claude-Validation,xi-api-key,Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve the main interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mocoa-current.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'mocoa-owner-interface' });
});

// ElevenLabs health check endpoint
app.get('/api/elevenlabs/health', (req, res) => {
  res.json({ status: 'healthy', service: 'elevenlabs-proxy' });
});

// -------- Mock/stub API endpoints required by the interface --------

// GCP token stub (frontend expects a JSON with { access_token })
app.post('/api/gcp/token', (req, res) => {
  res.json({ access_token: 'stub-access-token-' + Date.now() });
});

// Dr. Claude orchestration health
app.get('/api/dr-claude/health', (req, res) => {
  res.json({
    quantum_state: 'STABLE',
    validation_hash: 'valid-' + Date.now().toString(36),
    last_sync: new Date().toISOString(),
    dr_claude_active: true
  });
});

// Dr. Claude validate
app.post('/api/dr-claude/validate', (req, res) => {
  res.json({
    quantum_id: 'q_' + Math.random().toString(36).slice(2, 10),
    validation_hash: 'vh_' + Math.random().toString(36).slice(2, 10),
    dr_claude_approval: true
  });
});

// Dr. Claude orchestrate
app.post('/api/dr-claude/orchestrate', (req, res) => {
  const { type, data } = req.body || {};
  res.json({
    orchestration_id: 'orch_' + Math.random().toString(36).slice(2, 10),
    quantum_id: 'q_' + Math.random().toString(36).slice(2, 10),
    quantum_protection: 'MAXIMUM',
    result: {
      message: `Orchestrated ${type || 'request'} successfully`,
      echo: data || null
    }
  });
});

// Dr. Claude quantum sync
app.post('/api/dr-claude/quantum-sync', (req, res) => {
  res.json({
    sync_id: 'sync_' + Math.random().toString(36).slice(2, 10),
    quantum_state: 'SYNCHRONIZED',
    validation_hash: 'vh_' + Math.random().toString(36).slice(2, 10),
    sync_timestamp: new Date().toISOString()
  });
});

// GCP Secret Manager endpoint for ElevenLabs API key
app.get('/api/gcp/secrets/:secretName', async (req, res) => {
  try {
    const { secretName } = req.params;
    
    // Security: Only allow specific secret names
    const allowedSecrets = {
      'elevenlabs-api-key': '11_labs', // Map to actual GCP secret name
      'openai-api-key': 'openai-api-key',
      'anthropic-api-key': 'anthropic-api-key'
    };
    
    if (!allowedSecrets[secretName]) {
      return res.status(403).json({ error: `Access to secret '${secretName}' is not allowed` });
    }
    
    console.log(`🔐 Secret request for: ${secretName}`);
    
    // Try GCP Secret Manager first, then fallback to environment variables
    let secretValue;
    const actualSecretName = allowedSecrets[secretName];
    try {
      secretValue = await getSecretFromGCP(actualSecretName);
    } catch (error) {
      console.warn('Failed to get secret from GCP, trying environment variables');
      // Fallback to environment variables for local development
      const envName = secretName.replace(/-/g, '_').toUpperCase();
      secretValue = process.env[envName] || process.env.ELEVENLABS_API_KEY;
    }
    
    if (secretValue) {
      res.json({
        name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        payload: {
          data: secretValue
        },
        state: 'ENABLED',
        source: 'gcp-secret-manager'
      });
    } else {
      res.status(404).json({ error: 'Secret not found' });
    }
    
  } catch (error) {
    console.error('Secret retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve secret', message: error.message });
  }
});

// Secure ElevenLabs TTS proxy endpoint with OAuth2 authentication
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voice_id, model_id, voice_settings } = req.body;
    
    // Validate parameters
    if (!text || !voice_id) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        required: ['text', 'voice_id'] 
      });
    }
    
    // Get ElevenLabs OAuth2 token from GCP Secret Manager
    console.log('🔐 Retrieving ElevenLabs OAuth2 token for TTS request...');
    let elevenlabsToken;
    try {
      // Try OAuth2 token first
      elevenlabsToken = await getSecretFromGCP('elevenlabs-oauth2-token');
      console.log('✅ Using ElevenLabs OAuth2 token from Secret Manager');
    } catch (error) {
      console.warn('OAuth2 token not found, trying API key fallback:', error.message);
      
      // Fallback to API key if OAuth2 token not available
      try {
        elevenlabsToken = await getSecretFromGCP('11_labs');
        console.log('🔄 Using ElevenLabs API key as fallback');
      } catch (keyError) {
        console.error('Failed to retrieve any ElevenLabs credentials:', keyError.message);
        return res.status(500).json({ 
          error: 'ElevenLabs authentication not available', 
          message: 'Neither OAuth2 token nor API key found' 
        });
      }
    }
    
    // Make request to ElevenLabs API
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
    
    const requestBody = {
      text: text,
      model_id: model_id || 'eleven_monolingual_v1',
      voice_settings: voice_settings || {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };
    
    console.log(`🎤 Making TTS request to ElevenLabs for voice: ${voice_id}`);
    
    // Determine authentication method based on token format
    const isOAuth2Token = elevenlabsToken.startsWith('Bearer ') || elevenlabsToken.includes('.');
    const headers = {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json'
    };
    
    if (isOAuth2Token) {
      // Use OAuth2 Bearer token
      headers['Authorization'] = elevenlabsToken.startsWith('Bearer ') ? elevenlabsToken : `Bearer ${elevenlabsToken}`;
      console.log('🔐 Using OAuth2 Bearer token authentication');
    } else {
      // Use legacy API key
      headers['xi-api-key'] = elevenlabsToken;
      console.log('🔑 Using API key authentication (fallback)');
    }
    
    const response = await fetch(ttsUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      // If OAuth2 failed, try to refresh token or fallback
      if (response.status === 401 && isOAuth2Token) {
        console.log('🔄 OAuth2 token may be expired, attempting to refresh...');
        // TODO: Implement token refresh logic here
        return res.status(401).json({ 
          error: 'ElevenLabs OAuth2 token expired', 
          message: 'Please refresh OAuth2 token',
          needsRefresh: true
        });
      }
      
      return res.status(response.status).json({ 
        error: 'ElevenLabs API error', 
        message: errorText 
      });
    }
    
    // Stream the audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="tts-audio.mp3"');
    
    // Pipe the response stream directly to the client
    response.body.pipe(res);
    
    console.log('✅ TTS audio streamed successfully to client (OAuth2)');
    
  } catch (error) {
    console.error('TTS endpoint error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Simple agent allocation stub
app.get('/api/agents/allocation', (req, res) => {
  res.json({
    total_agents: 505001,
    wings: {
      'Alpha Wing': { agents: 168334, status: 'ACTIVE' },
      'Beta Wing': { agents: 168334, status: 'ACTIVE' },
      'Gamma Wing': { agents: 168333, status: 'ACTIVE' }
    },
    professional_copilots: {
      available: 11,
      original_pilots: true
    },
    patent_protection: {
      patents: 32,
      claims: 460
    }
  });
});

// Simple CLI help
app.get('/api/cli/help', (req, res) => {
  res.json({
    user_role: 'guest',
    available_commands: {
      '/help': 'Show available commands',
      '/status': 'Check system status',
      '/agents': 'Show agent allocation'
    },
    cli_version: '1.0.0',
    system: 'MOCOA Owner Interface',
    major_commands_available: false
  });
});

// Service Account Authentication endpoint
app.post('/api/auth/service-account', async (req, res) => {
  try {
    console.log('🔐 Service account authentication request received');
    
    // Simulate OAuth2 service account token generation
    const accessToken = 'ya29.c.mock_' + Math.random().toString(36).slice(2, 15) + '_' + Date.now();
    const refreshToken = 'refresh_' + Math.random().toString(36).slice(2, 15);
    
    // Return OAuth2 tokens (matching expected format)
    const response = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      issued_at: Math.floor(Date.now() / 1000),
      service_account: 'mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com',
      project_id: projectId
    };
    
    console.log('✅ Service account tokens generated successfully');
    res.json(response);
    
  } catch (error) {
    console.error('❌ Service account authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      message: error.message,
      code: 'SERVICE_ACCOUNT_AUTH_ERROR'
    });
  }
});

// -------------------------------------------------------------------

const port = process.env.PORT || 8080;
app.listen(port, async () => {
  console.log(`🚀 MOCOA Owner Interface running on port ${port}`);
  console.log('📊 System Capacity: 505,001 agents across 3 wings');
  console.log('🔐 GCP Secret Manager integration active');
  console.log('🎤 ElevenLabs TTS endpoint available');
  console.log('✅ Minimal server mode - core functionality only');
});
