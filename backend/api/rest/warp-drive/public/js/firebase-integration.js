/**
 * FirebaseManager Class
 * Handles Firebase integration for the Vision Space interface
 */
class FirebaseManager {
  /**
   * Initialize the Firebase Manager
   * @param {SceneManager} sceneManager - Reference to the SceneManager
   */
  constructor(sceneManager) {
    // Dependencies
    this.sceneManager = sceneManager;
    
    // Firebase services
    this.firestore = null;
    this.storage = null;
    this.functions = null;
    
    // Data cache
    this.scenes = [];
    this.fleetData = {
      timeliners: [],
      timepressers: []
    };
    
    // Listeners
    this.sceneListener = null;
    this.fleetListener = null;
    
    // Initialize Firebase
    this._initialize();
  }

  /**
   * Initialize Firebase services
   * @private
   */
  _initialize() {
    // Firebase is auto-initialized by /__/firebase/init.js
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize Firebase
      firebase.initializeApp();
      
      // Initialize services
      this.firestore = firebase.firestore();
      this.storage = firebase.storage();
      this.functions = firebase.functions();
      
      // Load data
      this._loadScenes();
      this._loadFleetData();
      
      console.log('Firebase services initialized');
    });
  }

  /**
   * Load scenes from Firestore
   * @private
   */
  _loadScenes() {
    // Get collection reference
    const scenesRef = this.firestore.collection(CONFIG.firebase.sceneCollection);
    
    // Set up real-time listener
    this.sceneListener = scenesRef.where('active', '==', true)
      .onSnapshot((snapshot) => {
        // Process changes
        snapshot.docChanges().forEach((change) => {
          const scene = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          // Handle change type
          if (change.type === 'added' || change.type === 'modified') {
            // Update scene in the scene manager
            this._updateScene(scene);
          } else if (change.type === 'removed') {
            // Remove scene from the scene manager
            this._removeScene(scene.id);
          }
        });
      }, (error) => {
        console.error('Error loading scenes:', error);
      });
  }

  /**
   * Load fleet data from Firestore
   * @private
   */
  _loadFleetData() {
    // Get collection reference
    const fleetRef = this.firestore.collection(CONFIG.firebase.fleetCollection);
    
    // Set up real-time listener
    this.fleetListener = fleetRef.where('active', '==', true)
      .onSnapshot((snapshot) => {
        // Process changes
        snapshot.docChanges().forEach((change) => {
          const craft = {
            id: change.doc.id,
            ...change.doc.data()
          };
          
          // Determine craft type and update accordingly
          if (craft.type === 'Timeliner') {
            this._updateCraft('timeliners', craft, change.type);
          } else if (craft.type === 'Timepresser') {
            this._updateCraft('timepressers', craft, change.type);
          }
        });
      }, (error) => {
        console.error('Error loading fleet data:', error);
      });
  }

  /**
   * Update a scene in the scene manager
   * @param {Object} scene - Scene data
   * @private
   */
  _updateScene(scene) {
    // Process image URL if needed
    if (scene.backgroundRef && !scene.background) {
      this._getImageUrl(scene.backgroundRef)
        .then(url => {
          scene.background = url;
          this._addSceneToManager(scene);
        })
        .catch(error => {
          console.error('Error loading scene background:', error);
          // Still add the scene, just without the background
          this._addSceneToManager(scene);
        });
    } else {
      this._addSceneToManager(scene);
    }
  }

  /**
   * Add a scene to the scene manager
   * @param {Object} scene - Scene data
   * @private
   */
  _addSceneToManager(scene) {
    // Check if we already have this scene
    const existingSceneIndex = this.scenes.findIndex(s => s.id === scene.id);
    
    if (existingSceneIndex >= 0) {
      // Update existing scene
      this.scenes[existingSceneIndex] = scene;
    } else {
      // Add new scene
      this.scenes.push(scene);
    }
    
    // Merge with local scenes
    const allScenes = [...CONFIG.scenes.availableScenes, ...this.scenes];
    
    // Update scene manager
    this.sceneManager.scenes = allScenes.reduce((acc, s) => {
      if (s.active !== false) {
        acc[s.id] = s;
      }
      return acc;
    }, {});
    
    // Update scene selector
    if (typeof this.sceneManager._updateSceneSelector === 'function') {
      this.sceneManager._updateSceneSelector();
    }
  }

  /**
   * Remove a scene from the scene manager
   * @param {String} sceneId - ID of the scene to remove
   * @private
   */
  _removeScene(sceneId) {
    // Remove from our cache
    this.scenes = this.scenes.filter(s => s.id !== sceneId);
    
    // Remove from scene manager if it exists
    if (this.sceneManager.scenes[sceneId]) {
      delete this.sceneManager.scenes[sceneId];
      
      // Update scene selector
      if (typeof this.sceneManager._updateSceneSelector === 'function') {
        this.sceneManager._updateSceneSelector();
      }
      
      // If this was the current scene, change to default
      if (this.sceneManager.currentScene === sceneId) {
        const defaultScene = CONFIG.scenes.default;
        if (defaultScene && this.sceneManager.scenes[defaultScene]) {
          this.sceneManager.changeScene(defaultScene);
        } else {
          // Just change to the first available scene
          const firstScene = Object.keys(this.sceneManager.scenes)[0];
          if (firstScene) {
            this.sceneManager.changeScene(firstScene);
          }
        }
      }
    }
  }

  /**
   * Update a craft in the fleet data
   * @param {String} fleetType - 'timeliners' or 'timepressers'
   * @param {Object} craft - Craft data
   * @param {String} changeType - 'added', 'modified', or 'removed'
   * @private
   */
  _updateCraft(fleetType, craft, changeType) {
    // Process based on change type
    if (changeType === 'added' || changeType === 'modified') {
      // Process image URL if needed
      if (craft.imageRef && !craft.image) {
        this._getImageUrl(craft.imageRef)
          .then(url => {
            craft.image = url;
            this._addCraftToFleet(fleetType, craft);
          })
          .catch(error => {
            console.error('Error loading craft image:', error);
            // Still add the craft, just without the image
            this._addCraftToFleet(fleetType, craft);
          });
      } else {
        this._addCraftToFleet(fleetType, craft);
      }
    } else if (changeType === 'removed') {
      // Remove from fleet data
      this.fleetData[fleetType] = this.fleetData[fleetType].filter(c => c.id !== craft.id);
      
      // Update the UI
      this._updateFleetUI(fleetType);
    }
  }

  /**
   * Add a craft to the fleet data
   * @param {String} fleetType - 'timeliners' or 'timepressers'
   * @param {Object} craft - Craft data
   * @private
   */
  _addCraftToFleet(fleetType, craft) {
    // Check if we already have this craft
    const existingCraftIndex = this.fleetData[fleetType].findIndex(c => c.id === craft.id);
    
    if (existingCraftIndex >= 0) {
      // Update existing craft
      this.fleetData[fleetType][existingCraftIndex] = craft;
    } else {
      // Add new craft
      this.fleetData[fleetType].push(craft);
    }
    
    // Update the UI
    this._updateFleetUI(fleetType);
  }

  /**
   * Update the fleet UI for a specific fleet type
   * @param {String} fleetType - 'timeliners' or 'timepressers'
   * @private
   */
  _updateFleetUI(fleetType) {
    // Get container element
    const container = document.getElementById(`${fleetType}-container`);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Merge with local data
    const allCraft = [...FLEET_DATA[fleetType], ...this.fleetData[fleetType]];
    
    // Add each craft element
    allCraft.forEach(craft => {
      if (craft.active !== false) {
        const element = this._createCraftElement(craft);
        container.appendChild(element);
      }
    });
  }

  /**
   * Create a craft element for the UI
   * @param {Object} craft - Craft data
   * @returns {HTMLElement} The created element
   * @private
   */
  _createCraftElement(craft) {
    // Reuse scene manager's method if available
    if (typeof this.sceneManager._createCraftElement === 'function') {
      return this.sceneManager._createCraftElement(craft);
    }
    
    // Fallback implementation
    const element = document.createElement('div');
    element.className = 'craft-card';
    element.setAttribute('data-id', craft.id);
    
    // Create craft content
    element.innerHTML = `
      <div class="craft-image" style="background-image: url('${craft.image || ''}')"></div>
      <div class="craft-info">
        <div class="craft-name">${craft.name}</div>
        <div class="craft-type ${craft.type.toLowerCase()}">${craft.type}</div>
        <div class="craft-description">${craft.description}</div>
      </div>
    `;
    
    // Add click event for showing details
    element.addEventListener('click', () => {
      if (typeof this.sceneManager._showCraftDetails === 'function') {
        this.sceneManager._showCraftDetails(craft);
      }
    });
    
    return element;
  }

  /**
   * Get the URL for a storage reference
   * @param {String} storagePath - Path in Firebase Storage
   * @returns {Promise<String>} Promise resolving to the download URL
   * @private
   */
  _getImageUrl(storagePath) {
    return this.storage.ref(storagePath).getDownloadURL();
  }

  /**
   * Clean up listeners when no longer needed
   */
  cleanup() {
    // Unsubscribe from Firestore listeners
    if (this.sceneListener) {
      this.sceneListener();
      this.sceneListener = null;
    }
    
    if (this.fleetListener) {
      this.fleetListener();
      this.fleetListener = null;
    }
  }
}