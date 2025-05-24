/**
 * Vision Space Configuration
 * Contains settings for the Vision Space interface
 */

const CONFIG = {
  // Application settings
  app: {
    name: "Vision Space Interface",
    version: "1.0.0",
    useWebcam: true,
    autoWelcome: true,
    debugMode: false
  },
  
  // Firebase settings (auto-initialized by /__/firebase/init.js)
  firebase: {
    projectId: "api-for-warp-drive",
    storageBucket: "api-for-warp-drive.appspot.com",
    sceneCollection: "vision_scenes",
    fleetCollection: "fleet_data"
  },
  
  // Chroma key settings
  chromaKey: {
    targetColor: [0, 255, 0], // Green by default (RGB)
    threshold: 60,            // Color detection threshold
    smoothing: 1.5,           // Edge smoothing factor
    feathering: 2,            // Feathering for the edges (in pixels)
    antiAlias: true,          // Enable anti-aliasing
    keyColor: '#00FF00'       // CSS color for the key
  },
  
  // Scene settings
  scenes: {
    // Available scenes (will be merged with Firebase data)
    default: "vision_space",
    availableScenes: [
      {
        id: "visualization_center",
        name: "Visualization Center",
        background: "assets/images/scenes/visualization-center.jpg",
        description: "Central hub for data visualization and strategic insights",
        ambientSound: "assets/audio/ambient-visualization.mp3",
        active: true
      },
      {
        id: "vision_space",
        name: "Vision Space",
        background: "assets/images/scenes/vision-space.jpg",
        description: "Main interface for the Vision Lake experience",
        ambientSound: "assets/audio/ambient-vision-space.mp3",
        active: true
      },
      {
        id: "pilots_lounge",
        name: "Pilots Lounge",
        background: "assets/images/scenes/pilots-lounge.jpg",
        description: "The central meeting space for the Vision Lake Fleet pilots",
        ambientSound: "assets/audio/ambient-lounge.mp3",
        active: true
      },
      {
        id: "gift_shop",
        name: "Gift Shop",
        background: "assets/images/scenes/gift-shop.jpg",
        description: "Explore and obtain Vision Lake memorabilia and souvenirs",
        ambientSound: "assets/audio/ambient-gift-shop.mp3",
        active: true
      },
      {
        id: "academy",
        name: "The Academy",
        background: "assets/images/scenes/academy.jpg",
        description: "Training and educational center for Vision Lake pilots",
        ambientSound: "assets/audio/ambient-academy.mp3",
        active: true
      },
      {
        id: "pilots_of_vision_lake",
        name: "The Pilots of Vision Lake",
        background: "assets/images/scenes/pilots-of-vision-lake.jpg",
        description: "Gallery showcasing the distinguished pilots of Vision Lake",
        ambientSound: "assets/audio/ambient-pilots.mp3",
        active: true
      },
      {
        id: "compass_field",
        name: "Compass Field",
        background: "assets/images/scenes/compass-field.jpg",
        description: "Navigate through the strategic direction compass of Vision Lake",
        ambientSound: "assets/audio/ambient-compass.mp3",
        active: true
      },
      {
        id: "flight_memory_system",
        name: "Flight Memory System",
        background: "assets/images/scenes/flight-memory-system.jpg",
        description: "Archive of all flight records and mission histories",
        ambientSound: "assets/audio/ambient-memory.mp3",
        active: true
      },
      {
        id: "jet_port",
        name: "Jet Port",
        background: "assets/images/scenes/jet-port.jpg",
        description: "Launching and landing facility for the Vision Lake Fleet",
        ambientSound: "assets/audio/ambient-jetport.mp3",
        active: true
      }
    ]
  },
  
  // Voice commands configuration
  voiceCommands: {
    enabled: true,
    language: 'en-US',
    commands: {
      'show fleet': 'toggleFleet',
      'hide fleet': 'toggleFleet',
      'change scene to *': 'changeScene',
      'go to *': 'changeScene',
      'show *': 'changeScene'
    },
    feedback: {
      enabled: true,
      audio: true
    }
  }
};