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
      lucyVoiceId: config.lucyVoiceId || 'lucy-voice-default',
      defaultMode: config.defaultMode || 'companion',
      enableHumanisms: config.enableHumanisms !== false,
      humanismChance: config.humanismChance || 0.2,
      ...config
    };

    this.voiceProfiles = {
      'dr-lucy-executive': {
        voiceId: 'lucy-executive-voice',
        stability: 0.75,
        similarityBoost: 0.85,
        style: 0.2
      },
      'dr-lucy-empathetic': {
        voiceId: 'lucy-empathy-voice',
        stability: 0.6,
        similarityBoost: 0.9,
        style: 0.4
      },
      'dr-lucy-strategic': {
        voiceId: 'lucy-strategy-voice',
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
        "🎉 Wow! Look at you!",
        "That's amazing progress!",
        "You did something brave today.",
        "I'm so proud of you.",
        "Let's celebrate this win!"
      ],
      reflection: [
        "Sometimes just naming it helps, doesn't it?",
        "You've come a long way, truly.",
        "I notice the strength in that.",
        "That takes real courage.",
        "You're processing this beautifully."
      ],
      encouragement: [
        "You're not alone in this.",
        "Mistakes are just data. You're learning.",
        "I believe in you.",
        "You have everything you need inside you.",
        "One step at a time is enough."
      ],
      presence: [
        "mm-hmm",
        "I'm listening",
        "...(gentle pause)",
        "...(thoughtful silence)",
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
   * @param {string} text - The message Lucy will speak
   * @param {object} userContext - {userName, mood, sessionId, emotion, history}
   * @param {object} options - {mode, emotion, voiceProfile, skipTTS}
   */
  async lucySpeak(text, userContext = {}, options = {}) {
    try {
      const {
        mode = this.config.defaultMode,
        emotion = userContext.emotion || 'neutral',
        voiceProfile = 'dr-lucy-executive',
        skipTTS = false,
        playAudio = true
      } = options;

      // Check if we should speak at all
      const modeConfig = this.conversationalModes[mode];
      if (modeConfig.speech === false) {
        return this.handleSilentPresence(userContext, options);
      }

      let expressiveText = text;

      // Add personal touch
      expressiveText = this.addPersonalTouch(expressiveText, userContext, modeConfig);

      // Apply emotional intelligence
      expressiveText = this.applyEmotionalIntelligence(expressiveText, emotion, userContext);

      // Add conversational mode styling
      expressiveText = this.applyConversationalMode(expressiveText, mode, modeConfig);

      // Add Lucy-isms (humanisms)
      expressiveText = this.addLucyisms(expressiveText, emotion, modeConfig);

      // Process pauses and speech markers
      expressiveText = this.processSpeechMarkers(expressiveText);

      if (skipTTS) {
        return {
          text: expressiveText,
          emotion,
          mode,
          voiceProfile,
          processed: true
        };
      }

      // Generate speech with ElevenLabs
      const audioResult = await this.generateSpeech(expressiveText, voiceProfile, options);

      // Log the interaction for memory
      await this.logInteraction(text, expressiveText, userContext, options, audioResult);

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
      console.error('Lucy Expressive Speech Error:', error);
      return {
        error: error.message,
        originalText: text,
        success: false
      };
    }
  }

  /**
   * Add personal touches based on user context
   */
  addPersonalTouch(text, userContext, modeConfig) {
    if (!modeConfig.personalTouch) return text;

    let personalText = text;

    // Add user name if available and appropriate
    if (userContext.userName && Math.random() < 0.3) {
      const greetings = [
        `Hey ${userContext.userName}, `,
        `${userContext.userName}, `,
        `Listen, ${userContext.userName}, `,
        `You know, ${userContext.userName}, `
      ];
      personalText = greetings[Math.floor(Math.random() * greetings.length)] + personalText;
    }

    // Reference conversation history
    if (userContext.history && userContext.history.length > 0 && Math.random() < 0.15) {
      const historyRefs = [
        "Like we discussed before, ",
        "Building on what you shared, ",
        "Continuing our conversation, "
      ];
      personalText = historyRefs[Math.floor(Math.random() * historyRefs.length)] + personalText.toLowerCase();
    }

    return personalText;
  }

  /**
   * Apply emotional intelligence to the text
   */
  applyEmotionalIntelligence(text, emotion, userContext) {
    let emotionalText = text;

    switch (emotion) {
      case 'empathy':
        emotionalText = "I'm here. " + emotionalText;
        if (Math.random() < 0.4) {
          emotionalText += " (gentle pause)";
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
          emotionalText += " ...mm-hmm.";
        }
        break;

      case 'concern':
      case 'worried':
        emotionalText = "I want to make sure you're okay. " + emotionalText;
        break;

      case 'excited':
      case 'enthusiastic':
        emotionalText = emotionalText + " I'm excited about this with you!";
        break;
    }

    return emotionalText;
  }

  /**
   * Apply conversational mode styling
   */
  applyConversationalMode(text, mode, modeConfig) {
    let modeText = text;

    switch (mode) {
      case 'listener':
        if (Math.random() < modeConfig.pauseFrequency) {
          modeText += " (gentle pause) Take your time.";
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
            " What direction calls to you?",
            " Where do you want to go from here?"
          ];
          modeText += prompts[Math.floor(Math.random() * prompts.length)];
        }
        break;

      case 'celebrator':
        if (modeConfig.enthusiasm && Math.random() < 0.5) {
          const celebrations = [
            " You're doing amazing!",
            " Look at this progress!",
            " I'm so proud of you!",
            " This is incredible!"
          ];
          modeText += celebrations[Math.floor(Math.random() * celebrations.length)];
        }
        break;

      case 'strategist':
        if (modeConfig.analytical && Math.random() < 0.3) {
          const analytical = [
            " Based on the data, ",
            " From a strategic perspective, ",
            " Looking at this systematically, "
          ];
          modeText = analytical[Math.floor(Math.random() * analytical.length)] + modeText.toLowerCase();
        }
        break;
    }

    return modeText;
  }

  /**
   * Add Lucy-isms for natural conversation flow
   */
  addLucyisms(text, emotion, modeConfig) {
    if (!this.config.enableHumanisms || !modeConfig.backchanneling) {
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

  /**
   * Process speech markers for TTS
   */
  processSpeechMarkers(text) {
    let processedText = text;

    // Replace pause markers
    processedText = processedText
      .replace(/\(gentle pause\)/g, "[PAUSE:1000]")
      .replace(/\(brief pause\)/g, "[PAUSE:500]")
      .replace(/\(long pause\)/g, "[PAUSE:2000]")
      .replace(/\.\.\.mm-hmm\./g, " mm-hmm [PAUSE:800] ")
      .replace(/\(thoughtful silence\)/g, "[PAUSE:1500]")
      .replace(/\.\.\./g, "[PAUSE:600]");

    // Clean up multiple spaces
    processedText = processedText.replace(/\s+/g, ' ').trim();

    return processedText;
  }

  /**
   * Handle silent presence mode
   */
  async handleSilentPresence(userContext, options) {
    console.log('🤫 Lucy: Silent presence mode - holding space...');
    
    return {
      mode: 'silent',
      presence: true,
      message: "Lucy is here with you in quiet support",
      success: true
    };
  }

  /**
   * Generate speech using ElevenLabs
   */
  async generateSpeech(text, voiceProfile, options) {
    if (!this.config.elevenLabsApiKey) {
      console.warn('⚠️ ElevenLabs API key not configured - returning text only');
      return { text, audio: null, success: false };
    }

    try {
      const profile = this.voiceProfiles[voiceProfile] || this.voiceProfiles['dr-lucy-executive'];
      
      // Remove pause markers for API call
      const cleanText = text.replace(/\[PAUSE:\d+\]/g, ' ').replace(/\s+/g, ' ').trim();
      
      const response = await axios.post(
        `${this.config.elevenLabsApiUrl}/text-to-speech/${profile.voiceId}`,
        {
          text: cleanText,
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
        text: cleanText,
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

  /**
   * Log interaction for memory and analytics
   */
  async logInteraction(originalText, expressiveText, userContext, options, audioResult) {
    const interaction = {
      timestamp: new Date().toISOString(),
      agentId: 'dr-lucy-crx-001',
      userId: userContext.userId || 'anonymous',
      sessionId: userContext.sessionId,
      originalText,
      expressiveText,
      emotion: options.emotion || userContext.emotion,
      mode: options.mode,
      voiceProfile: options.voiceProfile,
      success: audioResult?.success || false,
      textLength: originalText.length,
      expressiveLength: expressiveText.length,
      userContext: {
        userName: userContext.userName,
        mood: userContext.mood,
        historyLength: userContext.history?.length || 0
      }
    };

    console.log('🎙️ Lucy Speech Interaction:', {
      emotion: interaction.emotion,
      mode: interaction.mode,
      textLength: interaction.textLength,
      success: interaction.success
    });
    
    return interaction;
  }

  /**
   * Quick helper methods for common use cases
   */
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
      console.log(`🎙️ Lucy: "${result.text || result.expressiveText}"`);
    }

    console.log('\n✅ Dr. Lucy demonstrations complete!');
    console.log('💡 To use with real voice synthesis, set ELEVENLABS_API_KEY and LUCY_VOICE_ID in your .env file');
  }

  demonstrateLucy().catch(console.error);
}
      
      // Process pause markers for actual delays
      const textParts = text.split(/\[PAUSE:\d+\]/);
      const pauseMatches = text.match(/\[PAUSE:(\d+)\]/g) || [];
      
      if (textParts.length === 1) {
        // No pauses, single API call
        return await this.callElevenLabsAPI(text, profile);
      } else {
        // Multiple parts with pauses - handle sequentially
        return await this.generateSequentialSpeech(textParts, pauseMatches, profile);
      }

    } catch (error) {
      console.error('❌ ElevenLabs API Error:', error);
      return { text, error: error.message, success: false };
    }
  }

  /**
   * Call ElevenLabs API
   */
  async callElevenLabsAPI(text, profile) {
    const cleanText = text.replace(/\[PAUSE:\d+\]/g, ' ').replace(/\s+/g, ' ').trim();
    
    const response = await axios.post(
      `${this.config.elevenLabsApiUrl}/text-to-speech/${profile.voiceId}`,
      {
        text: cleanText,
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
      text: cleanText,
      voiceId: profile.voiceId,
      success: true
    };
  }

  /**
   * Generate speech with pauses
   */
  async generateSequentialSpeech(textParts, pauseMatches, profile) {
    const audioSegments = [];
    
    for (let i = 0; i < textParts.length; i++) {
      if (textParts[i].trim()) {
        const audioResult = await this.callElevenLabsAPI(textParts[i].trim(), profile);
        audioSegments.push({
          type: 'speech',
          data: audioResult.audio
        });
      }
      
      if (i < pauseMatches.length) {
        const pauseMatch = pauseMatches[i].match(/\[PAUSE:(\d+)\]/);
        const pauseDuration = pauseMatch ? parseInt(pauseMatch[1]) : 1000;
        audioSegments.push({
          type: 'pause',
          duration: pauseDuration
        });
      }
    }

    return {
      segments: audioSegments,
      text: textParts.join(' '),
      voiceId: profile.voiceId,
      success: true
    };
  }

  /**
   * Log interaction for memory and analytics
   */
  async logInteraction(originalText, expressiveText, userContext, options, audioResult) {
    const interaction = {
      timestamp: new Date().toISOString(),
      agentId: 'dr-lucy-crx-001',
      userId: userContext.userId || 'anonymous',
      sessionId: userContext.sessionId,
      originalText,
      expressiveText,
      emotion: options.emotion || userContext.emotion,
      mode: options.mode,
      voiceProfile: options.voiceProfile,
      success: audioResult.success,
      textLength: originalText.length,
      expressiveLength: expressiveText.length,
      userContext: {
        userName: userContext.userName,
        mood: userContext.mood,
        historyLength: userContext.history?.length || 0
      }
    };

    console.log('🎙️ Lucy Speech Interaction:', {
      emotion: interaction.emotion,
      mode: interaction.mode,
      textLength: interaction.textLength,
      success: interaction.success
    });

    // Store in memory system (implement based on your Pinecone setup)
    // await this.storeInMemory(interaction);
    
    return interaction;
  }

  /**
   * Quick helper methods for common use cases
   */
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
