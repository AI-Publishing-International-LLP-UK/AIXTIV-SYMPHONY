/**
 * VisionSpaceApp Class
 * Main application class for Vision Space interface
 */
class VisionSpaceApp {
  /**
   * Initialize the Vision Space application
   */
  constructor() {
    // Application components
    this.chromaKey = null;
    this.sceneManager = null;
    this.voiceCommands = null;
    this.firebaseManager = null;
    this.wishVisionClouds = null;
    this.rixCrxCopilot = null;
    
    // DOM elements
    this.video = document.getElementById('video-source');
    this.canvas = document.getElementById('output-canvas');
    this.startButton = document.getElementById('start-experience');
    this.toggleCopilotButton = document.getElementById('toggle-copilot');
    
    // Configuration
    this.config = {
      useWebcam: CONFIG.app.useWebcam,
      autoWelcome: CONFIG.app.autoWelcome,
      debugMode: CONFIG.app.debugMode,
      enableWishVision: true,
      enableRixCrxCopilot: true
    };
    
    // Initialize application when DOM is ready
    document.addEventListener('DOMContentLoaded', () => this.init());
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize components
      console.log('Initializing Vision Space...');
      
      // Initialize the scene manager first
      this._initSceneManager();
      
      // Initialize Firebase integration
      this._initFirebase();
      
      // Initialize chroma key processor
      await this._initChromaKey();
      
      // Initialize voice commands
      this._initVoiceCommands();
      
      // Initialize WishVision Clouds
      if (this.config.enableWishVision) {
        this._initWishVisionClouds();
      }
      
      // Initialize RIX CRx Copilot
      if (this.config.enableRixCrxCopilot) {
        this._initRixCrxCopilot();
      }
      
      // Start the experience if auto welcome is enabled
      if (this.config.autoWelcome) {
        this.sceneManager.showWelcome();
      } else {
        this.startExperience();
      }
      
      // Debug mode
      if (this.config.debugMode) {
        this._initDebugMode();
      }
      
      console.log('Vision Space initialized successfully');
    } catch (error) {
      console.error('Error initializing Vision Space:', error);
    }
  }

  /**
   * Start the Vision Space experience
   */
  startExperience() {
    // Hide welcome screen
    this.sceneManager.hideWelcome();
    
    // Start video processing
    this.chromaKey.start();
    
    // Start voice commands if enabled
    if (this.voiceCommands && CONFIG.voiceCommands.enabled) {
      this.voiceCommands.start();
    }
    
    // Switch to default scene
    const defaultScene = CONFIG.scenes.default || Object.keys(this.sceneManager.scenes)[0];
    if (defaultScene) {
      this.sceneManager.changeScene(defaultScene);
    }
  }

  /**
   * Initialize the chroma key processor
   * @private
   */
  async _initChromaKey() {
    console.log('Initializing Chroma Key...');
    
    // Create chroma key processor
    this.chromaKey = new ChromaKey(CONFIG.chromaKey);
    
    // Initialize video source
    if (this.config.useWebcam) {
      await this._initWebcam();
    }
    
    // Initialize with default background
    const defaultScene = this.sceneManager.scenes[CONFIG.scenes.default];
    const defaultBackground = defaultScene ? defaultScene.background : null;
    
    // Initialize chroma key with video and canvas
    await this.chromaKey.initialize(this.video, this.canvas, defaultBackground);
    
    // Add chroma key reference to scene manager
    this.sceneManager.setChromaKey(this.chromaKey);
  }

  /**
   * Initialize the webcam video source
   * @private
   */
  async _initWebcam() {
    console.log('Initializing webcam...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      this.video.srcObject = stream;
      
      // Wait for video to be ready
      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing webcam:', error);
      
      // Fallback to a green screen
      this._createGreenScreenFallback();
      return Promise.resolve();
    }
  }

  /**
   * Create a fallback green screen when webcam is not available
   * @private
   */
  _createGreenScreenFallback() {
    console.log('Creating green screen fallback...');
    
    // Create a canvas to generate a green video
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 640;
    fallbackCanvas.height = 480;
    const ctx = fallbackCanvas.getContext('2d');
    
    // Fill with green
    ctx.fillStyle = CONFIG.chromaKey.keyColor || '#00FF00';
    ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
    
    // Add some text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Webcam not available', fallbackCanvas.width / 2, fallbackCanvas.height / 2 - 20);
    ctx.fillText('Using green screen fallback', fallbackCanvas.width / 2, fallbackCanvas.height / 2 + 20);
    
    // Create a fake video stream from the canvas
    const stream = fallbackCanvas.captureStream(30); // 30 FPS
    this.video.srcObject = stream;
    this.video.play();
  }

  /**
   * Initialize the scene manager
   * @private
   */
  _initSceneManager() {
    console.log('Initializing Scene Manager...');
    
    // Create scene manager
    this.sceneManager = new SceneManager();
    
    // Add event listener for start experience button
    this.startButton.addEventListener('click', () => {
      this.startExperience();
    });
  }

  /**
   * Initialize the voice command processor
   * @private
   */
  _initVoiceCommands() {
    console.log('Initializing Voice Commands...');
    
    // Create voice command processor
    this.voiceCommands = new VoiceCommandProcessor(this.sceneManager);
  }

  /**
   * Initialize Firebase integration
   * @private
   */
  _initFirebase() {
    console.log('Initializing Firebase integration...');
    
    // Create Firebase manager
    this.firebaseManager = new FirebaseManager(this.sceneManager);
  }

  /**
   * Initialize debug mode
   * @private
   */
  _initDebugMode() {
    console.log('Debug mode enabled');
    
    // Add debug UI
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10px';
    debugDiv.style.left = '10px';
    debugDiv.style.padding = '10px';
    debugDiv.style.background = 'rgba(0, 0, 0, 0.7)';
    debugDiv.style.color = 'white';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.zIndex = '1000';
    debugDiv.style.borderRadius = '5px';
    
    // Add debug buttons
    const toggleVoiceButton = document.createElement('button');
    toggleVoiceButton.textContent = 'Toggle Voice';
    toggleVoiceButton.style.marginRight = '5px';
    toggleVoiceButton.addEventListener('click', () => {
      if (this.voiceCommands) {
        this.voiceCommands.toggle();
      }
    });
    
    const toggleFleetButton = document.createElement('button');
    toggleFleetButton.textContent = 'Toggle Fleet';
    toggleFleetButton.style.marginRight = '5px';
    toggleFleetButton.addEventListener('click', () => {
      this.sceneManager.toggleFleet();
    });
    
    const toggleWishCloudsButton = document.createElement('button');
    toggleWishCloudsButton.textContent = 'Toggle WishClouds';
    toggleWishCloudsButton.style.marginRight = '5px';
    toggleWishCloudsButton.addEventListener('click', () => {
      if (this.wishVisionClouds) {
        this.wishVisionClouds.toggle();
      }
    });
    
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload App';
    reloadButton.addEventListener('click', () => {
      location.reload();
    });
    
    debugDiv.appendChild(toggleVoiceButton);
    debugDiv.appendChild(toggleFleetButton);
    debugDiv.appendChild(toggleWishCloudsButton);
    debugDiv.appendChild(reloadButton);
    
    document.body.appendChild(debugDiv);
  }
  
  /**
   * Initialize the WishVision Clouds
   * @private
   */
  _initWishVisionClouds() {
    console.log('Initializing WishVision Clouds...');
    
    // Create WishVision Clouds
    this.wishVisionClouds = new WishVisionClouds(document.getElementById('vision-space'), {
      maxClouds: 7,
      minSize: 150,
      maxSize: 300
    });
    
    // Add some initial wishes
    this.wishVisionClouds.addWish({
      text: "Seamless transitions between all Vision Space scenes",
      pilotId: "System",
      config: {
        priority: "Medium"
      }
    });
    
    this.wishVisionClouds.addWish({
      text: "Real-time fleet status updates from all pilots",
      pilotId: "System",
      config: {
        priority: "High"
      }
    });
  }
  
  /**
   * Initialize the RIX CRx Copilot
   * @private
   */
  _initRixCrxCopilot() {
    console.log('Initializing RIX CRx Copilot...');
    
    // Create RIX CRx Copilot
    this.rixCrxCopilot = new RIXCRXCopilot({
      pilotId: "Vision Pilot Alpha",
      assistanceLevel: "Advanced",
      voiceEnabled: true
    });
    
    // Connect to WishVision
    if (this.wishVisionClouds) {
      this.rixCrxCopilot.setWishVision(this.wishVisionClouds);
    }
    
    // Set up toggle button
    if (this.toggleCopilotButton) {
      this.toggleCopilotButton.addEventListener('click', () => {
        this.rixCrxCopilot.toggle(document.getElementById('vision-space'));
      });
    }
    
    // Default craft
    setTimeout(() => {
      if (FLEET_DATA && FLEET_DATA.timeliners && FLEET_DATA.timeliners.length > 0) {
        this.rixCrxCopilot.setCraft(FLEET_DATA.timeliners[0]);
      }
    }, 2000);
  }
}

// Create the application instance
const app = new VisionSpaceApp();