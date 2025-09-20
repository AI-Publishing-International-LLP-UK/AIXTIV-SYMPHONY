/**
 * 🌟 WISH VISION FULL-SCREEN IMMERSIVE EXPERIENCE
 * 
 * Daily.co + Pipecat + Chromeo green-screen integration
 * Private employee wish cloud visualization with PCP interaction
 * Stored in partition 12 (employee-private, never searchable by company)
 */

export class WishVisionExperience {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.containerId = 'wish-vision-fullscreen';
    this.dailyRoom = null;
    this.pipecatClient = null;
    this.chromeoBackground = null;
    this.wishClouds = [];
    this.activeSession = false;
  }

  /**
   * Initialize full-screen Wish Vision experience
   */
  async initializeExperience(userData) {
    console.log('🌟 Initializing Wish Vision for:', userData.name);
    
    // Create full-screen overlay
    const fullscreenHTML = await this.createFullscreenInterface(userData);
    
    // Inject into DOM
    document.body.insertAdjacentHTML('beforeend', fullscreenHTML);
    
    // Initialize all components
    await this.setupDailyCoRoom(userData);
    await this.setupPipecatIntegration(userData);
    await this.setupChromeoBackground();
    await this.loadExistingWishClouds(userData);
    
    // Start session
    this.activeSession = true;
    this.startWishVisionSession(userData);
    
    return this.containerId;
  }

  /**
   * Create full-screen interface structure
   */
  async createFullscreenInterface(userData) {
    return `
      <div class="wish-vision-fullscreen" id="${this.containerId}">
        <!-- Exit Button (Top Right) -->
        <button class="wish-exit-btn" data-action="exit-wish-vision">
          ← EXIT WISH VISION
        </button>

        <!-- Video Container (70% of screen) -->
        <div class="wish-video-container" id="daily-video-container">
          <div class="daily-co-frame" id="daily-frame">
            <!-- Daily.co video call will be injected here -->
          </div>
          
          <!-- Chromeo Green Screen Background -->
          <div class="chromeo-background-overlay" id="chromeo-overlay">
            <!-- Dynamic background changes based on conversation -->
          </div>
        </div>

        <!-- Wish Clouds UI (Bottom 30%) -->
        <div class="wish-clouds-interface">
          <!-- Active Wish Clouds -->
          <div class="wish-clouds-container" id="wish-clouds-display">
            <div class="clouds-header">
              <h3>Your Wish Clouds</h3>
              <div class="cloud-stats">
                <span id="active-clouds-count">0</span> floating • 
                <span id="crystallized-count">0</span> crystallizing
              </div>
            </div>
            
            <!-- Floating Wish Clouds -->
            <div class="wish-clouds-sky" id="clouds-sky">
              <!-- Clouds will be dynamically generated here -->
            </div>
          </div>

          <!-- PCP Conversation Interface -->
          <div class="pcp-conversation-panel">
            <div class="pcp-avatar">
              <div class="pcp-status-indicator active"></div>
              <div class="pcp-name">Your PCP</div>
            </div>
            
            <div class="conversation-suggestions" id="pcp-suggestions">
              <!-- Dynamic suggestions based on wish analysis -->
            </div>
            
            <div class="wish-input-area">
              <input type="text" 
                     id="wish-input" 
                     placeholder="Share a wish, dream, or vision..."
                     class="wish-text-input">
              <button class="create-wish-btn" id="create-wish">
                ✨ CREATE CLOUD
              </button>
            </div>
          </div>
        </div>

        <!-- Session Controls (Floating) -->
        <div class="session-controls">
          <button class="control-btn" data-action="mute-audio">🔊</button>
          <button class="control-btn" data-action="toggle-video">📹</button>
          <button class="control-btn" data-action="change-background">🌅</button>
          <button class="control-btn" data-action="record-session">⏺️</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup Daily.co video room for PCP interaction
   */
  async setupDailyCoRoom(userData) {
    // Create Daily.co room for this wish vision session
    const roomConfig = {
      url: `https://ai-publishing.daily.co/wish-vision-${userData.id}-${Date.now()}`,
      properties: {
        max_participants: 2, // User + PCP
        enable_screenshare: false,
        enable_chat: false,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
        lang: 'en'
      }
    };

    try {
      // Initialize Daily frame
      const dailyFrame = document.getElementById('daily-frame');
      
      // Configure Daily.co call frame
      this.dailyRoom = window.DailyIframe.createFrame(dailyFrame, {
        iframeStyle: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px'
        },
        showLeaveButton: false,
        showFullscreenButton: false,
        showLocalVideo: true,
        showParticipantName: false
      });

      // Join the room
      await this.dailyRoom.join({
        url: roomConfig.url,
        userName: userData.name
      });

      // Setup Daily.co event handlers
      this.dailyRoom.on('participant-joined', this.handlePCPJoined.bind(this));
      this.dailyRoom.on('participant-left', this.handlePCPLeft.bind(this));
      
      console.log('🎥 Daily.co room initialized');
      
    } catch (error) {
      console.error('Failed to setup Daily.co:', error);
    }
  }

  /**
   * Setup Pipecat integration for conversational AI
   */
  async setupPipecatIntegration(userData) {
    // Initialize Pipecat for real-time conversational AI
    this.pipecatClient = new PipecatClient({
      apiKey: process.env.PIPECAT_API_KEY,
      model: 'PCP-WishVision-Specialist',
      voice: 'computational-smooth', // User's preferred voice
      realtime: true,
      context: {
        user: userData.name,
        session_type: 'wish_vision',
        privacy_level: 'maximum',
        data_storage: 'partition_12_private'
      }
    });

    // Setup Pipecat event handlers
    this.pipecatClient.on('speech-recognized', this.handleUserSpeech.bind(this));
    this.pipecatClient.on('wish-identified', this.createWishCloud.bind(this));
    this.pipecatClient.on('vision-crystallizing', this.crystallizeVision.bind(this));
    
    // Connect Pipecat to Daily.co audio stream
    await this.pipecatClient.connectToDaily(this.dailyRoom);
    
    console.log('🤖 Pipecat PCP integration ready');
  }

  /**
   * Setup Chromeo green-screen background system
   */
  async setupChromeoBackground() {
    const chromeoOverlay = document.getElementById('chromeo-overlay');
    
    // Initialize with default serene background
    this.chromeoBackground = {
      current: 'serene-sky',
      available: [
        'serene-sky',
        'mountain-vista', 
        'ocean-waves',
        'forest-clearing',
        'abstract-flowing',
        'space-nebula',
        'golden-hour',
        'rain-drops'
      ],
      transition: 'fade'
    };

    // Set initial background
    this.changeBackground('serene-sky');
    
    console.log('🌅 Chromeo background system initialized');
  }

  /**
   * Load existing wish clouds from partition 12
   */
  async loadExistingWishClouds(userData) {
    try {
      // Fetch from private partition 12 (never searchable by company)
      const storageAdapter = await import('../storage/partition-12.js');
      const existingClouds = await storageAdapter.fetchUserWishClouds(userData.id);
      
      this.wishClouds = existingClouds || [];
      
      // Render existing clouds in the sky
      this.renderWishClouds();
      
      // Update counters
      this.updateCloudStats();
      
      console.log(`☁️ Loaded ${this.wishClouds.length} existing wish clouds`);
      
    } catch (error) {
      console.error('Failed to load wish clouds:', error);
      this.wishClouds = [];
    }
  }

  /**
   * Start active wish vision session
   */
  async startWishVisionSession(userData) {
    // PCP welcome message
    const welcomeMessage = `Welcome to Wish Vision, ${userData.name}. This is your private space to explore dreams, wishes, and visions. Everything shared here remains completely private - your company will never see this data. What's on your mind today?`;
    
    // Speak welcome through Pipecat
    await this.pipecatClient.speak(welcomeMessage);
    
    // Start listening for wishes
    this.startWishListening();
    
    // Setup event handlers
    this.attachWishVisionEventHandlers();
    
    console.log('🌟 Wish Vision session active');
  }

  /**
   * Handle user speech recognition for wish identification
   */
  async handleUserSpeech(speechData) {
    const { text, confidence, wishKeywords } = speechData;
    
    // If wish-related keywords detected
    if (wishKeywords && wishKeywords.length > 0) {
      // Automatically create wish cloud
      await this.createWishCloud({
        text: text,
        keywords: wishKeywords,
        confidence: confidence,
        source: 'speech',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update PCP conversation suggestions
    this.updatePCPSuggestions(text);
  }

  /**
   * Create new wish cloud from user input
   */
  async createWishCloud(wishData) {
    const newCloud = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: wishData.text,
      keywords: wishData.keywords || [],
      status: 'floating',
      created: new Date().toISOString(),
      position: this.getRandomCloudPosition(),
      color: this.getWishCloudColor(wishData.keywords),
      size: this.calculateCloudSize(wishData.text.length),
      energy: 1.0 // How active/bright the cloud appears
    };
    
    // Add to clouds array
    this.wishClouds.push(newCloud);
    
    // Render new cloud with animation
    this.animateNewCloud(newCloud);
    
    // Save to private partition 12
    await this.saveWishCloud(newCloud);
    
    // Update stats
    this.updateCloudStats();
    
    // PCP response
    await this.pipecatClient.speak(`I see a new wish forming... "${wishData.text}". Tell me more about this vision.`);
    
    console.log('☁️ New wish cloud created:', newCloud.id);
  }

  /**
   * Crystallize wish into actionable project
   */
  async crystallizeVision(wishId) {
    const cloud = this.wishClouds.find(c => c.id === wishId);
    if (!cloud) {return;}
    
    // Change cloud status
    cloud.status = 'crystallizing';
    cloud.energy = 2.0;
    
    // Visual transformation
    this.animateCloudCrystallization(cloud);
    
    // PCP guides crystallization process
    const crystallizationPrompt = `Your wish "${cloud.text}" is ready to crystallize into reality. What's the first concrete step you'd like to take?`;
    await this.pipecatClient.speak(crystallizationPrompt);
    
    // Update storage
    await this.saveWishCloud(cloud);
    
    console.log('💎 Vision crystallizing:', cloud.id);
  }

  /**
   * Render wish clouds in the sky interface
   */
  renderWishClouds() {
    const cloudsSky = document.getElementById('clouds-sky');
    cloudsSky.innerHTML = '';
    
    this.wishClouds.forEach(cloud => {
      const cloudElement = document.createElement('div');
      cloudElement.className = `wish-cloud ${cloud.status}`;
      cloudElement.id = cloud.id;
      cloudElement.style.cssText = `
        left: ${cloud.position.x}%;
        top: ${cloud.position.y}%;
        background: ${cloud.color};
        width: ${cloud.size}px;
        height: ${cloud.size * 0.6}px;
        opacity: ${cloud.energy};
        animation: float-cloud ${3 + Math.random() * 2}s ease-in-out infinite;
      `;
      
      cloudElement.innerHTML = `
        <div class="cloud-content">
          <div class="cloud-text">${cloud.text.substring(0, 50)}...</div>
          <div class="cloud-actions">
            <button class="cloud-btn" data-action="expand" data-cloud="${cloud.id}">↗</button>
            <button class="cloud-btn" data-action="crystallize" data-cloud="${cloud.id}">💎</button>
          </div>
        </div>
      `;
      
      // Add click handler for cloud interaction
      cloudElement.addEventListener('click', () => this.expandWishCloud(cloud.id));
      
      cloudsSky.appendChild(cloudElement);
    });
  }

  /**
   * Change Chromeo background based on conversation mood
   */
  changeBackground(backgroundType) {
    const chromeoOverlay = document.getElementById('chromeo-overlay');
    
    const backgrounds = {
      'serene-sky': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)',
      'mountain-vista': 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 50%, #e17055 100%)',
      'ocean-waves': 'linear-gradient(135deg, #00b894 0%, #00cec9 50%, #74b9ff 100%)',
      'forest-clearing': 'linear-gradient(135deg, #55a3ff 0%, #003d82 50%, #2d3436 100%)',
      'abstract-flowing': 'linear-gradient(45deg, #6c5ce7, #a29bfe, #fd79a8, #fdcb6e)',
      'space-nebula': 'radial-gradient(circle, #2d3436 0%, #636e72 30%, #6c5ce7 70%, #fd79a8 100%)',
      'golden-hour': 'linear-gradient(135deg, #fdcb6e 0%, #fd79a8 50%, #e84393 100%)',
      'rain-drops': 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)'
    };
    
    chromeoOverlay.style.background = backgrounds[backgroundType] || backgrounds['serene-sky'];
    chromeoOverlay.style.opacity = '0.3';
    
    this.chromeoBackground.current = backgroundType;
  }

  /**
   * Attach event handlers for Wish Vision interface
   */
  attachWishVisionEventHandlers() {
    // Exit button
    document.querySelector('.wish-exit-btn').addEventListener('click', () => {
      this.exitWishVision();
    });
    
    // Create wish button
    document.getElementById('create-wish').addEventListener('click', () => {
      const wishInput = document.getElementById('wish-input');
      if (wishInput.value.trim()) {
        this.createWishCloud({
          text: wishInput.value.trim(),
          source: 'typed'
        });
        wishInput.value = '';
      }
    });
    
    // Session controls
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleSessionControl(action);
      });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.exitWishVision();
      }
    });
  }

  /**
   * Exit Wish Vision experience
   */
  async exitWishVision() {
    // Save session data
    await this.saveWishVisionSession();
    
    // Cleanup Daily.co
    if (this.dailyRoom) {
      await this.dailyRoom.leave();
      this.dailyRoom.destroy();
    }
    
    // Cleanup Pipecat
    if (this.pipecatClient) {
      await this.pipecatClient.disconnect();
    }
    
    // Remove fullscreen interface
    const fullscreenElement = document.getElementById(this.containerId);
    if (fullscreenElement) {
      fullscreenElement.remove();
    }
    
    this.activeSession = false;
    console.log('🌟 Wish Vision session ended');
  }

  /**
   * Save wish cloud to private partition 12
   */
  async saveWishCloud(cloud) {
    try {
      const storageAdapter = await import('../storage/partition-12.js');
      await storageAdapter.saveWishCloud(cloud, {
        privacy: 'employee-only',
        searchable: false,
        encrypted: true
      });
    } catch (error) {
      console.error('Failed to save wish cloud:', error);
    }
  }

  /**
   * Utility functions
   */
  getRandomCloudPosition() {
    return {
      x: Math.random() * 80 + 10, // 10% to 90% from left
      y: Math.random() * 60 + 10  // 10% to 70% from top
    };
  }
  
  getWishCloudColor(keywords) {
    const colorMap = {
      'business': '#74b9ff',
      'creative': '#fd79a8', 
      'travel': '#00b894',
      'learning': '#fdcb6e',
      'relationship': '#e17055',
      'health': '#55a3ff'
    };
    
    // Default to purple for general wishes
    return colorMap[keywords?.[0]] || '#a29bfe';
  }
  
  calculateCloudSize(textLength) {
    return Math.max(80, Math.min(200, textLength * 2));
  }
  
  updateCloudStats() {
    const activeCount = this.wishClouds.filter(c => c.status === 'floating').length;
    const crystallizedCount = this.wishClouds.filter(c => c.status === 'crystallizing').length;
    
    document.getElementById('active-clouds-count').textContent = activeCount;
    document.getElementById('crystallized-count').textContent = crystallizedCount;
  }
}

// CSS Styles for Wish Vision
export const wishVisionStyles = `
  .wish-vision-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000000;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .wish-exit-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
  }

  .wish-video-container {
    height: 70%;
    position: relative;
    overflow: hidden;
  }

  .daily-co-frame {
    width: 100%;
    height: 100%;
    border-radius: 12px;
  }

  .chromeo-background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    transition: all 0.5s ease;
  }

  .wish-clouds-interface {
    height: 30%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    padding: 20px;
    gap: 20px;
  }

  .wish-clouds-container {
    flex: 2;
    position: relative;
  }

  .clouds-header {
    margin-bottom: 16px;
  }

  .clouds-header h3 {
    color: white;
    margin: 0 0 8px 0;
    font-size: 18px;
  }

  .cloud-stats {
    color: #999;
    font-size: 12px;
  }

  .wish-clouds-sky {
    position: relative;
    height: 200px;
    overflow: hidden;
  }

  .wish-cloud {
    position: absolute;
    border-radius: 50px;
    padding: 8px 16px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .wish-cloud:hover {
    transform: scale(1.1);
    opacity: 1 !important;
  }

  .wish-cloud.crystallizing {
    animation: crystallize 2s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  }

  @keyframes float-cloud {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes crystallize {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); box-shadow: 0 0 30px rgba(255, 255, 255, 0.8); }
  }

  .cloud-content {
    font-size: 12px;
    text-align: center;
  }

  .cloud-text {
    margin-bottom: 4px;
  }

  .cloud-actions {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .cloud-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 10px;
  }

  .pcp-conversation-panel {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pcp-avatar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .pcp-status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00cc66;
  }

  .pcp-name {
    color: white;
    font-size: 14px;
    font-weight: 500;
  }

  .wish-input-area {
    display: flex;
    gap: 8px;
    margin-top: auto;
  }

  .wish-text-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 8px 12px;
    color: white;
    font-size: 14px;
  }

  .wish-text-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .create-wish-btn {
    background: #6c5ce7;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
  }

  .session-controls {
    position: absolute;
    bottom: 20px;
    left: 20px;
    display: flex;
    gap: 8px;
  }

  .control-btn {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    font-size: 16px;
  }
`;

export default WishVisionExperience;