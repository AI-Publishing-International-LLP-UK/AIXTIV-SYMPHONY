# MCP Server Deployment Guide for DrClaude.live

This guide provides instructions for deploying the MCP (Model Context Protocol) server to DrClaude.live. The server provides both testing capabilities and domain management integration for the ASOOS system.

## Prerequisites

Before deploying, ensure you have the following:

1. SSH access to the DrClaude.live server (typically requires SSH key authentication)
2. GoDaddy API credentials (API Key and Secret)
3. Firebase service account key file (`service-account-key.json`)
4. The target server has:
   - Node.js 14 or higher installed
   - NGINX installed
   - Root or sudo access

## Deployment Steps

### 1. Configure Environment Variables

Set the GoDaddy API credentials as environment variables before running the deployment script:

```bash
export GODADDY_API_KEY="your_godaddy_api_key"
export GODADDY_API_SECRET="your_godaddy_api_secret"
```

### 2. Run the Deployment Script

Run the deployment script from the `mcp-deploy` directory:

```bash
cd /Users/as/asoos/mcp-deploy
bash deploy.sh
```

The script performs the following tasks:

- Creates necessary directories on the server
- Copies all required files to the server
- Sets up environment variables
- Installs dependencies
- Configures NGINX as a reverse proxy
- Sets up SSL with Let's Encrypt
- Starts the MCP server with PM2

### 3. Verify the Deployment

After deployment, verify that the server is running correctly:

1. Check the server status:

   ```bash
   ssh root@drclaude.live "cd /root/mcp-server && pm2 status mcp-server"
   ```

2. Test the WebSocket connection:

   ```bash
   wscat -c wss://drclaude.live -H "Authorization: Bearer oauth2"
   ```

3. Verify HTTPS access:

   ```
   curl -I https://drclaude.live
   ```

## Connecting Claude Code to the MCP Server

Once the server is deployed, configure Claude Code to connect to it:

1. Open Claude Code
2. Run the following command to add the MCP integration:

   ```
   /mcp add SuperClaudeX wss://drclaude.live oauth2
   ```

3. Verify that the integration is working:

   ```
   /mcp list
   ```

If DNS propagation is delayed, you can use the server's IP address directly:

```
/mcp add SuperClaudeX wss://SERVER_IP_ADDRESS:443 oauth2
```

Note: Replace SERVER_IP_ADDRESS with the actual IP address of your server.

## Server Components

The MCP server consists of the following key components:

1. **WebSocket Server**: Handles MCP protocol communication
2. **HTTP Server**: Provides health check endpoint and OAuth2 callbacks
3. **OAuth2 Authentication**: Uses GCP service account for authentication
4. **Testing Tools**: Simulates and tests S2DO verification and Co-Pilot interactions
5. **Domain Management Integration**: Connects to Firebase and GoDaddy for domain operations
6. **PM2 Process Manager**: Ensures the server runs continuously
7. **NGINX Reverse Proxy**: Handles SSL termination and WebSocket forwarding

## Authentication

The MCP server uses OAuth2 authentication with Google Cloud Platform. There are two authentication methods supported:

1. **Standard OAuth2 Token**: The server accepts standard OAuth2 tokens issued by Google Cloud Platform. These tokens should be included in the WebSocket connection request with the `Authorization: Bearer <token>` header.

2. **Static Token**: For Claude Code connections, a static token 'oauth2' is supported, which should be included in the WebSocket connection request with the `Authorization: Bearer oauth2` header.

### Service Account Impersonation

The server is configured to use service account impersonation for the `drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com` account. This allows the MCP server to:

1. Generate tokens with the permissions of the impersonated service account
2. Access Firebase and GoDaddy resources using these credentials
3. Perform domain management operations securely

The service account key file is stored in the `credentials/service-account.json` path on the server. Ensure this file is kept secure and has the proper permissions.

## Server Endpoints

The MCP server exposes the following endpoints:

1. **WebSocket Endpoint** (`wss://drclaude.live`):
   - Main WebSocket connection for MCP protocol
   - Requires OAuth2 authentication via Authorization header

2. **Health Check** (`https://drclaude.live/health`):
   - HTTP endpoint returning server status
   - Useful for monitoring and testing server availability

3. **OAuth2 Callback** (`https://drclaude.live/oauth2/callback`):
   - Used for OAuth2 authentication flow
   - Handles OAuth2 code exchange (for future use)

### Handling DNS Propagation Delays

The MCP server is configured to use the `drclaude.live` domain. If you experience DNS propagation delays, here are alternative approaches:

1. **IP Address Access**:
   - Find the server's IP address
   - Connect directly using the IP address: `wss://[IP_ADDRESS]:443`
   - Example: `/mcp add SuperClaudeX wss://123.45.67.89:443 oauth2`

2. **Local hosts File Modification**:
   - Add an entry in your local hosts file pointing drclaude.live to the server IP
   - On macOS/Linux: `sudo nano /etc/hosts`
   - Add: `123.45.67.89 drclaude.live`
   - This allows local testing before DNS propagation completes

3. **Subdomain Alternative**:
   - If you have an available subdomain that points to the same server
   - Modify NGINX configuration to include the subdomain
   - Connect using that subdomain instead

## Troubleshooting

If you encounter issues during deployment:

1. **Server Connection Issues**:
   - Verify that port 443 (HTTPS) is open on the server firewall
   - Check NGINX configuration with `nginx -t`
   - Test the health endpoint: `curl https://drclaude.live/health`

2. **WebSocket Connection Issues**:
   - Verify that the WebSocket server is running: `pm2 logs mcp-server`
   - Check for errors in the NGINX error log: `/var/log/nginx/error.log`
   - Test WebSocket connectivity: `wscat -c wss://drclaude.live -H "Authorization: Bearer oauth2"`
   - If DNS propagation is delayed, test with IP address: `wscat -c wss://SERVER_IP_ADDRESS:443 -H "Authorization: Bearer oauth2"`

3. **Domain Management Issues**:
   - Verify GoDaddy API credentials are correctly set
   - Check the service account key file is correctly placed
   - Look for Firebase authentication errors in the logs

4. **OAuth2 Authentication Issues**:
   - Verify the service account file exists at `/root/mcp-server/credentials/service-account.json`
   - Check the logs for authentication errors: `pm2 logs mcp-server | grep -i "auth\|token\|oauth"`
   - Verify the service account has the necessary permissions in GCP
   - For Claude Code connections, ensure you're using the 'oauth2' token in the URL
   - To test token generation, connect to the server and run:

     ```
     cd /root/mcp-server
     node -e "const oauth = require('./oauth2-config'); oauth.initialize().then(() => oauth.getAccessToken().then(token => console.log('Token:', token)))"
     ```

## Maintenance

To maintain the server:

1. **View logs**:

   ```bash
   ssh root@drclaude.live "cd /root/mcp-server && pm2 logs mcp-server"
   ```

2. **Restart the server**:

   ```bash
   ssh root@drclaude.live "cd /root/mcp-server && pm2 restart mcp-server"
   ```

3. **Update the server**:
   - Make changes locally
   - Run the deployment script again
