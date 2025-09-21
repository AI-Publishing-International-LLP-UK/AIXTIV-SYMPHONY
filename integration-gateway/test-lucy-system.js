#!/usr/bin/env node

/**
 * Dr. Lucy System Test Runner
 * Comprehensive testing for expressive speech, memory, and integration
 * 
 * @author AI Publishing International LLP
 * @version 2.0.0 - Symphony Integration
 */

const LucyExpressiveSpeech = require('./lucy-expressive-speech');
const DrLucyMemoryImport = require('./dr-lucy-memory-import');
require('dotenv').config();

class LucySystemTest {
  constructor() {
    this.lucySpeech = new LucyExpressiveSpeech({
      lucyVoiceId: process.env.LUCY_VOICE_ID || 'demo-voice-id',
      enableHumanisms: true,
      humanismChance: 0.3
    });
    
    this.lucyMemory = new DrLucyMemoryImport();
    
    this.testResults = [];
    this.userContext = {
      userName: 'Phillip',
      userId: 'test-phillip-001',
      sessionId: `test-session-${Date.now()}`,
      mood: 'mixed',
      history: [
        'Previous conversation about Symphony project challenges',
        'Discussion about trust issues with team',
        'Launched first version successfully'
      ]
    };
  }

  async runAllTests() {
    console.log('🎭 Starting Dr. Lucy System Comprehensive Tests');
    console.log('=' .repeat(60));
    
    await this.testExpressiveSpeech();
    await this.testEmotionalIntelligence();
    await this.testConversationalModes();
    await this.testMemorySystem();
    await this.testIntegrationFlow();
    
    this.printResults();
  }

  async testExpressiveSpeech() {
    console.log('\n🎙️ Testing Expressive Speech System...');
    
    const speechTests = [
      {
        name: 'Basic Speech Generation',
        text: 'Hello, this is a basic test of my speech capabilities.',
        options: { skipTTS: true }
      },
      {
        name: 'Personal Touch',
        text: 'I wanted to check in with you about your project.',
        options: { skipTTS: true }
      },
      {
        name: 'With Pauses',
        text: 'Let me think about this (gentle pause) and give you my thoughts.',
        options: { skipTTS: true }
      }
    ];

    for (const test of speechTests) {
      try {
        const result = await this.lucySpeech.lucySpeak(
          test.text, 
          this.userContext, 
          test.options
        );
        
        this.logTest(test.name, true, {
          original: test.text,
          expressive: result.expressiveText,
          success: result.success
        });
        
        console.log(`  ✅ ${test.name}`);
        console.log(`     Original: "${test.text}"`);
        console.log(`     Enhanced: "${result.expressiveText}"`);
        
      } catch (error) {
        this.logTest(test.name, false, { error: error.message });
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testEmotionalIntelligence() {
    console.log('\n❤️ Testing Emotional Intelligence...');
    
    const emotionTests = [
      {
        name: 'Empathy Response',
        text: 'This has been really difficult for me.',
        emotion: 'empathy'
      },
      {
        name: 'Celebration Response',
        text: 'We successfully launched the project!',
        emotion: 'celebrate'
      },
      {
        name: 'Reassurance Response',
        text: 'I am worried about the next steps.',
        emotion: 'reassure'
      },
      {
        name: 'Reflection Response',
        text: 'I need to process what happened.',
        emotion: 'reflect'
      }
    ];

    for (const test of emotionTests) {
      try {
        const result = await this.lucySpeech.lucySpeak(
          test.text,
          { ...this.userContext, emotion: test.emotion },
          { emotion: test.emotion, skipTTS: true }
        );
        
        this.logTest(test.name, true, {
          emotion: test.emotion,
          enhanced: result.expressiveText
        });
        
        console.log(`  ✅ ${test.name} (${test.emotion})`);
        console.log(`     Enhanced: "${result.expressiveText}"`);
        
      } catch (error) {
        this.logTest(test.name, false, { error: error.message });
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testConversationalModes() {
    console.log('\n💬 Testing Conversational Modes...');
    
    const modeTests = [
      {
        name: 'Companion Mode',
        text: 'How are you feeling about everything?',
        mode: 'companion'
      },
      {
        name: 'Guide Mode',
        text: 'Here are some options for moving forward.',
        mode: 'guide'
      },
      {
        name: 'Listener Mode', 
        text: 'I hear what you are saying.',
        mode: 'listener'
      },
      {
        name: 'Celebrator Mode',
        text: 'You achieved something amazing!',
        mode: 'celebrator'
      },
      {
        name: 'Strategist Mode',
        text: 'Let me analyze the data and provide recommendations.',
        mode: 'strategist'
      },
      {
        name: 'Silent Mode',
        text: '',
        mode: 'silent'
      }
    ];

    for (const test of modeTests) {
      try {
        const result = await this.lucySpeech.lucySpeak(
          test.text,
          this.userContext,
          { mode: test.mode, skipTTS: true }
        );
        
        this.logTest(test.name, true, {
          mode: test.mode,
          result: result.mode === 'silent' ? 'Silent presence activated' : result.expressiveText
        });
        
        console.log(`  ✅ ${test.name}`);
        if (result.mode === 'silent') {
          console.log(`     Result: Silent presence mode activated`);
        } else {
          console.log(`     Enhanced: "${result.expressiveText}"`);
        }
        
      } catch (error) {
        this.logTest(test.name, false, { error: error.message });
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  async testMemorySystem() {
    console.log('\n🧠 Testing Memory System...');
    
    try {
      // Test memory recall
      console.log('  Testing memory recall...');
      const memories = await this.lucyMemory.testDrLucyMemoryRecall('coaching strategy');
      
      this.logTest('Memory Recall', true, {
        query: 'coaching strategy',
        memoriesFound: memories.length
      });
      
      console.log(`  ✅ Memory Recall: Found ${memories.length} relevant memories`);
      
      // Test response generation
      console.log('  Testing contextual response generation...');
      const response = await this.lucyMemory.generateDrLucyResponse('How can I improve my leadership?');
      
      this.logTest('Contextual Response', true, {
        query: 'How can I improve my leadership?',
        confidence: response.confidence,
        responseLength: response.response.length
      });
      
      console.log(`  ✅ Contextual Response Generated (confidence: ${response.confidence})`);
      console.log(`     Response: "${response.response}"`);
      
    } catch (error) {
      this.logTest('Memory System', false, { error: error.message });
      console.log(`  ❌ Memory System Error: ${error.message}`);
    }
  }

  async testIntegrationFlow() {
    console.log('\n🔄 Testing Complete Integration Flow...');
    
    const integrationTests = [
      {
        name: 'End-to-End Conversation',
        message: 'I successfully launched my project today, but I am worried about what comes next.',
        expectedEmotion: 'mixed'
      },
      {
        name: 'Memory + Speech Integration',
        message: 'Can you help me with strategic planning?',
        expectedEmotion: 'neutral'
      }
    ];

    for (const test of integrationTests) {
      try {
        console.log(`  Testing: ${test.name}`);
        
        // 1. Generate contextual response
        const lucyResponse = await this.lucyMemory.generateDrLucyResponse(test.message);
        
        // 2. Convert to expressive speech
        const speechResult = await this.lucySpeech.lucySpeak(
          lucyResponse.response,
          this.userContext,
          { 
            emotion: this.detectEmotion(test.message),
            mode: 'companion',
            skipTTS: true 
          }
        );
        
        this.logTest(test.name, true, {
          userMessage: test.message,
          lucyResponse: lucyResponse.response,
          expressiveSpeech: speechResult.expressiveText,
          confidence: lucyResponse.confidence
        });
        
        console.log(`  ✅ ${test.name}`);
        console.log(`     User: "${test.message}"`);
        console.log(`     Lucy (contextual): "${lucyResponse.response}"`);
        console.log(`     Lucy (expressive): "${speechResult.expressiveText}"`);
        console.log(`     Confidence: ${lucyResponse.confidence}`);
        
      } catch (error) {
        this.logTest(test.name, false, { error: error.message });
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
  }

  // Helper methods
  detectEmotion(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('successful') || lowerMessage.includes('launched')) {
      return 'celebrate';
    }
    if (lowerMessage.includes('worried') || lowerMessage.includes('afraid')) {
      return 'empathy';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('planning')) {
      return 'neutral';
    }
    
    return 'neutral';
  }

  logTest(name, success, details = {}) {
    this.testResults.push({
      name,
      success,
      timestamp: new Date().toISOString(),
      details
    });
  }

  printResults() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => !t.success)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details.error || 'Unknown error'}`);
        });
    }
    
    console.log('\n🎯 System Status:');
    console.log(`  Expressive Speech: ${passedTests > 0 ? 'OPERATIONAL' : 'FAILED'}`);
    console.log(`  Memory System: ${this.testResults.some(t => t.name.includes('Memory') && t.success) ? 'OPERATIONAL' : 'LIMITED'}`);
    console.log(`  Integration Flow: ${this.testResults.some(t => t.name.includes('Integration') && t.success) ? 'OPERATIONAL' : 'FAILED'}`);
    
    console.log('\n💡 Next Steps:');
    if (failedTests === 0) {
      console.log('  ✅ All systems operational! Ready for deployment.');
      console.log('  🚀 Configure ElevenLabs API key for voice synthesis');
      console.log('  🧠 Set up Pinecone for persistent memory storage');
    } else {
      console.log('  🔧 Fix failed tests before deployment');
      console.log('  📋 Check environment variables and dependencies');
    }
    
    console.log('\n🎭 Dr. Lucy System Test Complete!');
  }
}

// Run tests if called directly
if (require.main === module) {
  async function runTests() {
    const tester = new LucySystemTest();
    await tester.runAllTests();
  }
  
  runTests().catch(console.error);
}

module.exports = LucySystemTest;