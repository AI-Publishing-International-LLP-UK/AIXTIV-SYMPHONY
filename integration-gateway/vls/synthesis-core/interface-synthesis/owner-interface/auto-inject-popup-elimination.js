// ========================================================================
// AUTO-INJECTION SCRIPT FOR ELEVENLABS POPUP ELIMINATION
// ========================================================================
// This script automatically injects the popup elimination system into
// any page that loads, providing permanent protection
// ========================================================================

(function() {
  'use strict';
  
  console.log('🛡️ Auto-injecting ElevenLabs popup elimination system...');
  
  // Wait for DOM to be ready
  function injectPopupElimination() {
    // Create and inject the elimination script
    const script = document.createElement('script');
    script.textContent = `
// Complete ElevenLabs API Popup Elimination - Auto-Injected
console.log('🛡️ ElevenLabs Popup Elimination - Auto-Injected');

// Override prompt function immediately
const originalPrompt = window.prompt;
window.prompt = function(message, defaultValue) {
  if (message && (
    message.toLowerCase().includes('api key') ||
    message.toLowerCase().includes('elevenlabs') ||
    message.toLowerCase().includes('key') ||
    message.toLowerCase().includes('token')
  )) {
    console.log('🚫 API key prompt blocked (auto-injected):', message);
    return null;
  }
  return originalPrompt.call(this, message, defaultValue);
};

// Block API key property access
Object.defineProperty(window, 'ELEVENLABS_API_KEY', {
  get: function() { 
    console.log('🚫 ELEVENLABS_API_KEY access blocked (auto-injected)'); 
    return null; 
  },
  set: function() { 
    console.log('🚫 ELEVENLABS_API_KEY setting blocked (auto-injected)'); 
  }
});

// Enhanced browser-only TTS fallback
window.safeTTS = function(text, voiceName = 'System Default') {
  console.log('🎤 Safe TTS (browser-only):', text);
  
  if (!('speechSynthesis' in window)) {
    console.log('❌ Speech synthesis not supported');
    return Promise.resolve({ success: false });
  }
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Allison') || 
      voice.name.includes('Daniel') ||
      voice.lang.startsWith('en')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🎤 Using browser voice:', preferredVoice.name);
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      console.log('✅ Safe TTS completed');
      resolve({ success: true, source: 'browser_safe' });
    };
    
    utterance.onerror = (error) => {
      console.log('⚠️ Safe TTS error:', error);
      resolve({ success: false, error: error.message });
    };
    
    speechSynthesis.speak(utterance);
  });
};

// Override common TTS function names
const ttsOverrides = [
  'speakWithElevenLabs',
  'speakMessage', 
  'textToSpeech',
  'elevenLabsTTS',
  'generateSpeech',
  'speak',
  'tts'
];

ttsOverrides.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    window[funcName] = window.safeTTS;
    console.log('🔄 Overridden', funcName, 'with safe TTS');
  } else {
    // Define it to prevent future assignment
    window[funcName] = window.safeTTS;
  }
});

// Block fetch requests to ElevenLabs
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('api.elevenlabs.io')) {
    console.log('🚫 ElevenLabs API call blocked (auto-injected):', url);
    
    // Extract text if possible
    let text = 'Blocked API request';
    if (options && options.body) {
      try {
        const body = JSON.parse(options.body);
        text = body.text || text;
      } catch (e) {}
    }
    
    // Return successful response after playing with browser TTS
    return window.safeTTS(text).then(() => {
      return new Response(JSON.stringify({ success: true, source: 'browser_safe' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  }
  
  return originalFetch.apply(this, arguments);
};

// Block ElevenLabs constructor
if (typeof window.ElevenLabsClient !== 'undefined') {
  window.ElevenLabsClient = function() {
    console.log('🚫 ElevenLabsClient blocked (auto-injected)');
    return { 
      textToSpeech: window.safeTTS,
      generate: window.safeTTS 
    };
  };
}

console.log('✅ ElevenLabs popup elimination auto-injected successfully');
`;
    
    document.head.appendChild(script);
  }
  
  // Inject immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPopupElimination);
  } else {
    injectPopupElimination();
  }
  
})();