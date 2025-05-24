/**
 * Dr. Memoria's Anthology Module
 * Handles interactions and dynamic content for Dr. Memoria's Anthology
 */

class DrMemoriaAnthology {
  /**
   * Initialize the Dr. Memoria module
   */
  constructor() {
    this.isActive = false;
    this.initialized = false;
    this.recentPrompts = [];
    this.maxRecentPrompts = 5;
    
    // Listen for toggle events from navigation
    document.addEventListener('toggleDrMemoriaAnthology', this.handleToggle.bind(this));
    
    // Listen for DOM content loaded to initialize
    document.addEventListener('DOMContentLoaded', this.init.bind(this));
  }
  
  /**
   * Initialize event listeners and UI components
   */
  init() {
    console.log("Initializing Dr. Memoria's Anthology module");
    
    // Add event listeners for prompt submission
    document.addEventListener('click', (e) => {
      // Check if it's the submit button 
      if (e.target.closest('.anthology-prompt .submit-btn')) {
        this.handlePromptSubmission();
      }
    });
    
    // Add event listeners for tool buttons
    document.addEventListener('click', (e) => {
      const toolBtn = e.target.closest('.tool-btn');
      if (toolBtn) {
        this.handleToolClick(toolBtn);
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
   * Initialize additional functionality when anthology is active
   */
  initializeActiveState() {
    console.log("Initializing active state for Dr. Memoria's Anthology");
    
    // Focus the textarea when panel becomes active
    setTimeout(() => {
      const textarea = document.querySelector('.anthology-prompt textarea');
      if (textarea) {
        textarea.focus();
      }
    }, 800);
    
    // Add subtle background animation
    const panel = document.getElementById('dr-memoria-panel');
    if (panel) {
      panel.style.background = `
        linear-gradient(135deg, rgba(20, 20, 40, 0.7), rgba(65, 105, 225, 0.3)),
        url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path fill="rgba(65, 105, 225, 0.1)" d="M10 10L90 10L90 90L10 90Z"/></svg>')
      `;
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
    this.recentPrompts.unshift(promptText);
    
    // Limit to max recent prompts
    if (this.recentPrompts.length > this.maxRecentPrompts) {
      this.recentPrompts.pop();
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('drMemoriaRecentPrompts', JSON.stringify(this.recentPrompts));
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
    
    // Create prompt message container
    const promptContainer = document.createElement('div');
    promptContainer.className = 'prompt-message user';
    promptContainer.innerHTML = `
      <div class="message-content">${promptText}</div>
      <div class="message-time">${this.getFormattedTime()}</div>
    `;
    
    // Create response container with typing indicator
    const responseContainer = document.createElement('div');
    responseContainer.className = 'prompt-message system typing';
    responseContainer.innerHTML = `
      <div class="message-avatar">
        <img src="images/dr-memoria-avatar.png" onerror="this.src='https://via.placeholder.com/40?text=DM'" alt="Dr. Memoria">
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    // Add before the prompt textarea
    const promptElement = anthologyContent.querySelector('.anthology-prompt');
    anthologyContent.insertBefore(promptContainer, promptElement);
    anthologyContent.insertBefore(responseContainer, promptElement);
    
    // Simulate response after delay
    setTimeout(() => {
      responseContainer.classList.remove('typing');
      responseContainer.querySelector('.message-content').innerHTML = this.generateMockResponse(promptText);
      responseContainer.innerHTML += `<div class="message-time">${this.getFormattedTime()}</div>`;
      
      // Scroll to bottom
      anthologyContent.scrollTop = anthologyContent.scrollHeight;
    }, 2000);
    
    // Scroll to bottom
    anthologyContent.scrollTop = anthologyContent.scrollHeight;
  }
  
  /**
   * Generate a mock response (for demo purposes)
   * @param {String} promptText - The original prompt text
   * @returns {String} - HTML for the response
   */
  generateMockResponse(promptText) {
    // For demo, return simple acknowledgment
    return `
      <p>I've recorded your request: "${promptText}"</p>
      <p>This would typically connect to Dr. Memoria's Anthology system for content creation, knowledge management, and digital legacy services.</p>
    `;
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
   * Handle tool button clicks
   * @param {Element} toolBtn - The tool button element
   */
  handleToolClick(toolBtn) {
    const toolType = toolBtn.querySelector('i').className.split('fa-')[1].split(' ')[0];
    
    // Create notification for demo
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <span>The ${toolType} tool would launch here in the full implementation</span>
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
const drMemoriaAnthology = new DrMemoriaAnthology();

// Make available globally
window.drMemoriaAnthology = drMemoriaAnthology;