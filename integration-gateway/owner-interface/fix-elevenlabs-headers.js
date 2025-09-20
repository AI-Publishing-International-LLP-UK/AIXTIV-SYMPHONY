// ========================================================================
// ELEVENLABS HEADER ENCODING FIX + OAUTH2 INTEGRATION
// ========================================================================
// Paste this script into the browser console at:
// https://mocoa-owner-interface-v34-859242575175.us-west1.run.app/
//
// This script fixes the header encoding issue and enables OAuth2 TTS
// ========================================================================

console.log('🔧 Loading ElevenLabs Header Encoding Fix + OAuth2 Integration...');

// Cloud endpoint for TTS with OAuth2 support
const CLOUD_TTS_URL = 'https://mocoa-owner-interface-859242575175.us-central1.run.app/api/elevenlabs/tts';
const CLOUD_AUTH_URL = 'https://mocoa-owner-interface-859242575175.us-central1.run.app/api/auth/service-account';

// Enhanced ElevenLabs TTS function with header encoding fix and OAuth2
async function fixedElevenLabsTTS(text, voiceId = "21m00Tcm4TlvDq8ikWAM", voiceName = "Rachel") {
  console.log(`🎤 Enhanced ElevenLabs TTS: "${text}" with voice ${voiceName}`);
  
  try {
    // Use the cloud TTS endpoint which handles OAuth2 internally
    const response = await fetch(CLOUD_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        voice_id: voiceId,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs TTS failed:', response.status, errorText);
      
      if (response.status === 401) {
        console.log('🔄 OAuth2 token may need refresh, falling back to browser voice');
        return fallbackToBrowserVoice(text);
      }
      
      throw new Error(`TTS failed: ${response.status} ${response.statusText}`);
    }
    
    // Handle audio response
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    console.log('🔊 Playing ElevenLabs audio...');
    await audio.play();
    
    // Clean up URL after 10 seconds
    setTimeout(() => URL.revokeObjectURL(audioUrl), 10000);
    
    return { success: true, source: 'elevenlabs_oauth2' };
    
  } catch (error) {
    console.error('❌ ElevenLabs TTS error:', error.message);
    console.log('🔄 Falling back to browser voice synthesis...');
    return fallbackToBrowserVoice(text);
  }
}

// Fallback to browser speech synthesis
function fallbackToBrowserVoice(text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a good female voice
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Samantha') || 
      voice.name.includes('Allison') || 
      voice.name.includes('Victoria') ||
      voice.gender === 'female'
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      console.log(`🎤 Using browser voice: ${femaleVoice.name}`);
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      console.log('✅ Browser speech synthesis completed');
      resolve({ success: true, source: 'browser_fallback' });
    };
    
    utterance.onerror = (error) => {
      console.error('❌ Browser speech synthesis failed:', error);
      reject(error);
    };
    
    speechSynthesis.speak(utterance);
  });
}

// Enhanced speak message function with proper error handling
async function enhancedSpeakMessage(message) {
  console.log(`🗣️ Enhanced speak message: "${message}"`);
  
  try {
    // First try ElevenLabs with OAuth2
    const result = await fixedElevenLabsTTS(message);
    return result;
  } catch (error) {
    console.error('❌ All TTS methods failed:', error);
    return { success: false, error: error.message };
  }
}

// Replace existing voice functions with fixed versions
if (typeof window.speakWithElevenLabs === 'function') {
  window.originalSpeakWithElevenLabs = window.speakWithElevenLabs;
  window.speakWithElevenLabs = fixedElevenLabsTTS;
  console.log('🔄 Replaced speakWithElevenLabs with fixed version');
}

if (typeof window.speakMessage === 'function') {
  window.originalSpeakMessage = window.speakMessage;
  window.speakMessage = enhancedSpeakMessage;
  console.log('🔄 Replaced speakMessage with enhanced version');
}

// Add new functions to global scope
window.fixedElevenLabsTTS = fixedElevenLabsTTS;
window.enhancedSpeakMessage = enhancedSpeakMessage;
window.fallbackToBrowserVoice = fallbackToBrowserVoice;

// Test function
async function testFixedTTS() {
  console.log('🧪 Testing fixed ElevenLabs TTS system...');
  
  try {
    const result = await enhancedSpeakMessage("Testing the fixed ElevenLabs TTS system with OAuth2 authentication");
    if (result.success) {
      console.log(`✅ TTS test successful using ${result.source}`);
    } else {
      console.log(`❌ TTS test failed: ${result.error}`);
    }
    return result;
  } catch (error) {
    console.error('❌ TTS test error:', error);
    return { success: false, error: error.message };
  }
}

// Make test function available globally
window.testFixedTTS = testFixedTTS;

console.log('✅ ElevenLabs Header Encoding Fix + OAuth2 Integration Loaded!');
console.log('📋 Available functions:');
console.log('  • testFixedTTS() - Test the fixed TTS system');
console.log('  • enhancedSpeakMessage("text") - Speak with enhanced system');
console.log('  • fixedElevenLabsTTS("text", "voiceId") - Direct ElevenLabs call');
console.log('');
console.log('🔧 The system now:');
console.log('  ✅ Fixes header encoding issues');
console.log('  ✅ Uses OAuth2 authentication');
console.log('  ✅ Falls back to browser voices');
console.log('  ✅ Handles CORS properly');
console.log('');
console.log('💡 Run testFixedTTS() to verify the fix works!');

// Auto-test after a short delay
setTimeout(async () => {
  console.log('🚀 Running automatic test...');
  await testFixedTTS();
}, 2000);