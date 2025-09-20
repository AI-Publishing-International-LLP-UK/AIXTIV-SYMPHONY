import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Rate, Trend } from 'k6/metrics';

// Load test configuration
const config = JSON.parse(open('./config.json'));

// Custom metrics
const voiceAssignmentErrors = new Counter('voice_assignment_errors');
const voiceSynthesisErrors = new Counter('voice_synthesis_errors');
const batchAssignmentErrors = new Counter('batch_assignment_errors');
const fallbackActivations = new Counter('fallback_activations');
const authenticationFailures = new Counter('authentication_failures');
const responseTime = new Trend('custom_response_time');

// Test data generators
const pilots = new SharedArray('pilots', function () {
  const pilotData = [];
  for (let i = 1; i <= 100000; i++) { // Sample of 100k pilots for testing
    pilotData.push({
      id: `pilot_${i.toString().padStart(8, '0')}`,
      type: ['RIX', 'CRX', 'QRIX', 'HQRIX', 'PCP'][Math.floor(Math.random() * 5)],
      region: ['us-west1', 'us-central1', 'europe-west1'][Math.floor(Math.random() * 3)],
      priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)]
    });
  }
  return pilotData;
});

const voiceProfiles = ['4RZ84U1b4WCqpu57LvIq', '1nQX17jSn2RXlK251b8y', 'RILOU7YmBhvwJGDGjNmP'];
const testTexts = [
  'Welcome to Aixtiv Symphony. How can I assist you today?',
  'Processing your request. Please stand by.',
  'Voice synthesis complete. Ready for deployment.',
  'System status: All pilots operational and ready.',
  'Initiating secure communication protocol.'
];

// K6 test configuration
export const options = {
  stages: [
    { duration: config.loadTest.rampUpTime, target: config.loadTest.concurrentUsers },
    { duration: config.loadTest.testDuration, target: config.loadTest.concurrentUsers },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: config.loadTest.thresholds.httpReqDuration,
    http_req_failed: config.loadTest.thresholds.httpReqFailed,
    http_reqs: config.loadTest.thresholds.httpReqs,
    voice_assignment_errors: ['count<100'],
    voice_synthesis_errors: ['count<50'],
    batch_assignment_errors: ['count<25'],
    authentication_failures: ['count<10'],
  },
};

// Authentication token (should be set via environment variable)
const authToken = __ENV.AUTH_TOKEN || 'test-token';
const baseUrl = __ENV.BASE_URL || 'http://localhost:3333';

// Headers for authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'X-Session-Token': authToken,
  'CF-Ray': `test-ray-${Math.random().toString(36).substr(2, 9)}`,
  'CF-Connecting-IP': '203.0.113.1',
  'User-Agent': 'K6-LoadTest/1.0'
};

export default function () {
  const scenario = selectScenario();
  const pilot = pilots[Math.floor(Math.random() * pilots.length)];
  
  switch (scenario) {
  case 'voiceAssignment':
    testVoiceAssignment(pilot);
    break;
  case 'voiceSynthesis':
    testVoiceSynthesis(pilot);
    break;
  case 'batchAssignment':
    testBatchAssignment();
    break;
  case 'statusCheck':
    testStatusCheck(pilot);
    break;
  }
  
  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

function selectScenario() {
  const scenarios = config.loadTest.scenarios;
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [name, scenario] of Object.entries(scenarios)) {
    cumulative += scenario.weight;
    if (rand <= cumulative) {
      return name;
    }
  }
  return 'voiceAssignment'; // Default fallback
}

function testVoiceAssignment(pilot) {
  const payload = {
    pilotId: pilot.id,
    voiceProfile: voiceProfiles[Math.floor(Math.random() * voiceProfiles.length)],
    priority: pilot.priority,
    metadata: {
      pilotType: pilot.type,
      region: pilot.region,
      testId: __VU,
      timestamp: new Date().toISOString()
    }
  };
  
  const startTime = Date.now();
  const response = http.post(`${baseUrl}/api/voice/assign`, JSON.stringify(payload), { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'voice assignment status is 200': (r) => r.status === 200,
    'voice assignment has assignment ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.assignment && body.assignment.id;
      } catch (e) {
        return false;
      }
    },
    'voice assignment response time < 2s': (r) => duration < 2000,
  });
  
  if (!success || response.status !== 200) {
    voiceAssignmentErrors.add(1);
    
    // Test fallback mechanism
    if (response.status >= 500) {
      testFallbackMechanism(pilot, 'voiceAssignment');
    }
  }
  
  // Log authentication failures
  if (response.status === 401 || response.status === 403) {
    authenticationFailures.add(1);
  }
}

function testVoiceSynthesis(pilot) {
  const payload = {
    text: testTexts[Math.floor(Math.random() * testTexts.length)],
    voiceProfile: voiceProfiles[Math.floor(Math.random() * voiceProfiles.length)],
    quality: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
    pilotId: pilot.id
  };
  
  const startTime = Date.now();
  const response = http.post(`${baseUrl}/api/voice/synthesize`, JSON.stringify(payload), { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'voice synthesis status is 200': (r) => r.status === 200,
    'voice synthesis has synthesis ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.synthesis && body.synthesis.id;
      } catch (e) {
        return false;
      }
    },
    'voice synthesis response time < 3s': (r) => duration < 3000,
  });
  
  if (!success || response.status !== 200) {
    voiceSynthesisErrors.add(1);
    
    // Test fallback mechanism
    if (response.status >= 500) {
      testFallbackMechanism(pilot, 'voiceSynthesis');
    }
  }
}

function testBatchAssignment() {
  const batchSize = Math.floor(Math.random() * 50) + 10; // 10-60 pilots per batch
  const assignments = [];
  
  for (let i = 0; i < batchSize; i++) {
    const pilot = pilots[Math.floor(Math.random() * pilots.length)];
    assignments.push({
      pilotId: pilot.id,
      voiceProfile: voiceProfiles[Math.floor(Math.random() * voiceProfiles.length)],
      priority: pilot.priority
    });
  }
  
  const payload = { assignments };
  
  const startTime = Date.now();
  const response = http.post(`${baseUrl}/api/voice/batch-assign`, JSON.stringify(payload), { headers });
  const duration = Date.now() - startTime;
  
  responseTime.add(duration);
  
  const success = check(response, {
    'batch assignment status is 200': (r) => r.status === 200,
    'batch assignment processed all': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.processed === batchSize;
      } catch (e) {
        return false;
      }
    },
    'batch assignment response time < 5s': (r) => duration < 5000,
  });
  
  if (!success || response.status !== 200) {
    batchAssignmentErrors.add(1);
  }
}

function testStatusCheck(pilot) {
  const response = http.get(`${baseUrl}/api/voice/pilot/${pilot.id}/status`, { headers });
  
  check(response, {
    'status check is 200': (r) => r.status === 200,
    'status check has pilot data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status && body.status.pilotId === pilot.id;
      } catch (e) {
        return false;
      }
    },
  });
}

function testFallbackMechanism(pilot, operation) {
  fallbackActivations.add(1);
  
  // Simulate fallback to alternative provider/endpoint
  const fallbackHeaders = {
    ...headers,
    'X-Fallback-Provider': 'backup',
    'X-Original-Operation': operation
  };
  
  let fallbackPayload;
  let fallbackEndpoint;
  
  switch (operation) {
  case 'voiceAssignment':
    fallbackPayload = {
      pilotId: pilot.id,
      voiceProfile: 'fallback-voice',
      priority: 'high', // Increase priority for fallback
      fallback: true
    };
    fallbackEndpoint = '/api/voice/assign';
    break;
  case 'voiceSynthesis':
    fallbackPayload = {
      text: 'Fallback synthesis test',
      voiceProfile: 'fallback-voice',
      quality: 'medium',
      fallback: true
    };
    fallbackEndpoint = '/api/voice/synthesize';
    break;
  }
  
  if (fallbackPayload && fallbackEndpoint) {
    const fallbackResponse = http.post(`${baseUrl}${fallbackEndpoint}`, JSON.stringify(fallbackPayload), { 
      headers: fallbackHeaders,
      timeout: '10s'
    });
    
    check(fallbackResponse, {
      'fallback mechanism works': (r) => r.status === 200 || r.status === 202,
    });
  }
}

// Setup function - runs once before the test
export function setup() {
  console.log(`Starting Voice Assignment Load Test for ${config.loadTest.totalPilots} pilots`);
  console.log(`Concurrent users: ${config.loadTest.concurrentUsers}`);
  console.log(`Test duration: ${config.loadTest.testDuration}`);
  
  // Test authentication
  const authResponse = http.get(`${baseUrl}/health`, { headers });
  if (authResponse.status !== 200) {
    console.error('Health check failed - API may not be ready');
  }
  
  return {
    startTime: new Date().toISOString(),
    config: config.loadTest
  };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log(`Load test completed at ${new Date().toISOString()}`);
  console.log(`Test started at: ${data.startTime}`);
  
  // Generate test summary
  console.log('\n=== LOAD TEST SUMMARY ===');
  console.log(`Target Pilots: ${config.loadTest.totalPilots}`);
  console.log(`Concurrent Users: ${config.loadTest.concurrentUsers}`);
  console.log(`Test Duration: ${config.loadTest.testDuration}`);
  console.log('========================\n');
}

// Export for external monitoring
export { voiceAssignmentErrors, voiceSynthesisErrors, batchAssignmentErrors, fallbackActivations, authenticationFailures };
