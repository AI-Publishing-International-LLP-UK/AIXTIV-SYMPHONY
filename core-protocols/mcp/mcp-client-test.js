#!/usr/bin/env node
// MCP Client Test Script
// This script tests the MCP client integration

const { connect } = require('./index');

// Test MCP client
async function testMCP() {
  console.log('Testing MCP Client Integration');
  console.log('==============================');

  try {
    console.log('\nConnecting to MCP server...');
    const client = await connect({
      host: 'localhost',
      port: process.env.PORT || 3000,
    });

    console.log(`✅ Connected to MCP server (Session ID: ${client.sessionId})`);

    // Test resource listing
    console.log('\nListing resources...');
    const resources = await client.listResources();
    console.log(`✅ Received ${resources.resources.length} resources`);

    // Test tool listing
    console.log('\nListing tools...');
    const tools = await client.listTools();
    console.log(`✅ Received ${tools.tools.length} tools`);

    // Test prompt listing
    console.log('\nListing prompts...');
    const prompts = await client.listPrompts();
    console.log(`✅ Received ${prompts.prompts.length} prompts`);

    // Test resource fetch
    if (resources.resources.length > 0) {
      const resourceId = resources.resources[0].id;
      console.log(`\nFetching resource: ${resourceId}`);
      const resource = await client.fetchResource(resourceId);
      console.log(`✅ Resource fetched successfully`);
    }

    // Test S2DO tool execution
    console.log('\nExecuting S2DO verify tool...');
    const s2doResult = await client.executeTool('s2do/verify', {
      stem: 'Task',
      action: 'Create',
      initiator: 'mcp-client-test',
    });
    console.log(
      `✅ S2DO verification created: ${s2doResult.result.verification_id}`
    );

    // Test prompt rendering
    if (prompts.prompts.length > 0) {
      const promptId = prompts.prompts[0].id;
      console.log(`\nRendering prompt: ${promptId}`);
      const prompt = await client.renderPrompt(promptId, {
        context: 'MCP Client Test',
        requirements: 'Testing the MCP client integration',
        domain: 'Testing',
      });
      console.log(`✅ Prompt rendered successfully`);
    }

    console.log('\nClosing connection...');
    client.close();
    console.log('✅ Connection closed');

    console.log('\n✅ All tests completed successfully');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
testMCP().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
