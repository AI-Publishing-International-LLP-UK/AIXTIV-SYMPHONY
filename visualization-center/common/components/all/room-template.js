/**
 * @class VisualizationRoom
 * @description Base template for creating visualization rooms
 * @implements Hub Object Distribution pattern
 */
class VisualizationRoom {
  constructor(options = {}) {
    // Core room properties
    this.roomId = options.roomId || `room-${Date.now()}`;
    this.roomName = options.roomName || 'Untitled Room';
    this.roomType = options.roomType || 'standard';
    this.capacity = options.capacity || 10;
    this.targetElement = options.targetElement || document.body;

    // Environment settings
    this.backgroundColor = options.backgroundColor || '#000000';
    this.backgroundImage = options.backgroundImage || null;
    this.backgroundVideo = options.backgroundVideo || null;
    this.ambientAudio = options.ambientAudio || null;
    this.lightingPreset = options.lightingPreset || 'standard';

    // Green screen integration
    this.greenScreenEnabled = options.greenScreenEnabled || false;
    this.greenScreenCalibration = options.greenScreenCalibration || {
      keyColor: [0, 177, 64], // RGB green
      similarity: 0.4,
      smoothness: 0.1,
    };

    // Functionality & features
    this.hasBreakoutRooms = options.hasBreakoutRooms || false;
    this.breakoutRooms = [];
    this.hasPresentationScreen = options.hasPresentationScreen !== false;
    this.hasAudioSystem = options.hasAudioSystem !== false;
    this.hasVideoSystem = options.hasVideoSystem !== false;
    this.has3DObjects = options.has3DObjects || false;
    this.hasCollaboration = options.hasCollaboration || false;

    // State tracking
    this.isActive = false;
    this.occupants = [];
    this.activePresentation = null;
    this.roomState = 'idle';

    // Endpoint visibility system
    this.endpoints = options.endpoints || {};
    this.endpointVisibility = options.endpointVisibility || 'hover';

    // Initialize room
    this.initRoom();

    // Register with HOD registry if available
    if (window.ASOOS && window.ASOOS.HOD) {
      window.ASOOS.HOD.register('VisualizationRoom', this, this.roomId);
    }
  }

  /**
   * Initialize the room DOM structure
   */
  initRoom() {
    // Create room container
    this.roomContainer = document.createElement('div');
    this.roomContainer.id = this.roomId;
    this.roomContainer.className = `visualization-room visualization-room-${this.roomType}`;

    // Set room styles
    this.roomContainer.style.backgroundColor = this.backgroundColor;

    // Create room header
    this.roomHeader = document.createElement('div');
    this.roomHeader.className = 'visualization-room-header';

    const roomTitle = document.createElement('h2');
    roomTitle.className = 'visualization-room-title';
    roomTitle.textContent = this.roomName;
    this.roomHeader.appendChild(roomTitle);

    // Create room content area
    this.roomContent = document.createElement('div');
    this.roomContent.className = 'visualization-room-content';

    // Create presentation screen if enabled
    if (this.hasPresentationScreen) {
      this.presentationScreen = document.createElement('div');
      this.presentationScreen.className = 'visualization-presentation-screen';
      this.roomContent.appendChild(this.presentationScreen);
    }

    // Create room controls
    this.roomControls = document.createElement('div');
    this.roomControls.className = 'visualization-room-controls';

    // Create endpoint indicators if enabled
    if (this.endpointVisibility !== 'none') {
      this.createEndpointIndicators();
    }

    // Assemble room
    this.roomContainer.appendChild(this.roomHeader);
    this.roomContainer.appendChild(this.roomContent);
    this.roomContainer.appendChild(this.roomControls);

    // Add to target element
    this.targetElement.appendChild(this.roomContainer);

    // Set initial state
    this.setActive(false);

    // Initialize green screen if enabled
    if (this.greenScreenEnabled) {
      this.initGreenScreen();
    }

    // Setup breakout rooms if enabled
    if (this.hasBreakoutRooms) {
      this.setupBreakoutRooms();
    }
  }

  /**
   * Initialize green screen functionality
   */
  initGreenScreen() {
    this.greenScreenContainer = document.createElement('div');
    this.greenScreenContainer.className = 'green-screen-container';

    // Create video element for camera input
    this.cameraVideo = document.createElement('video');
    this.cameraVideo.className = 'green-screen-camera';
    this.cameraVideo.autoplay = true;
    this.cameraVideo.muted = true;
    this.greenScreenContainer.appendChild(this.cameraVideo);

    // Create canvas for processing
    this.greenScreenCanvas = document.createElement('canvas');
    this.greenScreenCanvas.className = 'green-screen-canvas';
    this.greenScreenContainer.appendChild(this.greenScreenCanvas);

    // Create controls for green screen
    this.greenScreenControls = document.createElement('div');
    this.greenScreenControls.className = 'green-screen-controls';

    // Create calibration sliders
    const similarityControl = document.createElement('div');
    similarityControl.className = 'green-screen-control';

    const similarityLabel = document.createElement('label');
    similarityLabel.textContent = 'Color Similarity:';

    const similaritySlider = document.createElement('input');
    similaritySlider.type = 'range';
    similaritySlider.min = '0';
    similaritySlider.max = '1';
    similaritySlider.step = '0.01';
    similaritySlider.value = this.greenScreenCalibration.similarity.toString();
    similaritySlider.addEventListener('input', event => {
      this.greenScreenCalibration.similarity = parseFloat(event.target.value);
      this.updateGreenScreen();
    });

    similarityControl.appendChild(similarityLabel);
    similarityControl.appendChild(similaritySlider);
    this.greenScreenControls.appendChild(similarityControl);

    // Add smoothness control
    const smoothnessControl = document.createElement('div');
    smoothnessControl.className = 'green-screen-control';

    const smoothnessLabel = document.createElement('label');
    smoothnessLabel.textContent = 'Edge Smoothness:';

    const smoothnessSlider = document.createElement('input');
    smoothnessSlider.type = 'range';
    smoothnessSlider.min = '0';
    smoothnessSlider.max = '1';
    smoothnessSlider.step = '0.01';
    smoothnessSlider.value = this.greenScreenCalibration.smoothness.toString();
    smoothnessSlider.addEventListener('input', event => {
      this.greenScreenCalibration.smoothness = parseFloat(event.target.value);
      this.updateGreenScreen();
    });

    smoothnessControl.appendChild(smoothnessLabel);
    smoothnessControl.appendChild(smoothnessSlider);
    this.greenScreenControls.appendChild(smoothnessControl);

    // Add controls to container
    this.greenScreenContainer.appendChild(this.greenScreenControls);

    // Add to room content
    this.roomContent.appendChild(this.greenScreenContainer);

    // Start camera if available
    this.startCamera();
  }

  /**
   * Start camera for green screen
   */
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.cameraVideo.srcObject = stream;
      this.cameraVideo.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        this.greenScreenCanvas.width = this.cameraVideo.videoWidth;
        this.greenScreenCanvas.height = this.cameraVideo.videoHeight;

        // Start processing
        this.processingInterval = setInterval(
          () => this.processGreenScreen(),
          1000 / 30
        ); // 30fps
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.greenScreenEnabled = false;
      this.greenScreenContainer.innerHTML =
        '<p class="error-message">Camera access denied or unavailable</p>';
    }
  }

  /**
   * Process green screen effect
   */
  processGreenScreen() {
    if (
      !this.cameraVideo ||
      !this.greenScreenCanvas ||
      !this.greenScreenEnabled
    )
      return;

    const ctx = this.greenScreenCanvas.getContext('2d');
    ctx.drawImage(
      this.cameraVideo,
      0,
      0,
      this.greenScreenCanvas.width,
      this.greenScreenCanvas.height
    );

    // Apply chroma key effect
    const imageData = ctx.getImageData(
      0,
      0,
      this.greenScreenCanvas.width,
      this.greenScreenCanvas.height
    );
    const data = imageData.data;

    const [r, g, b] = this.greenScreenCalibration.keyColor;
    const similarity = this.greenScreenCalibration.similarity;
    const smoothness = this.greenScreenCalibration.smoothness;

    for (let i = 0; i < data.length; i += 4) {
      const pixelR = data[i];
      const pixelG = data[i + 1];
      const pixelB = data[i + 2];

      // Calculate color difference
      const diff =
        Math.sqrt(
          Math.pow(pixelR - r, 2) +
            Math.pow(pixelG - g, 2) +
            Math.pow(pixelB - b, 2)
        ) / 255;

      // Calculate alpha based on difference
      let alpha = 1;
      if (diff < similarity) {
        alpha = 0;
      } else if (diff < similarity + smoothness) {
        alpha = (diff - similarity) / smoothness;
      }

      // Apply alpha
      data[i + 3] = Math.round(data[i + 3] * alpha);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Update green screen settings
   */
  updateGreenScreen() {
    // This will be called when green screen settings change
    // No need to do anything as the next processGreenScreen call will use updated values
  }

  /**
   * Setup breakout rooms
   */
  setupBreakoutRooms() {
    this.breakoutContainer = document.createElement('div');
    this.breakoutContainer.className = 'breakout-rooms-container';

    // Add breakout rooms button
    const breakoutButton = document.createElement('button');
    breakoutButton.className = 'breakout-rooms-button';
    breakoutButton.textContent = 'Breakout Rooms';
    breakoutButton.addEventListener('click', () => this.toggleBreakoutRooms());
    this.roomControls.appendChild(breakoutButton);

    // Add breakout container to room
    this.roomContent.appendChild(this.breakoutContainer);

    // Hide initially
    this.breakoutContainer.style.display = 'none';
  }

  /**
   * Toggle breakout rooms visibility
   */
  toggleBreakoutRooms() {
    const isVisible = this.breakoutContainer.style.display !== 'none';
    this.breakoutContainer.style.display = isVisible ? 'none' : 'block';

    if (!isVisible && this.breakoutRooms.length === 0) {
      // Create default breakout rooms if none exist
      this.createBreakoutRoom('Breakout 1');
      this.createBreakoutRoom('Breakout 2');
    }
  }

  /**
   * Create a breakout room
   * @param {string} name - Name of the breakout room
   * @returns {Object} Breakout room object
   */
  createBreakoutRoom(name) {
    const roomId = `${this.roomId}-breakout-${this.breakoutRooms.length + 1}`;

    // Create breakout room element
    const roomElement = document.createElement('div');
    roomElement.className = 'breakout-room';
    roomElement.id = roomId;

    // Add room header
    const header = document.createElement('h3');
    header.textContent = name;
    roomElement.appendChild(header);

    // Add join button
    const joinButton = document.createElement('button');
    joinButton.textContent = 'Join Room';
    joinButton.addEventListener('click', () => this.joinBreakoutRoom(roomId));
    roomElement.appendChild(joinButton);

    // Add to container
    this.breakoutContainer.appendChild(roomElement);

    // Create room object
    const room = {
      id: roomId,
      name,
      element: roomElement,
      occupants: [],
    };

    this.breakoutRooms.push(room);
    return room;
  }

  /**
   * Join a breakout room
   * @param {string} roomId - ID of the breakout room
   */
  joinBreakoutRoom(roomId) {
    // Find the room
    const room = this.breakoutRooms.find(r => r.id === roomId);
    if (!room) return;

    console.log(`Joining breakout room: ${room.name}`);

    // In a real implementation, this would handle the connection to the breakout room
    // For this template, we'll just log the action
  }

  /**
   * Create visual indicators for all connection endpoints
   */
  createEndpointIndicators() {
    this.endpointContainer = document.createElement('div');
    this.endpointContainer.className = 'visualization-room-endpoints';

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

    // Add to room
    this.roomContainer.appendChild(this.endpointContainer);

    // Set visibility based on settings
    if (this.endpointVisibility === 'hover') {
      this.endpointContainer.classList.add('endpoints-hover');
    } else if (this.endpointVisibility === 'always') {
      this.endpointContainer.classList.add('endpoints-visible');
    }
  }

  /**
   * Set the active state of the room
   * @param {boolean} active - Whether the room is active
   */
  setActive(active) {
    this.isActive = active;

    if (active) {
      this.roomContainer.classList.add('room-active');
    } else {
      this.roomContainer.classList.remove('room-active');
    }

    return this.isActive;
  }

  /**
   * Set the background of the room
   * @param {Object} options - Background options
   * @param {string} [options.color] - Background color
   * @param {string} [options.image] - Background image URL
   * @param {string} [options.video] - Background video URL
   */
  setBackground(options = {}) {
    if (options.color) {
      this.backgroundColor = options.color;
      this.roomContainer.style.backgroundColor = options.color;
    }

    if (options.image) {
      this.backgroundImage = options.image;
      this.roomContainer.style.backgroundImage = `url(${options.image})`;
      this.roomContainer.style.backgroundSize = 'cover';
      this.roomContainer.style.backgroundPosition = 'center';
    }

    if (options.video) {
      this.backgroundVideo = options.video;

      // Remove existing video if any
      const existingVideo = this.roomContainer.querySelector(
        '.room-background-video'
      );
      if (existingVideo) {
        existingVideo.remove();
      }

      // Create video element
      const videoElement = document.createElement('video');
      videoElement.className = 'room-background-video';
      videoElement.src = options.video;
      videoElement.autoplay = true;
      videoElement.loop = true;
      videoElement.muted = true;

      // Insert as first child to be in the background
      this.roomContainer.insertBefore(
        videoElement,
        this.roomContainer.firstChild
      );
    }
  }

  /**
   * Set the lighting preset for the room
   * @param {string} preset - Lighting preset name
   */
  setLightingPreset(preset) {
    this.lightingPreset = preset;

    // Remove existing lighting classes
    const lightingClasses = Array.from(this.roomContainer.classList).filter(
      cls => cls.startsWith('lighting-')
    );

    lightingClasses.forEach(cls => {
      this.roomContainer.classList.remove(cls);
    });

    // Add new lighting class
    this.roomContainer.classList.add(`lighting-${preset}`);

    return true;
  }

  /**
   * Load content into the presentation screen
   * @param {Object} content - Content to load
   * @param {string} [content.type='html'] - Content type (html, iframe, image, video)
   * @param {string|HTMLElement} content.data - Content data
   */
  loadPresentation(content = {}) {
    if (!this.hasPresentationScreen || !this.presentationScreen) {
      return false;
    }

    const type = content.type || 'html';

    // Clear existing content
    this.presentationScreen.innerHTML = '';

    // Load based on type
    if (type === 'html') {
      if (typeof content.data === 'string') {
        this.presentationScreen.innerHTML = content.data;
      } else if (content.data instanceof HTMLElement) {
        this.presentationScreen.appendChild(content.data);
      }
    } else if (type === 'iframe') {
      const iframe = document.createElement('iframe');
      iframe.src = content.data;
      iframe.className = 'presentation-iframe';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      this.presentationScreen.appendChild(iframe);
    } else if (type === 'image') {
      const img = document.createElement('img');
      img.src = content.data;
      img.className = 'presentation-image';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      this.presentationScreen.appendChild(img);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.src = content.data;
      video.className = 'presentation-video';
      video.controls = true;
      video.style.maxWidth = '100%';
      video.style.maxHeight = '100%';
      this.presentationScreen.appendChild(video);
    }

    // Store active presentation
    this.activePresentation = content;

    return true;
  }

  /**
   * Add an occupant to the room
   * @param {Object} occupant - Occupant information
   */
  addOccupant(occupant) {
    // Check if already in room
    if (this.occupants.some(o => o.id === occupant.id)) {
      return false;
    }

    this.occupants.push(occupant);

    // Update room state if needed
    if (this.occupants.length === 1) {
      this.roomState = 'occupied';
    }

    return true;
  }

  /**
   * Remove an occupant from the room
   * @param {string} occupantId - ID of the occupant to remove
   */
  removeOccupant(occupantId) {
    const initialCount = this.occupants.length;
    this.occupants = this.occupants.filter(o => o.id !== occupantId);

    // Update room state if needed
    if (this.occupants.length === 0 && initialCount > 0) {
      this.roomState = 'idle';
    }

    return initialCount !== this.occupants.length;
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

  /**
   * Clean up resources when the room is destroyed
   */
  destroy() {
    // Stop camera if running
    if (this.cameraVideo && this.cameraVideo.srcObject) {
      const tracks = this.cameraVideo.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Clear processing interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Remove from DOM
    if (this.roomContainer && this.roomContainer.parentNode) {
      this.roomContainer.parentNode.removeChild(this.roomContainer);
    }

    // Unregister from HOD registry if available
    if (window.ASOOS && window.ASOOS.HOD) {
      window.ASOOS.HOD.unregister('VisualizationRoom', this.roomId);
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualizationRoom;
} else if (typeof define === 'function' && define.amd) {
  define([], function () {
    return VisualizationRoom;
  });
} else {
  window.VisualizationRoom = VisualizationRoom;
}
