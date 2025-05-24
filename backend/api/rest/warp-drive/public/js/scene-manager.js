/**
 * SceneManager Class
 * Manages scenes, transitions, and UI state for the Vision Space interface
 */
class SceneManager {
  /**
   * Initialize the Scene Manager
   */
  constructor() {
    // DOM Elements
    this.sceneTitle = document.getElementById('scene-title');
    this.sceneSelect = document.getElementById('scene-select');
    this.fleetView = document.getElementById('fleet-view');
    this.fleetToggle = document.getElementById('toggle-fleet');
    this.closeFleet = document.getElementById('close-fleet');
    this.timepressersContainer = document.getElementById('timepressers-container');
    this.timelinersContainer = document.getElementById('timeliners-container');
    this.fleetTabs = document.querySelectorAll('.fleet-tab');
    this.craftDetailModal = document.getElementById('craft-detail-modal');
    this.craftDetailContainer = document.getElementById('craft-detail-container');
    this.closeModal = document.querySelector('.close-modal');
    this.welcomeOverlay = document.getElementById('welcome-overlay');
    this.startExperience = document.getElementById('start-experience');
    
    // State
    this.scenes = {};
    this.currentScene = null;
    this.isFleetVisible = false;
    this.chromaKey = null;
    
    // Audio
    this.ambientAudio = new Audio();
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0.3;
    
    // Initialize data
    this._initScenes();
    
    // Set up event listeners
    this._setupEventListeners();
  }

  /**
   * Set the ChromaKey instance to control
   * @param {ChromaKey} chromaKey - The ChromaKey instance
   */
  setChromaKey(chromaKey) {
    this.chromaKey = chromaKey;
  }

  /**
   * Change to a specific scene
   * @param {String} sceneId - ID of the scene to change to
   * @returns {Promise} Promise that resolves when the scene change is complete
   */
  async changeScene(sceneId) {
    // Find the scene
    const scene = this.scenes[sceneId];
    if (!scene) {
      console.error(`Scene not found: ${sceneId}`);
      return Promise.reject(`Scene not found: ${sceneId}`);
    }
    
    // Update UI with fade transition
    this._fadeElement(this.sceneTitle, () => {
      this.sceneTitle.textContent = scene.name;
    });
    
    // Update select element
    this.sceneSelect.value = sceneId;
    
    // Load background if ChromaKey is available
    if (this.chromaKey) {
      try {
        await this.chromaKey.setBackground(scene.background);
      } catch (error) {
        console.error('Error loading background:', error);
      }
    }
    
    // Change ambient audio with crossfade
    if (scene.ambientSound) {
      this._changeAudio(scene.ambientSound);
    }
    
    // Update current scene
    this.currentScene = sceneId;
    
    return Promise.resolve();
  }

  /**
   * Toggle the fleet view visibility
   */
  toggleFleet() {
    this.isFleetVisible = !this.isFleetVisible;
    this.fleetView.classList.toggle('hidden', !this.isFleetVisible);
  }

  /**
   * Show the welcome screen
   */
  showWelcome() {
    this.welcomeOverlay.classList.remove('hidden');
  }

  /**
   * Hide the welcome screen
   */
  hideWelcome() {
    this._fadeElement(this.welcomeOverlay, null, true);
  }

  /**
   * Initialize scenes from configuration
   * @private
   */
  _initScenes() {
    // Clear existing
    this.scenes = {};
    
    // Get scenes from config
    const configScenes = CONFIG.scenes.availableScenes;
    
    // Add scenes from configuration
    configScenes.forEach(scene => {
      if (scene.active) {
        this.scenes[scene.id] = scene;
      }
    });
    
    // Initialize scene selector
    this._updateSceneSelector();
    
    // Set default scene
    const defaultScene = CONFIG.scenes.default || 
                        (configScenes.length > 0 ? configScenes[0].id : null);
    
    if (defaultScene) {
      this.currentScene = defaultScene;
      this.sceneTitle.textContent = this.scenes[defaultScene].name;
      this.sceneSelect.value = defaultScene;
    }
  }

  /**
   * Update the scene selector dropdown with available scenes
   * @private
   */
  _updateSceneSelector() {
    // Clear existing options
    this.sceneSelect.innerHTML = '';
    
    // Add options for each scene
    Object.values(this.scenes).forEach(scene => {
      const option = document.createElement('option');
      option.value = scene.id;
      option.textContent = scene.name;
      this.sceneSelect.appendChild(option);
    });
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Scene selection change
    this.sceneSelect.addEventListener('change', (e) => {
      this.changeScene(e.target.value);
    });
    
    // Fleet toggle
    this.fleetToggle.addEventListener('click', () => {
      this.toggleFleet();
    });
    
    // Close fleet button
    this.closeFleet.addEventListener('click', () => {
      this.toggleFleet();
    });
    
    // Fleet tabs
    this.fleetTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const fleetType = tab.dataset.fleet;
        
        // Update tab active state
        this.fleetTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update visible fleet group
        document.querySelectorAll('.fleet-group').forEach(g => {
          g.classList.remove('active');
        });
        document.getElementById(`${fleetType}-container`).classList.add('active');
      });
    });
    
    // Close modal
    this.closeModal.addEventListener('click', () => {
      this.craftDetailModal.classList.add('hidden');
    });
    
    // Start experience button
    this.startExperience.addEventListener('click', () => {
      this.hideWelcome();
    });
    
    // Initialize fleet items
    this._initFleetItems();
  }

  /**
   * Initialize fleet items from data
   * @private
   */
  _initFleetItems() {
    // Initialize Timeliners
    FLEET_DATA.timeliners.forEach(craft => {
      if (craft.active) {
        const element = this._createCraftElement(craft);
        this.timelinersContainer.appendChild(element);
      }
    });
    
    // Initialize Timepressers
    FLEET_DATA.timepressers.forEach(craft => {
      if (craft.active) {
        const element = this._createCraftElement(craft);
        this.timepressersContainer.appendChild(element);
      }
    });
  }

  /**
   * Create a craft element for the fleet view
   * @param {Object} craft - Craft data
   * @returns {HTMLElement} The created element
   * @private
   */
  _createCraftElement(craft) {
    const element = document.createElement('div');
    element.className = 'craft-card';
    element.setAttribute('data-id', craft.id);
    
    // Create craft content
    element.innerHTML = `
      <div class="craft-image" style="background-image: url('${craft.image}')"></div>
      <div class="craft-info">
        <div class="craft-name">${craft.name}</div>
        <div class="craft-type ${craft.type.toLowerCase()}">${craft.type}</div>
        <div class="craft-description">${craft.description}</div>
      </div>
    `;
    
    // Add click event for showing details
    element.addEventListener('click', () => {
      this._showCraftDetails(craft);
    });
    
    return element;
  }

  /**
   * Show detailed information about a craft
   * @param {Object} craft - Craft data
   * @private
   */
  _showCraftDetails(craft) {
    // Create detail view
    this.craftDetailContainer.innerHTML = `
      <div class="craft-detail-header">
        <img src="${craft.image}" alt="${craft.name}" class="craft-detail-image">
        <div class="craft-detail-title">
          <h2>${craft.name}</h2>
          <div class="craft-type ${craft.type.toLowerCase()}">${craft.type}</div>
          <p>${craft.description}</p>
          ${craft.specs && craft.specs.mintMark ? `<div class="mint-mark">${craft.specs.mintMark}</div>` : ''}
        </div>
      </div>
      
      <div class="craft-detail-specs">
        <h3>Specifications</h3>
        <div class="specs-grid">
          ${this._createSpecsHTML(craft.specs)}
        </div>
      </div>
      
      <div class="craft-detail-features">
        <h3>Features</h3>
        <ul>
          ${craft.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
      
      ${craft.wallet ? `
      <div class="craft-detail-wallet">
        <h3>Queen Mint Mark Owner's Wallet</h3>
        <div class="wallet-info">
          <div class="wallet-certification">
            <span class="label">Certification:</span> 
            <span class="value">${craft.wallet.certification}</span>
          </div>
          <div class="wallet-security">
            <span class="label">Security Level:</span> 
            <span class="value">${craft.wallet.securityLevel}</span>
          </div>
          <div class="wallet-transferable">
            <span class="label">Transferable:</span> 
            <span class="value">${craft.wallet.transferable ? 'Yes' : 'No'}</span>
          </div>
        </div>
        
        <div class="wallet-features">
          <h4>Wallet Features</h4>
          <ul>
            ${this._getWalletFeaturesHTML(craft.wallet.certification)}
          </ul>
        </div>
      </div>
      ` : ''}
      
      <div class="craft-detail-footer">
        <div class="antigravity-badge">Antigravity Powercraft</div>
      </div>
    `;
    
    // Show modal
    this.craftDetailModal.classList.remove('hidden');
  }
  
  /**
   * Get wallet features HTML based on certification level
   * @param {String} certification - Wallet certification level
   * @returns {String} HTML for wallet features
   * @private
   */
  _getWalletFeaturesHTML(certification) {
    // Find matching wallet type in mintMarks data
    let walletType = '';
    
    if (certification === 'Standard' || certification === 'Future Standard') {
      walletType = 'Standard';
    } else if (certification === 'Enhanced' || certification === 'Future Enhanced') {
      walletType = 'Enhanced';
    } else if (certification === 'Premium' || certification === 'Future Premium') {
      walletType = 'Premium';
    } else if (certification === 'Executive') {
      walletType = 'Executive';
    } else if (certification === 'Sovereign') {
      walletType = 'Sovereign';
    }
    
    // Get wallet features from mintMarks data
    const walletTypeInfo = FLEET_DATA.mintMarks.walletTypes.find(w => w.type === walletType);
    
    if (walletTypeInfo && walletTypeInfo.features) {
      return walletTypeInfo.features.map(feature => `<li>${feature}</li>`).join('');
    }
    
    return '<li>No wallet features available</li>';
  }

  /**
   * Create HTML for specs display
   * @param {Object} specs - Specifications object
   * @returns {String} HTML string
   * @private
   */
  _createSpecsHTML(specs) {
    return Object.entries(specs).map(([key, value]) => `
      <div class="spec-item">
        <div class="spec-label">${this._formatSpecLabel(key)}</div>
        <div class="spec-value">${value}</div>
      </div>
    `).join('');
  }

  /**
   * Format a spec label for display
   * @param {String} label - The raw label
   * @returns {String} Formatted label
   * @private
   */
  _formatSpecLabel(label) {
    return label.charAt(0).toUpperCase() + 
           label.slice(1).replace(/([A-Z])/g, ' $1');
  }

  /**
   * Fade an element in or out
   * @param {HTMLElement} element - Element to fade
   * @param {Function} callback - Optional callback when fade completes
   * @param {Boolean} fadeOut - True to fade out, false to fade in
   * @private
   */
  _fadeElement(element, callback, fadeOut = false) {
    // Set initial state
    element.style.transition = 'opacity 0.5s ease-in-out';
    
    if (fadeOut) {
      element.style.opacity = '0';
      setTimeout(() => {
        element.classList.add('hidden');
        if (callback) callback();
      }, 500);
    } else {
      element.style.opacity = '0';
      setTimeout(() => {
        if (callback) callback();
        setTimeout(() => {
          element.style.opacity = '1';
        }, 50);
      }, 500);
    }
  }

  /**
   * Change the ambient audio with crossfade
   * @param {String} src - New audio source
   * @private
   */
  _changeAudio(src) {
    // Create new audio element
    const newAudio = new Audio(src);
    newAudio.loop = true;
    newAudio.volume = 0;
    
    // Start new audio
    newAudio.play().catch(err => {
      console.warn('Could not play audio:', err);
    });
    
    // Crossfade
    let volume = 0.3;
    const fadeInterval = setInterval(() => {
      volume -= 0.02;
      if (volume <= 0) {
        this.ambientAudio.pause();
        clearInterval(fadeInterval);
        this.ambientAudio = newAudio;
      } else {
        this.ambientAudio.volume = volume;
        newAudio.volume = 0.3 - volume;
      }
    }, 50);
  }
}