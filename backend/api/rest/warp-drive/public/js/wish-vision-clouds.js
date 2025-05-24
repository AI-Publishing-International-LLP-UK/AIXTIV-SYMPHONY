/**
 * WishVision Clouds Class
 * Provides cloud visualization and wish manifestation for the Vision Space interface
 */
class WishVisionClouds {
  /**
   * Initialize WishVision Clouds
   * @param {HTMLElement} container - The container element for the clouds
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    // DOM Elements
    this.container = container;
    this.cloudsContainer = null;
    
    // Cloud state
    this.clouds = [];
    this.activeWishes = new Map();
    this.isVisible = false;
    
    // Configuration
    this.config = {
      maxClouds: options.maxClouds || 7,
      minSize: options.minSize || 100,
      maxSize: options.maxSize || 300,
      minOpacity: options.minOpacity || 0.3,
      maxOpacity: options.maxOpacity || 0.9,
      minDuration: options.minDuration || 60,
      maxDuration: options.maxDuration || 120,
      fadeInDuration: options.fadeInDuration || 2000,
      fadeOutDuration: options.fadeOutDuration || 2000,
      ...options
    };
    
    // Initialize
    this._initialize();
  }

  /**
   * Show the WishVision Clouds
   */
  show() {
    if (this.cloudsContainer) {
      this.cloudsContainer.style.transition = `opacity ${this.config.fadeInDuration / 1000}s ease-in-out`;
      this.cloudsContainer.style.opacity = '1';
      this.cloudsContainer.style.pointerEvents = 'auto';
      this.isVisible = true;
    }
  }

  /**
   * Hide the WishVision Clouds
   */
  hide() {
    if (this.cloudsContainer) {
      this.cloudsContainer.style.transition = `opacity ${this.config.fadeOutDuration / 1000}s ease-in-out`;
      this.cloudsContainer.style.opacity = '0';
      this.cloudsContainer.style.pointerEvents = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Toggle visibility of the WishVision Clouds
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Add a new wish to the WishVision Clouds
   * @param {Object} wish - The wish to add
   * @param {String} wish.id - Unique identifier for the wish
   * @param {String} wish.text - The wish text
   * @param {String} wish.pilotId - The ID of the pilot who made the wish
   * @param {Object} wish.config - Optional configuration for the wish
   * @returns {String} The ID of the created wish cloud
   */
  addWish(wish) {
    if (!wish || !wish.text || !wish.pilotId) {
      console.error('Invalid wish data');
      return null;
    }
    
    // Create unique ID if not provided
    const wishId = wish.id || `wish-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create a new cloud for this wish
    const cloudElement = this._createCloudElement(wishId, wish);
    
    // Add to DOM
    this.cloudsContainer.appendChild(cloudElement);
    
    // Add to active wishes
    this.activeWishes.set(wishId, {
      element: cloudElement,
      data: wish,
      timestamp: Date.now()
    });
    
    // Add animation
    this._animateCloud(cloudElement);
    
    // Track the cloud
    this.clouds.push({
      id: wishId,
      element: cloudElement
    });
    
    // If we have too many clouds, remove the oldest
    if (this.clouds.length > this.config.maxClouds) {
      const oldestCloud = this.clouds.shift();
      this._removeCloud(oldestCloud.id);
    }
    
    return wishId;
  }

  /**
   * Update an existing wish
   * @param {String} wishId - The ID of the wish to update
   * @param {Object} wishData - New wish data
   */
  updateWish(wishId, wishData) {
    if (!this.activeWishes.has(wishId)) {
      console.error(`Wish not found: ${wishId}`);
      return;
    }
    
    const wishInfo = this.activeWishes.get(wishId);
    
    // Update the data
    wishInfo.data = {
      ...wishInfo.data,
      ...wishData
    };
    
    // Update the element
    this._updateCloudElement(wishInfo.element, wishInfo.data);
  }

  /**
   * Remove a wish from the clouds
   * @param {String} wishId - The ID of the wish to remove
   */
  removeWish(wishId) {
    this._removeCloud(wishId);
    
    // Remove from clouds array
    this.clouds = this.clouds.filter(cloud => cloud.id !== wishId);
  }

  /**
   * Clear all wishes
   */
  clearWishes() {
    // Remove all cloud elements
    this.clouds.forEach(cloud => {
      this._removeCloud(cloud.id);
    });
    
    // Reset arrays
    this.clouds = [];
    this.activeWishes.clear();
  }

  /**
   * Initialize the WishVision Clouds
   * @private
   */
  _initialize() {
    // Create container for clouds
    this.cloudsContainer = document.createElement('div');
    this.cloudsContainer.className = 'wish-vision-clouds';
    this.cloudsContainer.style.opacity = '0';
    this.cloudsContainer.style.pointerEvents = 'none';
    
    // Add to main container
    this.container.appendChild(this.cloudsContainer);
    
    // Add event listeners
    this._setupEventListeners();
  }

  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => {
      // Reposition clouds when window is resized
      this.clouds.forEach(cloud => {
        this._repositionCloud(cloud.element);
      });
    });
  }

  /**
   * Create a cloud element for a wish
   * @param {String} wishId - The ID of the wish
   * @param {Object} wishData - The wish data
   * @returns {HTMLElement} The created cloud element
   * @private
   */
  _createCloudElement(wishId, wishData) {
    // Create the cloud element
    const cloudElement = document.createElement('div');
    cloudElement.className = 'wish-cloud';
    cloudElement.setAttribute('data-wish-id', wishId);
    
    // Set initial size
    const size = this._randomBetween(this.config.minSize, this.config.maxSize);
    cloudElement.style.width = `${size}px`;
    cloudElement.style.height = `${size * 0.7}px`;
    
    // Set initial position
    this._repositionCloud(cloudElement);
    
    // Create inner content
    cloudElement.innerHTML = `
      <div class="wish-cloud-inner">
        <div class="wish-text">${wishData.text}</div>
        <div class="wish-pilot">Pilot: ${wishData.pilotId}</div>
        ${wishData.config && wishData.config.priority ? 
          `<div class="wish-priority ${wishData.config.priority.toLowerCase()}">
            ${wishData.config.priority}
          </div>` : ''}
      </div>
    `;
    
    // Add click event to maximize cloud
    cloudElement.addEventListener('click', () => {
      this._toggleCloudFocus(cloudElement);
    });
    
    return cloudElement;
  }

  /**
   * Update a cloud element with new wish data
   * @param {HTMLElement} cloudElement - The cloud element to update
   * @param {Object} wishData - The new wish data
   * @private
   */
  _updateCloudElement(cloudElement, wishData) {
    // Update the inner content
    const inner = cloudElement.querySelector('.wish-cloud-inner');
    
    if (inner) {
      inner.innerHTML = `
        <div class="wish-text">${wishData.text}</div>
        <div class="wish-pilot">Pilot: ${wishData.pilotId}</div>
        ${wishData.config && wishData.config.priority ? 
          `<div class="wish-priority ${wishData.config.priority.toLowerCase()}">
            ${wishData.config.priority}
          </div>` : ''}
      `;
    }
  }

  /**
   * Toggle focus on a cloud
   * @param {HTMLElement} cloudElement - The cloud element to focus
   * @private
   */
  _toggleCloudFocus(cloudElement) {
    const isFocused = cloudElement.classList.contains('focused');
    
    // Remove focus from all clouds
    document.querySelectorAll('.wish-cloud.focused').forEach(cloud => {
      if (cloud !== cloudElement) {
        cloud.classList.remove('focused');
      }
    });
    
    // Toggle focus on this cloud
    cloudElement.classList.toggle('focused', !isFocused);
  }

  /**
   * Animate a cloud with random motion
   * @param {HTMLElement} cloudElement - The cloud element to animate
   * @private
   */
  _animateCloud(cloudElement) {
    // Set initial opacity
    const opacity = this._randomBetween(this.config.minOpacity, this.config.maxOpacity);
    cloudElement.style.opacity = opacity;
    
    // Set animation duration
    const duration = this._randomBetween(this.config.minDuration, this.config.maxDuration);
    cloudElement.style.animationDuration = `${duration}s`;
    
    // Set random animation delay
    const delay = this._randomBetween(0, 10);
    cloudElement.style.animationDelay = `${delay}s`;
    
    // Add animation class
    cloudElement.classList.add('animated');
  }

  /**
   * Position a cloud at a random location
   * @param {HTMLElement} cloudElement - The cloud element to position
   * @private
   */
  _repositionCloud(cloudElement) {
    const containerRect = this.cloudsContainer.getBoundingClientRect();
    const cloudWidth = parseInt(cloudElement.style.width) || this.config.minSize;
    const cloudHeight = parseInt(cloudElement.style.height) || (this.config.minSize * 0.7);
    
    // Calculate random position
    const left = this._randomBetween(0, containerRect.width - cloudWidth);
    const top = this._randomBetween(0, containerRect.height - cloudHeight);
    
    // Set position
    cloudElement.style.left = `${left}px`;
    cloudElement.style.top = `${top}px`;
  }

  /**
   * Remove a cloud from the DOM
   * @param {String} wishId - The ID of the wish/cloud to remove
   * @private
   */
  _removeCloud(wishId) {
    // Find the cloud element
    if (this.activeWishes.has(wishId)) {
      const wishInfo = this.activeWishes.get(wishId);
      const cloudElement = wishInfo.element;
      
      // Add fading out class
      cloudElement.classList.add('fading-out');
      
      // Remove after animation
      setTimeout(() => {
        if (cloudElement.parentNode) {
          cloudElement.parentNode.removeChild(cloudElement);
        }
        this.activeWishes.delete(wishId);
      }, 1000);
    }
  }

  /**
   * Generate a random number between min and max
   * @param {Number} min - Minimum value
   * @param {Number} max - Maximum value
   * @returns {Number} Random number in the range
   * @private
   */
  _randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}