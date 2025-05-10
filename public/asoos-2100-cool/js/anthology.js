/**
 * Anthology Module with Roark's 5.0 Authorship Framework
 * Manages the unified Anthology interface with multiple AI personas
 */

class AnthologySystem {
  /**
   * Initialize the Anthology module
   */
  constructor() {
    this.isActive = false;
    this.initialized = false;
    this.activePersona = 'dr-memoria';
    this.recentPrompts = [];
    this.maxRecentPrompts = 5;
    
    // Listen for toggle events from navigation
    document.addEventListener('toggleAnthology', this.handleToggle.bind(this));
    
    // Listen for DOM content loaded to initialize
    document.addEventListener('DOMContentLoaded', this.init.bind(this));
  }
  
  /**
   * Initialize event listeners and UI components
   */
  init() {
    console.log("Initializing Anthology System");
    
    // Add event listeners for prompt submission
    document.addEventListener('click', (e) => {
      // Check if it's the submit button 
      if (e.target.closest('.anthology-prompt .submit-btn')) {
        this.handlePromptSubmission();
      }
    });
    
    // Add event listeners for persona selection
    document.addEventListener('click', (e) => {
      const personaElement = e.target.closest('.persona');
      if (personaElement) {
        this.switchPersona(personaElement.dataset.persona);
      }
    });
    
    // Add event listeners for content type selection
    document.addEventListener('click', (e) => {
      const contentType = e.target.closest('.content-type');
      if (contentType) {
        this.handleContentTypeSelection(contentType);
      }
    });
    
    // Add event listeners for framework stage selection
    document.addEventListener('click', (e) => {
      const stage = e.target.closest('.stage');
      if (stage) {
        this.handleStageSelection(stage);
      }
    });
    
    // Add event listener for textarea keypress (Enter to submit)
    document.addEventListener('keypress', (e) => {
      const textarea = e.target.closest('.anthology-prompt textarea');
      if (textarea && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handlePromptSubmission();
      }
    });
    
    this.initialized = true;
  }
  
  /**
   * Handle toggle events from navigation
   * @param {CustomEvent} event - The toggle event
   */
  handleToggle(event) {
    const isActive = event.detail.active;
    const transitionState = event.detail.transitionState || 'start';
    
    this.isActive = isActive;
    
    // Only initialize additional functionality when fully activated
    if (isActive && transitionState === 'complete' && this.initialized) {
      this.initializeActiveState();
    }
  }
  
  /**
   * Initialize additional functionality when Anthology is active
   */
  initializeActiveState() {
    console.log("Initializing active state for Anthology");
    
    // Set initial persona state
    this.switchPersona(this.activePersona, true);
    
    // Focus the textarea when panel becomes active
    setTimeout(() => {
      const textarea = document.querySelector('.anthology-prompt textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 800);
    
    // Add subtle animation to stages
    document.querySelectorAll('.stage').forEach((stage, index) => {
      setTimeout(() => {
        stage.style.transform = 'translateY(-3px)';
        setTimeout(() => {
          stage.style.transform = '';
        }, 300);
      }, index * 150);
    });
    
    // Add subtle animation to content types
    document.querySelectorAll('.content-type').forEach((type, index) => {
      setTimeout(() => {
        type.style.transform = 'translateY(-5px)';
        setTimeout(() => {
          type.style.transform = '';
        }, 300);
      }, index * 150);
    });
  }
  
  /**
   * Switch between different AI personas
   * @param {String} persona - The persona ID to switch to
   * @param {Boolean} isInitial - Whether this is the initial setup
   */
  switchPersona(persona, isInitial = false) {
    if (!isInitial && this.activePersona === persona) return;
    
    console.log(`Switching to ${persona} persona`);
    
    // Update active persona
    this.activePersona = persona;
    
    // Update UI
    document.querySelectorAll('.persona').forEach(item => {
      if (item.dataset.persona === persona) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update textarea placeholder based on persona
    const textarea = document.querySelector('.anthology-prompt textarea');
    if (textarea) {
      switch (persona) {
        case 'dr-memoria':
          textarea.placeholder = "What would you like to create today? Dr. Memoria's Anthology can help bring your publication ideas to life...";
          break;
        case 'dr-match':
          textarea.placeholder = "How can I help with your customer connections and relationship management?";
          break;
        case 'co-pilot':
          textarea.placeholder = "I'm your Co-Pilot for all Anthology features. What would you like assistance with?";
          break;
      }
    }
    
    // Add a visual effect when changing personas
    if (!isInitial) {
      const anthologyPanel = document.getElementById('anthology-panel');
      if (anthologyPanel) {
        anthologyPanel.classList.add('persona-transition');
        
        setTimeout(() => {
          anthologyPanel.classList.remove('persona-transition');
        }, 500);
      }
      
      // Change focus colors based on persona
      document.documentElement.style.setProperty(
        '--persona-color', 
        persona === 'dr-memoria' ? 'var(--color-turquoise)' : 
        persona === 'dr-match' ? '#9c27b0' : '#4caf50'
      );
    }
  }
  
  /**
   * Handle content type selection
   * @param {Element} contentTypeElement - The selected content type element
   */
  handleContentTypeSelection(contentTypeElement) {
    const contentType = contentTypeElement.querySelector('h4').textContent;
    console.log(`Selected content type: ${contentType}`);
    
    // Create notification for selection
    this.showNotification(`${this.activePersona === 'dr-memoria' ? 'Dr. Memoria' : this.activePersona === 'dr-match' ? 'Dr. Match' : 'Co-Pilot'} is ready to help you create a ${contentType.toLowerCase()} publication.`, 'info');
    
    // Highlight the selected content type
    document.querySelectorAll('.content-type').forEach(type => {
      type.classList.remove('selected');
    });
    contentTypeElement.classList.add('selected');
    
    // Update textarea suggestion
    const textarea = document.querySelector('.anthology-prompt textarea');
    if (textarea) {
      textarea.placeholder = `What ${contentType.toLowerCase()} would you like to create? Describe your idea...`;
      textarea.focus();
    }
  }
  
  /**
   * Handle stage selection in the framework
   * @param {Element} stageElement - The selected stage element
   */
  handleStageSelection(stageElement) {
    const stageName = stageElement.querySelector('h4').textContent;
    console.log(`Selected stage: ${stageName}`);
    
    // Create notification for selection
    this.showNotification(`Entering the ${stageName} phase of Roark's 5.0 Authorship Framework.`, 'info');
    
    // Highlight the selected stage
    document.querySelectorAll('.stage').forEach(stage => {
      stage.classList.remove('active-stage');
    });
    stageElement.classList.add('active-stage');
    
    // Update textarea based on selected stage
    const textarea = document.querySelector('.anthology-prompt textarea');
    if (textarea) {
      switch (stageName.toLowerCase()) {
        case 'ideation':
          textarea.placeholder = "Share your expertise and unique perspective. What topic would you like to explore?";
          break;
        case 'composition':
          textarea.placeholder = "Ready to structure your content. What format or style would you prefer?";
          break;
        case 'production':
          textarea.placeholder = "Your content is taking shape. What publication format would you like to produce?";
          break;
        case 'publication':
          textarea.placeholder = "Ready to publish. Where would you like to distribute your content?";
          break;
      }
      textarea.focus();
    }
  }
  
  /**
   * Handle prompt submission
   */
  handlePromptSubmission() {
    const textarea = document.querySelector('.anthology-prompt textarea');
    if (!textarea || !textarea.value.trim()) return;
    
    const promptText = textarea.value.trim();
    
    // Add to recent prompts
    this.addToRecentPrompts(promptText);
    
    // Create response UI
    this.createResponseUI(promptText);
    
    // Clear textarea
    textarea.value = '';
    
    // Focus back on textarea
    textarea.focus();
  }
  
  /**
   * Add prompt to recent prompts history
   * @param {String} promptText - The prompt text
   */
  addToRecentPrompts(promptText) {
    this.recentPrompts.unshift({
      text: promptText,
      persona: this.activePersona,
      timestamp: new Date().toISOString()
    });
    
    // Limit to max recent prompts
    if (this.recentPrompts.length > this.maxRecentPrompts) {
      this.recentPrompts.pop();
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('anthologyRecentPrompts', JSON.stringify(this.recentPrompts));
    } catch (e) {
      console.error('Failed to save recent prompts:', e);
    }
  }
  
  /**
   * Create UI for prompt response
   * @param {String} promptText - The prompt text
   */
  createResponseUI(promptText) {
    const anthologyContent = document.querySelector('.anthology-content');
    if (!anthologyContent) return;
    
    // Find the prompt container to insert before
    const promptContainer = anthologyContent.querySelector('.anthology-prompt');
    
    // Create prompt message container
    const userMessage = document.createElement('div');
    userMessage.className = 'prompt-message user';
    userMessage.innerHTML = `
      <div class="message-content">${promptText}</div>
      <div class="message-time">${this.getFormattedTime()}</div>
    `;
    
    // Get avatar based on active persona
    const avatarSrc = document.querySelector(`.persona[data-persona="${this.activePersona}"] img`).src;
    const personaName = this.activePersona === 'dr-memoria' ? 'Dr. Memoria' : 
                        this.activePersona === 'dr-match' ? 'Dr. Match' : 'Co-Pilot';
    
    // Create response container with typing indicator
    const responseContainer = document.createElement('div');
    responseContainer.className = 'prompt-message system typing';
    responseContainer.innerHTML = `
      <div class="message-avatar">
        <img src="${avatarSrc}" alt="${personaName}">
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    // Insert messages before the prompt textarea
    anthologyContent.insertBefore(userMessage, promptContainer);
    anthologyContent.insertBefore(responseContainer, promptContainer);
    
    // Simulate response after delay
    setTimeout(() => {
      responseContainer.classList.remove('typing');
      responseContainer.querySelector('.message-content').innerHTML = this.generateResponse(promptText);
      responseContainer.innerHTML += `<div class="message-time">${this.getFormattedTime()}</div>`;
      
      // Scroll to bottom
      this.scrollToBottom(anthologyContent);
    }, 2000);
    
    // Scroll to bottom
    this.scrollToBottom(anthologyContent);
  }
  
  /**
   * Generate a response based on active persona
   * @param {String} promptText - The original prompt text
   * @returns {String} - HTML for the response
   */
  generateResponse(promptText) {
    // Generate different responses based on active persona
    switch (this.activePersona) {
      case 'dr-memoria':
        return `
          <p>Thank you for sharing your publication idea. I'll help you develop this through Roark's 5.0 Authorship Framework.</p>
          <p>Your concept: "${promptText}"</p>
          <p>I recommend starting with the Ideation phase to explore the key themes and unique perspectives you want to include. Would you like me to help you structure an outline based on your expertise?</p>
        `;
      case 'dr-match':
        return `
          <p>I understand you're interested in: "${promptText}"</p>
          <p>From a relationship management perspective, I can help you develop this content to strengthen connections with your audience. Would you prefer to focus on thought leadership or specialized expertise for your audience?</p>
        `;
      case 'co-pilot':
        return `
          <p>I've noted your request: "${promptText}"</p>
          <p>As your Co-Pilot, I can coordinate between our authorship and relationship management systems. Would you like me to:</p>
          <ol>
            <li>Start the content creation process with Dr. Memoria</li>
            <li>Develop audience targeting strategies with Dr. Match</li>
            <li>Create a comprehensive publication plan using both approaches</li>
          </ol>
        `;
      default:
        return `<p>I've recorded your request: "${promptText}"</p>`;
    }
  }
  
  /**
   * Scroll content to bottom
   * @param {Element} container - The container to scroll
   */
  scrollToBottom(container) {
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
  
  /**
   * Get formatted time for messages
   * @returns {String} - Formatted time string
   */
  getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * Show notification
   * @param {String} message - The notification message
   * @param {String} type - The notification type (info, success, error)
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'info' ? 'fa-info-circle' : 
                type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    notification.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }
}

// Create and export module instance
const anthologySystem = new AnthologySystem();

// Make available globally
window.anthologySystem = anthologySystem;