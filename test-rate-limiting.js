#!/usr/bin/env node

/**
 * Test Script for Adaptive Rate Limiting
 * 
 * This script tests the rate limiting functionality by sending requests
 * with different user and agent types to verify enforcement.
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';

async function testRateLimit(userType, agentType, userId, expectedLimit) {
  console.log(`\n🧪 Testing Rate Limit for ${agentType || userType}`);
  console.log(`Expected limit: ${expectedLimit} requests/minute`);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (userType) headers['x-user-type'] = userType;
  if (agentType) headers['x-agent-type'] = agentType;
  if (userId) {
    if (agentType) {
      headers['x-agent-id'] = userId;
    } else {
      headers['x-user-id'] = userId;
    }
  }
  
  try {
    // First, check the rate limit status
    const statusResponse = await axios.get(`${BASE_URL}/api/rate-limit/status`, { headers });
    console.log(`📊 Rate Limit Status:`, statusResponse.data.rateLimitInfo);
    
    // Make a series of requests to test rate limiting
    let successCount = 0;
    let rateLimitedCount = 0;
    
    for (let i = 0; i < Math.min(expectedLimit + 50, 100); i++) {
      try {
        const response = await axios.get(`${BASE_URL}/health`, { headers });
        if (response.status === 200) {
          successCount++;
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          rateLimitedCount++;
          console.log(`⚠️  Rate limited after ${successCount} requests`);
          break;
        } else {
          console.error(`❌ Unexpected error:`, error.message);
        }
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log(`✅ Successful requests: ${successCount}`);
    console.log(`🚫 Rate limited requests: ${rateLimitedCount}`);
    
    // Verify the limit is approximately correct (allowing some margin)
    const withinExpectedRange = successCount >= expectedLimit * 0.8 && successCount <= expectedLimit * 1.2;
    if (withinExpectedRange) {
      console.log(`✅ Rate limiting working correctly`);
    } else {
      console.log(`❌ Rate limiting may not be working as expected`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Rate Limiting Tests');
  console.log(`Testing against: ${BASE_URL}`);
  
  // Test anonymous users
  await testRateLimit('anonymous', null, null, 200);
  
  // Test authenticated users
  await testRateLimit('authenticated', null, 'user123', 2000);
  
  // Test RIX agents
  await testRateLimit(null, 'rix', 'rix-agent-001', 5000);
  
  // Test CRX agents
  await testRateLimit(null, 'crx', 'crx-agent-001', 10000);
  
  // Test QRIX agents
  await testRateLimit(null, 'qrix', 'qrix-agent-001', 20000);
  
  // Test unknown agent type
  await testRateLimit(null, 'unknown', 'unknown-agent-001', 500);
  
  console.log('\n🏁 Rate Limiting Tests Complete');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
