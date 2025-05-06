#!/usr/bin/env node
// Agent-Driven Execution Framework + MCP Integration Test
// This script tests the integration between the Agent-Driven Execution Framework and the MCP

const { connect } = require('./index');
const agentFramework = require('/Users/as/asoos/integration-gateway/agents/agent-driven-execution');

async function testAgentMCPIntegration() {
  console.log('Agent-Driven Execution Framework + MCP Integration Test');
  console.log('====================================================');

  try {
    // 1. Connect to MCP
    console.log('\n1. Connecting to MCP server...');
    const mcp = await connect({
      host: 'localhost',
      port: process.env.PORT || 3000,
    });
    console.log(`✅ Connected to MCP (Session ID: ${mcp.sessionId})`);

    // 2. Initialize Agent Framework components
    console.log('\n2. Initializing Agent Framework components...');
    const agentRegistry = new agentFramework.AgentRegistry();
    const capabilityRegistry = new agentFramework.CapabilityRegistry();
    const executionEngine = new agentFramework.ExecutionEngine();
    const securityService = new agentFramework.SecurityService();
    const blockchainApproval = new agentFramework.BlockchainApprovalService();
    const s2doGovernance = new agentFramework.S2DOGovernanceEngine();

    const framework = new agentFramework.AgentDrivenExecutionFramework(
      agentRegistry,
      capabilityRegistry,
      executionEngine,
      securityService,
      blockchainApproval,
      s2doGovernance
    );
    console.log('✅ Agent Framework initialized');

    // 3. Create a test workflow via MCP
    console.log('\n3. Creating a test workflow via MCP...');
    const s2doResult = await mcp.executeTool('s2do/verify', {
      stem: 'Task',
      action: 'Create',
      initiator: 'agent-driven-mcp-test',
      parameters: {
        name: 'Test MCP Integration',
        priority: 'high',
      },
    });
    console.log(
      `✅ S2DO verification created via MCP: ${s2doResult.result.verification_id}`
    );

    // 4. Create a test workflow via Agent Framework
    console.log('\n4. Creating a test workflow via Agent Framework...');
    const workflowDefinition = {
      id: 'test-workflow-' + Date.now(),
      name: 'MCP Integration Test Workflow',
      description: 'Test workflow for MCP integration',
      steps: [
        {
          id: 'step-1',
          name: 'Test Step',
          capabilities: ['TEST_CAPABILITY'],
          parameters: {},
        },
      ],
      securityPolicy: {
        executionConstraints: [],
      },
    };

    const workflow = await framework.createAgentWorkflow(workflowDefinition, {
      requestorId: 'test-user',
      purpose: 'MCP integration testing',
    });
    console.log(`✅ Agent workflow created: ${workflow.id}`);

    // 5. Initiate a flight via MCP
    console.log('\n5. Initiating a flight via MCP...');
    const flightResult = await mcp.executeTool('fms/initiate_flight', {
      mission: 'Test MCP Integration',
      squadron_id: 'test-squadron',
      priority: 'high',
    });
    console.log(
      `✅ Flight initiated via MCP: ${flightResult.result.flight_id}`
    );

    // 6. Update flight status via MCP
    console.log('\n6. Updating flight status via MCP...');
    const updateResult = await mcp.executeTool('fms/track_flight', {
      flight_id: flightResult.result.flight_id,
      status: 'in-progress',
      progress: 50,
      notes: 'Integration test in progress',
    });
    console.log(`✅ Flight updated via MCP: ${updateResult.result.flight_id}`);

    // 7. Close connections
    console.log('\n7. Closing connections...');
    mcp.close();
    console.log('✅ MCP connection closed');

    console.log('\n✅ All integration tests completed successfully');
  } catch (error) {
    console.error(`\n❌ Integration test failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Execute the test
if (require.main === module) {
  testAgentMCPIntegration().catch(err => {
    console.error('Integration test error:', err);
    process.exit(1);
  });
}

module.exports = {
  testAgentMCPIntegration,
};
