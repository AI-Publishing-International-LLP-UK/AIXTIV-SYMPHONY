#!/usr/bin/env node

/**
 * Dr. Lucy Expressive Speech Middleware
 * Transforms Dr. Lucy's responses into natural, emotionally intelligent speech
 * with presence, empathy, and conversational flow
 * 
 * @author AI Publishing International LLP
 * @version 2.0.0 - Symphony Integration
 * @agent Dr. Lucy CRX-001 - Quantum Intelligence Enhanced
 */

const axios = require('axios');
require('dotenv').config();

class LucyExpressiveSpeech {
  constructor(config = {}) {
    this.config = {
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
      elevenLabsApiUrl: 'https://api.elevenlabs.io/v1',
      lucyVoiceId: config.lucyVoiceId || process.env.LUCY_VOICE_ID || 'lucy-voice-default',
      defaultMode: config.defaultMode || 'companion',
      enableHumanisms: config.enableHumanisms !== false,
      humanismChance: config.humanismChance || 0.2,
      ...config
    };

    this.voiceProfiles = {
      'dr-lucy-executive': {
        voiceId: this.config.lucyVoiceId,
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.2
      },
      'dr-lucy-empathetic': {
        voiceId: this.config.lucyVoiceId,
        stability: 0.6,
        similarityBoost: 0.9,
        style: 0.4
      },
      'dr-lucy-strategic': {
        voiceId: this.config.lucyVoiceId,
        stability: 0.8,
        similarityBoost: 0.75,
        style: 0.1
      }
    };

    this.lucyisms = {
      empathy: [
        "I'm here with you.",
        "Take your time.",
        "Let's breathe together for a moment.",
        "That's a lot to carry.",
        "I feel that deeply."
      ],
      celebration: [
        "Wow! Look at you!",
        "That's amazing progress!",
        "You did something brave today.",
        "I'm so proud of you.",
        "Let's celebrate this!"
      ],
      reflection: [
        "Sometimes just naming it helps, doesn't it?",
        "You've come a long way, truly.",
        "I notice the strength in that.",
        "That takes real courage."
      ],
      encouragement: [
        "You're not alone in this.",
        "Mistakes are just data. You're learning.",
        "I believe in you.",
        "One step at a time is enough."
      ],
      presence: [
        "mm-hmm",
        "I'm listening",
        "I'm right here with you"
      ]
    };

    this.conversationalModes = {
      companion: {
        backchanneling: true,
        pauseFrequency: 0.3,
        empathyLevel: 0.8,
        personalTouch: true
      },
      guide: {
        backchanneling: false,
        pauseFrequency: 0.1,
        empathyLevel: 0.6,
        personalTouch: true,
        followUpPrompts: true
      },
      listener: {
        backchanneling: true,
        pauseFrequency: 0.7,
        empathyLevel: 0.9,
        personalTouch: true,
        silentSupport: true
      },
      celebrator: {
        backchanneling: true,
        pauseFrequency: 0.2,
        empathyLevel: 0.7,
        personalTouch: true,
        enthusiasm: true
      },
      strategist: {
        backchanneling: false,
        pauseFrequency: 0.15,
        empathyLevel: 0.5,
        personalTouch: false,
        analytical: true
      },
      silent: {
        speech: false,
        presence: true
      }
    };
  }

  /**
   * Main expressive speech function
   */
  async lucySpeak(text, userContext = {}, options = {}) {
    try {
      const {
        mode = this.config.defaultMode,
        emotion = userContext.emotion || 'neutral',
        voiceProfile = 'dr-lucy-executive',
        skipTTS = false
      } = options;

      // Check if we should speak at all
      const modeConfig = this.conversationalModes[mode];
      if (modeConfig && modeConfig.speech === false) {
        return this.handleSilentPresence(userContext, options);
      }

      let expressiveText = text;

      // Add personal touch
      if (modeConfig && modeConfig.personalTouch) {
        expressiveText = this.addPersonalTouch(expressiveText, userContext);
      }

      // Apply emotional intelligence
      expressiveText = this.applyEmotionalIntelligence(expressiveText, emotion);

      // Add conversational mode styling
      expressiveText = this.applyConversationalMode(expressiveText, mode, modeConfig);

      // Add Lucy-isms
      if (modeConfig && modeConfig.backchanneling) {
        expressiveText = this.addLucyisms(expressiveText, emotion);
      }

      // Process speech markers
      expressiveText = this.processSpeechMarkers(expressiveText);

      if (skipTTS) {
        return {
          text: expressiveText,
          expressiveText,
          emotion,
          mode,
          voiceProfile,
          processed: true,
          success: true
        };
      }

      // Generate speech with ElevenLabs
      const audioResult = await this.generateSpeech(expressiveText, voiceProfile);

      return {
        originalText: text,
        expressiveText,
        audioResult,
        emotion,
        mode,
        voiceProfile,
        success: true
      };

    } catch (error) {
      console.error('Lucy Expressive Speech Error:', error.message);
      return {
        error: error.message,
        originalText: text,
        success: false
      };
    }
  }

  addPersonalTouch(text, userContext) {
    let personalText = text;

    if (userContext.userName && Math.random() < 0.3) {
      const greetings = [
        `Hey ${userContext.userName}, `,
        `${userContext.userName}, `,
        `Listen, ${userContext.userName}, `
      ];
      personalText = greetings[Math.floor(Math.random() * greetings.length)] + personalText;
    }

    return personalText;
  }

  applyEmotionalIntelligence(text, emotion) {
    let emotionalText = text;

    switch (emotion) {
      case 'empathy':
        emotionalText = "I'm here. " + emotionalText;
        if (Math.random() < 0.4) {
          emotionalText += " Take your time.";
        }
        break;

      case 'celebrate':
      case 'celebration':
        emotionalText = "🎉 " + emotionalText;
        if (Math.random() < 0.3) {
          emotionalText += " This is wonderful!";
        }
        break;

      case 'reassure':
      case 'comfort':
        emotionalText = emotionalText + " Remember, you're not alone.";
        break;

      case 'reflect':
      case 'thoughtful':
        emotionalText = "Let's just take a breath. " + emotionalText;
        if (Math.random() < 0.5) {
          emotionalText += " mm-hmm.";
        }
        break;

      case 'concern':
      case 'worried':
        emotionalText = "I want to make sure you're okay. " + emotionalText;
        break;
    }

    return emotionalText;
  }

  applyConversationalMode(text, mode, modeConfig) {
    if (!modeConfig) return text;

    let modeText = text;

    switch (mode) {
      case 'listener':
        if (Math.random() < modeConfig.pauseFrequency) {
          modeText += " Take your time.";
        }
        if (modeConfig.silentSupport && Math.random() < 0.3) {
          modeText += " I'm right here.";
        }
        break;

      case 'guide':
        if (modeConfig.followUpPrompts && Math.random() < 0.4) {
          const prompts = [
            " What would you like to explore next?",
            " How does that feel to you?",
            " Where do you want to go from here?"
          ];
          modeText += prompts[Math.floor(Math.random() * prompts.length)];
        }
        break;

      case 'celebrator':
        if (modeConfig.enthusiasm && Math.random() < 0.5) {
          modeText += " You're doing amazing!";
        }
        break;

      case 'strategist':
        if (modeConfig.analytical && Math.random() < 0.3) {
          const analytical = [
            "Based on the data, ",
            "From a strategic perspective, ",
            "Looking at this systematically, "
          ];
          modeText = analytical[Math.floor(Math.random() * analytical.length)] + modeText.toLowerCase();
        }
        break;
    }

    return modeText;
  }

  addLucyisms(text, emotion) {
    if (!this.config.enableHumanisms) {
      return text;
    }

    let lucyText = text;

    // Add emotional Lucy-isms
    if (this.lucyisms[emotion] && Math.random() < 0.25) {
      const emotionLucyisms = this.lucyisms[emotion];
      const selectedLucyism = emotionLucyisms[Math.floor(Math.random() * emotionLucyisms.length)];
      
      if (Math.random() < 0.5) {
        lucyText = selectedLucyism + " " + lucyText;
      } else {
        lucyText = lucyText + " " + selectedLucyism;
      }
    }

    // Add presence markers
    if (Math.random() < this.config.humanismChance) {
      const presenceMarkers = this.lucyisms.presence;
      const marker = presenceMarkers[Math.floor(Math.random() * presenceMarkers.length)];
      lucyText += " " + marker;
    }

    return lucyText;
  }

  processSpeechMarkers(text) {
    return text
      .replace(/\s+/g, ' ')
      .trim();
  }

  async handleSilentPresence(userContext, options) {
    console.log('🤫 Lucy: Silent presence mode - holding space...');
    
    return {
      mode: 'silent',
      presence: true,
      message: "Lucy is here with you in quiet support",
      success: true
    };
  }

  async generateSpeech(text, voiceProfile) {
    if (!this.config.elevenLabsApiKey) {
      console.warn('⚠️ ElevenLabs API key not configured - returning text only');
      return { text, audio: null, success: false };
    }

    try {
      const profile = this.voiceProfiles[voiceProfile] || this.voiceProfiles['dr-lucy-executive'];
      
      const response = await axios.post(
        `${this.config.elevenLabsApiUrl}/text-to-speech/${profile.voiceId}`,
        {
          text: text,
          voice_settings: {
            stability: profile.stability,
            similarity_boost: profile.similarityBoost,
            style: profile.style
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.config.elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer'
        }
      );

      return {
        audio: response.data,
        text: text,
        voiceId: profile.voiceId,
        success: true
      };

    } catch (error) {
      console.error('❌ ElevenLabs API Error:', error.response?.data || error.message);
      return { 
        text, 
        error: error.message, 
        success: false 
      };
    }
  }

  // Quick helper methods
  async speakWithEmpathy(text, userContext = {}) {
    return this.lucySpeak(text, userContext, { emotion: 'empathy', mode: 'companion' });
  }

  async celebrateWithUser(text, userContext = {}) {
    return this.lucySpeak(text, userContext, { emotion: 'celebrate', mode: 'celebrator' });
  }

  async listenSupportively(text, userContext = {}) {
    return this.lucySpeak(text, userContext, { emotion: 'neutral', mode: 'listener' });
  }

  async provideGuidance(text, userContext = {}) {
    return this.lucySpeak(text, userContext, { emotion: 'neutral', mode: 'guide' });
  }

  async offerSilentSupport(userContext = {}) {
    return this.lucySpeak('', userContext, { mode: 'silent' });
  }
}

// Export the class
module.exports = LucyExpressiveSpeech;

// Usage examples and tests
if (require.main === module) {
  async function demonstrateLucy() {
    const lucy = new LucyExpressiveSpeech({
      lucyVoiceId: process.env.LUCY_VOICE_ID || 'demo-voice-id'
    });

    const userContext = {
      userName: 'Phillip',
      sessionId: 'demo-session',
      emotion: 'empathy',
      history: ['Previous conversation about Symphony project']
    };

    console.log('🎭 Demonstrating Dr. Lucy Expressive Speech...\n');

    // Test different emotional modes
    const tests = [
      { text: "I understand this has been really challenging for you.", emotion: 'empathy' },
      { text: "You launched your project today!", emotion: 'celebrate' },
      { text: "Let's think about the next steps for your Symphony.", mode: 'guide' },
      { text: "Take all the time you need.", mode: 'listener' },
      { text: "Based on our analysis, here's what I recommend.", mode: 'strategist' }
    ];

    for (const test of tests) {
      console.log(`\n📝 Testing: ${test.emotion || test.mode || 'companion'} mode`);
      const result = await lucy.lucySpeak(test.text, userContext, {
        ...test,
        skipTTS: true // Skip actual TTS for demo
      });
      console.log(`🎙️ Lucy: "${result.expressiveText}"`);
    }

    console.log('\n✅ Dr. Lucy demonstrations complete!');
    console.log('💡 To use with real voice synthesis, set ELEVENLABS_API_KEY and LUCY_VOICE_ID in your .env file');
  }

  demonstrateLucy().catch(console.error);
}