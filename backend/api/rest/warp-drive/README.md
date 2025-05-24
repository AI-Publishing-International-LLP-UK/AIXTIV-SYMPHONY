# Vision Space Interface

An interactive no-touch interface featuring green screen technology for dynamic scene toggling and fleet visualization.

## Overview

The Vision Space interface provides a seamless way to interact with digital environments using green screen (chroma key) technology. The system allows for:

- Dynamic scene toggling between different backgrounds
- Voice-controlled interaction
- Vision Lake Fleet visualization with Timeliners and Timepressers
- Real-time data updates via Firebase
- Interactive, no-touch environment

## Vision Lake Scenes

The Vision Space interface includes the following scenes:

1. **Visualization Center** - Central hub for data visualization and strategic insights
2. **Vision Space** - Main interface for the Vision Lake experience
3. **Pilots Lounge** - The central meeting space for the Vision Lake Fleet pilots
4. **Gift Shop** - Explore and obtain Vision Lake memorabilia and souvenirs
5. **The Academy** - Training and educational center for Vision Lake pilots
6. **The Pilots of Vision Lake** - Gallery showcasing the distinguished pilots of Vision Lake
7. **Compass Field** - Navigate through the strategic direction compass of Vision Lake
8. **Flight Memory System** - Archive of all flight records and mission histories
9. **Jet Port** - Launching and landing facility for the Vision Lake Fleet

## Scene Background Setup

To set up your scene backgrounds:

1. Prepare your background images for each scene (see format requirements below)
2. Name each image according to the scene ID:
   - `visualization-center.jpg`
   - `vision-space.jpg`
   - `pilots-lounge.jpg`
   - `gift-shop.jpg`
   - `academy.jpg`
   - `pilots-of-vision-lake.jpg`
   - `compass-field.jpg`
   - `flight-memory-system.jpg`
   - `jet-port.jpg`
3. Place all images in the `/public/assets/images/scenes/` directory
4. Run the launch script to deploy with your images

## Adding Additional Custom Scenes

You can add more scenes to the Vision Space interface in two ways:

### 1. Direct File Integration

1. Place your background images in the `/public/assets/images/scenes/` directory
2. Name your files appropriately (e.g., `pilots-lounge.jpg`, `command-center.jpg`)
3. Update the `scenes` section in the `config.js` file:

```javascript
scenes: {
  default: "your_default_scene_id",
  availableScenes: [
    {
      id: "your_scene_id",
      name: "Your Scene Name",
      background: "assets/images/scenes/your-scene.jpg",
      description: "Description of your scene",
      ambientSound: "assets/audio/your-ambient-sound.mp3", // Optional
      active: true
    },
    // Add more scenes here
  ]
}
```

### 2. Firebase Integration

1. Upload your background images to Firebase Storage in the `scenes/` folder
2. Add entries to the Firestore `vision_scenes` collection with the following fields:
   - `id`: Unique identifier for your scene
   - `name`: Display name for your scene
   - `backgroundRef`: Storage reference (e.g., `scenes/your-scene.jpg`)
   - `description`: Description of your scene
   - `ambientSoundRef`: Optional reference to ambient audio
   - `active`: Set to `true` to make the scene available

## Scene Format Requirements

For optimal performance, follow these guidelines for scene backgrounds:

- **Resolution**: Minimum 1920x1080px (HD), 3840x2160px (4K) recommended for high-quality displays
- **Aspect Ratio**: 16:9 is recommended (matches most displays)
- **File Format**: JPEG or PNG (JPEG recommended for better performance)
- **File Size**: Optimize images to keep file size under 2MB for faster loading
- **Naming**: Use descriptive, lowercase names with hyphens (e.g., `pilots-lounge.jpg`)

## Chroma Key Setup

To use the green screen functionality:

1. Ensure you have a good quality green screen setup with even lighting
2. Adjust the chroma key settings in `config.js` if needed:

```javascript
chromaKey: {
  targetColor: [0, 255, 0], // RGB value for key color
  threshold: 60,            // Color detection threshold (lower = more precise)
  smoothing: 1.5,           // Edge smoothing factor
  feathering: 2,            // Edge feathering in pixels
  antiAlias: true,          // Enable anti-aliasing
  keyColor: '#00FF00'       // CSS color for fallback
}
```

## Deployment

Deploy the Vision Space interface using the included launch script:

```bash
chmod +x launch.sh
./launch.sh
```

This will deploy the interface to Firebase hosting.

## Voice Commands

The following voice commands are supported:

- "show fleet" - Toggle the fleet view
- "hide fleet" - Toggle the fleet view
- "change scene to [scene name]" - Switch to a specific scene
- "go to [scene name]" - Switch to a specific scene
- "show [scene name]" - Switch to a specific scene

Example voice commands for specific scenes:
- "go to Vision Space"
- "change scene to Pilots Lounge"
- "show Gift Shop"
- "go to The Academy"
- "change scene to Jet Port"

## Fleet Data

The Vision Lake Fleet consists of Antigravity Powercraft in two main categories:

1. **Timeliners** - Deliver today on schedule on demand
2. **Timepressers** - Deliver the future today or at the end of the process

### Antigravity Powercraft Models

#### Timeliners
- **AG-110 Super Timeliner** - Standard operations with automated processes
- **AG-210 Enhanced Timeliner** - Advanced performance for daily operations
- **AG-310 Premium Timeliner** - Premium reliability for critical tasks
- **AG-330 Executive Timeliner** - Executive-class for leadership operations

#### Timepressers
- **AG-390 Daily Timepresser** - Consistent future performance for daily operations
- **AG-490 Strategic Timepresser** - Medium-term planning and forecasting
- **AG-590 Visionary Timepresser** - Long-term strategic planning and innovation
- **AG-690 Sovereign Timepresser** - Exclusive sovereign capabilities for shaping futures

### Queen Mint Mark Owner's Wallets

Each Antigravity Powercraft comes with a Queen Mint Mark Owner's Wallet that provides:

1. **Authentication** - Official certification of craft ownership
2. **Security** - Multi-layered protection systems
3. **Transferability** - Secure ownership transfer protocols
4. **Maintenance Access** - Official service authorizations
5. **Feature Unlocks** - Access to craft-specific capabilities

#### Wallet Certification Levels

- **Standard** - Basic ownership verification and standard security
- **Enhanced** - Advanced security and priority maintenance
- **Premium** - Military-grade security and performance optimization
- **Executive** - Ultra-secure protocols and proprietary features
- **Sovereign** - Highest level authentication with strategic capabilities

The Queen Mint Mark provides verified craft authenticity, access to official maintenance services, insurance coverage, and operational certifications.

Each craft in the fleet is detailed in the fleet visualization with complete specifications, features, and Queen Mint Mark information.