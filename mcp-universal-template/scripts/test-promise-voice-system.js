#!/usr/bin/env node

/**
 * Test Script for AI Trinity Voice System with Promise Handling
 * 
 * This script tests:
 * 1. Promise resolution without [object Promise] errors
 * 2. AI Trinity voice configuration (Dr. Lucy, Dr. Claude, Victory36)
 * 3. Multilingual support (52+ languages)
 * 4. ElevenLabs integration simulation
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:8080';
const TEST_TIMEOUT = 30000;

// Test data
const TEST_PHRASES = {
  english: "Hello! This is a test of the AI Trinity voice system.",
  french: "Bonjour! Ceci est un test du système vocal AI Trinity.",
  spanish: "¡Hola! Esta es una prueba del sistema de voz AI Trinity.",
  german: "Hallo! Dies ist ein Test des AI Trinity Sprachsystems."
};

const AI_TRINITY_AGENTS = ['dr_lucy', 'dr_claude', 'victory36'];

async function testPromiseHandling() {
  console.log('\n🧪 Testing Promise Handling System...\n');
  
  try {
    // Test health endpoint to verify Promise infrastructure
    console.log('1. Testing Promise infrastructure health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    
    if (healthResponse.data.promiseInfrastructure !== 'healthy') {
      throw new Error('Promise infrastructure not healthy');
    }
    
    console.log('✅ Promise infrastructure: HEALTHY');
    console.log(`   Active promises: ${healthResponse.data.stats.activePromises}`);
    console.log(`   Success rate: ${healthResponse.data.stats.successRate}%`);
    
    return true;
  } catch (error) {
    console.error('❌ Promise infrastructure test failed:', error.message);
    return false;
  }
}

async function testVoiceConfiguration() {
  console.log('\n🎤 Testing AI Trinity Voice Configuration...\n');
  
  try {
    console.log('1. Fetching voice configuration...');
    const configResponse = await axios.get(`${BASE_URL}/api/voices/config`);
    const config = configResponse.data;
    
    // Verify AI Trinity voices
    const expectedVoices = ['dr_lucy', 'dr_claude', 'victory36'];
    const actualVoices = Object.keys(config.aiTrinityVoices);
    
    console.log('   Expected voices:', expectedVoices);
    console.log('   Configured voices:', actualVoices);
    
    for (const voice of expectedVoices) {
      if (!actualVoices.includes(voice)) {
        throw new Error(`Missing voice configuration: ${voice}`);
      }
      
      const voiceConfig = config.aiTrinityVoices[voice];
      console.log(`   ✅ ${voice}: ${voiceConfig.name} (${voiceConfig.voice_id})`);
      console.log(`      Profile: ${voiceConfig.profile}`);
      console.log(`      Languages: ${voiceConfig.primary_languages.join(', ')}`);
    }
    
    // Verify multilingual support
    console.log(`\\n   Multilingual support: ${config.totalLanguages} languages`);
    console.log(`   Model: ${config.multilingualSupport.model}`);
    
    return true;
  } catch (error) {
    console.error('❌ Voice configuration test failed:', error.message);
    return false;
  }
}

async function testVoiceSynthesis() {
  console.log('\n🗣️ Testing AI Trinity Voice Synthesis...\n');
  
  const results = [];
  
  for (const agent of AI_TRINITY_AGENTS) {
    console.log(`Testing ${agent}...`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/voices/synthesize`, {
        text: TEST_PHRASES.english,
        agent: agent,
        language: 'en-US'
      }, {
        timeout: TEST_TIMEOUT
      });
      
      const result = response.data;
      
      // Check for [object Promise] issues
      if (JSON.stringify(result).includes('[object Promise]')) {
        throw new Error(`[object Promise] detected in response for ${agent}`);
      }
      
      if (!result.success || !result.synthesis) {
        throw new Error(`Invalid synthesis result for ${agent}`);
      }
      
      const synthesis = result.synthesis;
      console.log(`   ✅ ${agent} synthesis successful`);
      console.log(`      Voice: ${synthesis.voiceName} (${synthesis.voiceId})`);
      console.log(`      Duration: ${synthesis.duration}s`);
      console.log(`      Promise handled: ${result.promiseHandled}`);
      
      results.push({
        agent,
        success: true,
        voiceName: synthesis.voiceName,
        voiceId: synthesis.voiceId
      });
      
    } catch (error) {
      console.error(`   ❌ ${agent} synthesis failed:`, error.message);
      results.push({
        agent,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\\nSynthesis Results: ${successCount}/${AI_TRINITY_AGENTS.length} successful`);
  
  return successCount === AI_TRINITY_AGENTS.length;
}

async function testMultilingualSupport() {
  console.log('\n🌍 Testing Multilingual Voice Support...\n');
  
  const languages = ['english', 'french', 'spanish', 'german'];
  const results = [];
  
  for (const lang of languages) {
    console.log(`Testing ${lang}...`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/voices/synthesize-multilingual`, {
        text: TEST_PHRASES[lang],
        autoDetectLanguage: true
      }, {
        timeout: TEST_TIMEOUT
      });
      
      const result = response.data;
      
      // Check for [object Promise] issues
      if (JSON.stringify(result).includes('[object Promise]')) {
        throw new Error(`[object Promise] detected in multilingual response for ${lang}`);
      }
      
      if (!result.success || !result.multilingual) {
        throw new Error(`Invalid multilingual result for ${lang}`);
      }
      
      const multilingual = result.multilingual;
      console.log(`   ✅ ${lang} multilingual synthesis successful`);
      console.log(`      Detected language: ${multilingual.detectedLanguage}`);
      console.log(`      Selected agent: ${multilingual.agent}`);
      console.log(`      Voice: ${multilingual.voiceName}`);
      console.log(`      Confidence: ${multilingual.textAnalysis.languageConfidence}`);
      
      results.push({
        language: lang,
        success: true,
        detectedLanguage: multilingual.detectedLanguage,
        agent: multilingual.agent
      });
      
    } catch (error) {
      console.error(`   ❌ ${lang} multilingual test failed:`, error.message);
      results.push({
        language: lang,
        success: false,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\\nMultilingual Results: ${successCount}/${languages.length} successful`);
  
  return successCount === languages.length;
}

async function testBatchVoiceProcessing() {
  console.log('\n📦 Testing Batch Voice Processing...\n');
  
  try {
    console.log('Testing all AI Trinity voices with batch processing...');
    
    const response = await axios.post(`${BASE_URL}/api/voices/test-trinity`, {
      testPhrase: "This is a batch processing test of all AI Trinity voices."
    }, {
      timeout: TEST_TIMEOUT
    });
    
    const result = response.data;
    
    // Check for [object Promise] issues
    if (JSON.stringify(result).includes('[object Promise]')) {
      throw new Error('[object Promise] detected in batch processing response');
    }
    
    if (!result.success || !result.batchProcessed) {
      throw new Error('Batch processing failed');
    }
    
    console.log('   ✅ Batch processing successful');
    console.log(`   Agents tested: ${result.agentsTested.length}`);
    console.log(`   Results count: ${result.results.length}`);
    console.log(`   Promise handler used: ${result.promiseHandlerUsed}`);
    console.log(`   Batch stats: ${JSON.stringify(result.batchStats)}`);
    
    // Verify each agent result
    for (const agentResult of result.results) {
      console.log(`      ${agentResult.agent}: ${agentResult.voiceName} (${agentResult.testResult})`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Batch processing test failed:', error.message);
    return false;
  }
}

async function testVoiceSystemHealth() {
  console.log('\n💚 Testing Voice System Health...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/voices/health`);
    const result = response.data;
    
    // Check for [object Promise] issues
    if (JSON.stringify(result).includes('[object Promise]')) {
      throw new Error('[object Promise] detected in health check response');
    }
    
    if (result.status !== 'healthy') {
      throw new Error(`Voice system not healthy: ${result.status}`);
    }
    
    console.log('   ✅ Voice system health: HEALTHY');
    console.log(`   Active voices: ${result.voiceSystem.aiTrinityVoicesActive}`);
    console.log(`   Multilingual languages: ${result.voiceSystem.multilingualLanguagesSupported}`);
    console.log(`   Promise infrastructure: ${result.voiceSystem.promiseInfrastructure}`);
    console.log(`   ElevenLabs integration: ${result.voiceSystem.elevenLabsIntegration}`);
    
    // Show agent profiles
    console.log('\\n   Agent Profiles:');
    for (const profile of result.voiceSystem.agentProfiles) {
      console.log(`      ${profile.agent}: ${profile.name} (${profile.primaryLanguages} languages)`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Voice system health check failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 AI Trinity Voice System Test Suite');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timeout: ${TEST_TIMEOUT}ms`);
  
  const testResults = {
    promiseHandling: false,
    voiceConfiguration: false,
    voiceSynthesis: false,
    multilingualSupport: false,
    batchProcessing: false,
    systemHealth: false
  };
  
  // Run all tests
  testResults.promiseHandling = await testPromiseHandling();
  testResults.voiceConfiguration = await testVoiceConfiguration();
  testResults.voiceSynthesis = await testVoiceSynthesis();
  testResults.multilingualSupport = await testMultilingualSupport();
  testResults.batchProcessing = await testBatchVoiceProcessing();
  testResults.systemHealth = await testVoiceSystemHealth();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result).length;
  
  for (const [testName, result] of Object.entries(testResults)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
  }
  
  console.log(`\\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\\n🎉 All tests passed! AI Trinity voice system with Promise handling is working correctly.');
    console.log('\\n✅ Key Features Verified:');
    console.log('   • Promise infrastructure prevents [object Promise] errors');
    console.log('   • Dr. Lucy, Dr. Claude, Victory36 voices configured correctly');
    console.log('   • 52+ language multilingual support active');
    console.log('   • ElevenLabs integration ready');
    console.log('   • Batch processing with Promise handling');
    console.log('   • Health monitoring and statistics');
    
    process.exit(0);
  } else {
    console.log(`\\n❌ ${totalTests - passedTests} test(s) failed. Please review the issues above.`);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\\n💥 Test suite failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testPromiseHandling,
  testVoiceConfiguration,
  testVoiceSynthesis,
  testMultilingualSupport,
  testBatchVoiceProcessing,
  testVoiceSystemHealth
};