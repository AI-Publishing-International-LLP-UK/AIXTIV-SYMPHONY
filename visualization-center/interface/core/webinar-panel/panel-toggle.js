/**
 * @class WebinarPanelToggle
 * @description TV-like interface toggle system for the universal Webinar Panel
 * @implements Hub Object Distribution pattern
 */
class WebinarPanelToggle {
  constructor(options = {}) {
    // Core panel properties
    this.panelId = options.panelId || 'webinar-panel';
    this.targetElement = options.targetElement || document.body;
    this.position = options.position || 'bottom-right';
    this.activeView = options.defaultView || 'default';
    this.availableViews = options.availableViews || [];
    this.userRole = options.userRole || 'subscriber';
    this.geography = options.geography || 'north-america';
    this.onViewChange = options.onViewChange || null;

    // Customization options
    this.theme = options.theme || 'dark';
    this.animate = options.animate !== false;
    this.showLabels = options.showLabels !== false;
    this.miniMode = options.miniMode || false;
    this.allowCustomization = options.allowCustomization !== false;

    // State tracking
    this.isVisible = false;
    this.isExpanded = false;
    this.history = [];
    this.favorites = options.favorites || [];

    // Endpoint visibility system
    this.endpoints = options.endpoints || {};
    this.endpointVisibility = options.endpointVisibility || 'hover';

    // Initialize panel
    this.initPanel();

    // Register with HOD registry if available
    if (window.ASOOS && window.ASOOS.HOD) {
      window.ASOOS.HOD.register('WebinarPanelToggle', this);
    }
  }

  /**
   * Initialize the panel DOM structure
   */
  initPanel() {
    // Create panel container
    this.panelContainer = document.createElement('div');
    this.panelContainer.id = this.panelId;
    this.panelContainer.className = `webinar-panel webinar-panel-${this.theme} webinar-panel-${this.position}`;

    // Create toggle button (TV power button style)
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'webinar-panel-toggle-button';
    this.toggleButton.innerHTML = '<span class="power-icon">⏻</span>';
    this.toggleButton.setAttribute('aria-label', 'Toggle Webinar Panel');
    this.toggleButton.addEventListener('click', () => this.toggleVisibility());

    // Create view container
    this.viewContainer = document.createElement('div');
    this.viewContainer.className = 'webinar-panel-view-container';

    // Create channel controls (TV channel style)
    this.channelControls = document.createElement('div');
    this.channelControls.className = 'webinar-panel-channel-controls';

    // Create channel up button
    this.channelUpButton = document.createElement('button');
    this.channelUpButton.className = 'webinar-panel-channel-button channel-up';
    this.channelUpButton.innerHTML = '▲';
    this.channelUpButton.setAttribute('aria-label', 'Next View');
    this.channelUpButton.addEventListener('click', () => this.nextView());

    // Create channel down button
    this.channelDownButton = document.createElement('button');
    this.channelDownButton.className =
      'webinar-panel-channel-button channel-down';
    this.channelDownButton.innerHTML = '▼';
    this.channelDownButton.setAttribute('aria-label', 'Previous View');
    this.channelDownButton.addEventListener('click', () => this.previousView());

    // Create channel display
    this.channelDisplay = document.createElement('div');
    this.channelDisplay.className = 'webinar-panel-channel-display';
    this.channelDisplay.innerHTML = this.activeView;

    // Assemble channel controls
    this.channelControls.appendChild(this.channelUpButton);
    this.channelControls.appendChild(this.channelDisplay);
    this.channelControls.appendChild(this.channelDownButton);

    // Assemble panel
    this.panelContainer.appendChild(this.toggleButton);
    this.panelContainer.appendChild(this.viewContainer);
    this.panelContainer.appendChild(this.channelControls);

    // Add endpoint indicators if enabled
    if (this.endpointVisibility !== 'none') {
      this.createEndpointIndicators();
    }

    // Add to target element
    this.targetElement.appendChild(this.panelContainer);

    // Hide initially
    this.hidePanel();
  }

  /**
   * Create visual indicators for all connection endpoints
   */
  createEndpointIndicators() {
    this.endpointContainer = document.createElement('div');
    this.endpointContainer.className = 'webinar-panel-endpoints';

    // Create indicators for each endpoint
    for (const [id, endpoint] of Object.entries(this.endpoints)) {
      const indicator = document.createElement('div');
      indicator.className = 'endpoint-indicator';
      indicator.dataset.endpointId = id;
      indicator.title = endpoint.description || id;

      // Color-code by endpoint type
      if (endpoint.type) {
        indicator.classList.add(`endpoint-${endpoint.type}`);
      }

      // Add connection status
      if (endpoint.connected) {
        indicator.classList.add('endpoint-connected');
      }

      // Add to container
      this.endpointContainer.appendChild(indicator);
    }

    // Add to panel
    this.panelContainer.appendChild(this.endpointContainer);

    // Set visibility based on settings
    if (this.endpointVisibility === 'hover') {
      this.endpointContainer.classList.add('endpoints-hover');
    } else if (this.endpointVisibility === 'always') {
      this.endpointContainer.classList.add('endpoints-visible');
    }
  }

  /**
   * Toggle panel visibility
   */
  toggleVisibility() {
    if (this.isVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
    return this.isVisible;
  }

  /**
   * Show the panel
   */
  showPanel() {
    this.panelContainer.classList.add('panel-visible');
    this.isVisible = true;

    // Trigger "power on" animation
    if (this.animate) {
      this.panelContainer.classList.add('panel-power-on');
      setTimeout(() => {
        this.panelContainer.classList.remove('panel-power-on');
      }, 500);
    }

    // Load current view
    this.loadView(this.activeView);

    return true;
  }

  /**
   * Hide the panel
   */
  hidePanel() {
    // Trigger "power off" animation
    if (this.animate) {
      this.panelContainer.classList.add('panel-power-off');
      setTimeout(() => {
        this.panelContainer.classList.remove('panel-power-off');
        this.panelContainer.classList.remove('panel-visible');
      }, 300);
    } else {
      this.panelContainer.classList.remove('panel-visible');
    }

    this.isVisible = false;
    return true;
  }

  /**
   * Load a specific view
   * @param {string} viewId - ID of the view to load
   */
  loadView(viewId) {
    // Find view in available views
    const view = this.availableViews.find(v => v.id === viewId);
    if (!view) {
      console.warn(`View "${viewId}" not found`);
      return false;
    }

    // Check permissions
    if (view.roles && !view.roles.includes(this.userRole)) {
      console.warn(
        `User role "${this.userRole}" does not have access to view "${viewId}"`
      );
      return false;
    }

    // Update channel display
    this.channelDisplay.innerHTML = view.name || view.id;

    // Load content
    this.viewContainer.innerHTML = '';

    if (typeof view.content === 'function') {
      // If content is a function, call it
      try {
        const content = view.content(this);
        if (typeof content === 'string') {
          this.viewContainer.innerHTML = content;
        } else if (content instanceof Node) {
          this.viewContainer.appendChild(content);
        }
      } catch (error) {
        console.error(`Error loading view "${viewId}":`, error);
        this.viewContainer.innerHTML = `<div class="view-error">Error loading view</div>`;
        return false;
      }
    } else if (typeof view.content === 'string') {
      // If content is a string, set as HTML
      this.viewContainer.innerHTML = view.content;
    } else if (view.content instanceof Node) {
      // If content is a DOM node, append it
      this.viewContainer.appendChild(view.content);
    } else if (view.url) {
      // If view has a URL, load via iframe
      const iframe = document.createElement('iframe');
      iframe.src = view.url;
      iframe.className = 'webinar-panel-iframe';
      this.viewContainer.appendChild(iframe);
    }

    // Update state
    this.previousView = this.activeView;
    this.activeView = viewId;
    this.history.push(viewId);

    // Call onViewChange callback if provided
    if (typeof this.onViewChange === 'function') {
      this.onViewChange(viewId, view);
    }

    return true;
  }

  /**
   * Switch to the next view
   */
  nextView() {
    if (!this.availableViews.length) return false;

    // Find current view index
    const currentIndex = this.availableViews.findIndex(
      v => v.id === this.activeView
    );
    let nextIndex = (currentIndex + 1) % this.availableViews.length;

    // Skip views that user doesn't have access to
    let attempts = 0;
    while (attempts < this.availableViews.length) {
      const nextView = this.availableViews[nextIndex];
      if (!nextView.roles || nextView.roles.includes(this.userRole)) {
        return this.loadView(nextView.id);
      }
      nextIndex = (nextIndex + 1) % this.availableViews.length;
      attempts++;
    }

    return false;
  }

  /**
   * Switch to the previous view
   */
  previousView() {
    if (!this.availableViews.length) return false;

    // Find current view index
    const currentIndex = this.availableViews.findIndex(
      v => v.id === this.activeView
    );
    let prevIndex =
      (currentIndex - 1 + this.availableViews.length) %
      this.availableViews.length;

    // Skip views that user doesn't have access to
    let attempts = 0;
    while (attempts < this.availableViews.length) {
      const prevView = this.availableViews[prevIndex];
      if (!prevView.roles || prevView.roles.includes(this.userRole)) {
        return this.loadView(prevView.id);
      }
      prevIndex =
        (prevIndex - 1 + this.availableViews.length) %
        this.availableViews.length;
      attempts++;
    }

    return false;
  }

  /**
   * Add a view to favorites
   * @param {string} viewId - ID of the view to add to favorites
   */
  addToFavorites(viewId) {
    if (!this.favorites.includes(viewId)) {
      this.favorites.push(viewId);
      return true;
    }
    return false;
  }

  /**
   * Remove a view from favorites
   * @param {string} viewId - ID of the view to remove from favorites
   */
  removeFromFavorites(viewId) {
    const index = this.favorites.indexOf(viewId);
    if (index !== -1) {
      this.favorites.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update endpoint connection status
   * @param {string} endpointId - ID of the endpoint to update
   * @param {boolean} connected - New connection status
   */
  updateEndpoint(endpointId, connected) {
    if (!this.endpoints[endpointId]) {
      return false;
    }

    // Update internal state
    this.endpoints[endpointId].connected = connected;

    // Update visual indicator if it exists
    const indicator = this.endpointContainer?.querySelector(
      `[data-endpoint-id="${endpointId}"]`
    );
    if (indicator) {
      if (connected) {
        indicator.classList.add('endpoint-connected');
      } else {
        indicator.classList.remove('endpoint-connected');
      }
    }

    return true;
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebinarPanelToggle;
} else if (typeof define === 'function' && define.amd) {
  define([], function () {
    return WebinarPanelToggle;
  });
} else {
  window.WebinarPanelToggle = WebinarPanelToggle;
}
