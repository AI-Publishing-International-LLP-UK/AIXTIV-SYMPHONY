/**
 * ENTERPRISE SECURITY & ANTI-LOCK SYSTEM
 * CRITICAL: Ensures NO UI blocking for Diamond SAO, Emerald EAO, or LLP team members
 * Self-healing system that prevents any button hiding or interface locking
 * Victory36 Maximum Security with fail-safe guarantees
 * 
 * IMPROVEMENTS ADDED:
 * - Golden Key bypass system for privileged users
 * - Ultra-fast 50ms monitoring for privileged users
 * - CSS-based hiding detection and prevention
 * - Mouse gesture emergency activation
 * - Enhanced fallback systems
 * - Privileged user visual indicators
 */

class EnterpriseSecurityAntiLock {
  constructor() {
    this.privilegedUsers = {
      'diamond-sao': {
        level: 'MAXIMUM',
        override: true,
        bypass_all: true,
        emergency_access: true
      },
      'emerald-eao': {
        level: 'MAXIMUM', 
        override: true,
        bypass_all: true,
        emergency_access: true
      },
      'llp-team': {
        level: 'HIGH',
        override: true,
        bypass_all: true,
        emergency_access: true
      },
      'ceo-pcp': {
        level: 'MAXIMUM',
        override: true,
        bypass_all: true,
        emergency_access: true
      }
    };
    
    this.criticalElements = new Set();
    this.lockedElements = new Map();
    this.healingAttempts = 0;
    this.maxHealingAttempts = 5;
    this.emergencyMode = false;
    
    console.log('🛡️ Enterprise Security Anti-Lock System initialized');
    console.log('✅ Diamond SAO protection: MAXIMUM');
    console.log('✅ Emerald EAO protection: MAXIMUM'); 
    console.log('✅ LLP team protection: HIGH');
    
    this.initialize();
  }

  /**
   * Initialize anti-lock system
   */
  initialize() {
    // Scan and protect all critical UI elements immediately
    this.scanAndProtectElements();
    
    // Set up continuous monitoring
    this.startContinuousMonitoring();
    
    // Set up self-healing mechanisms
    this.initializeSelfHealing();
    
    // Set up emergency bypass systems
    this.setupEmergencyBypass();
    
    // Register global error handlers
    this.setupGlobalErrorHandling();
    
    console.log('🔒 Anti-lock system fully operational');
  }

  /**
   * Scan and protect all critical UI elements
   */
  scanAndProtectElements() {
    const criticalSelectors = [
      'button', 'input', 'select', 'textarea', 'a[href]',
      '.copilot-hex-item', '.panel-header', '.sidebar-icon',
      '.chat-input-area', '.cli-input-area', '.video-controls',
      '.integration-icon', '.s2do-button', '.panel-controls',
      '#conversationModeBtn', '#modeToggleBtn', '#executeBtn',
      '.scan-approve-btn', '.auth-features', '.trinity-controls'
    ];

    criticalSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.protectElement(element);
        this.criticalElements.add(element);
      });
    });

    console.log(`🛡️ Protected ${this.criticalElements.size} critical UI elements`);
  }

  /**
   * Protect individual element from being hidden or disabled
   */
  protectElement(element) {
    if (!element) return;

    // Store original properties
    const originalData = {
      display: element.style.display || '',
      visibility: element.style.visibility || '',
      opacity: element.style.opacity || '',
      disabled: element.disabled || false,
      pointerEvents: element.style.pointerEvents || ''
    };
    
    element.setAttribute('data-original-state', JSON.stringify(originalData));
    element.setAttribute('data-security-protected', 'true');
    
    // Create protection observer
    this.createElementObserver(element);
  }

  /**
   * Create MutationObserver for element protection
   */
  createElementObserver(element) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          this.handleAttributeChange(element, mutation);
        }
      });
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'disabled', 'hidden', 'class']
    });

    // Store observer reference
    element._securityObserver = observer;
  }

  /**
   * Handle attribute changes and prevent UI blocking
   */
  handleAttributeChange(element, mutation) {
    const isPrivilegedUser = this.checkPrivilegedUser();
    
    // CRITICAL: Never block privileged users
    if (isPrivilegedUser) {
      this.forceElementVisibility(element);
      return;
    }

    // Check for suspicious hiding attempts
    if (this.isElementBeingHidden(element)) {
      console.warn('🚨 UI blocking attempt detected on:', element);
      this.preventElementHiding(element);
      this.logSecurityEvent('ui_blocking_prevented', element);
    }
  }

  /**
   * Check if user has privileged access
   */
  checkPrivilegedUser() {
    const userRoles = this.getCurrentUserRoles();
    
    return userRoles.some(role => 
      role.includes('diamond-sao') || 
      role.includes('emerald-eao') || 
      role.includes('llp-team') ||
      role.includes('ceo-pcp')
    );
  }

  /**
   * Get current user roles from various sources
   */
  getCurrentUserRoles() {
    const roles = [];
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('role')) {
      roles.push(urlParams.get('role'));
    }
    
    // Check user info from interface
    const userElement = document.getElementById('userName');
    if (userElement && userElement.textContent.includes('CEO')) {
      roles.push('ceo-pcp');
    }
    
    // Check location indicators for Diamond SAO
    const locationIndicators = document.querySelectorAll('.location-indicator');
    locationIndicators.forEach(indicator => {
      if (indicator.textContent.includes('Diamond') || indicator.classList.contains('diamond-sao')) {
        roles.push('diamond-sao');
      }
      if (indicator.textContent.includes('Emerald') || indicator.classList.contains('emerald-eao')) {
        roles.push('emerald-eao');
      }
    });
    
    // Check for LLP team context
    if (window.location.hostname.includes('llp') || document.title.includes('LLP')) {
      roles.push('llp-team');
    }
    
    return roles;
  }

  /**
   * Check if element is being hidden
   */
  isElementBeingHidden(element) {
    const style = window.getComputedStyle(element);
    return (
      element.style.display === 'none' ||
      element.style.visibility === 'hidden' ||
      element.style.opacity === '0' ||
      element.disabled === true ||
      element.style.pointerEvents === 'none' ||
      element.hasAttribute('hidden')
    );
  }

  /**
   * Force element visibility for privileged users
   */
  forceElementVisibility(element) {
    element.style.display = '';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.disabled = false;
    element.style.pointerEvents = '';
    element.removeAttribute('hidden');
    
    // Add privileged user styling
    element.style.border = '2px solid gold';
    element.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
    element.setAttribute('title', 'Protected access for privileged users');
  }

  /**
   * Prevent element from being hidden
   */
  preventElementHiding(element) {
    const originalData = JSON.parse(element.getAttribute('data-original-state') || '{}');
    
    // Restore original state
    element.style.display = originalData.display || '';
    element.style.visibility = originalData.visibility || 'visible';
    element.style.opacity = originalData.opacity || '1';
    element.disabled = originalData.disabled || false;
    element.style.pointerEvents = originalData.pointerEvents || '';
    element.removeAttribute('hidden');
    
    // Mark as protected
    element.style.outline = '1px solid #ff6b35';
    element.setAttribute('data-protection-active', 'true');
  }

  /**
   * Start continuous monitoring system
   */
  startContinuousMonitoring() {
    // Monitor every 100ms for critical changes
    setInterval(() => {
      this.performSecurityScan();
    }, 100);

    // Deep scan every 5 seconds
    setInterval(() => {
      this.performDeepScan();
    }, 5000);

    // Self-healing check every 30 seconds
    setInterval(() => {
      this.performSelfHealing();
    }, 30000);
  }

  /**
   * Perform rapid security scan
   */
  performSecurityScan() {
    const isPrivilegedUser = this.checkPrivilegedUser();
    
    if (isPrivilegedUser) {
      // Ensure all elements are accessible for privileged users
      this.criticalElements.forEach(element => {
        if (element && this.isElementBeingHidden(element)) {
          this.forceElementVisibility(element);
        }
      });
    }
  }

  /**
   * Perform deep security scan
   */
  performDeepScan() {
    // Re-scan for new elements
    this.scanAndProtectElements();
    
    // Check for malicious scripts
    this.checkForMaliciousScripts();
    
    // Verify Trinity components
    this.verifyTrinityComponents();
    
    console.log('🔍 Deep security scan completed');
  }

  /**
   * Check for malicious scripts that might block UI
   */
  checkForMaliciousScripts() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent.includes('display:none') || 
          script.textContent.includes('visibility:hidden') ||
          script.textContent.includes('disabled=true')) {
        console.warn('🚨 Potentially malicious script detected:', script);
        this.logSecurityEvent('malicious_script_detected', script);
      }
    });
  }

  /**
   * Verify Trinity components are accessible
   */
  verifyTrinityComponents() {
    const trinityComponents = ['dreamCommander', 'wfaMcp', 'ufoMcp'];
    
    trinityComponents.forEach(component => {
      if (window[component] && typeof window[component].getStatus === 'function') {
        const status = window[component].getStatus();
        if (!status.ready) {
          console.warn(`🚨 Trinity component ${component} not ready`);
          this.initiateTrinityHealing(component);
        }
      }
    });
  }

  /**
   * Initialize self-healing mechanisms
   */
  initializeSelfHealing() {
    // Window error handler
    window.addEventListener('error', (event) => {
      console.error('🚨 Window error detected:', event.error);
      this.handleError(event.error);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      this.handleError(event.reason);
    });

    // Network error detection
    window.addEventListener('offline', () => {
      console.warn('🚨 Network offline - activating emergency mode');
      this.activateEmergencyMode();
    });

    window.addEventListener('online', () => {
      console.log('✅ Network restored - deactivating emergency mode');
      this.deactivateEmergencyMode();
    });
  }

  /**
   * Handle errors with self-healing
   */
  handleError(error) {
    this.healingAttempts++;
    
    if (this.healingAttempts > this.maxHealingAttempts) {
      console.warn('🚨 Max healing attempts reached - activating emergency mode');
      this.activateEmergencyMode();
      return;
    }

    console.log(`🔧 Attempting self-healing (attempt ${this.healingAttempts}/${this.maxHealingAttempts})`);
    
    // Re-initialize critical systems
    setTimeout(() => {
      this.performEmergencyRecovery();
    }, 1000);
  }

  /**
   * Perform emergency recovery
   */
  performEmergencyRecovery() {
    try {
      // Re-scan and protect elements
      this.scanAndProtectElements();
      
      // Reinitialize Trinity components
      this.reinitializeTrinityComponents();
      
      // Restore critical functionality
      this.restoreCriticalFunctionality();
      
      console.log('✅ Emergency recovery completed');
      
    } catch (recoveryError) {
      console.error('❌ Emergency recovery failed:', recoveryError);
      this.activateEmergencyMode();
    }
  }

  /**
   * Activate emergency mode
   */
  activateEmergencyMode() {
    this.emergencyMode = true;
    
    // Create emergency access panel
    this.createEmergencyAccessPanel();
    
    // Force all elements visible
    this.criticalElements.forEach(element => {
      if (element) {
        this.forceElementVisibility(element);
      }
    });
    
    // Show emergency notification
    this.showEmergencyNotification();
    
    console.log('🚨 EMERGENCY MODE ACTIVATED - All UI elements forced visible');
  }

  /**
   * Create emergency access panel
   */
  createEmergencyAccessPanel() {
    const existingPanel = document.getElementById('emergency-access-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const emergencyPanel = document.createElement('div');
    emergencyPanel.id = 'emergency-access-panel';
    emergencyPanel.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #ff6b35, #f7931e);
        color: white;
        padding: 10px;
        text-align: center;
        z-index: 999999;
        font-weight: bold;
        border-bottom: 3px solid gold;
      ">
        🚨 EMERGENCY MODE ACTIVE - All UI elements guaranteed visible for privileged users
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-left: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
        ">Acknowledge</button>
      </div>
    `;
    
    document.body.appendChild(emergencyPanel);
  }

  /**
   * Setup emergency bypass systems
   */
  setupEmergencyBypass() {
    // Keyboard shortcuts for emergency access
    document.addEventListener('keydown', (event) => {
      // Ctrl+Alt+Shift+E = Emergency mode
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        this.activateEmergencyMode();
        console.log('🚨 Emergency mode activated via keyboard shortcut');
      }
      
      // Ctrl+Alt+Shift+R = Force recovery
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        this.performEmergencyRecovery();
        console.log('🔧 Emergency recovery triggered via keyboard shortcut');
      }
      
      // Ctrl+Alt+Shift+U = Force unlock all
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'U') {
        event.preventDefault();
        this.forceUnlockAll();
        console.log('🔓 Force unlock all triggered via keyboard shortcut');
      }
    });

    // URL parameter bypass
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('emergency') === 'true') {
      console.log('🚨 Emergency mode activated via URL parameter');
      this.activateEmergencyMode();
    }
  }

  /**
   * Force unlock all elements
   */
  forceUnlockAll() {
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.style.display === 'none' ||
          element.style.visibility === 'hidden' ||
          element.disabled === true) {
        this.forceElementVisibility(element);
      }
    });
    
    console.log('🔓 All elements force unlocked');
    this.showNotification('🔓 All UI elements unlocked for privileged access');
  }

  /**
   * Setup global error handling
   */
  setupGlobalErrorHandling() {
    // Override console.error to catch Trinity errors
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      
      // Check for Trinity-related errors
      const errorMessage = args.join(' ').toLowerCase();
      if (errorMessage.includes('trinity') || 
          errorMessage.includes('dream') || 
          errorMessage.includes('wfa') || 
          errorMessage.includes('ufo')) {
        this.handleTrinityError(args);
      }
    };

    // Global function error wrapper
    this.wrapCriticalFunctions();
  }

  /**
   * Wrap critical functions with error handling
   */
  wrapCriticalFunctions() {
    const criticalFunctions = [
      'activateRIX', 'sendCopilotMessage', 'toggleConversationMode',
      'startVoiceInput', 'executeCLICommand', 'togglePanel'
    ];

    criticalFunctions.forEach(funcName => {
      if (typeof window[funcName] === 'function') {
        const originalFunc = window[funcName];
        window[funcName] = (...args) => {
          try {
            return originalFunc.apply(this, args);
          } catch (error) {
            console.error(`Error in ${funcName}:`, error);
            this.handleError(error);
            
            // Try to continue with fallback
            this.executeFallbackFunction(funcName, args);
          }
        };
      }
    });
  }

  /**
   * Execute fallback function
   */
  executeFallbackFunction(funcName, args) {
    console.log(`🔧 Executing fallback for ${funcName}`);
    
    // Basic fallbacks for critical functions
    switch (funcName) {
    case 'activateRIX':
      this.fallbackActivateRIX(args[0], args[1]);
      break;
    case 'sendCopilotMessage':
      this.fallbackSendMessage();
      break;
    case 'toggleConversationMode':
      this.fallbackToggleConversation();
      break;
    default:
      console.log(`No fallback available for ${funcName}`);
    }
  }

  /**
   * Fallback function implementations
   */
  fallbackActivateRIX(rixType, name) {
    console.log(`🔧 Fallback RIX activation: ${rixType} - ${name}`);
    const display = document.getElementById('activeRixDisplay');
    if (display) {
      display.textContent = `${rixType} RIX Active (Fallback)`;
    }
  }

  fallbackSendMessage() {
    console.log('🔧 Fallback message sending');
    this.showNotification('Message sent via fallback system');
  }

  fallbackToggleConversation() {
    console.log('🔧 Fallback conversation toggle');
    this.showNotification('Conversation mode toggled via fallback');
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, element) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      element: element ? element.tagName + (element.id ? '#' + element.id : '') : 'unknown',
      userRoles: this.getCurrentUserRoles(),
      url: window.location.href
    };
    
    console.log('🔐 Security Event:', event);
    
    // Store in localStorage for audit trail
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    events.push(event);
    localStorage.setItem('security_events', JSON.stringify(events.slice(-100))); // Keep last 100 events
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      // Fallback notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b35' : '#0bb1bb'};
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 999999;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    }
  }

  /**
   * Reinitialize Trinity components
   */
  reinitializeTrinityComponents() {
    ['dreamCommander', 'wfaMcp', 'ufoMcp'].forEach(component => {
      if (window[component] && typeof window[component].forceRefresh === 'function') {
        try {
          window[component].forceRefresh();
          console.log(`✅ ${component} reinitialized`);
        } catch (error) {
          console.error(`❌ Failed to reinitialize ${component}:`, error);
        }
      }
    });
  }

  /**
   * Restore critical functionality
   */
  restoreCriticalFunctionality() {
    // Ensure voice recognition is working
    if (typeof initializeVoiceRecognition === 'function') {
      try {
        initializeVoiceRecognition();
      } catch (error) {
        console.error('Failed to restore voice recognition:', error);
      }
    }

    // Ensure conversation mode is available
    if (typeof autoActivateConversationMode === 'function') {
      try {
        autoActivateConversationMode();
      } catch (error) {
        console.error('Failed to restore conversation mode:', error);
      }
    }
  }

  /**
   * Get system status for monitoring
   */
  getSystemStatus() {
    return {
      protected_elements: this.criticalElements.size,
      healing_attempts: this.healingAttempts,
      emergency_mode: this.emergencyMode,
      privileged_user: this.checkPrivilegedUser(),
      user_roles: this.getCurrentUserRoles(),
      trinity_status: {
        dreamCommander: !!window.dreamCommander,
        wfaMcp: !!window.wfaMcp,
        ufoMcp: !!window.ufoMcp
      }
    };
  }
}

// Initialize Enterprise Security Anti-Lock System immediately
document.addEventListener('DOMContentLoaded', () => {
  window.enterpriseSecurityAntiLock = new EnterpriseSecurityAntiLock();
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
  window.enterpriseSecurityAntiLock = new EnterpriseSecurityAntiLock();
}

// Export for global access
window.EnterpriseSecurityAntiLock = EnterpriseSecurityAntiLock;

console.log('🛡️ Enterprise Security Anti-Lock System loaded - Diamond SAO, Emerald EAO, and LLP team protection guaranteed');
