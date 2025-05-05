// MCP Test Server Implementation for drclaude.live
// This script implements a WebSocket server with MCP protocol support
// specifically configured for testing the ASOOS system

const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'oauth2'; // Replace with secure token in production
const LOG_DIRECTORY = './test_logs';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

// Load MCP configuration
const MCP_CONFIG = require('./mcp-testing-tools.json');

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: PORT });
console.log(`MCP test server listening on port ${PORT}`);

// Store active sessions
const activeSessions = new Map();
const testResults = new Map();

// MCP Protocol Handling
wss.on('connection', (ws, req) => {
  // Authenticate client
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  console.log('Client connected');
  
  // Initialize MCP session
  const sessionId = crypto.randomUUID();
  const sessionLog = initializeSessionLog(sessionId);
  
  // Store session
  activeSessions.set(sessionId, {
    ws,
    log: sessionLog,
    testResults: new Map()
  });
  
  // Send initial message
  send(ws, {
    type: 'session_init',
    session_id: sessionId,
    supported_versions: ['0.1.0'],
    server_info: MCP_CONFIG.server_info
  });
  
  logEvent(sessionLog, 'session_initialized', { sessionId });
  
  // Handle client messages
  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);
      console.log('Received:', msg.type);
      logEvent(sessionLog, 'message_received', { type: msg.type, request_id: msg.request_id });
      
      switch (msg.type) {
        case 'list_resources':
          handleListResources(ws, msg, sessionLog);
          break;
        
        case 'list_tools':
          handleListTools(ws, msg, sessionLog);
          break;
          
        case 'list_prompts':
          handleListPrompts(ws, msg, sessionLog);
          break;
          
        case 'execute_tool':
          await handleExecuteTool(ws, msg, sessionId, sessionLog);
          break;
          
        case 'fetch_resource':
          await handleFetchResource(ws, msg, sessionLog);
          break;
          
        case 'render_prompt':
          handleRenderPrompt(ws, msg, sessionLog);
          break;
          
        default:
          logEvent(sessionLog, 'error', { message: `Unknown message type: ${msg.type}` });
          send(ws, { 
            type: 'error', 
            request_id: msg.request_id,
            error: { code: 'unknown_message_type', message: `Unknown message type: ${msg.type}` }
          });
      }
    } catch (err) {
      console.error('Error processing message:', err);
      logEvent(sessionLog, 'error', { message: err.message, stack: err.stack });
      send(ws, { 
        type: 'error',
        error: { code: 'internal_server_error', message: err.message }
      });
    }
  });
  
  ws.on('close', () => {
    console.log(`Client disconnected (Session: ${sessionId})`);
    logEvent(sessionLog, 'session_closed');
    
    // Finalize session log
    finalizeSessionLog(sessionId, sessionLog);
    
    // Remove session
    activeSessions.delete(sessionId);
  });
});

// Resource Handling
function handleListResources(ws, msg, log) {
  logEvent(log, 'list_resources_requested');
  
  send(ws, {
    type: 'resources_list',
    request_id: msg.request_id,
    resources: MCP_CONFIG.resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      description: resource.description
    }))
  });
  
  logEvent(log, 'resources_list_sent', { count: MCP_CONFIG.resources.length });
}

async function handleFetchResource(ws, msg, log) {
  const resourceId = msg.resource_id;
  logEvent(log, 'fetch_resource_requested', { resource_id: resourceId });
  
  // Find the requested resource
  const resource = MCP_CONFIG.resources.find(r => r.id === resourceId);
  
  if (!resource) {
    logEvent(log, 'resource_not_found', { resource_id: resourceId });
    return send(ws, {
      type: 'error',
      request_id: msg.request_id,
      error: { code: 'resource_not_found', message: `Resource not found: ${resourceId}` }
    });
  }
  
  send(ws, {
    type: 'resource_content',
    request_id: msg.request_id,
    resource_id: resourceId,
    content: resource.content
  });
  
  logEvent(log, 'resource_content_sent', { resource_id: resourceId });
}

// Tool Handling
function handleListTools(ws, msg, log) {
  logEvent(log, 'list_tools_requested');
  
  send(ws, {
    type: 'tools_list',
    request_id: msg.request_id,
    tools: MCP_CONFIG.tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }))
  });
  
  logEvent(log, 'tools_list_sent', { count: MCP_CONFIG.tools.length });
}

async function handleExecuteTool(ws, msg, sessionId, log) {
  const toolId = msg.tool_id;
  const params = msg.parameters;
  
  logEvent(log, 'execute_tool_requested', { tool_id: toolId });
  
  // Find the requested tool
  const tool = MCP_CONFIG.tools.find(t => t.id === toolId);
  
  if (!tool) {
    logEvent(log, 'tool_not_found', { tool_id: toolId });
    return send(ws, {
      type: 'error',
      request_id: msg.request_id,
      error: { code: 'tool_not_found', message: `Tool not found: ${toolId}` }
    });
  }
  
  try {
    // Execute the tool based on its ID
    let result;
    
    switch (toolId) {
      case 'test/verify_s2do':
        result = await executeVerifyS2DO(params, sessionId, log);
        break;
        
      case 'test/simulate_copilot':
        result = await executeSimulateCoPilot(params, sessionId, log);
        break;
        
      case 'test/validate_data_access':
        result = await executeValidateDataAccess(params, sessionId, log);
        break;
        
      case 'test/log_result':
        result = await executeLogResult(params, sessionId, log);
        break;
        
      case 'test/generate_report':
        result = await executeGenerateReport(params, sessionId, log);
        break;
        
      default:
        throw new Error(`Tool implementation not found for: ${toolId}`);
    }
    
    send(ws, {
      type: 'tool_result',
      request_id: msg.request_id,
      tool_id: toolId,
      result
    });
    
    logEvent(log, 'tool_result_sent', { tool_id: toolId, success: true });
    
  } catch (err) {
    console.error(`Error executing tool ${toolId}:`, err);
    logEvent(log, 'tool_execution_error', { tool_id: toolId, error: err.message });
    
    send(ws, {
      type: 'error',
      request_id: msg.request_id,
      error: { code: 'tool_execution_error', message: err.message }
    });
  }
}

// Prompt Handling
function handleListPrompts(ws, msg, log) {
  logEvent(log, 'list_prompts_requested');
  
  send(ws, {
    type: 'prompts_list',
    request_id: msg.request_id,
    prompts: MCP_CONFIG.prompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description
    }))
  });
  
  logEvent(log, 'prompts_list_sent', { count: MCP_CONFIG.prompts.length });
}

function handleRenderPrompt(ws, msg, log) {
  const promptId = msg.prompt_id;
  const params = msg.parameters || {};
  
  logEvent(log, 'render_prompt_requested', { prompt_id: promptId });
  
  // Find the requested prompt
  const prompt = MCP_CONFIG.prompts.find(p => p.id === promptId);
  
  if (!prompt) {
    logEvent(log, 'prompt_not_found', { prompt_id: promptId });
    return send(ws, {
      type: 'error',
      request_id: msg.request_id,
      error: { code: 'prompt_not_found', message: `Prompt not found: ${promptId}` }
    });
  }
  
  // Replace placeholders in the prompt content
  let content = { prompt: prompt.content.prompt };
  
  // Replace placeholders with parameter values
  Object.keys(params).forEach(key => {
    const placeholder = `{${key}}`;
    content.prompt = content.prompt.replace(new RegExp(placeholder, 'g'), params[key]);
  });
  
  send(ws, {
    type: 'prompt_content',
    request_id: msg.request_id,
    prompt_id: promptId,
    content
  });
  
  logEvent(log, 'prompt_content_sent', { prompt_id: promptId });
}

// Tool Implementations
async function executeVerifyS2DO(params, sessionId, log) {
  logEvent(log, 'verify_s2do_started', params);
  
  // Validate required parameters
  if (!params.stem || !params.action || !params.initiator || !params.expected_result) {
    throw new Error('Missing required parameters for S2DO verification');
  }
  
  // Perform verification logic
  const verificationResult = verifyS2DOAction(params);
  
  // Store the test result
  const session = activeSessions.get(sessionId);
  if (session) {
    const testId = `s2do_verification_${Date.now()}`;
    session.testResults.set(testId, {
      type: 'verify_s2do',
      params,
      result: verificationResult,
      timestamp: new Date().toISOString()
    });
  }
  
  logEvent(log, 'verify_s2do_completed', { result: verificationResult });
  
  return {
    verification_id: crypto.randomUUID(),
    stem: params.stem,
    action: params.action,
    initiator: params.initiator,
    result: verificationResult.result,
    validation_messages: verificationResult.messages,
    expected_result_matched: verificationResult.result === params.expected_result,
    timestamp: new Date().toISOString()
  };
}

function verifyS2DOAction(params) {
  // This is a simplified implementation for testing purposes
  // In a real implementation, this would perform actual validation
  
  const { stem, action, initiator, expected_result } = params;
  
  // Define validation rules
  const validStems = ['Project', 'Document', 'Task', 'Flight', 'Learning', 'Rewards'];
  const validActions = {
    'Project': ['Create', 'Update', 'Close', 'ResourceAssign'],
    'Document': ['Create', 'Update', 'Share', 'Approve'],
    'Task': ['Create', 'Assign', 'Complete', 'Verify'],
    'Flight': ['Prepare', 'Execute', 'Complete'],
    'Learning': ['Register', 'Distribute'],
    'Rewards': ['Calculate', 'Allocate', 'Distribute']
  };
  
  // Validate stem
  if (!validStems.includes(stem)) {
    return {
      result: 'validation_error',
      messages: [`Invalid stem: ${stem}. Valid stems are: ${validStems.join(', ')}`]
    };
  }
  
  // Validate action
  if (!validActions[stem].includes(action)) {
    return {
      result: 'validation_error',
      messages: [`Invalid action: ${action} for stem: ${stem}. Valid actions are: ${validActions[stem].join(', ')}`]
    };
  }
  
  // Validate initiator
  const validInitiators = ['co-pilot', 'dr-claude-02', 'flight_engineer', 'purser', 'pilot'];
  if (!validInitiators.includes(initiator)) {
    return {
      result: 'auth_error',
      messages: [`Unauthorized initiator: ${initiator}`]
    };
  }
  
  // If expected_result is specified as an error, return that error
  if (expected_result === 'validation_error') {
    return {
      result: 'validation_error',
      messages: ['Simulated validation error as requested']
    };
  } else if (expected_result === 'auth_error') {
    return {
      result: 'auth_error',
      messages: ['Simulated authorization error as requested']
    };
  }
  
  // Everything is valid
  return {
    result: 'success',
    messages: ['S2DO action validated successfully']
  };
}

async function executeSimulateCoPilot(params, sessionId, log) {
  logEvent(log, 'simulate_copilot_started', params);
  
  // Validate required parameters
  if (!params.scenario_id || !params.user_input) {
    throw new Error('Missing required parameters for Co-Pilot simulation');
  }
  
  // Find the scenario
  const resourceContent = MCP_CONFIG.resources.find(r => r.id === 'test/copilot_scenarios')?.content;
  
  if (!resourceContent || !resourceContent.scenarios) {
    throw new Error('Co-Pilot scenarios resource not found');
  }
  
  const scenario = resourceContent.scenarios.find(s => s.id === params.scenario_id);
  
  if (!scenario) {
    throw new Error(`Scenario not found: ${params.scenario_id}`);
  }
  
  // Determine step
  const stepIndex = params.step_index || 0;
  const step = scenario.steps[stepIndex] || 'Unknown step';
  
  // Generate a simulated Co-Pilot response
  const response = generateCoPilotResponse(params.user_input, scenario, step, params.user_context);
  
  // Store the test result
  const session = activeSessions.get(sessionId);
  if (session) {
    const testId = `copilot_simulation_${Date.now()}`;
    session.testResults.set(testId, {
      type: 'simulate_copilot',
      params,
      response,
      timestamp: new Date().toISOString()
    });
  }
  
  logEvent(log, 'simulate_copilot_completed', { scenario_id: params.scenario_id, step });
  
  return {
    scenario_id: params.scenario_id,
    scenario_name: scenario.name,
    step: step,
    step_index: stepIndex,
    user_input: params.user_input,
    response: response,
    next_step_index: stepIndex < scenario.steps.length - 1 ? stepIndex + 1 : null,
    timestamp: new Date().toISOString()
  };
}

function generateCoPilotResponse(userInput, scenario, step, userContext = {}) {
  // This is a simplified implementation for testing purposes
  // In a real implementation, this would generate a more sophisticated response
  
  // Create personalized greeting based on context if available
  const greeting = userContext.name ? `Hello ${userContext.name}, ` : 'Hello, ';
  
  // Generate response based on scenario and step
  switch (scenario.id) {
    case 'client_onboarding':
      if (step.includes('greeting')) {
        return `${greeting}I'm your Co-Pilot and I'll be guiding you through our onboarding process. Let's get started by understanding your specific needs and goals. Could you tell me a bit about what you're looking to achieve?`;
      } else if (step.includes('collection')) {
        return `Thank you for sharing that information. I've recorded these details in your profile. Now, I'd like to learn more about your timeline and budget constraints. This will help me tailor our services to your specific situation.`;
      } else if (step.includes('assessment')) {
        return `Based on what you've shared, I'm analyzing which of our services would best meet your needs. Your priorities seem to be ${userInput.includes('quickly') ? 'speed and efficiency' : 'thoroughness and quality'}. Is that correct?`;
      } else if (step.includes('recommendation')) {
        return `After analyzing your needs, I recommend our ${userInput.includes('budget') ? 'Standard' : 'Premium'} service package, which includes all the key features you'll need. Would you like me to explain the specific benefits included?`;
      } else if (step.includes('plan')) {
        return `I've created an initial plan for your review. It includes a timeline, resource allocation, and key milestones. Once you approve this plan, we can begin implementation immediately.`;
      } else {
        return `Let's outline the next steps. I'll schedule an initial kickoff meeting, prepare the necessary resources, and set up your project workspace. You'll receive a confirmation email with all these details within the next hour.`;
      }
      
    case 'project_creation':
      if (step.includes('requirement')) {
        return `${greeting}let's gather all the requirements for your new project. Could you describe the main objectives and any specific deliverables you're expecting?`;
      } else if (step.includes('assessment')) {
        return `Thank you for that information. Based on your project scope, I estimate we'll need a team of 3-4 specialists, including expertise in ${userInput.includes('data') ? 'data analysis and visualization' : 'development and design'}. Does that align with your expectations?`;
      } else if (step.includes('timeline')) {
        return `I've drafted a timeline for your project with an estimated completion date of ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}. This includes buffer time for reviews and revisions. Does this timeline work for you?`;
      } else if (step.includes('milestone')) {
        return `I've identified the following key milestones for your project: initial design completion, prototype development, testing phase, and final delivery. Would you like to add or modify any of these milestones?`;
      } else if (step.includes('assignment')) {
        return `I'll now assign the appropriate squadron to handle your project. Based on the requirements, I recommend Squadron ${userInput.includes('complex') ? '3' : '2'} which specializes in ${userInput.includes('complex') ? 'complex, full-stack solutions' : 'implementation and integration'}.`;
      } else {
        return `Your project has been successfully initiated. You can track progress through your dashboard, and I'll provide regular updates. The first status report will be available in 48 hours. Is there anything specific you'd like me to focus on in these updates?`;
      }
      
    default:
      return `I'm processing your request: "${userInput}". This is a simulated Co-Pilot response for testing purposes. In a production environment, you would receive a contextually appropriate response based on your specific situation and needs.`;
  }
}

async function executeValidateDataAccess(params, sessionId, log) {
  logEvent(log, 'validate_data_access_started', params);
  
  // Validate required parameters
  if (!params.data_type || !params.access_context || params.expected_access === undefined) {
    throw new Error('Missing required parameters for data access validation');
  }
  
  // Perform data access validation
  const validationResult = validateDataAccess(params.data_type, params.access_context);
  
  // Check if the result matches expectations
  const expectationMet = validationResult.access === params.expected_access;
  
  // Store the test result
  const session = activeSessions.get(sessionId);
  if (session) {
    const testId = `data_access_validation_${Date.now()}`;
    session.testResults.set(testId, {
      type: 'validate_data_access',
      params,
      result: validationResult,
      expectationMet,
      timestamp: new Date().toISOString()
    });
  }
  
  logEvent(log, 'validate_data_access_completed', { 
    data_type: params.data_type, 
    access: validationResult.access,
    expectation_met: expectationMet
  });
  
  return {
    validation_id: crypto.randomUUID(),
    data_type: params.data_type,
    access_granted: validationResult.access,
    reasons: validationResult.reasons,
    expected_access: params.expected_access,
    expectation_met: expectationMet,
    timestamp: new Date().toISOString()
  };
}

function validateDataAccess(dataType, accessContext) {
  // This is a simplified implementation for testing purposes
  // In a real implementation, this would perform actual access control checks
  
  // Define access control rules
  const accessRules = {
    'client_profile': {
      'co-pilot': true,
      'squadron_pilot': false,
      'admin': true
    },
    'project_data': {
      'co-pilot': true,
      'squadron_pilot': true,
      'admin': true
    },
    'financial_data': {
      'co-pilot': false,
      'squadron_pilot': false,
      'admin': true
    },
    'system_logs': {
      'co-pilot': false,
      'squadron_pilot': false,
      'admin': true
    }
  };
  
  // Get the role from access context
  const role = accessContext.role || 'unknown';
  
  // Check if the data type exists in the rules
  if (!accessRules[dataType]) {
    return {
      access: false,
      reasons: [`Unknown data type: ${dataType}`]
    };
  }
  
  // Check if the role is defined for this data type
  if (accessRules[dataType][role] === undefined) {
    return {
      access: false,
      reasons: [`Unknown role: ${role} for data type: ${dataType}`]
    };
  }
  
  // Determine access based on role
  const access = accessRules[dataType][role];
  
  return {
    access,
    reasons: access 
      ? [`${role} has permission to access ${dataType}`] 
      : [`${role} does not have permission to access ${dataType}`]
  };
}

async function executeLogResult(params, sessionId, log) {
  logEvent(log, 'log_result_started', params);
  
  // Validate required parameters
  if (!params.test_id || !params.result) {
    throw new Error('Missing required parameters for logging test result');
  }
  
  // Store the test result
  const testResult = {
    test_id: params.test_id,
    result: params.result,
    details: params.details || {},
    notes: params.notes || '',
    timestamp: new Date().toISOString()
  };
  
  // Add to global test results
  testResults.set(params.test_id, testResult);
  
  // Add to session test results
  const session = activeSessions.get(sessionId);
  if (session) {
    session.testResults.set(params.test_id, testResult);
  }
  
  // Log the test result to the log file
  logEvent(log, 'test_result_logged', { 
    test_id: params.test_id,
    result: params.result
  });
  
  // Write to test results file
  const resultsPath = path.join(LOG_DIRECTORY, `test_result_${params.test_id}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(testResult, null, 2));
  
  return {
    test_id: params.test_id,
    result: params.result,
    logged: true,
    file_path: resultsPath,
    timestamp: testResult.timestamp
  };
}

async function executeGenerateReport(params, sessionId, log) {
  logEvent(log, 'generate_report_started', params);
  
  // Validate required parameters
  if (!params.format) {
    throw new Error('Missing required parameters for generating test report');
  }
  
  // Get test results to include in the report
  let resultsToInclude = [];
  
  if (params.test_ids && params.test_ids.length > 0) {
    // Include only specified test IDs
    resultsToInclude = params.test_ids
      .map(id => testResults.get(id))
      .filter(result => result !== undefined);
  } else {
    // Include all test results
    resultsToInclude = Array.from(testResults.values());
  }
  
  // Generate the report
  const report = generateTestReport(resultsToInclude, params.format, params.include_metrics);
  
  // Write the report to a file
  const reportId = crypto.randomUUID();
  const reportPath = path.join(LOG_DIRECTORY, `test_report_${reportId}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logEvent(log, 'generate_report_completed', { 
    report_id: reportId,
    format: params.format,
    test_count: resultsToInclude.length
  });
  
  return {
    report_id: reportId,
    format: params.format,
    test_count: resultsToInclude.length,
    summary: {
      pass: resultsToInclude.filter(r => r.result === 'pass').length,
      fail: resultsToInclude.filter(r => r.result === 'fail').length,
      partial: resultsToInclude.filter(r => r.result === 'partial').length,
      inconclusive: resultsToInclude.filter(r => r.result === 'inconclusive').length
    },
    file_path: reportPath,
    timestamp: new Date().toISOString()
  };
}

function generateTestReport(testResults, format, includeMetrics) {
  // Calculate statistics
  const testStats = {
    total: testResults.length,
    pass: testResults.filter(r => r.result === 'pass').length,
    fail: testResults.filter(r => r.result === 'fail').length,
    partial: testResults.filter(r => r.result === 'partial').length,
    inconclusive: testResults.filter(r => r.result === 'inconclusive').length
  };
  
  // Calculate success rate
  testStats.success_rate = testStats.total > 0 
    ? (testStats.pass / testStats.total) * 100 
    : 0;
  
  // Generate report based on format
  switch (format) {
    case 'summary':
      return {
        generated_at: new Date().toISOString(),
        statistics: testStats,
        conclusion: testStats.success_rate >= 90 
          ? 'Testing successful' 
          : testStats.success_rate >= 70 
            ? 'Testing partially successful with issues' 
            : 'Testing failed with significant issues'
      };
      
    case 'detailed':
      return {
        generated_at: new Date().toISOString(),
        statistics: testStats,
        test_results: testResults.map(result => ({
          test_id: result.test_id,
          result: result.result,
          timestamp: result.timestamp,
          notes: result.notes
        })),
        metrics: includeMetrics ? generateMetrics(testResults) : undefined,
        conclusion: testStats.success_rate >= 90 
          ? 'Testing successful' 
          : testStats.success_rate >= 70 
            ? 'Testing partially successful with issues' 
            : 'Testing failed with significant issues'
      };
      
    case 'technical':
      return {
        generated_at: new Date().toISOString(),
        statistics: testStats,
        test_results: testResults,
        metrics: includeMetrics ? generateMetrics(testResults) : undefined,
        issues: testResults
          .filter(r => r.result === 'fail' || r.result === 'partial')
          .map(result => ({
            test_id: result.test_id,
            result: result.result,
            details: result.details,
            notes: result.notes
          }))
      };
      
    case 'executive':
      return {
        generated_at: new Date().toISOString(),
        summary: `Testing completed with ${testStats.pass} passed, ${testStats.fail} failed, and ${testStats.partial} partially successful tests.`,
        success_rate: `${testStats.success_rate.toFixed(1)}%`,
        status: testStats.success_rate >= 90 
          ? 'GREEN' 
          : testStats.success_rate >= 70 
            ? 'YELLOW' 
            : 'RED',
        key_issues: testResults
          .filter(r => r.result === 'fail')
          .slice(0, 3)
          .map(result => result.notes || result.test_id),
        conclusion: testStats.success_rate >= 90 
          ? 'System is performing as expected and ready for next phase' 
          : testStats.success_rate >= 70 
            ? 'System is functioning with minor issues that require attention' 
            : 'System has significant issues that must be addressed before proceeding'
      };
      
    default:
      return {
        generated_at: new Date().toISOString(),
        statistics: testStats,
        test_results: testResults.map(result => ({
          test_id: result.test_id,
          result: result.result
        }))
      };
  }
}

function generateMetrics(testResults) {
  // This is a simplified implementation for testing purposes
  // In a real implementation, this would calculate actual metrics
  
  // Calculate timestamps
  const timestamps = testResults
    .map(r => new Date(r.timestamp).getTime())
    .sort((a, b) => a - b);
    
  const firstTest = timestamps[0];
  const lastTest = timestamps[timestamps.length - 1];
  
  // Calculate duration in seconds
  const totalDuration = (lastTest - firstTest) / 1000;
  
  // Calculate tests per minute
  const testsPerMinute = testResults.length / (totalDuration / 60);
  
  return {
    duration_seconds: totalDuration,
    tests_per_minute: testsPerMinute,
    average_time_between_tests: totalDuration / (testResults.length - 1),
    first_test_timestamp: new Date(firstTest).toISOString(),
    last_test_timestamp: new Date(lastTest).toISOString()
  };
}

// Logging Functions
function initializeSessionLog(sessionId) {
  const logPath = path.join(LOG_DIRECTORY, `session_${sessionId}.log`);
  const stream = fs.createWriteStream(logPath, { flags: 'a' });
  
  return {
    sessionId,
    path: logPath,
    stream,
    entries: []
  };
}

function logEvent(log, event, data = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    event,
    ...data
  };
  
  // Add to in-memory log
  log.entries.push(entry);
  
  // Write to log file
  log.stream.write(JSON.stringify(entry) + '\n');
}

function finalizeSessionLog(sessionId, log) {
  // Close the log file stream
  log.stream.end();
  
  // Write summary
  const summaryPath = path.join(LOG_DIRECTORY, `session_${sessionId}_summary.json`);
  const summary = {
    sessionId,
    start_time: log.entries[0]?.timestamp,
    end_time: new Date().toISOString(),
    event_count: log.entries.length,
    events_by_type: log.entries.reduce((counts, entry) => {
      counts[entry.event] = (counts[entry.event] || 0) + 1;
      return counts;
    }, {})
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
}

// Helper function to send messages
function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});