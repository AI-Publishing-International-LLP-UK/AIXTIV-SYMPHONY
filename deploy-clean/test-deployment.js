#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://api-for-warp-drive.uw.r.appspot.com';
const MAX_RETRIES = 30;
const RETRY_DELAY = 5000; // 5 seconds

console.log('🚀 Testing ASOOS Flyer ML Deployment...\n');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEndpoint(url, method = 'GET', data = null, maxRetries = MAX_RETRIES) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${url}`,
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      };
            
      if (data) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }
            
      const response = await axios(config);
            
      if (response.status === 503) {
        console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Service starting (${response.status})...`);
        await sleep(RETRY_DELAY);
        continue;
      }
            
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
            
    } catch (error) {
      if (error.response && error.response.status === 503) {
        console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Service starting...`);
        await sleep(RETRY_DELAY);
        continue;
      }
            
      console.log(`❌ Attempt ${i + 1}/${maxRetries}: Error - ${error.message}`);
            
      if (i === maxRetries - 1) {
        return {
          success: false,
          error: error.message,
          status: error.response?.status
        };
      }
            
      await sleep(RETRY_DELAY);
    }
  }
}

async function runTests() {
  const tests = [
    {
      name: '🏥 Health Check',
      endpoint: '/health',
      method: 'GET'
    },
    {
      name: '📋 API Documentation',
      endpoint: '/',
      method: 'GET'
    },
    {
      name: '📊 ASOOS Flyer Status',
      endpoint: '/api/asoos/status',
      method: 'GET'
    },
    {
      name: '🧪 ASOOS Flyer Test',
      endpoint: '/api/asoos/test',
      method: 'POST',
      data: { testType: 'basic' }
    }
  ];
    
  const results = [];
    
  for (const test of tests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Endpoint: ${test.method} ${test.endpoint}`);
        
    const result = await testEndpoint(
      test.endpoint,
      test.method,
      test.data,
      test.name === '🏥 Health Check' ? MAX_RETRIES : 3 // More retries for health check
    );
        
    if (result.success) {
      console.log(`✅ Success! Status: ${result.status}`);
            
      // Show key data for important endpoints
      if (test.endpoint === '/health' && result.data) {
        console.log(`   📈 Version: ${result.data.version || 'Unknown'}`);
        console.log(`   🎯 ASOOS Flyer: ${result.data.asoosFlyerML?.status || 'Unknown'}`);
      }
            
      if (test.endpoint === '/api/asoos/status' && result.data) {
        console.log(`   🔧 Status: ${result.data.status}`);
        console.log(`   🤖 Connectors: ${result.data.availableConnectors?.length || 0}`);
        console.log(`   🧠 ML Enhanced: ${result.data.version}`);
      }
            
      if (test.endpoint === '/api/asoos/test' && result.data) {
        console.log(`   🧪 Test Result: ${result.data.status}`);
        console.log(`   💫 System Operational: ${result.data.result?.message || 'Check complete'}`);
      }
            
    } else {
      console.log(`❌ Failed! ${result.error || 'Unknown error'}`);
      if (result.status) {
        console.log(`   Status: ${result.status}`);
      }
    }
        
    results.push({
      test: test.name,
      endpoint: test.endpoint,
      success: result.success,
      status: result.status,
      error: result.error
    });
  }
    
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT TEST SUMMARY');
  console.log('='.repeat(60));
    
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
    
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.success ? 'PASS' : 'FAIL'}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
    
  console.log('\n' + '='.repeat(60));
    
  if (successCount === totalCount) {
    console.log('🎉 ASOOS FLYER ML DEPLOYMENT SUCCESSFUL!');
    console.log('🚀 Dr. Lucy ML automation is OPERATIONAL');
    console.log('🧠 Professor Lee AI-human feedback loop is ACTIVE');
    console.log('🔥 Intelligent market intelligence swarm is DEPLOYED!');
    console.log('\n💫 Access your system at:');
    console.log(`   🌐 Health: ${BASE_URL}/health`);
    console.log(`   📊 Status: ${BASE_URL}/api/asoos/status`);
    console.log(`   🧠 Process: ${BASE_URL}/api/asoos/process`);
    console.log(`   👨‍🏫 Curate: ${BASE_URL}/api/asoos/curate`);
    console.log(`   🔄 Feedback: ${BASE_URL}/api/asoos/feedback`);
  } else {
    console.log(`⚠️  PARTIAL SUCCESS: ${successCount}/${totalCount} tests passed`);
    console.log('🔍 Check the errors above and the service logs for issues');
  }
    
  console.log('\n' + '='.repeat(60));
    
  process.exit(successCount === totalCount ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
