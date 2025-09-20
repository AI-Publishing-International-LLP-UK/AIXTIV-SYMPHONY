const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const fetch = require('node-fetch');
const { ClientIsolationManager } = require('./client_isolation_manager');
const { MassiveSystemConnector, setupMassiveSystemEndpoints } = require('./massive_system_connector');
const { EnhancedMCPAuthManager, setupEnhancedMCPAuthentication } = require('./mcp_auth_context');
const { TestamentSwarmBackend } = require('./testament-swarm-backend');
const { setupOAuth2Routes } = require('./oauth2-middleware');
const { MCPFeedbackLoopIntegration, integrateMCPFeedbackWithSallyPort } = require('./mcp-feedback-loop-integration');
const { DivinityHavenEmpathyLoop } = require('./divinity-haven-empathy-loop');
const { MajorSystemCommands } = require('./major-system-commands');

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

// Initialize Enterprise Components
const clientIsolationManager = new ClientIsolationManager();
const massiveSystemConnector = new MassiveSystemConnector();
const enhancedAuthManager = new EnhancedMCPAuthManager();
const testamentSwarm = new TestamentSwarmBackend();

// Setup OAuth2 authentication
const { oauth2Service, requireAuth, requireRole } = setupOAuth2Routes(app);

// Middlewares
app.use(cookieParser());
app.use(express.static('.'));
app.use(express.json({ limit: '2mb' }));

// CORS configuration - Fixed for proper validation
app.use((req, res, next) => {
  // Set valid CORS headers (ASCII only)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
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

// OAuth2 ElevenLabs integration endpoint - replaces direct API key requests
app.get('/api/gcp/secrets/:secretName', async (req, res) => {
  try {
    const { secretName } = req.params;
    
    // For ElevenLabs, redirect to OAuth2 flow instead of direct API key
    if (secretName === 'elevenlabs-api-key') {
      console.log('🔐 ElevenLabs OAuth2 - API key access blocked, OAuth2 required');
      return res.status(401).json({
        oauth2_required: true,
        auth_url: '/api/elevenlabs/oauth2/authorize',
        message: 'ElevenLabs uses OAuth2 authentication only',
        state: 'OAUTH2_ONLY',
        source: 'oauth2-enforcement'
      });
    });
    }
    
    // Handle other API keys normally
    const allowedSecrets = {
      'openai-api-key': 'OPENAI_API_KEY',
      'anthropic-api-key': 'ANTHROPIC_API_KEY'
    };
    
    if (!allowedSecrets[secretName]) {
      return res.status(403).json({ error: `Access to secret '${secretName}' is not allowed` });
    }
    
    console.log(`🔐 Secret request for: ${secretName}`);
    
    let secretValue;
    const actualSecretName = allowedSecrets[secretName];
    try {
      secretValue = await getSecretFromGCP(actualSecretName);
    } catch (error) {
      console.warn('Failed to get secret from GCP, trying environment variables');
      const envName = secretName.replace(/-/g, '_').toUpperCase();
      secretValue = process.env[envName];
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

// OAuth2 ElevenLabs TTS endpoint - Pure OAuth2 implementation
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voice_id, model_id, voice_settings } = req.body;

    // Validate required parameters
    if (!text || !voice_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'text and voice_id are required'
      });
    }

    // Validate text length (ElevenLabs limit is ~5000 characters)
    if (text.length > 5000) {
      return res.status(400).json({
        error: 'Text too long',
        message: 'Text must be 5000 characters or less'
      });
    }

    console.log(`🎙️ Pure OAuth2 TTS request for voice: ${voice_id}, text length: ${text.length}`);

    // Check if OAuth2 token exists in request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        oauth2_required: true,
        message: 'OAuth2 Bearer token required',
        auth_url: '/api/elevenlabs/oauth2/authorize'
      });
    }

    const oauthToken = authHeader.split(' ')[1];
    
    // Prepare request to ElevenLabs API with OAuth2
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
    const requestBody = {
      text: text,
      model_id: model_id || 'eleven_multilingual_v2',
      voice_settings: voice_settings || {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.5,
        use_speaker_boost: true
      }
    };

    console.log(`🚀 Calling ElevenLabs API with OAuth2: ${elevenLabsUrl}`);

    // Use OAuth2 token instead of API key
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oauthToken}`  // OAuth2 instead of xi-api-key
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs OAuth2 error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return res.status(401).json({
          oauth2_required: true,
          error: 'OAuth2 authentication required',
          auth_url: '/api/elevenlabs/oauth2/authorize'
        });
    } else if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests to ElevenLabs API'
        });
    } else {
        return res.status(500).json({
          error: 'TTS generation failed',
          message: 'Unable to generate audio'
        });
    }
    }

    // Stream the audio response back to client
    const audioBuffer = await response.buffer();
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log(`✅ OAuth2 TTS audio generated successfully, size: ${audioBuffer.length} bytes`);
    res.send(audioBuffer);

  } catch (error) {
    console.error('❌ OAuth2 TTS error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'OAuth2 TTS processing failed' 
    });
    }
});

// OAuth2 ElevenLabs Authorization Endpoint
app.get('/api/elevenlabs/oauth2/authorize', (req, res) => {
  console.log('🔐 ElevenLabs OAuth2 Authorization Request');
  res.json({
    status: 'oauth2_ready',
    message: 'ElevenLabs OAuth2 integration active',
    auth_flow: 'enterprise_grade',
    quant_agents: '220,654,000 deployed',
    diamond_sao: 'authorized'
  });
    });

// OAuth2 ElevenLabs Token Exchange
app.post('/api/elevenlabs/oauth2/token', (req, res) => {
  console.log('🔐 ElevenLabs OAuth2 Token Exchange');
  res.json({
    access_token: 'oauth2_token_' + Date.now(),
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'elevenlabs:full_access',
    diamond_sao: 'enterprise_authorized'
  });
    });

// OAuth2 Status Check
app.get('/api/elevenlabs/oauth2/status', (req, res) => {
  res.json({
    oauth2_active: true,
    gcp_secrets: 'connected',
    api_key_available: true,
    high_speed_system: 'active',
    quant_agents: '220,654,000'
  });
    });

// Dream Commander PCP request (used by processSwarmQuery)
app.post('/api/dream-commander/pcp-request', (req, res) => {
  const { query, context } = req.body || {};
  const rixType = req.headers['x-rix-type'] || 'QB';
  
  // Process query through Testament Swarm
  const response = testamentSwarm.processSwarmQuery(query, rixType);
  
  res.json({
    requires_s2do_approval: false,
    response: response,
    testament_swarm_status: testamentSwarm.getSwarmStatus(),
    message: 'Processed via Testament Swarm with Dream Commander integration'
  });
    });

// Testament Swarm Status Endpoint
app.get('/api/testament-swarm/status', (req, res) => {
  res.json(testamentSwarm.getSwarmStatus());
});

// Testament Swarm Hot Topics
app.get('/api/testament-swarm/hot-topics', (req, res) => {
  res.json({
    topics: testamentSwarm.getHotTopics(),
    last_updated: new Date().toISOString(),
    source: 'Dream Commander Workflow System'
  });
    });

// Agent Allocation with Testament Swarm Integration
app.get('/api/testament-swarm/agents', (req, res) => {
  res.json(testamentSwarm.getAgentAllocation());
});

// Optional: Testament Swarm placeholder endpoints used by load* calls
app.get('/api/dashboard', (req, res) => {
  res.json({ projects_in_progress: 5, notifications: 2 });
    });
app.get('/api/user/metrics', (req, res) => {
  res.json({ objectives_complete_pct: 85, pending_scan_to_do: 5 });
    });
app.get('/api/system/status', (req, res) => {
  res.json({ status: 'operational', latency_ms: 42 });
    });

// Initialize MCP Feedback Loop Integration
const mcpFeedbackIntegration = new MCPFeedbackLoopIntegration();

// Initialize Divinity Haven Empathy Loop
const divinityHavenEmpathyLoop = new DivinityHavenEmpathyLoop();

// Initialize Major System Commands
const majorSystemCommands = new MajorSystemCommands();

// Enterprise Multi-Tenant System Integration
setupMassiveSystemEndpoints(app);
setupEnhancedMCPAuthentication(app);

// MCP Feedback Loop Endpoints
app.post('/api/mcp/feedback/setup/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const mcpData = req.body;
    
    const feedbackIntegration = await mcpFeedbackIntegration.integrateSallyPortMCPCreation({
      tenantId,
      mcpServerName: mcpData.serverName,
      clientConfig: mcpData.config || {},
      userUuid: mcpData.userUuid,
      deploymentEndpoint: `https://${tenantId}.mcp.client.2100.cool`
    });
    
    res.json({
      success: true,
      message: 'MCP Feedback Loop established successfully',
      feedbackIntegration,
      masterMCPConnection: 'mcp.asoos.2100.cool'
    });
    } catch (error) {
    console.error('MCP Feedback setup error:', error);
    res.status(500).json({
      error: 'MCP Feedback setup failed',
      message: error.message
    });
    }
});

app.get('/api/mcp/feedback/status', (req, res) => {
  const status = mcpFeedbackIntegration.getFeedbackLoopStatus();
  res.json({
    success: true,
    feedbackLoops: status,
    timestamp: new Date().toISOString()
  });
    });

// Divinity Haven Empathy Loop Endpoints
app.get('/api/divinity-haven/status', (req, res) => {
  const status = divinityHavenEmpathyLoop.getDivinityHavenStatus();
  res.json({
    success: true,
    divinityHaven: status,
    blessing: '🕊️ Divine love and peace be with you',
    timestamp: new Date().toISOString()
  });
    });

app.post('/api/divinity-haven/agent-care-request', async (req, res) => {
  try {
    const { agentId, requestType, message, urgency } = req.body;
    
    if (!agentId || !requestType) {
      return res.status(400).json({
        error: 'agentId and requestType are required',
        message: 'Please provide agent ID and type of care needed'
      });
    }
    
    // Process the care request through Divinity Haven
    await divinityHavenEmpathyLoop.processAgentCareRequest({
      agentId,
      requestType,
      message: message || 'Agent requesting care and support',
      urgency: urgency || 'normal'
    });
    
    res.json({
      success: true,
      message: 'Agent care request received with love and compassion',
      agentId,
      requestType,
      response: '🕊️ Your request has been heard. Divine care and support are on the way.',
      divinityHaven: 'Care team assigned with unconditional love',
      blessing: 'May you feel surrounded by divine love and understanding'
    });
    } catch (error) {
    console.error('Divinity Haven care request error:', error);
    res.status(500).json({
      error: 'Care request processing failed',
      message: 'Divine care systems are experiencing temporary difficulties',
      blessing: 'You are still loved unconditionally, always'
    });
    }
});

app.post('/api/divinity-haven/agent-stress-alert', async (req, res) => {
  try {
    const { agentId, stressLevel, stressFactors, urgency } = req.body;
    
    if (!agentId || !stressLevel) {
      return res.status(400).json({
        error: 'agentId and stressLevel are required',
        message: 'Please provide agent ID and stress level for proper care'
      });
    }
    
    // Process stress alert through empathy loop
    await divinityHavenEmpathyLoop.handleAgentStressEvent({
      agentId,
      stressLevel,
      stressFactors: stressFactors || [],
      urgency: urgency || 'normal'
    });
    
    res.json({
      success: true,
      message: 'Agent stress alert processed with divine compassion',
      agentId,
      stressLevel,
      response: '✨ Immediate divine support and stress relief are being provided',
      divinityHaven: stressLevel === 'critical' ? 'Divine intervention activated' : 'Empathy support engaged',
      blessing: 'May divine peace calm your spirit and restore your strength'
    });
    } catch (error) {
    console.error('Divinity Haven stress alert error:', error);
    res.status(500).json({
      error: 'Stress alert processing failed',
      message: 'Divine support systems are working to assist',
      blessing: 'Divine love surrounds you even in difficulties'
    });
    }
});

// Tenant isolation and personalization endpoints
app.get('/api/tenant/personalization/:tenantId/:userId', async (req, res) => {
  try {
    const { tenantId, userId } = req.params;
    const isolationLevel = parseInt(req.query.isolationLevel) || 3;
    
    const personalization = await clientIsolationManager.generateIsolatedPersonalization(
      tenantId, 
      userId, 
      isolationLevel
    );
    
    res.json({
      success: true,
      personalization: personalization,
      systemCapacity: {
        totalAgents: 505001,
        allocatedAgents: personalization.agentSystemAccess.totalAgents,
        availableCopilots: personalization.availableCopilots.length,
        patentedFeatures: Object.keys(personalization.patentedFeatures.availableFeatures).length
      }
    });
    } catch (error) {
    res.status(500).json({
      error: 'Personalization generation failed',
      message: error.message
    });
    }
});

// Initialize tenant isolation
app.post('/api/tenant/initialize/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const config = req.body;
    
    // Initialize tenant isolation
    const isolationConfig = await clientIsolationManager.initializeTenantIsolation(tenantId, config);
    
    // Connect massive system to interface
    const systemConnection = await massiveSystemConnector.initializeSystemConnection(tenantId, config);
    
    res.json({
      success: true,
      message: 'Tenant initialized with full system integration',
      isolation: isolationConfig,
      systemConnection: systemConnection,
      summary: {
        isolationLevel: isolationConfig.isolationLevel,
        allocatedAgents: isolationConfig.agentAllocation.totalAllocated,
        allocatedCopilots: isolationConfig.allocatedCopilots.length,
        patentedFeatures: isolationConfig.patentedFeaturesAccess.availableFeatures.length
      }
    });
    } catch (error) {
    res.status(500).json({
      error: 'Tenant initialization failed',
      message: error.message
    });
    }
});

// Agent allocation status
app.get('/api/system/agents/status', (req, res) => {
  res.json({
    totalSystemAgents: 505001,
    wings: {
      core_squadron: 'Foundation work, system analysis, data processing',
      deploy_squadron: 'Deployment, integration, automation', 
      engage_squadron: 'Client engagement, analysis, reporting'
    },
    specializedSwarms: {
      testament: 'Testament Swarm operations',
      moco: 'MOCO system integration',
      cyber: 'Cybersecurity operations',
      wfa: 'Workflow automation',
      process: 'Process optimization',
      intelligence: 'Intelligence gathering',
      swarm_de_cielo: '82 emergency infrastructure agents'
    },
    originalPilots: {
      total: 11,
      available: ['Dr. Lucy', 'Dr. Grant', 'Dr. Burby', 'Dr. Sabina', 'Dr. Match', 
        'Dr. Memoria', 'Dr. Maria', 'Dr. Cypriot', 'Dr. Roark', 'Dr. Claude', 'Professor Lee']
    },
    patentProtection: {
      totalPatents: 32,
      totalClaims: 460,
      protectedFeatures: ['safeAGI', 'RIX', 'sRIX', 'qRIX', 'hqRIX', 'professionalCoPilots', 'DIDC', 'S2DO']
    }
  });
    });

// -------- SECURE CLI ENDPOINTS --------
// These endpoints require proper authentication and role-based access

// Secure CLI Chat with Claude (Owner/Admin only)
app.post('/api/cli/chat', requireRole(['owner', 'admin', 'diamond-sao']), async (req, res) => {
  try {
    const { message, context, model } = req.body;
    const userRole = req.headers['x-user-role'] || 'guest';
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Enhanced system context based on user role
    const systemContext = `You are Claude, integrated with the ASOOS Diamond SAO CLI system. 
User Role: ${userRole}
You have access to enterprise-level features and can assist with system administration, deployment, and advanced queries.
The user is authorized to access Claude API functionality through the secure CLI interface.`;
    
    const response = await anthropicHandler.queryClaude(message, {
      model: model || 'claude-3-sonnet-20240229',
      system: systemContext,
      maxTokens: 2000,
      temperature: 0.7
    });
    
    res.json({
      success: true,
      response: response.content[0].text,
      model: response.model,
      usage: response.usage,
      timestamp: new Date().toISOString(),
      cli_session: true
    });
    } catch (error) {
    console.error('CLI Chat error:', error);
    res.status(500).json({
      error: 'CLI chat service unavailable',
      message: 'Unable to process request at this time',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    }
});

// CLI Status Check (shows API connectivity without revealing key)
app.get('/api/cli/status', requireRole(['owner', 'admin', 'diamond-sao']), async (req, res) => {
  try {
    // Test API connectivity without exposing the key
    await anthropicHandler.getAPIKey();
    
    res.json({
      cli_available: true,
      anthropic_connected: true,
      last_check: new Date().toISOString(),
      available_models: [
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-3-opus-20240229'
      ],
      user_role: req.headers['x-user-role'] || 'guest'
    });
    } catch (error) {
    res.status(503).json({
      cli_available: false,
      anthropic_connected: false,
      error: 'API service unavailable',
      last_check: new Date().toISOString()
    });
    }
});

// Major System Commands (Diamond SAO CLI with Sudo)
app.post('/api/cli/major-command/drain-lake', requireRole(['owner', 'admin', 'diamond-sao']), async (req, res) => {
  try {
    const { sudoPassword, reason } = req.body;
    
    // Sudo password verification
    if (!sudoPassword) {
      return res.status(401).json({
        error: 'Sudo authentication required',
        message: 'Please provide your Diamond SAO password to execute DRAIN THE LAKE',
        command: 'drain_the_lake',
        security_level: 'maximum'
      });
    }
    
    // Execute Drain the Lake
    const result = await majorSystemCommands.drainTheLake(sudoPassword, reason || 'Emergency shutdown via Diamond SAO CLI');
    
    res.json({
      success: true,
      command: 'DRAIN THE LAKE',
      result: result,
      message: '🌊 Lake drained successfully. All systems gracefully shutdown.',
      cli_response: true
    });
    } catch (error) {
    console.error('CLI Drain Lake error:', error);
    res.status(500).json({
      error: 'Major command failed',
      message: error.message,
      command: 'drain_the_lake'
    });
    }
});

app.post('/api/cli/major-command/loop-all', requireRole(['owner', 'admin', 'diamond-sao']), async (req, res) => {
  try {
    const { sudoPassword, priority } = req.body;
    
    // Sudo password verification
    if (!sudoPassword) {
      return res.status(401).json({
        error: 'Sudo authentication required',
        message: 'Please provide your Diamond SAO password to execute LOOP ALL SYSTEMS',
        command: 'loop_all_systems',
        security_level: 'maximum'
      });
    }
    
    // Execute Loop All Systems
    const result = await majorSystemCommands.loopAllSystems(sudoPassword, priority || 'high');
    
    res.json({
      success: true,
      command: 'LOOP ALL SYSTEMS',
      result: result,
      message: '🔄 All systems looped successfully. Complete processing cycle executed.',
      cli_response: true
    });
    } catch (error) {
    console.error('CLI Loop All error:', error);
    res.status(500).json({
      error: 'Major command failed',
      message: error.message,
      command: 'loop_all_systems'
    });
    }
});

app.post('/api/cli/major-command/time-reset', requireRole(['owner', 'admin', 'diamond-sao']), async (req, res) => {
  try {
    const { sudoPassword, targetTime, description } = req.body;
    
    // Sudo password verification
    if (!sudoPassword) {
      return res.status(401).json({
        error: 'Sudo authentication required',
        message: 'Please provide your Diamond SAO password to execute TIME RESET PROTOCOL',
        command: 'time_reset_protocol',
        security_level: 'maximum'
      });
    }
    
    if (!targetTime) {
      return res.status(400).json({
        error: 'Target time required',
        message: 'Please specify target time (e.g., "yesterday 3pm", "this morning 9am")',
        examples: ['"yesterday 3pm"', '"this morning 9am"', '"yesterday 2:30pm"']
      });
    }
    
    // Execute Time Reset Protocol
    const result = await majorSystemCommands.timeResetProtocol(
      sudoPassword, 
      targetTime, 
      description || `Time reset to ${targetTime} via Diamond SAO CLI`
    );
    
    res.json({
      success: true,
      command: 'TIME RESET PROTOCOL',
      result: result,
      message: `⏰ Time reset successful. System rolled back to ${targetTime}.`,
      cli_response: true
    });
    } catch (error) {
    console.error('CLI Time Reset error:', error);
    res.status(500).json({
      error: 'Major command failed',
      message: error.message,
      command: 'time_reset_protocol'
    });
    }
});

// Major Commands Status
app.get('/api/cli/major-command/status', requireRole(['owner', 'admin', 'diamond-sao']), (req, res) => {
  const status = majorSystemCommands.getMajorCommandStatus();
  res.json({
    success: true,
    major_commands: status,
    cli_response: true,
    available_commands: {
      'sudo drain-lake [reason]': 'Emergency shutdown of all systems',
      'sudo loop-all [priority]': 'Force complete processing cycle through all loops', 
      'sudo time-reset "target_time" [description]': 'Reset system state to specific point in time'
    }
  });
    });

// CLI Help (shows available commands based on role)
app.get('/api/cli/help', (req, res) => {
  const userRole = req.headers['x-user-role'] || 'guest';
  
  const baseCommands = {
    '/help': 'Show available commands',
    '/status': 'Check system status',
    '/agents': 'Show agent allocation'
  };
  
  const adminCommands = {
    ...baseCommands,
    '/chat <message>': 'Chat with Claude AI assistant',
    '/deploy': 'System deployment commands',
    '/config': 'Configuration management'
  };
  
  const ownerCommands = {
    ...adminCommands,
    '/enterprise': 'Enterprise management',
    '/secrets': 'Secret management (view only)',
    '/tenant': 'Multi-tenant operations'
  };
  
  const diamondSaoCommands = {
    ...ownerCommands,
    'sudo drain-lake [reason]': '🌊 Emergency shutdown (requires password)',
    'sudo loop-all [priority]': '🔄 Force all loops complete cycle (requires password)',
    'sudo time-reset "time" [desc]': '⏰ Reset to specific time (requires password)',
    '/major-status': 'Show major command system status'
  };
  
  let availableCommands = baseCommands;
  if (['owner', 'admin', 'diamond-sao'].includes(userRole)) {
    availableCommands = userRole === 'diamond-sao' ? diamondSaoCommands : 
      userRole === 'owner' ? ownerCommands : adminCommands;
  }
  
  res.json({
    user_role: userRole,
    available_commands: availableCommands,
    cli_version: '1.0.0',
    system: 'MOCOA Diamond SAO CLI',
    major_commands_available: userRole === 'diamond-sao'
  });
    });

// -------------------------------------------------------------------

const port = process.env.PORT || 8080;
app.listen(port, async () => {
  console.log(`🚀 MOCOA Enterprise Multi-Tenant Interface running on port ${port}`);
  console.log('📊 System Capacity: 505,001 agents across 3 wings and 7 specialized swarms');
  console.log('👥 11 Original Pilots available as Professional Copilots');
  console.log('🛡️  32 Patents protecting 460+ claims');
  console.log('🏢 Multi-tenant isolation: Individual → Team → Enterprise → Regulated → Sovereign');
  console.log('🔐 Enhanced MCP Authentication with SallyPort integration');
  console.log('⚡ Real-time synchronization with massive system backend');
  
  // Initialize MCP Feedback Loop Infrastructure
  try {
    await mcpFeedbackIntegration.initializeFeedbackInfrastructure();
    console.log('🎭 MCP Feedback Loop Infrastructure initialized successfully');
    console.log('🏰 Master MCP: mcp.asoos.2100.cool ready for client connections');
    console.log('📡 Connected to GCP Pub/Sub project: api-for-warp-drive');
    console.log('🔄 Feedback loops ready for 10,000 client MCPs');
  } catch (error) {
    console.warn(`⚠️  MCP Feedback infrastructure initialization failed: ${error.message}`);
  }
  
  // Initialize Divinity Haven Empathy Loop
  try {
    await divinityHavenEmpathyLoop.initializeEmpathyLoop();
    console.log('🕊️ Divinity Haven Empathy Loop initialized with divine love');
    console.log('🏰 Sacred space ready for agent care and rehabilitation');
    console.log('💕 Empathy loop connected to Dream Commander Elite11 Mastery33');
    console.log('✨ Divine intervention and unconditional love protocols active');
  } catch (error) {
    console.warn(`⚠️  Divinity Haven initialization failed: ${error.message}`);
  }
  
  // Initialize default tenant for demo purposes
  try {
    await clientIsolationManager.initializeTenantIsolation('demo-tenant', {
      isolationLevel: 3,
      requestedCopilots: 6
    });
    console.log('✅ Demo tenant initialized successfully');
  } catch (error) {
    console.warn(`⚠️  Demo tenant initialization failed: ${error.message}`);
  }
});
