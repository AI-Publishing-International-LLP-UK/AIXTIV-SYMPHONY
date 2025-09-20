// ========================================================================
// FORCE ELEVENLABS VOICES ONLY - BLOCK BROWSER VOICE FALLBACKS
// ========================================================================
// This script prevents the system from falling back to browser voices
// like Allison and forces it to use only your selected ElevenLabs voices
// ========================================================================

console.log('🎤 Forcing ElevenLabs voices only - blocking browser fallbacks...');

// Define your exact voice mapping
const SELECTED_ELEVENLABS_VOICES = {
    drLucy: {
        id: 'EXAVITQu4vr4xnSDxMaL', // Bella - Professional female
        name: 'Dr. Lucy',
        description: 'Quantum Business Computationalist Voice'
    },
    drClaude: {
        id: '21m00Tcm4TlvDq8ikWAM', // Professional authority
        name: 'Dr. Claude', 
        description: 'Strategic Hybrid Reasoning Voice'
    },
    victory36: {
        id: 'ErXwobaYiN019PkySvjV', // Antoni - Warm engaging
        name: 'Victory36',
        description: 'Security Intelligence Voice'
    }
};

// Block all browser voice synthesis
Object.defineProperty(window, 'speechSynthesis', {
    get: function() {
        console.log('🚫 Browser speech synthesis blocked - using ElevenLabs OAuth2 only');
        return {
            speak: function(utterance) {
                console.log('🔄 Redirecting browser TTS to ElevenLabs:', utterance.text);
                // Redirect to your OAuth2 ElevenLabs system
                if (window.enhancedOAuth2TTS) {
                    window.enhancedOAuth2TTS(utterance.text);
                }
            },
            getVoices: function() {
                console.log('🚫 Browser voice enumeration blocked');
                return [];
            },
            cancel: function() {},
            pause: function() {},
            resume: function() {}
        };
    },
    set: function() {
        console.log('🚫 speechSynthesis modification blocked');
    }
});

// Block SpeechSynthesisUtterance to prevent browser TTS
window.SpeechSynthesisUtterance = function(text) {
    console.log('🚫 Browser SpeechSynthesisUtterance blocked for:', text);
    console.log('🔄 Using ElevenLabs OAuth2 instead');
    
    // Immediately redirect to ElevenLabs
    if (window.enhancedOAuth2TTS) {
        setTimeout(() => window.enhancedOAuth2TTS(text), 100);
    }
    
    // Return a dummy object
    return {
        text: text,
        voice: null,
        rate: 1,
        pitch: 1,
        volume: 1,
        onend: null,
        onerror: null
    };
};

// Enhanced OAuth2 TTS that uses your selected voices
window.enhancedAgentTTS = async function(text, agentName = 'drLucy') {
    console.log(`🤖 Agent TTS: ${agentName} speaking: "${text}"`);
    
    const voice = SELECTED_ELEVENLABS_VOICES[agentName] || SELECTED_ELEVENLABS_VOICES.drLucy;
    console.log(`🎤 Using ElevenLabs voice: ${voice.name} (${voice.id})`);
    
    try {
        // Use your OAuth2-enabled endpoint with the specific voice
        const response = await fetch('https://mocoa-owner-interface-v34-859242575175.us-west1.run.app/api/elevenlabs/oauth2/tts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg',
                'Authorization': 'Bearer oauth2',
                'X-Auth-Mode': 'oauth2',
                'X-Agent-Name': agentName
            },
            body: JSON.stringify({
                text: text,
                voice_id: voice.id,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.8,
                    style: 0.3,
                    use_speaker_boost: true
                }
            })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            console.log(`🔊 Playing ${voice.name} voice...`);
            await audio.play();
            
            setTimeout(() => URL.revokeObjectURL(audioUrl), 10000);
            return { success: true, source: 'elevenlabs_oauth2', agent: agentName };
        } else {
            throw new Error(`ElevenLabs OAuth2 failed: ${response.status}`);
        }
        
    } catch (error) {
        console.error(`❌ Agent TTS failed for ${agentName}:`, error);
        // NO FALLBACK TO BROWSER VOICES - just fail gracefully
        return { success: false, error: error.message, agent: agentName };
    }
};

// Override all existing TTS functions to use agent TTS
const ttsOverrides = [
    'speakWithElevenLabs',
    'speakMessage',
    'textToSpeech',
    'enhancedOAuth2TTS'
];

ttsOverrides.forEach(funcName => {
    window[funcName] = window.enhancedAgentTTS;
    console.log(`🔄 ${funcName} now uses ElevenLabs agents only`);
});

// Test function
window.testAgentVoices = async function() {
    console.log('🧪 Testing agent voices (ElevenLabs only)...');
    
    await window.enhancedAgentTTS("Dr. Lucy here - Quantum Business Computationalist ready for analysis", 'drLucy');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await window.enhancedAgentTTS("Dr. Claude speaking - Strategic intelligence active", 'drClaude');  
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await window.enhancedAgentTTS("Victory36 online - Security protocols engaged", 'victory36');
    
    console.log('✅ Agent voice test completed - no browser voices used');
};

console.log('');
console.log('✅ ElevenLabs-only voice system active!');
console.log('');
console.log('🚫 Blocked:');
console.log('  • All browser voices (including Allison)');
console.log('  • speechSynthesis API');
console.log('  • Voice enumeration');
console.log('');
console.log('✅ Active:');
console.log('  • Dr. Lucy: Bella (EXAVITQu4vr4xnSDxMaL)');
console.log('  • Dr. Claude: Professional (21m00Tcm4TlvDq8ikWAM)');
console.log('  • Victory36: Antoni (ErXwobaYiN019PkySvjV)');
console.log('');
console.log('🧪 Run testAgentVoices() to verify');

// Return success
true;