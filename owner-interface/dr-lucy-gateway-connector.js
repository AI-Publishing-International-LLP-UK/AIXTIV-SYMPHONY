/**
 * Dr. Lucy Gateway Connector
 * Connects MOCOA interface with Dr. Lucy's knowledge base, historical memory, and FMS
 * via the Universal Gateway and Integration Gateway
 */

// Integration gateway endpoints
const INTEGRATION_GATEWAY_ENDPOINTS = {
  base: 'https://integration-gateway.pr-aef.workers.dev',
  universalGateway: 'https://integration-gateway.pr-aef.workers.dev/universal-gateway',
  drLucyML: 'https://integration-gateway.pr-aef.workers.dev/connectors/dr-lucy-ml',
  deepMind: 'https://mocorix2-us-central1.com/deep-mind-api',
  knowledgeBase: 'https://aixtiv-symphony.mocorix-us-west1-c.com/knowledge-base',
  flightMemory: 'https://vision-lake.mocorix2-us-central1.com/flight-memory',
  fms: 'https://mocorix2-cluster.us-central1.com/fms-api'
};

// Dr. Lucy's voice configuration
const DR_LUCY_VOICE = {
  provider: 'elevenlabs',
  voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - Professional African American female voice
  modelId: 'eleven_multilingual_v2',
  settings: {
    stability: 0.75,
    similarity_boost: 0.85,
    style: 0.90,
    use_speaker_boost: true
  }
};

/**
 * Dr. Lucy Knowledge Connector
 * Connects to Dr. Lucy's knowledge base, flight memory, and FMS historical data
 */
class DrLucyGatewayConnector {
  constructor() {
    this.isInitialized = false;
    this.isConnected = false;
    this.authToken = null;
    this.sessionId = null;
    this.contextWindow = [];
    this.knowledgeBaseConnected = false;
    this.flightMemoryConnected = false;
    this.fmsConnected = false;
    this.universalGatewayConnected = false;
    
    // Authentication state
    this.authState = {
      authenticated: false,
      tokenExpiry: null,
      authenticatedAt: null,
      authLevel: 0
    };
    
    // Voice status and configuration
    this.voiceConfig = DR_LUCY_VOICE;
    this.voiceSystemActive = false;
    this.voiceRecognitionActive = false;
    
    console.log('🔄 Dr. Lucy Gateway Connector initializing...');
  }
  
  /**
   * Initialize the gateway connector
   */
  async initialize() {
    try {
      console.log('🧠 Initializing Dr. Lucy Gateway connections...');
      
      // Authenticate with the Universal Gateway
      await this.authenticate();
      
      // Connect to Dr. Lucy's knowledge base
      await this.connectKnowledgeBase();
      
      // Connect to Flight Memory
      await this.connectFlightMemory();
      
      // Connect to FMS historical data
      await this.connectFMS();
      
      // Initialize voice system
      await this.initializeVoiceSystem();
      
      this.isInitialized = true;
      console.log('✅ Dr. Lucy Gateway Connector initialized successfully!');
      
      // Start heartbeat to maintain connection
      this.startHeartbeat();
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Dr. Lucy Gateway Connector:', error);
      return false;
    }
  }
  
  /**
   * Authenticate with the Universal Gateway
   */
  async authenticate() {
    try {
      console.log('🔑 Authenticating with Universal Gateway...');
      
      // Retrieve authentication token from server or localStorage
      const savedToken = localStorage.getItem('universal_gateway_token');
      if (savedToken) {
        try {
          const tokenData = JSON.parse(savedToken);
          if (tokenData.expiry && new Date(tokenData.expiry) > new Date()) {
            this.authToken = tokenData.token;
            this.authState.authenticated = true;
            this.authState.tokenExpiry = tokenData.expiry;
            this.authState.authenticatedAt = tokenData.authenticatedAt;
            this.authState.authLevel = tokenData.authLevel || 3;
            
            console.log('✅ Restored existing Universal Gateway authentication');
            return true;
          }
        } catch (e) {
          console.warn('⚠️ Saved token invalid, authenticating again');
        }
      }
      
      // If token missing or expired, authenticate with gateway
      const response = await fetch(`${INTEGRATION_GATEWAY_ENDPOINTS.universalGateway}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: 'mocoa-owner-interface',
          auth_level: 'owner',
          session_type: 'persistent'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gateway authentication failed: ${response.status}`);
      }
      
      const authData = await response.json();
      
      // Store authentication token
      this.authToken = authData.token;
      this.authState.authenticated = true;
      this.authState.tokenExpiry = authData.expiry;
      this.authState.authenticatedAt = new Date().toISOString();
      this.authState.authLevel = authData.auth_level || 3;
      
      // Save token for future sessions
      localStorage.setItem('universal_gateway_token', JSON.stringify({
        token: this.authToken,
        expiry: this.authState.tokenExpiry,
        authenticatedAt: this.authState.authenticatedAt,
        authLevel: this.authState.authLevel
      }));
      
      console.log('✅ Universal Gateway authentication successful');
      this.universalGatewayConnected = true;
      
      // Create a new session
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return true;
    } catch (error) {
      console.error('❌ Universal Gateway authentication failed:', error);
      
      // Fallback to using mock authentication for development
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        console.log('⚠️ Using development fallback authentication');
        this.authToken = 'dev-fallback-token';
        this.authState.authenticated = true;
        this.authState.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        this.authState.authenticatedAt = new Date().toISOString();
        this.authState.authLevel = 3;
        this.universalGatewayConnected = true;
        this.sessionId = `dev_session_${Date.now()}`;
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Connect to Dr. Lucy's knowledge base
   */
  async connectKnowledgeBase() {
    try {
      console.log('📚 Connecting to Dr. Lucy Knowledge Base...');
      
      const response = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.knowledgeBase}/connect`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: this.sessionId,
          connection_type: 'full',
          source: 'mocoa-owner-interface'
        })
      });
      
      if (response.status === 'connected') {
        console.log('✅ Knowledge Base connected successfully');
        this.knowledgeBaseConnected = true;
        return true;
      }
      
      throw new Error('Knowledge Base connection failed');
      
    } catch (error) {
      console.warn('⚠️ Knowledge Base connection failed, using fallback:', error.message);
      
      // Development fallback
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        console.log('⚠️ Using development fallback for Knowledge Base');
        this.knowledgeBaseConnected = true;
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Connect to Flight Memory for Dr. Lucy's historical data
   */
  async connectFlightMemory() {
    try {
      console.log('🛫 Connecting to Flight Memory...');
      
      const response = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.flightMemory}/connect`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: this.sessionId,
          memory_type: 'extended',
          access_level: 'full'
        })
      });
      
      if (response.status === 'connected') {
        console.log('✅ Flight Memory connected successfully');
        this.flightMemoryConnected = true;
        return true;
      }
      
      throw new Error('Flight Memory connection failed');
      
    } catch (error) {
      console.warn('⚠️ Flight Memory connection failed, using fallback:', error.message);
      
      // Development fallback
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        console.log('⚠️ Using development fallback for Flight Memory');
        this.flightMemoryConnected = true;
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Connect to FMS for historical data
   */
  async connectFMS() {
    try {
      console.log('🗄️ Connecting to FMS...');
      
      const response = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.fms}/connect`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: this.sessionId,
          data_access: 'historical',
          integration_type: 'dr_lucy'
        })
      });
      
      if (response.status === 'connected') {
        console.log('✅ FMS connected successfully');
        this.fmsConnected = true;
        return true;
      }
      
      throw new Error('FMS connection failed');
      
    } catch (error) {
      console.warn('⚠️ FMS connection failed, using fallback:', error.message);
      
      // Development fallback
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        console.log('⚠️ Using development fallback for FMS');
        this.fmsConnected = true;
        return true;
      }
      
      return false;
    }
  }
  
  /**
   * Initialize Dr. Lucy's voice system
   */
  async initializeVoiceSystem() {
    try {
      console.log('🎙️ Initializing Dr. Lucy voice system...');
      
      // Connect to voice API for TTS
      const voiceResponse = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.drLucyML}/voice/initialize`, {
        method: 'POST',
        body: JSON.stringify({
          voice_id: this.voiceConfig.voiceId,
          model_id: this.voiceConfig.modelId,
          settings: this.voiceConfig.settings,
          provider: this.voiceConfig.provider
        })
      });
      
      if (voiceResponse.status === 'initialized') {
        console.log('✅ Voice system initialized successfully');
        this.voiceSystemActive = true;
      } else {
        throw new Error('Voice system initialization failed');
      }
      
      // Initialize voice recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('✅ Browser voice recognition available');
        this.voiceRecognitionActive = true;
      } else {
        console.warn('⚠️ Browser voice recognition not available');
        this.voiceRecognitionActive = false;
      }
      
      return this.voiceSystemActive;
      
    } catch (error) {
      console.warn('⚠️ Voice system initialization failed:', error.message);
      
      // Fallback to browser TTS
      console.log('⚠️ Using browser fallback for voice synthesis');
      this.voiceSystemActive = 'speechSynthesis' in window;
      
      return this.voiceSystemActive;
    }
  }
  
  /**
   * Process a message with Dr. Lucy's Knowledge
   * @param {string} message - The user message
   * @param {Object} options - Processing options
   */
  async processMessage(message, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Ensure we're authenticated
      if (!this.authState.authenticated) {
        await this.authenticate();
      }
      
      console.log('🧠 Processing message with Dr. Lucy...');
      
      // Add message to context window
      this.contextWindow.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });
      
      // Prepare request with full context
      const requestBody = {
        message: message,
        session_id: this.sessionId,
        context: this.contextWindow,
        knowledge_base: this.knowledgeBaseConnected,
        flight_memory: this.flightMemoryConnected,
        fms: this.fmsConnected,
        options: {
          voice_response: options.voice_response !== false,
          detailed_response: options.detailed_response !== false,
          use_ml: options.use_ml !== false,
          use_deep_mind: options.use_deep_mind !== false,
          response_format: options.response_format || 'text',
          max_length: options.max_length || 2000
        }
      };
      
      // Process with Dr. Lucy's knowledge
      const response = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.drLucyML}/process`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (!response.message) {
        throw new Error('Invalid response from Dr. Lucy');
      }
      
      // Add assistant response to context window
      this.contextWindow.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      });
      
      // Limit context window size
      if (this.contextWindow.length > 20) {
        this.contextWindow = this.contextWindow.slice(-20);
      }
      
      console.log('✅ Dr. Lucy processed message successfully');
      
      return {
        text: response.message,
        voice_url: response.voice_url,
        source: 'dr_lucy_knowledge',
        contextWindow: this.contextWindow,
        knowledge_sources: response.knowledge_sources || [],
        metadata: response.metadata || {}
      };
      
    } catch (error) {
      console.error('❌ Dr. Lucy message processing failed:', error);
      
      // Fallback processing without knowledge
      console.log('⚠️ Using fallback response processing');
      
      // Add fallback response to context window
      this.contextWindow.push({
        role: 'assistant',
        content: this.generateFallbackResponse(message),
        timestamp: new Date().toISOString()
      });
      
      return {
        text: this.generateFallbackResponse(message),
        source: 'fallback',
        contextWindow: this.contextWindow,
        error: error.message
      };
    }
  }
  
  /**
   * Generate a speech audio URL for Dr. Lucy's voice
   * @param {string} text - The text to convert to speech
   */
  async generateSpeech(text) {
    try {
      if (!this.voiceSystemActive) {
        throw new Error('Voice system not active');
      }
      
      console.log('🎙️ Generating Dr. Lucy speech...');
      
      const response = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.drLucyML}/voice/synthesize`, {
        method: 'POST',
        body: JSON.stringify({
          text: text,
          voice_id: this.voiceConfig.voiceId,
          model_id: this.voiceConfig.modelId,
          settings: this.voiceConfig.settings
        })
      });
      
      if (response.audio_url) {
        console.log('✅ Speech generated successfully');
        return response.audio_url;
      }
      
      throw new Error('Speech generation failed');
      
    } catch (error) {
      console.warn('⚠️ Dr. Lucy speech generation failed:', error.message);
      return null;
    }
  }
  
  /**
   * Play Dr. Lucy's voice
   * @param {string} text - The text to speak
   */
  async speak(text) {
    try {
      // Try to get audio URL from the voice API
      const audioUrl = await this.generateSpeech(text);
      
      if (audioUrl) {
        // Play the audio
        const audio = new Audio(audioUrl);
        audio.play();
        return true;
      }
      
      // Fallback to browser TTS if API fails
      if ('speechSynthesis' in window) {
        console.log('⚠️ Using browser TTS fallback');
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') || 
          voice.name.includes('Samantha') || 
          voice.name.includes('Google US English Female')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        utterance.rate = 0.9; // Slightly slower
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Speech playback failed:', error);
      return false;
    }
  }
  
  /**
   * Make an authenticated request to the gateway
   * @param {string} url - The URL to request
   * @param {Object} options - Fetch options
   */
  async makeAuthenticatedRequest(url, options = {}) {
    // Check if we need to re-authenticate
    if (this.authState.tokenExpiry && new Date(this.authState.tokenExpiry) < new Date()) {
      await this.authenticate();
    }
    
    const fetchOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers
      }
    };
    
    try {
      // For development, simulate successful responses
      if ((window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) && 
          !url.includes('localhost') && !url.includes('127.0.0.1')) {
        
        console.log(`🔄 DEV MODE: Simulating request to ${url}`);
        
        // Simulate response based on URL path
        if (url.includes('/connect')) {
          return { status: 'connected', message: 'Development connection successful' };
        }
        else if (url.includes('/voice/initialize')) {
          return { status: 'initialized', message: 'Voice system initialized' };
        }
        else if (url.includes('/voice/synthesize')) {
          // Return null for speech URL in development
          return { audio_url: null };
        }
        else if (url.includes('/process')) {
          return this.simulateProcessResponse(JSON.parse(options.body).message);
        }
        
        return { status: 'success', message: 'Development success response' };
      }
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Request to ${url} failed:`, error);
      throw error;
    }
  }
  
  /**
   * Start heartbeat to maintain connection
   */
  startHeartbeat() {
    // Send heartbeat every 5 minutes
    this.heartbeatInterval = setInterval(async () => {
      if (this.authState.authenticated) {
        try {
          const response = await this.makeAuthenticatedRequest(`${INTEGRATION_GATEWAY_ENDPOINTS.universalGateway}/heartbeat`, {
            method: 'POST',
            body: JSON.stringify({
              session_id: this.sessionId
            })
          });
          
          if (response.status === 'active') {
            console.log('💓 Universal Gateway heartbeat successful');
          } else {
            console.warn('⚠️ Heartbeat received unexpected response:', response);
          }
        } catch (error) {
          console.warn('⚠️ Heartbeat failed, attempting to reconnect:', error.message);
          this.authenticate();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  /**
   * Generate a fallback response for Dr. Lucy
   * @param {string} message - The user message
   */
  generateFallbackResponse(message) {
    // Simpler fallback responses that sound like Dr. Lucy
    const responses = [
      'I\'m analyzing that request, but I\'m having trouble connecting to my full knowledge base right now. Let me provide what information I can based on my core understanding.',
      
      'While I\'m experiencing some connectivity issues with my extended memory systems, I can still assist you. My baseline knowledge suggests that your question about this topic is important for organizational growth.',
      
      'I\'m operating with limited access to my flight memory at the moment, but I can still provide strategic insights. Based on my core knowledge, here\'s what I recommend for this situation.',
      
      'My connection to the FMS historical database is currently limited, but I can still leverage my fundamental knowledge. Let me share what I know about this topic from my core understanding.',
      
      'I\'m currently operating with a partial connection to my knowledge systems, but I\'m still here to help. Based on what I can access, here\'s my analysis of your question.'
    ];
    
    // Simple keyword-based context matching
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    if (message.toLowerCase().includes('report') || message.toLowerCase().includes('data')) {
      response += ' When it comes to data analysis and reporting, I typically recommend focusing on actionable insights rather than just raw metrics. This helps drive more strategic decision-making.';
    } 
    else if (message.toLowerCase().includes('team') || message.toLowerCase().includes('staff')) {
      response += ' When addressing team dynamics, I\'ve observed that clear communication frameworks and well-defined roles typically lead to higher performance and better outcomes.';
    }
    else if (message.toLowerCase().includes('strategy') || message.toLowerCase().includes('plan')) {
      response += ' Strategic planning should always balance innovation with practical implementation. My analysis typically shows that the most successful strategies maintain this balance while remaining adaptable.';
    }
    
    return response;
  }
  
  /**
   * Simulate processing response for development
   */
  simulateProcessResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Start with Dr. Lucy's knowledge-infused voice pattern
    let response = 'Based on my analysis and historical data, ';
    
    // Add specific domain knowledge based on keywords
    if (lowerMessage.includes('report') || lowerMessage.includes('data')) {
      response += 'I can help you with that reporting request. My flight memory indicates we\'ve processed similar reports in the past with great success. The key metrics you\'ll want to focus on include customer acquisition cost, lifetime value, and engagement rates. Historical FMS data shows these have been particularly insightful for your team.';
    } 
    else if (lowerMessage.includes('team') || lowerMessage.includes('staff')) {
      response += 'team dynamics are critical to organizational success. Our FMS historical data shows that your leadership approach has created strong team cohesion. I\'d recommend continuing the weekly strategy sessions that have proven effective, while incorporating more cross-functional collaboration which has shown a 24% increase in innovation outcomes in similar organizational structures.';
    }
    else if (lowerMessage.includes('strategy') || lowerMessage.includes('plan')) {
      response += 'strategic planning requires both visionary thinking and practical implementation. From my knowledge base, I can see that your organization has historically excelled at innovation but sometimes faced challenges in execution phases. I recommend a staged implementation approach with clear milestones and accountability metrics, which has shown 37% better outcomes in similar contexts.';
    }
    else if (lowerMessage.includes('project') || lowerMessage.includes('deadline')) {
      response += 'project management is an area where your organization has developed strong competencies. Looking at your historical project data in the FMS, I can see a pattern of successful delivery on complex initiatives. The current project timeline appears ambitious but achievable based on your team\'s previous performance metrics and capacity analysis.';
    }
    else {
      response += 'I\'d be happy to provide insights on this topic. My knowledge base contains extensive information that can help guide your decision-making process. Based on historical patterns and current data trends, I can offer both strategic and tactical recommendations tailored to your specific organizational context.';
    }
    
    // Add a Dr. Lucy signature comment about integration
    response += ' One thing I\'ve consistently observed across multiple organizations is that integrated approaches tend to yield superior results compared to siloed efforts. My flight memory records show this pattern repeatedly across diverse industries and contexts.';
    
    return {
      message: response,
      voice_url: null,
      knowledge_sources: [
        { name: 'Historical FMS Data', confidence: 0.87 },
        { name: 'Flight Memory Records', confidence: 0.92 },
        { name: 'Organizational Knowledge Base', confidence: 0.95 }
      ],
      metadata: {
        processing_time: 1.2,
        confidence: 0.89,
        model: 'Dr. Lucy Knowledge Integration',
        contexts_used: 5
      }
    };
  }
  
  /**
   * Get the connector status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      authenticated: this.authState.authenticated,
      token_expiry: this.authState.tokenExpiry,
      knowledge_base: this.knowledgeBaseConnected,
      flight_memory: this.flightMemoryConnected,
      fms: this.fmsConnected,
      universal_gateway: this.universalGatewayConnected,
      voice_system: this.voiceSystemActive,
      voice_recognition: this.voiceRecognitionActive,
      session_id: this.sessionId,
      context_length: this.contextWindow.length
    };
  }
  
  /**
   * Clean up resources when done
   */
  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.contextWindow = [];
    console.log('🧹 Dr. Lucy Gateway Connector cleaned up');
  }
}

// Export the connector
window.DrLucyGatewayConnector = DrLucyGatewayConnector;
