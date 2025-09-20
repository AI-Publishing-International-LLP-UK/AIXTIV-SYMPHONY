// ========================================================================
// ElevenLabs Integration Debug Script - MOCOA Owner Interface
// ========================================================================
// Paste this script into the browser console at:
// https://mocoa-owner-interface-v34-859242575175.us-west1.run.app/
//
// This script will debug the ElevenLabs TTS integration and identify
// the exact source of the failure.
// ========================================================================

console.log('🔍 Starting ElevenLabs Integration Debug...');

// Test URLs
const CLOUD_TTS_URL = 'https://mocoa-owner-interface-859242575175.us-central1.run.app/api/elevenlabs/tts';
const V34_TTS_URL = 'https://mocoa-owner-interface-v34-859242575175.us-west1.run.app/api/elevenlabs/tts';

// Test voice and text
const TEST_CONFIG = {
  text: "Testing ElevenLabs integration with MOCOA system",
  voice_id: "21m00Tcm4TlvDq8ikWAM", // Default Rachel voice
  model_id: "eleven_monolingual_v1",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.5
  }
};

// Debug function to test TTS endpoint
async function testTTSEndpoint(url, config) {
  console.log(`🎤 Testing TTS endpoint: ${url}`);
  console.log(`📝 Request config:`, config);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(config),
      mode: 'cors'
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ TTS endpoint error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return { success: false, error: errorText, status: response.status };
    }
    
    // Check if response is audio
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('audio')) {
      console.log('✅ TTS endpoint returned audio successfully');
      
      // Try to create audio blob and play it
      const audioBlob = await response.blob();
      console.log(`🎵 Audio blob size: ${audioBlob.size} bytes`);
      
      // Create audio URL and play it
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      console.log('🔊 Playing test audio...');
      await audio.play();
      
      // Clean up URL after 5 seconds
      setTimeout(() => URL.revokeObjectURL(audioUrl), 5000);
      
      return { success: true, audioSize: audioBlob.size };
      
    } else {
      const responseText = await response.text();
      console.error('❌ TTS endpoint returned non-audio response:', responseText);
      return { success: false, error: 'Non-audio response', response: responseText };
    }
    
  } catch (error) {
    console.error('❌ TTS endpoint request failed:', error);
    return { success: false, error: error.message, type: 'network_error' };
  }
}

// Test function to check what's happening in the interface
async function debugInterfaceVoiceSystem() {
  console.log('🔍 Debugging interface voice system...');
  
  // Check if any voice-related functions exist
  const voiceFunctions = [];
  ['synthesizeVoice', 'initializeVoiceSystem', 'playTTS', 'elevenLabsTTS'].forEach(func => {
    if (typeof window[func] === 'function') {
      voiceFunctions.push(func);
    }
  });
  
  console.log('🎤 Found voice functions:', voiceFunctions);
  
  // Check for any ElevenLabs related variables
  const elevenLabsVars = [];
  Object.keys(window).forEach(key => {
    if (key.toLowerCase().includes('eleven') || key.toLowerCase().includes('voice') || key.toLowerCase().includes('tts')) {
      elevenLabsVars.push(key);
    }
  });
  
  console.log('🔧 ElevenLabs-related variables:', elevenLabsVars);
  
  // Check console for any existing errors
  console.log('📋 Check browser console for any existing ElevenLabs errors...');
}

// Enhanced voice synthesis function that uses the working cloud endpoint
async function synthesizeVoiceWithCloudEndpoint(text, voiceId = "21m00Tcm4TlvDq8ikWAM") {
  console.log(`🎤 Synthesizing voice with cloud endpoint: "${text}"`);
  
  try {
    const response = await fetch(CLOUD_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        voice_id: voiceId,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status} ${response.statusText}`);
    }
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    console.log('🔊 Playing synthesized voice...');
    await audio.play();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(audioUrl), 10000);
    
    return { success: true, message: 'Voice synthesis completed' };
    
  } catch (error) {
    console.error('❌ Voice synthesis failed:', error);
    throw error;
  }
}

// Main debug function
async function runElevenLabsDebug() {
  console.log('🧪 Running complete ElevenLabs debug suite...');
  
  try {
    // Test 1: Debug interface voice system
    console.log('\n📝 Test 1: Interface Voice System Check');
    debugInterfaceVoiceSystem();
    
    // Test 2: Test cloud TTS endpoint
    console.log('\n📝 Test 2: Cloud TTS Endpoint Test');
    const cloudResult = await testTTSEndpoint(CLOUD_TTS_URL, TEST_CONFIG);
    
    // Test 3: Test original v34 endpoint (if different)
    console.log('\n📝 Test 3: V34 TTS Endpoint Test');
    const v34Result = await testTTSEndpoint(V34_TTS_URL, TEST_CONFIG);
    
    // Test 4: Test enhanced voice synthesis
    console.log('\n📝 Test 4: Enhanced Voice Synthesis');
    try {
      await synthesizeVoiceWithCloudEndpoint("Testing enhanced voice synthesis with cloud endpoint");
      console.log('✅ Enhanced voice synthesis test passed');
    } catch (error) {
      console.error('❌ Enhanced voice synthesis test failed:', error);
    }
    
    // Summary
    console.log('\n📊 ElevenLabs Debug Summary:');
    console.log(`  Cloud TTS (${CLOUD_TTS_URL}): ${cloudResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`  V34 TTS (${V34_TTS_URL}): ${v34Result.success ? '✅ Working' : '❌ Failed'}`);
    
    if (!cloudResult.success) {
      console.log('  ⚠️ Cloud endpoint error:', cloudResult.error);
    }
    if (!v34Result.success) {
      console.log('  ⚠️ V34 endpoint error:', v34Result.error);
    }
    
    return {
      cloudWorking: cloudResult.success,
      v34Working: v34Result.success,
      cloudError: cloudResult.error,
      v34Error: v34Result.error
    };
    
  } catch (error) {
    console.error('❌ ElevenLabs debug failed:', error);
    return { error: error.message };
  }
}

// Replace any existing voice functions with working versions
if (typeof window.synthesizeVoice !== 'function') {
  window.synthesizeVoice = synthesizeVoiceWithCloudEndpoint;
  console.log('➕ Added synthesizeVoice function (cloud-enhanced)');
} else {
  window.originalSynthesize = window.synthesizeVoice;
  window.synthesizeVoice = synthesizeVoiceWithCloudEndpoint;
  console.log('🔄 Replaced existing synthesizeVoice with cloud-enhanced version');
}

// Make functions available globally
window.testTTSEndpoint = testTTSEndpoint;
window.runElevenLabsDebug = runElevenLabsDebug;
window.synthesizeVoiceWithCloudEndpoint = synthesizeVoiceWithCloudEndpoint;

console.log('\n🎯 ElevenLabs Debug Tools Ready!');
console.log('📋 Available commands:');
console.log('  • runElevenLabsDebug() - Run complete debug suite');
console.log('  • synthesizeVoice("Hello world") - Test voice synthesis');
console.log('  • testTTSEndpoint(url, config) - Test specific endpoint');
console.log('\n🔧 Ready to debug ElevenLabs integration issues...');

// Auto-run debug
runElevenLabsDebug().then(result => {
  console.log('\n🎊 Debug completed! Check results above.');
});