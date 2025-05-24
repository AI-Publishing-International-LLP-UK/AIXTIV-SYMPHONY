/**
 * ChromaKey Class
 * Handles the green screen effect processing
 */
class ChromaKey {
  /**
   * Initialize the ChromaKey processor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Use provided settings or defaults from CONFIG
    this.settings = {
      targetColor: options.targetColor || CONFIG.chromaKey.targetColor,
      threshold: options.threshold || CONFIG.chromaKey.threshold,
      smoothing: options.smoothing || CONFIG.chromaKey.smoothing,
      feathering: options.feathering || CONFIG.chromaKey.feathering,
      antiAlias: options.antiAlias !== undefined ? options.antiAlias : CONFIG.chromaKey.antiAlias,
    };

    // Elements
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.backgroundImage = new Image();
    this.isInitialized = false;
    
    // Processing data
    this.frameTimer = null;
    this.width = 0;
    this.height = 0;
  }

  /**
   * Initialize the chroma key processor
   * @param {HTMLVideoElement} videoElement - The video source element
   * @param {HTMLCanvasElement} canvasElement - The canvas for output
   * @param {String} backgroundSrc - Path to background image
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize(videoElement, canvasElement, backgroundSrc) {
    // Set elements
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    
    // Set initial dimensions
    this._updateDimensions();
    
    // Load background image
    if (backgroundSrc) {
      await this._loadBackground(backgroundSrc);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => this._updateDimensions());
    
    this.isInitialized = true;
    return Promise.resolve();
  }

  /**
   * Start processing video frames
   */
  start() {
    if (!this.isInitialized) {
      console.error('ChromaKey not initialized. Call initialize() first.');
      return;
    }
    
    // Stop any existing processing
    this.stop();
    
    // Start processing frames
    this.frameTimer = requestAnimationFrame(() => this._processFrame());
  }

  /**
   * Stop processing video frames
   */
  stop() {
    if (this.frameTimer) {
      cancelAnimationFrame(this.frameTimer);
      this.frameTimer = null;
    }
  }

  /**
   * Set a new background image
   * @param {String} src - Path to the background image
   * @returns {Promise} Promise that resolves when the image is loaded
   */
  setBackground(src) {
    return this._loadBackground(src);
  }

  /**
   * Update chroma key settings
   * @param {Object} newSettings - New settings to apply
   */
  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
  }

  /**
   * Process a single video frame
   * @private
   */
  _processFrame() {
    if (!this.isInitialized || !this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // Request next frame and wait for video data
      this.frameTimer = requestAnimationFrame(() => this._processFrame());
      return;
    }

    // Update dimensions if needed
    this._updateDimensions();

    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.width, this.height);

    // Apply chroma key effect
    this._applyChromaKey();

    // Request next frame
    this.frameTimer = requestAnimationFrame(() => this._processFrame());
  }

  /**
   * Apply the chroma key effect to the current canvas
   * @private
   */
  _applyChromaKey() {
    // Get image data from canvas
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;
    
    // Target color components
    const targetR = this.settings.targetColor[0];
    const targetG = this.settings.targetColor[1];
    const targetB = this.settings.targetColor[2];
    
    // Threshold and smoothing
    const threshold = this.settings.threshold;
    const smoothing = this.settings.smoothing;

    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate color distance (using a weighted formula that's sensitive to green)
      const dR = r - targetR;
      const dG = g - targetG;
      const dB = b - targetB;
      
      // Green is given more weight in this calculation since it's our key color
      const distance = Math.sqrt(
        dR * dR * 0.3 +
        dG * dG * 0.6 +
        dB * dB * 0.1
      );

      // Calculate alpha based on distance from target color
      let alpha = 255;
      
      if (distance < threshold) {
        // Inside threshold - fully transparent
        alpha = 0;
      } else if (distance < threshold + smoothing) {
        // Edge area - apply smoothing
        const smoothFactor = (distance - threshold) / smoothing;
        alpha = Math.round(smoothFactor * 255);
      }

      // Apply alpha
      data[i + 3] = alpha;
    }

    // Create temporary canvas for background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw background image
    if (this.backgroundImage.complete && this.backgroundImage.src) {
      tempCtx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
    } else {
      // Fallback to solid color if no background
      tempCtx.fillStyle = '#000000';
      tempCtx.fillRect(0, 0, this.width, this.height);
    }
    
    // Apply anti-aliasing if enabled
    if (this.settings.antiAlias) {
      this._applyAntiAliasing(data, this.width, this.height);
    }

    // Draw processed frame back to canvas
    this.ctx.putImageData(imageData, 0, 0);
    
    // Get background from temp canvas
    const bgData = tempCtx.getImageData(0, 0, this.width, this.height).data;
    
    // Blend with background using destination-over
    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Apply anti-aliasing to the image data
   * @param {Uint8ClampedArray} data - The image data to process
   * @param {Number} width - Image width
   * @param {Number} height - Image height
   * @private
   */
  _applyAntiAliasing(data, width, height) {
    const feathering = this.settings.feathering;
    
    // Skip if feathering is disabled
    if (feathering <= 0) return;
    
    // Apply a simple box blur to alpha channel only at edges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        
        // Only process semi-transparent pixels (edges)
        if (alpha > 0 && alpha < 255) {
          // Apply feathering
          let sum = alpha;
          let count = 1;
          
          // Sample surrounding pixels
          for (let fy = -feathering; fy <= feathering; fy++) {
            for (let fx = -feathering; fx <= feathering; fx++) {
              if (fx === 0 && fy === 0) continue;
              
              const nx = x + fx;
              const ny = y + fy;
              
              // Skip out of bounds
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
              
              const nIdx = (ny * width + nx) * 4;
              sum += data[nIdx + 3];
              count++;
            }
          }
          
          // Set new alpha
          data[idx + 3] = Math.round(sum / count);
        }
      }
    }
  }

  /**
   * Load a background image
   * @param {String} src - Path to the background image
   * @returns {Promise} Promise that resolves when the image is loaded
   * @private
   */
  _loadBackground(src) {
    return new Promise((resolve, reject) => {
      this.backgroundImage = new Image();
      this.backgroundImage.onload = () => resolve();
      this.backgroundImage.onerror = (err) => reject(err);
      this.backgroundImage.src = src;
    });
  }

  /**
   * Update canvas dimensions based on current video or window size
   * @private
   */
  _updateDimensions() {
    // If video is available, use its size
    if (this.video && this.video.videoWidth > 0 && this.video.videoHeight > 0) {
      // Maintain aspect ratio
      const videoRatio = this.video.videoWidth / this.video.videoHeight;
      const windowRatio = window.innerWidth / window.innerHeight;
      
      if (windowRatio > videoRatio) {
        // Window is wider than video
        this.height = window.innerHeight;
        this.width = this.height * videoRatio;
      } else {
        // Window is taller than video
        this.width = window.innerWidth;
        this.height = this.width / videoRatio;
      }
    } else {
      // Fallback to window size
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    }
    
    // Update canvas size
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }
}