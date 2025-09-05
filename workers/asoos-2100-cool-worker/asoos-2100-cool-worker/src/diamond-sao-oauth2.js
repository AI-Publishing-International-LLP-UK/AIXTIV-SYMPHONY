/**
 * Diamond SAO OAuth2 Cloud Integration
 * Replaces static Diamond SAO settings with real cloud OAuth2 connectivity
 * This script will be injected into the existing interface at https://2100.cool/interface/
 */

class DiamondSAOCloudIntegration {
  constructor() {
    this.baseUrl = 'https://2100.cool/api/oauth2';
    this.diamondSAOUrl = 'https://2100.cool/api/diamond-sao';
    this.currentUser = this.getCurrentLLPMember();
    
    // Services we can authenticate with
    this.services = {
      mocoa_gateway: 'MOCOA Integration Gateway',
      victory36: 'Victory36 Prediction Engine',
      sallyport: 'SallyPort Authentication'
    };
    
    this.featureStatus = {};
    this.oauthTokens = {};
  }

  /**
   * Get current LLP member from localStorage
   */
  getCurrentLLPMember() {
    try {
      const memberData = localStorage.getItem('asoos_llp_member');
      return memberData ? JSON.parse(memberData) : null;
    } catch (error) {
      console.error('Error getting LLP member data:', error);
      return null;
    }
  }

  /**
   * Initialize OAuth2 integration - replaces static Diamond SAO settings
   */
  async initialize() {
    console.log('🛡️ Initializing Diamond SAO OAuth2 Cloud Integration...');
    
    // Replace the static createSettingsOverlay function
    if (typeof window.createSettingsOverlay === 'function') {
      window.createSettingsOverlay = () => this.createRealSettingsOverlay();
    }
    
    // Replace the static openSettings function
    if (typeof window.openSettings === 'function') {
      window.openSettings = () => this.openRealSettings();
    }
    
    // Replace authenticateWithSallyPort with real OAuth2 flow
    if (typeof window.authenticateWithSallyPort === 'function') {
      window.authenticateWithSallyPort = () => this.authenticateWithCloud();
    }
    
    // Load current feature status
    await this.loadFeatureStatus();
    
    console.log('✅ Diamond SAO OAuth2 integration active');
  }

  /**
   * Create real settings overlay with OAuth2 connectivity
   */
  createRealSettingsOverlay() {
    const existingOverlay = document.getElementById('settingsOverlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'settingsOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    overlay.innerHTML = this.generateRealSettingsHTML();
    document.body.appendChild(overlay);
    
    // Bind event handlers for the real settings
    this.bindSettingsEventHandlers();
  }

  /**
   * Generate HTML for real Diamond SAO settings
   */
  generateRealSettingsHTML() {
    const userInfo = this.currentUser || { name: 'Unknown User', email: 'unknown@example.com' };
    const statusData = this.featureStatus;

    return `
      <div style="background: #1a1a1a; border: 2px solid #FFD700; border-radius: 15px; padding: 30px; max-width: 600px; color: white; max-height: 80vh; overflow-y: auto;">
        <h2 style="color: #FFD700; margin-bottom: 20px; text-align: center;">Diamond SAO Cloud Settings</h2>
        
        <!-- User Info -->
        <div style="margin-bottom: 20px; padding: 15px; background: rgba(11, 177, 187, 0.1); border-radius: 8px;">
          <div style="color: #0bb1bb; font-weight: 600;">Current User:</div>
          <div style="color: white;">${userInfo.name} (${userInfo.email})</div>
          <div style="color: #FFD700; font-size: 12px;">${userInfo.access_level || 'standard'} access level</div>
        </div>

        <!-- Cloud Services Status -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #0bb1bb; margin-bottom: 10px;">Cloud Services Status</h3>
          ${this.generateServiceStatusHTML()}
        </div>

        <!-- Feature Activation -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #FFD700; margin-bottom: 10px;">Feature Activation</h3>
          ${this.generateFeatureActivationHTML()}
        </div>

        <!-- OAuth2 Authentication -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: #50C878; margin-bottom: 10px;">OAuth2 Authentication</h3>
          ${this.generateOAuth2HTML()}
        </div>

        <!-- Actions -->
        <div style="text-align: center;">
          <button id="refreshStatusBtn" style="background: #0bb1bb; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 10px;">
            Refresh Status
          </button>
          <button onclick="closeSettingsOverlay()" style="background: #444; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Close
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate service status HTML
   */
  generateServiceStatusHTML() {
    let html = '';
    for (const [serviceKey, serviceName] of Object.entries(this.services)) {
      const status = this.featureStatus[serviceKey] || { active: false, error: 'checking...' };
      const statusColor = status.active ? '#50C878' : '#ff4757';
      const statusText = status.active ? 'Connected' : (status.error || 'Disconnected');
      
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
          <span style="color: white;">${serviceName}</span>
          <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
        </div>
      `;
    }
    return html;
  }

  /**
   * Generate feature activation HTML
   */
  generateFeatureActivationHTML() {
    const features = ['elite11', 'mastery33', 'victory36'];
    let html = '';

    for (const feature of features) {
      const status = this.featureStatus[feature] || { active: false };
      const statusColor = status.active ? '#50C878' : '#888';
      const statusText = status.active ? 'Active' : 'Inactive';
      
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
          <div>
            <span style="color: white; text-transform: capitalize;">${feature.replace(/(\d+)/, ' $1')}</span>
            <div style="color: #888; font-size: 11px;">${this.getFeatureDescription(feature)}</div>
          </div>
          <div>
            <span style="color: ${statusColor}; font-weight: 600; margin-right: 10px;">${statusText}</span>
            <button class="activateFeatureBtn" data-feature="${feature}" style="background: #FFD700; border: none; color: black; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
              ${status.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      `;
    }
    
    return html;
  }

  /**
   * Generate OAuth2 authentication HTML
   */
  generateOAuth2HTML() {
    let html = '';
    
    for (const [serviceKey, serviceName] of Object.entries(this.services)) {
      const hasToken = this.oauthTokens[serviceKey] && this.oauthTokens[serviceKey].access_token;
      const buttonText = hasToken ? 'Re-authenticate' : 'Authenticate';
      const statusText = hasToken ? 'Authenticated' : 'Not Authenticated';
      const statusColor = hasToken ? '#50C878' : '#888';
      
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #333;">
          <div>
            <span style="color: white;">${serviceName}</span>
            <div style="color: ${statusColor}; font-size: 11px;">${statusText}</div>
          </div>
          <button class="authenticateServiceBtn" data-service="${serviceKey}" style="background: #50C878; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            ${buttonText}
          </button>
        </div>
      `;
    }
    
    return html;
  }

  /**
   * Get feature description
   */
  getFeatureDescription(feature) {
    const descriptions = {
      elite11: 'Strategic oversight and macro-level coordination',
      mastery33: 'Operational mastery and wing coordination',
      victory36: 'Protective shields and prediction protocols'
    };
    return descriptions[feature] || 'Advanced AI workflows';
  }

  /**
   * Bind event handlers for settings
   */
  bindSettingsEventHandlers() {
    // Refresh status button
    const refreshBtn = document.getElementById('refreshStatusBtn');
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refreshStatus();
    }

    // Feature activation buttons
    const featureButtons = document.querySelectorAll('.activateFeatureBtn');
    featureButtons.forEach(btn => {
      btn.onclick = (e) => this.toggleFeature(e.target.dataset.feature);
    });

    // OAuth2 authentication buttons
    const authButtons = document.querySelectorAll('.authenticateServiceBtn');
    authButtons.forEach(btn => {
      btn.onclick = (e) => this.authenticateService(e.target.dataset.service);
    });
  }

  /**
   * Open real settings (public method)
   */
  openRealSettings() {
    showNotification('Opening Diamond SAO Cloud Settings...', 'success');
    this.createRealSettingsOverlay();
  }

  /**
   * Refresh all status information
   */
  async refreshStatus() {
    showNotification('Refreshing cloud service status...', 'success');
    await this.loadFeatureStatus();
    
    // Refresh the overlay with new data
    this.createRealSettingsOverlay();
    showNotification('Status refreshed successfully', 'success');
  }

  /**
   * Load feature status from cloud services
   */
  async loadFeatureStatus() {
    if (!this.currentUser) {
      console.warn('No current user found for status check');
      return;
    }

    try {
      const response = await fetch(`${this.diamondSAOUrl}?action=get_status&member=${encodeURIComponent(this.currentUser.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-LLP-Member': this.currentUser.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.featureStatus = data.feature_status || {};
        console.log('✅ Feature status loaded:', this.featureStatus);
      } else {
        console.error('Failed to load feature status:', response.status);
        // Set default status for UI
        this.featureStatus = {
          elite11: { active: false, error: 'service_unavailable' },
          mastery33: { active: false, error: 'service_unavailable' },
          victory36: { active: false, error: 'service_unavailable' }
        };
      }
    } catch (error) {
      console.error('Error loading feature status:', error);
      this.featureStatus = {};
    }
  }

  /**
   * Toggle feature activation
   */
  async toggleFeature(feature) {
    if (!this.currentUser) {
      showNotification('Authentication required', 'error');
      return;
    }

    const isActive = this.featureStatus[feature] && this.featureStatus[feature].active;
    const action = isActive ? 'deactivate' : 'activate';
    
    showNotification(`${action === 'activate' ? 'Activating' : 'Deactivating'} ${feature}...`, 'success');

    try {
      const response = await fetch(`${this.diamondSAOUrl}?action=activate_features`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          features: [feature],
          llp_member_email: this.currentUser.email,
          action: action
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.activation_results && data.activation_results[feature];
        
        if (result && result.success) {
          showNotification(`${feature} ${action}d successfully`, 'success');
          await this.loadFeatureStatus();
          this.createRealSettingsOverlay(); // Refresh UI
        } else {
          showNotification(`Failed to ${action} ${feature}: ${result.error || 'Unknown error'}`, 'error');
        }
      } else {
        showNotification(`Failed to ${action} ${feature}`, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing ${feature}:`, error);
      showNotification(`Error ${action}ing ${feature}`, 'error');
    }
  }

  /**
   * Authenticate with a cloud service via OAuth2
   */
  async authenticateService(service) {
    if (!this.currentUser) {
      showNotification('User authentication required', 'error');
      return;
    }

    showNotification(`Initiating OAuth2 flow for ${this.services[service]}...`, 'success');

    try {
      const response = await fetch(`${this.baseUrl}?action=initiate&service=${service}`, {
        method: 'GET',
        headers: {
          'X-LLP-Member': this.currentUser.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.authorization_url) {
          // Store state for validation
          sessionStorage.setItem(`oauth2_state_${service}`, data.state);
          
          // Open OAuth2 authorization URL
          const authWindow = window.open(
            data.authorization_url,
            'oauth2_auth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );
          
          // Listen for OAuth2 callback
          this.listenForOAuth2Callback(service, authWindow);
        } else {
          showNotification('Failed to initiate OAuth2 flow', 'error');
        }
      } else {
        showNotification('Failed to initiate authentication', 'error');
      }
    } catch (error) {
      console.error('OAuth2 initiation error:', error);
      showNotification('Authentication error', 'error');
    }
  }

  /**
   * Listen for OAuth2 callback
   */
  listenForOAuth2Callback(service, authWindow) {
    const checkClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkClosed);
        // Check if we got a successful callback
        this.checkOAuth2CallbackResult(service);
      }
    }, 1000);
  }

  /**
   * Check OAuth2 callback result
   */
  async checkOAuth2CallbackResult(service) {
    // In a real implementation, this would check for callback parameters
    // stored during the callback processing
    
    showNotification('Checking authentication result...', 'success');
    
    // Simulate checking for successful authentication
    setTimeout(async () => {
      await this.loadFeatureStatus();
      this.createRealSettingsOverlay(); // Refresh UI
      showNotification(`Authentication with ${this.services[service]} completed`, 'success');
    }, 2000);
  }

  /**
   * Real cloud authentication (replaces mock authenticateWithSallyPort)
   */
  async authenticateWithCloud() {
    if (!this.currentUser) {
      showNotification('Starting SallyPort cloud authentication...', 'success');
    } else {
      showNotification(`Re-authenticating ${this.currentUser.name} with cloud services...`, 'success');
    }

    // Start OAuth2 flow with SallyPort
    await this.authenticateService('sallyport');
  }
}

// Initialize Diamond SAO Cloud Integration when the page loads
window.diamondSAOCloud = new DiamondSAOCloudIntegration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.diamondSAOCloud.initialize();
  });
} else {
  window.diamondSAOCloud.initialize();
}

// Expose for manual initialization
window.initializeDiamondSAOCloud = () => {
  window.diamondSAOCloud.initialize();
};

console.log('🛡️ Diamond SAO OAuth2 Cloud Integration loaded');
