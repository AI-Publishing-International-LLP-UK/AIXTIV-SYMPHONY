#!/usr/bin/env node

import { initializeRIXAgents, elevenlabs } from './elevenlabs-conversational-agents.js';
import 'dotenv/config';

async function testElevenLabsConnection() {
  console.log('🧪 Testing ElevenLabs API connection...');
  
  try {
    const voices = await elevenlabs.voices.getAll();
    console.log(`✅ ElevenLabs API connected. Found ${voices.voices.length} voices available.`);
    
    // Check for specific voices we're using
    const danaVoice = voices.voices.find(v => v.voice_id === 'pNInz6obpgDQGcFmaJgB');
    if (danaVoice) {
      console.log(`🎙️ Dana voice found: ${danaVoice.name}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ ElevenLabs API connection failed:', error.message);
    return false;
  }
}

async function testAgentCreation() {
  console.log('🚀 Testing RIX Agent creation...');
  
  try {
    const agentConfig = await initializeRIXAgents();
    console.log('✅ All agents created successfully!');
    console.log('📋 Agent Configuration:', agentConfig);
    
    // Test agent capabilities
    console.log('\n🔍 Testing agent capabilities...');
    
    for (const [rixType, config] of Object.entries(agentConfig)) {
      console.log(`\n📞 Testing ${config.name} (${rixType}):`);
      console.log(`   • Agent ID: ${config.agentId}`);
      console.log(`   • Specialization: ${config.specialization}`);
      
      // You can add conversation tests here if needed
      // const conversation = await elevenlabs.conversationalAi.conversations.create({
      //   agentId: config.agentId
      // });
    }
    
    return agentConfig;
  } catch (error) {
    console.error('❌ Agent creation test failed:', error);
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Running ElevenLabs Conversational AI Agent Tests\n');
  
  try {
    // Test 1: API Connection
    const connected = await testElevenLabsConnection();
    if (!connected) {
      console.log('❌ Cannot proceed without API connection');
      process.exit(1);
    }
    
    // Test 2: Agent Creation
    const agentConfig = await testAgentCreation();
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. The RIX agents are now created in ElevenLabs');
    console.log('   2. Integrate agent IDs into your MCP.API.2100.COOL system');
    console.log('   3. Replace the existing Promise-based agent responses with ElevenLabs conversations');
    console.log('   4. Deploy updated system to production');
    
    console.log('\n🔗 Integration Instructions:');
    console.log('   • QB RIX (Dr. Lucy):', agentConfig.QB_RIX.agentId);
    console.log('   • SH RIX (Dr. Claude):', agentConfig.SH_RIX.agentId);
    console.log('   • V36 RIX (Victory36):', agentConfig.V36_RIX.agentId);
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testElevenLabsConnection, testAgentCreation };
