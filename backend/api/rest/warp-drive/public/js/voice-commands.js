/**
 * VoiceCommandProcessor Class
 * Handles voice recognition and command processing
 */
class VoiceCommandProcessor {
  /**
   * Initialize the voice command processor
   * @param {SceneManager} sceneManager - Reference to the SceneManager
   */
  constructor(sceneManager) {
    // Dependencies
    this.sceneManager = sceneManager;
    
    // State
    this.isListening = false;
    this.recognition = null;
    this.commandHandlers = {
      'show fleet': () => this.sceneManager.toggleFleet(),
      'hide fleet': () => this.sceneManager.toggleFleet(),
      'fleet': () => this.sceneManager.toggleFleet(),
      'change scene': (sceneName) => this._handleSceneChange(sceneName),
      'go to': (sceneName) => this._handleSceneChange(sceneName),
      'show': (sceneName) => this._handleSceneChange(sceneName)
    };

    // DOM elements
    this.voiceIndicator = document.getElementById('voice-indicator');
    
    // Initialize if browser supports speech recognition
    this._initialize();
  }

  /**
   * Start voice recognition
   */
  start() {
    if (!this.recognition || !CONFIG.voiceCommands.enabled) return;
    
    try {
      this.recognition.start();
      this.isListening = true;
      this._showIndicator();
    } catch (e) {
      console.error('Error starting voice recognition:', e);
    }
  }

  /**
   * Stop voice recognition
   */
  stop() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
      this.isListening = false;
      this._hideIndicator();
    } catch (e) {
      console.error('Error stopping voice recognition:', e);
    }
  }

  /**
   * Toggle voice recognition
   */
  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Initialize speech recognition
   * @private
   */
  _initialize() {
    // Check if voice commands are enabled
    if (!CONFIG.voiceCommands.enabled) {
      console.log('Voice commands are disabled in configuration');
      return;
    }
    
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    // Create recognition instance
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = CONFIG.voiceCommands.language || 'en-US';
    
    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('Voice recognition started');
      this.isListening = true;
      this._showIndicator();
    };
    
    this.recognition.onend = () => {
      console.log('Voice recognition ended');
      this.isListening = false;
      this._hideIndicator();
      
      // Restart recognition after a short delay
      setTimeout(() => {
        if (CONFIG.voiceCommands.enabled) {
          this.start();
        }
      }, 500);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      this._hideIndicator();
      
      // Restart after error (with delay)
      setTimeout(() => {
        if (CONFIG.voiceCommands.enabled) {
          this.start();
        }
      }, 3000);
    };
    
    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim().toLowerCase();
      
      console.log('Voice command recognized:', transcript);
      this._processCommand(transcript);
    };
  }

  /**
   * Process a recognized voice command
   * @param {String} command - The command text
   * @private
   */
  _processCommand(command) {
    let handled = false;
    
    // Check for exact commands
    for (const [key, handler] of Object.entries(this.commandHandlers)) {
      if (command === key) {
        handler();
        handled = true;
        break;
      }
    }
    
    // Check for commands with parameters
    if (!handled) {
      // Scene change commands
      if (command.startsWith('change scene to ')) {
        const sceneName = command.substring('change scene to '.length);
        this._handleSceneChange(sceneName);
        handled = true;
      } else if (command.startsWith('go to ')) {
        const sceneName = command.substring('go to '.length);
        this._handleSceneChange(sceneName);
        handled = true;
      } else if (command.startsWith('show ')) {
        const sceneName = command.substring('show '.length);
        if (sceneName !== 'fleet') {
          this._handleSceneChange(sceneName);
          handled = true;
        }
      }
    }
    
    // Provide feedback if command was handled
    if (handled && CONFIG.voiceCommands.feedback.enabled) {
      this._provideFeedback();
    }
  }

  /**
   * Handle scene change by name
   * @param {String} sceneName - Name of the scene to change to
   * @private
   */
  _handleSceneChange(sceneName) {
    // Find scene by name match
    const scenes = Object.values(this.sceneManager.scenes);
    const scene = scenes.find(s => {
      return s.name.toLowerCase().includes(sceneName.toLowerCase());
    });
    
    if (scene) {
      this.sceneManager.changeScene(scene.id);
    } else {
      console.log(`Scene not found: ${sceneName}`);
    }
  }

  /**
   * Provide feedback for successful command recognition
   * @private
   */
  _provideFeedback() {
    // Visual feedback
    this._pulseIndicator();
    
    // Audio feedback if enabled
    if (CONFIG.voiceCommands.feedback.audio) {
      // Simple beep sound
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1200;
      gainNode.gain.value = 0.1;
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start(0);
      
      // Quick ramp down
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
      oscillator.stop(context.currentTime + 0.3);
    }
  }

  /**
   * Show the voice indicator
   * @private
   */
  _showIndicator() {
    this.voiceIndicator.classList.remove('hidden');
  }

  /**
   * Hide the voice indicator
   * @private
   */
  _hideIndicator() {
    this.voiceIndicator.classList.add('hidden');
  }

  /**
   * Pulse the indicator for feedback
   * @private
   */
  _pulseIndicator() {
    // Add pulse class
    this.voiceIndicator.classList.add('pulse-feedback');
    
    // Remove after animation
    setTimeout(() => {
      this.voiceIndicator.classList.remove('pulse-feedback');
    }, 300);
  }
}