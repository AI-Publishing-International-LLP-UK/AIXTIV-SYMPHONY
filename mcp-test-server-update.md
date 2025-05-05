# MCP Test Server Update for Firebase-GoDaddy Integration

This guide explains how to update the MCP test server to include integration with the Firebase-GoDaddy domain management pipeline.

## Overview

The updated MCP server will include tools for domain management that leverage the existing Firebase-GoDaddy pipeline from the domain-management directory. This integration allows for testing domain-related operations through the MCP protocol.

## Update Steps

### 1. Add Domain Integration Module

1. The `mcp-domain-integration.js` file has been created to provide the domain management integration functionality.
2. This module exports resources, tools, and prompts related to domain management, as well as the execution functions for domain operations.

### 2. Update MCP Test Server Configuration

Update the `mcp-testing-tools.json` file to include the domain management components:

```javascript
// Add to the "resources" array
...resources,
...require('./mcp-domain-integration').resources,

// Add to the "tools" array
...tools,
...require('./mcp-domain-integration').tools,

// Add to the "prompts" array
...prompts,
...require('./mcp-domain-integration').prompts,
```

### 3. Modify the MCP Test Server Implementation

Update the `mcp-test-server.js` file to include domain management tools:

1. Add the domain integration import:

```javascript
// Import domain management integration
const domainIntegration = require('./mcp-domain-integration');
```

2. Update the `handleExecuteTool` function to include domain management tools:

```javascript
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
      // Existing tools...
      
      // Domain management tools
      case 'domain/verify':
        result = await domainIntegration.executeDomainVerification(params, sessionId, log);
        break;
        
      case 'domain/register':
        result = await domainIntegration.executeDomainRegistration(params, sessionId, log);
        break;
        
      case 'domain/status':
        result = await domainIntegration.executeDomainStatusCheck(params, sessionId, log);
        break;
      
      default:
        throw new Error(`Tool implementation not found for: ${toolId}`);
    }
    
    // ...rest of the function
  }
}
```

### 4. Ensure Environment Configuration

The domain management tools require certain environment variables to function properly:

```
FIREBASE_PROJECT_ID=api-for-warp-drive
GODADDY_API_KEY=your_godaddy_api_key
GODADDY_API_SECRET=your_godaddy_api_secret
```

Add these to the `.env` file and the PM2 ecosystem configuration.

## Testing the Domain Management Integration

Once the updates are deployed, you can test the domain management integration using Claude Code:

1. Connect to the MCP server:
   ```
   claude config mcp add-integration
   ```

2. Use Claude Code to test domain verification:
   ```
   I'd like to verify a domain using the MCP server. Can you help me check the status of "example.com" on the Firebase site "my-site"?
   ```

3. Test domain registration:
   ```
   I need to register a new domain "newexample.com" with our Firebase hosting. Can you help me with that?
   ```

## Security Considerations

1. The domain management tools involve sensitive operations that require proper authorization.
2. In a production environment, ensure that:
   - API keys and secrets are securely stored and not exposed
   - Access to domain management tools is restricted to authorized users
   - All domain operations are properly logged and audited

## Troubleshooting

If you encounter issues with the domain management integration:

1. Check that the required environment variables are set correctly
2. Verify that the Firebase and GoDaddy API credentials are valid
3. Check the server logs for detailed error messages
4. Ensure the Firebase-GoDaddy pipeline components are functioning correctly independently

## Next Steps

After deploying the updated MCP server with domain management capabilities:

1. Create comprehensive test cases for domain operations
2. Document the domain management tools for users
3. Consider adding more advanced domain management features as needed
4. Implement monitoring for domain operations to track usage and issues