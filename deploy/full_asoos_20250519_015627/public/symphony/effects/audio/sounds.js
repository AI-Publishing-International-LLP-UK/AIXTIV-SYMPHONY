// Sound effects for the Symphony interface
const SymphonyAudio = {
  // Sound effect filenames
  sounds: {
    click: '/assets/sounds/click.mp3',
    success: '/assets/sounds/success.mp3',
    error: '/assets/sounds/error.mp3',
    notification: '/assets/sounds/notification.mp3',
    hover: '/assets/sounds/hover.mp3',
    startup: '/assets/sounds/startup.mp3',
    login: '/assets/sounds/login.mp3'
  },
  
  // Audio elements cache
  audioElements: {},
  
  // Volume settings
  volume: 0.5,
  enabled: true,
  
  // Initialize the audio system
  init() {
    // Pre-load all sounds
    for (const [key, path] of Object.entries(this.sounds)) {
      this.audioElements[key] = new Audio();
      this.audioElements[key].volume = this.volume;
      // We don't set src yet to avoid network requests for non-existent files in this demo
    }
    
    console.log('[Symphony Audio] System initialized');
    
    // Play startup sound
    this.play('startup');
  },
  
  // Play a sound
  play(soundName) {
    if (!this.enabled) return;
    
    if (this.audioElements[soundName]) {
      // In a real implementation, we would set the src here
      // this.audioElements[soundName].src = this.sounds[soundName];
      // this.audioElements[soundName].play();
      
      // For now, just log that we would play the sound
      console.log(`[Symphony Audio] Playing sound: ${soundName}`);
    }
  },
  
  // Set volume for all sounds
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    
    for (const audio of Object.values(this.audioElements)) {
      audio.volume = this.volume;
    }
    
    console.log(`[Symphony Audio] Volume set to: ${this.volume}`);
  },
  
  // Enable/disable all sounds
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[Symphony Audio] Sounds ${enabled ? 'enabled' : 'disabled'}`);
  }
};

// Initialize sounds when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  SymphonyAudio.init();
  
  // Attach sound effects to interactive elements
  document.body.addEventListener('click', function(e) {
    // Play click sound for buttons
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      SymphonyAudio.play('click');
    }
  });
});
