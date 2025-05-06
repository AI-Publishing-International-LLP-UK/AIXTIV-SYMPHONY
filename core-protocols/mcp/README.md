# ASOOS Master Control Program (MCP)

The Master Control Program (MCP) serves as the central control and orchestration system for the AIXTIV Orchestra Opus Operating System (ASOOS).

## Overview

The MCP provides a standardized interface for:

- S2DO blockchain integration
- Flight Management System (FMS) operations
- Agent orchestration and deployment
- Cross-component communication

## Configuration

The MCP is configured to work with:

- **GCP Region**: us-west1
- **Firebase Project**: api-for-warp-drive
- **Service Account**: drlucyutomation@api-for-warp-drive.iam.gserviceaccount.com

## Directory Structure

- `mcp-server.js` - Main MCP server implementation
- `mcp-test-server.js` - Testing version with additional capabilities
- `mcp-domain-integration.js` - Domain management extension
- `mcp-start.sh` - Server startup script
- `mcp-check-config.js` - Configuration verification
- `deploy/` - Deployment configuration and scripts

## Getting Started

1. Verify the MCP configuration:
   ```
   npm run check
   ```

2. Start the MCP server:
   ```
   npm start
   ```

3. Start the test server:
   ```
   npm run start:test
   ```

4. Deploy to production:
   ```
   npm run deploy
   ```

## MCP Protocol

The MCP implements a WebSocket-based protocol that allows clients to:

1. **Access resources**: Schemas, configurations, and shared data
2. **Execute tools**: S2DO verifications, flight management, domain operations
3. **Render prompts**: Dynamic agent prompts based on context

## Integration

The MCP is integrated with other ASOOS components:

- **VLS Solutions**: Dr. Sabina's Dream Commander, Dr. Lucy's solutions, etc.
- **Academy**: Learning environment and content delivery
- **Wing**: Agent orchestration and deployment
- **Integration Gateway**: External system connectivity