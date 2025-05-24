/**
 * RIX CRx Copilot Class
 * Advanced pilot configuration and assistance system for Antigravity Powercraft
 */
class RIXCRXCopilot {
  /**
   * Initialize the RIX CRx Copilot
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Configuration
    this.config = {
      pilotId: options.pilotId || 'Default Pilot',
      craftId: options.craftId || null,
      assistanceLevel: options.assistanceLevel || 'Standard',
      voiceEnabled: options.voiceEnabled !== undefined ? options.voiceEnabled : true,
      autoSuggestions: options.autoSuggestions !== undefined ? options.autoSuggestions : true,
      interfaceMode: options.interfaceMode || 'Full',
      responseTime: options.responseTime || 'Balanced',
      ...options
    };
    
    // State
    this.isActive = false;
    this.currentCraft = null;
    this.pilotProfile = null;
    this.suggestedActions = [];
    this.wishVision = null;
    
    // DOM Elements
    this.copilotContainer = null;
    this.copilotInterface = null;
    this.craftInfoPanel = null;
    this.pilotPanel = null;
    this.actionsPanel = null;
    
    // Initialize
    this._initialize();
  }

  /**
   * Activate the RIX CRx Copilot
   * @param {HTMLElement} container - The container element for the copilot interface
   */
  activate(container) {
    if (!container) {
      console.error('No container provided for RIX CRx Copilot');
      return;
    }
    
    // Set up the copilot container
    this.copilotContainer = container;
    
    // Create the copilot interface
    this._createInterface();
    
    // Set active state
    this.isActive = true;
    
    // Load pilot profile
    this._loadPilotProfile();
    
    // Announce activation
    this._announceStatus('RIX CRx Copilot system activated');
    
    // Show the interface
    this._showInterface();
  }

  /**
   * Deactivate the RIX CRx Copilot
   */
  deactivate() {
    if (!this.isActive) return;
    
    // Hide the interface
    this._hideInterface();
    
    // Announce deactivation
    this._announceStatus('RIX CRx Copilot system deactivated');
    
    // Set inactive state
    this.isActive = false;
  }

  /**
   * Toggle the RIX CRx Copilot activation state
   * @param {HTMLElement} container - The container element (only needed for activation)
   */
  toggle(container) {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate(container);
    }
  }

  /**
   * Set the current craft for the copilot
   * @param {Object} craft - The craft data
   */
  setCraft(craft) {
    if (!craft) return;
    
    this.currentCraft = craft;
    
    // Update craft info panel
    if (this.craftInfoPanel) {
      this._updateCraftInfo();
    }
    
    // Generate suggested actions based on the craft
    this._generateSuggestedActions();
    
    // Announce craft connection
    this._announceStatus(`Connected to ${craft.name}`);
  }

  /**
   * Set the pilot for the copilot
   * @param {Object} pilotData - The pilot data
   */
  setPilot(pilotData) {
    if (!pilotData) return;
    
    this.config.pilotId = pilotData.id || pilotData.name || this.config.pilotId;
    this.pilotProfile = pilotData;
    
    // Update pilot panel
    if (this.pilotPanel) {
      this._updatePilotInfo();
    }
    
    // Announce pilot configuration
    this._announceStatus(`Pilot ${this.config.pilotId} configured`);
  }

  /**
   * Add a wish to the WishVision Clouds
   * @param {String} wishText - The wish text
   * @param {Object} config - Optional configuration for the wish
   * @returns {String} The ID of the created wish
   */
  addWish(wishText, config = {}) {
    if (!this.wishVision) return null;
    
    const wishId = `wish-${Date.now()}`;
    const wish = {
      id: wishId,
      text: wishText,
      pilotId: this.config.pilotId,
      config: config
    };
    
    return this.wishVision.addWish(wish);
  }

  /**
   * Set the WishVision Clouds instance
   * @param {WishVisionClouds} wishVision - The WishVision Clouds instance
   */
  setWishVision(wishVision) {
    this.wishVision = wishVision;
  }

  /**
   * Update the copilot configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    // Update the interface if active
    if (this.isActive) {
      this._updateInterface();
    }
    
    // Announce configuration update
    this._announceStatus('Copilot configuration updated');
  }

  /**
   * Initialize the RIX CRx Copilot
   * @private
   */
  _initialize() {
    // Create empty pilot profile
    this.pilotProfile = {
      id: this.config.pilotId,
      name: this.config.pilotId,
      rank: 'Standard',
      experience: 0,
      specializations: [],
      preferences: {}
    };
  }

  /**
   * Create the copilot interface
   * @private
   */
  _createInterface() {
    // Create main interface container
    this.copilotInterface = document.createElement('div');
    this.copilotInterface.className = 'rix-crx-copilot';
    this.copilotInterface.style.opacity = '0';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'copilot-header';
    header.innerHTML = `
      <div class="copilot-title">RIX CRx Copilot</div>
      <div class="copilot-status">Status: Active</div>
      <button class="copilot-toggle">Deactivate</button>
    `;
    
    // Create craft info panel
    this.craftInfoPanel = document.createElement('div');
    this.craftInfoPanel.className = 'copilot-panel craft-info-panel';
    this.craftInfoPanel.innerHTML = '<h3>Craft Information</h3><div class="panel-content"></div>';
    
    // Create pilot panel
    this.pilotPanel = document.createElement('div');
    this.pilotPanel.className = 'copilot-panel pilot-panel';
    this.pilotPanel.innerHTML = '<h3>Pilot Configuration</h3><div class="panel-content"></div>';
    
    // Create actions panel
    this.actionsPanel = document.createElement('div');
    this.actionsPanel.className = 'copilot-panel actions-panel';
    this.actionsPanel.innerHTML = '<h3>Suggested Actions</h3><div class="panel-content"></div>';
    
    // Create wishes panel
    const wishesPanel = document.createElement('div');
    wishesPanel.className = 'copilot-panel wishes-panel';
    wishesPanel.innerHTML = `
      <h3>WishVision Cloud</h3>
      <div class="panel-content">
        <input type="text" class="wish-input" placeholder="Enter your wish...">
        <button class="wish-submit">Send to Cloud</button>
        <button class="toggle-wish-clouds">Toggle Clouds</button>
      </div>
    `;
    
    // Add all elements to interface
    this.copilotInterface.appendChild(header);
    this.copilotInterface.appendChild(this.craftInfoPanel);
    this.copilotInterface.appendChild(this.pilotPanel);
    this.copilotInterface.appendChild(this.actionsPanel);
    this.copilotInterface.appendChild(wishesPanel);
    
    // Add to container
    this.copilotContainer.appendChild(this.copilotInterface);
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Update panels with initial data
    this._updateCraftInfo();
    this._updatePilotInfo();
    this._updateActionsPanel();
  }

  /**
   * Set up event listeners for the interface
   * @private
   */
  _setupEventListeners() {
    // Toggle button
    const toggleButton = this.copilotInterface.querySelector('.copilot-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.deactivate();
      });
    }
    
    // Wish submit button
    const wishSubmitButton = this.copilotInterface.querySelector('.wish-submit');
    const wishInput = this.copilotInterface.querySelector('.wish-input');
    
    if (wishSubmitButton && wishInput) {
      wishSubmitButton.addEventListener('click', () => {
        const wishText = wishInput.value.trim();
        if (wishText && this.wishVision) {
          this.addWish(wishText);
          wishInput.value = '';
        }
      });
      
      // Also submit on Enter key
      wishInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const wishText = wishInput.value.trim();
          if (wishText && this.wishVision) {
            this.addWish(wishText);
            wishInput.value = '';
          }
        }
      });
    }
    
    // Toggle clouds button
    const toggleCloudsButton = this.copilotInterface.querySelector('.toggle-wish-clouds');
    if (toggleCloudsButton && this.wishVision) {
      toggleCloudsButton.addEventListener('click', () => {
        this.wishVision.toggle();
      });
    }
  }

  /**
   * Show the copilot interface
   * @private
   */
  _showInterface() {
    if (this.copilotInterface) {
      this.copilotInterface.style.transition = 'opacity 0.5s ease-in-out';
      this.copilotInterface.style.opacity = '1';
    }
  }

  /**
   * Hide the copilot interface
   * @private
   */
  _hideInterface() {
    if (this.copilotInterface) {
      this.copilotInterface.style.transition = 'opacity 0.5s ease-in-out';
      this.copilotInterface.style.opacity = '0';
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (this.copilotInterface.parentNode) {
          this.copilotInterface.parentNode.removeChild(this.copilotInterface);
        }
        this.copilotInterface = null;
      }, 500);
    }
  }

  /**
   * Update the entire interface
   * @private
   */
  _updateInterface() {
    this._updateCraftInfo();
    this._updatePilotInfo();
    this._updateActionsPanel();
  }

  /**
   * Update the craft info panel
   * @private
   */
  _updateCraftInfo() {
    if (!this.craftInfoPanel) return;
    
    const contentDiv = this.craftInfoPanel.querySelector('.panel-content');
    
    if (this.currentCraft) {
      // Craft is connected
      contentDiv.innerHTML = `
        <div class="craft-info">
          <div class="craft-name">${this.currentCraft.name}</div>
          <div class="craft-type">${this.currentCraft.type}</div>
          <div class="craft-id">ID: ${this.currentCraft.id}</div>
          <div class="craft-status">Status: Connected</div>
          <div class="craft-specs">
            <div class="spec-item">
              <span class="spec-label">Anti-Gravity:</span>
              <span class="spec-value">${this.currentCraft.specs?.antigravity || 'Standard'}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Reliability:</span>
              <span class="spec-value">${this.currentCraft.specs?.reliability || '99%'}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // No craft connected
      contentDiv.innerHTML = `
        <div class="no-craft">
          <p>No Antigravity Powercraft connected</p>
          <button class="connect-craft-btn">Connect to Craft</button>
        </div>
      `;
      
      // Add event listener to connect button
      const connectButton = contentDiv.querySelector('.connect-craft-btn');
      if (connectButton) {
        connectButton.addEventListener('click', () => {
          // Show modal to select craft
          this._showCraftSelectionModal();
        });
      }
    }
  }

  /**
   * Update the pilot info panel
   * @private
   */
  _updatePilotInfo() {
    if (!this.pilotPanel) return;
    
    const contentDiv = this.pilotPanel.querySelector('.panel-content');
    
    if (this.pilotProfile) {
      // Pilot is configured
      contentDiv.innerHTML = `
        <div class="pilot-info">
          <div class="pilot-name">${this.pilotProfile.name}</div>
          <div class="pilot-rank">${this.pilotProfile.rank}</div>
          <div class="pilot-id">ID: ${this.pilotProfile.id}</div>
          <div class="pilot-config">
            <div class="config-item">
              <span class="config-label">Assistance Level:</span>
              <span class="config-value">${this.config.assistanceLevel}</span>
            </div>
            <div class="config-item">
              <span class="config-label">Interface Mode:</span>
              <span class="config-value">${this.config.interfaceMode}</span>
            </div>
            <div class="config-item">
              <span class="config-label">Voice:</span>
              <span class="config-value">${this.config.voiceEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <button class="edit-config-btn">Edit Configuration</button>
        </div>
      `;
      
      // Add event listener to edit button
      const editButton = contentDiv.querySelector('.edit-config-btn');
      if (editButton) {
        editButton.addEventListener('click', () => {
          // Show modal to edit configuration
          this._showConfigModal();
        });
      }
    } else {
      // No pilot configured
      contentDiv.innerHTML = `
        <div class="no-pilot">
          <p>No pilot profile configured</p>
          <button class="create-pilot-btn">Create Pilot Profile</button>
        </div>
      `;
      
      // Add event listener to create button
      const createButton = contentDiv.querySelector('.create-pilot-btn');
      if (createButton) {
        createButton.addEventListener('click', () => {
          // Show modal to create pilot
          this._showPilotCreationModal();
        });
      }
    }
  }

  /**
   * Update the actions panel with suggested actions
   * @private
   */
  _updateActionsPanel() {
    if (!this.actionsPanel) return;
    
    const contentDiv = this.actionsPanel.querySelector('.panel-content');
    
    if (this.suggestedActions && this.suggestedActions.length > 0) {
      // Has suggested actions
      const actionsHTML = this.suggestedActions.map(action => `
        <div class="action-item" data-action-id="${action.id}">
          <div class="action-title">${action.title}</div>
          <div class="action-description">${action.description}</div>
          <button class="execute-action-btn">Execute</button>
        </div>
      `).join('');
      
      contentDiv.innerHTML = actionsHTML;
      
      // Add event listeners to execute buttons
      contentDiv.querySelectorAll('.execute-action-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const actionItem = e.target.closest('.action-item');
          const actionId = actionItem.getAttribute('data-action-id');
          this._executeAction(actionId);
        });
      });
    } else {
      // No suggested actions
      contentDiv.innerHTML = `
        <div class="no-actions">
          <p>No suggested actions available</p>
          <p>Connect to a craft to see suggested actions</p>
        </div>
      `;
    }
  }

  /**
   * Show a modal to select a craft
   * @private
   */
  _showCraftSelectionModal() {
    // This would be implemented to show a modal with available crafts
    // For now, we'll just use a sample craft
    this.setCraft(FLEET_DATA.timeliners[0]);
  }

  /**
   * Show a modal to edit the copilot configuration
   * @private
   */
  _showConfigModal() {
    // This would be implemented to show a modal to edit configuration
    // For now, we'll just update to a sample configuration
    this.updateConfig({
      assistanceLevel: 'Advanced',
      interfaceMode: 'Enhanced'
    });
  }

  /**
   * Show a modal to create a pilot profile
   * @private
   */
  _showPilotCreationModal() {
    // This would be implemented to show a modal to create a pilot
    // For now, we'll just set a sample pilot
    this.setPilot({
      id: 'PILOT-1337',
      name: 'Vision Pilot Alpha',
      rank: 'Commander',
      experience: 9500,
      specializations: ['Strategic Operations', 'Temporal Navigation'],
      preferences: {
        uiTheme: 'Dark',
        alertLevel: 'Medium',
        autoSuggestions: true
      }
    });
  }

  /**
   * Load the pilot profile
   * @private
   */
  _loadPilotProfile() {
    // In a real implementation, this would load from storage
    // For now, we'll just use the default profile
  }

  /**
   * Generate suggested actions based on the current craft
   * @private
   */
  _generateSuggestedActions() {
    if (!this.currentCraft) {
      this.suggestedActions = [];
      return;
    }
    
    // Generate actions based on craft type
    if (this.currentCraft.type === 'Timeliner') {
      this.suggestedActions = [
        {
          id: 'action-1',
          title: 'Optimize Delivery Pathway',
          description: 'Recalculate optimal route for scheduled deliveries',
          execute: () => {
            console.log('Optimizing delivery pathway');
            // Implementation would go here
          }
        },
        {
          id: 'action-2',
          title: 'Enhance Performance Metrics',
          description: 'Tune the antigravity field for improved efficiency',
          execute: () => {
            console.log('Enhancing performance metrics');
            // Implementation would go here
          }
        },
        {
          id: 'action-3',
          title: 'Schedule Maintenance Check',
          description: 'Proactive diagnostic of core systems',
          execute: () => {
            console.log('Scheduling maintenance check');
            // Implementation would go here
          }
        }
      ];
    } else if (this.currentCraft.type === 'Timepresser') {
      this.suggestedActions = [
        {
          id: 'action-1',
          title: 'Recalibrate Temporal Field',
          description: 'Adjust the temporal field to focus on optimal future outcomes',
          execute: () => {
            console.log('Recalibrating temporal field');
            // Implementation would go here
          }
        },
        {
          id: 'action-2',
          title: 'Generate Strategic Forecast',
          description: 'Create a comprehensive forecast based on current data',
          execute: () => {
            console.log('Generating strategic forecast');
            // Implementation would go here
          }
        },
        {
          id: 'action-3',
          title: 'Identify Opportunity Windows',
          description: 'Scan for upcoming high-value opportunity windows',
          execute: () => {
            console.log('Identifying opportunity windows');
            // Implementation would go here
          }
        }
      ];
    }
    
    // Update the actions panel
    this._updateActionsPanel();
  }

  /**
   * Execute an action by ID
   * @param {String} actionId - The ID of the action to execute
   * @private
   */
  _executeAction(actionId) {
    const action = this.suggestedActions.find(a => a.id === actionId);
    
    if (action && typeof action.execute === 'function') {
      action.execute();
      
      // Announce action execution
      this._announceStatus(`Executing: ${action.title}`);
      
      // In a real implementation, you would handle the result
      // For now, we'll just remove the action from the list
      this.suggestedActions = this.suggestedActions.filter(a => a.id !== actionId);
      this._updateActionsPanel();
    }
  }

  /**
   * Announce a status message
   * @param {String} message - The message to announce
   * @private
   */
  _announceStatus(message) {
    console.log(`RIX CRx Copilot: ${message}`);
    
    // Update status display if exists
    const statusElement = this.copilotInterface?.querySelector('.copilot-status');
    if (statusElement) {
      statusElement.textContent = message;
      
      // Highlight briefly
      statusElement.classList.add('highlight');
      setTimeout(() => {
        statusElement.classList.remove('highlight');
      }, 1500);
    }
    
    // Speak message if voice is enabled
    if (this.config.voiceEnabled && window.speechSynthesis) {
      const speech = new SpeechSynthesisUtterance(message);
      speech.rate = 1.0;
      speech.pitch = 1.0;
      speech.volume = 0.8;
      window.speechSynthesis.speak(speech);
    }
  }
}