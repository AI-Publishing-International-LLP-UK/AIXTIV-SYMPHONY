# MCP Test Server Deployment Instructions for drclaude.live

These instructions detail how to deploy the MCP Test Server for ASOOS system testing.

## Prerequisites

- Node.js v14+ installed on the server
- SSH access to drclaude.live
- Domain pointed to the server IP
- Basic knowledge of Linux server administration

## Deployment Steps

### 1. Server Setup

1. SSH into the server:
   ```bash
   ssh user@drclaude.live
   ```

2. Create a directory for the application:
   ```bash
   mkdir -p ~/mcp-test-server
   cd ~/mcp-test-server
   ```

3. Install PM2 (process manager) globally:
   ```bash
   npm install -g pm2
   ```

### 2. Upload Configuration Files

Transfer the following files to the server:

1. `mcp-testing-tools.json` - Contains the MCP resource and tool definitions
2. `mcp-test-server.js` - The MCP WebSocket server implementation

You can use SCP or SFTP to transfer these files:
```bash
scp mcp-testing-tools.json user@drclaude.live:~/mcp-test-server/
scp mcp-test-server.js user@drclaude.live:~/mcp-test-server/
```

### 3. Install Dependencies

On the server, install required dependencies:

```bash
cd ~/mcp-test-server
npm init -y
npm install ws crypto-js
```

### 4. Create Environment Configuration

Create a `.env` file with configuration parameters:

```bash
cat > .env << 'EOF'
PORT=3000
AUTH_TOKEN=oauth2
EOF
```

### 5. Configure PM2 for Process Management

Create a PM2 ecosystem configuration file:

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "mcp-test-server",
    script: "mcp-test-server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      AUTH_TOKEN: "oauth2"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
EOF
```

### 6. Set Up NGINX as Reverse Proxy (Optional but Recommended)

1. Install NGINX if not already installed:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create an NGINX configuration for the MCP server:
   ```bash
   sudo nano /etc/nginx/sites-available/mcp-test-server
   ```

3. Add the following configuration:
   ```
   server {
     listen 80;
     server_name drclaude.live;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
     }
   }
   ```

4. Enable the site and restart NGINX:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mcp-test-server /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 7. Set Up SSL with Let's Encrypt

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d drclaude.live
   ```

3. Follow the prompts to complete the SSL setup.

### 8. Start the MCP Test Server

Start the server using PM2:

```bash
cd ~/mcp-test-server
pm2 start ecosystem.config.js
```

Ensure the server starts automatically on reboot:

```bash
pm2 save
pm2 startup
```

### 9. Create Log Directory

Create a directory for test logs:

```bash
mkdir -p ~/mcp-test-server/test_logs
chmod 755 ~/mcp-test-server/test_logs
```

### 10. Verify Deployment

Test that the server is running correctly:

```bash
curl -I https://drclaude.live
```

You should receive a 101 Switching Protocols response for WebSocket connections, or a 400 Bad Request for regular HTTP requests (which is expected as this is a WebSocket server).

## Connecting to the MCP Test Server

Once deployed, you can connect to the MCP server from Claude Code using:

```
claude config mcp add-integration
```

With the following configuration:
- Name: ASOOS-Test
- MCP Server URL: wss://drclaude.live
- Type: Websocket Stream
- Authentication: Bearer oauth2

## Testing the Connection

To test the connection, run:

```
claude mcp
```

This should show the ASOOS-Test integration as available.

## Monitoring and Maintenance

- View server logs: `pm2 logs mcp-test-server`
- Restart server: `pm2 restart mcp-test-server`
- Stop server: `pm2 stop mcp-test-server`
- View detailed metrics: `pm2 monit`

## Accessing Test Logs

Test logs are stored in the `~/mcp-test-server/test_logs` directory. You can access them via SFTP or by using commands like:

```bash
ls -la ~/mcp-test-server/test_logs
cat ~/mcp-test-server/test_logs/session_XXXX.log
```

## Troubleshooting

If you encounter issues with the MCP server:

1. Check server logs: `pm2 logs mcp-test-server`
2. Verify the service is running: `pm2 status`
3. Check NGINX configuration: `sudo nginx -t`
4. Test WebSocket connectivity using a tool like wscat:
   ```bash
   npm install -g wscat
   wscat -c wss://drclaude.live -H "Authorization: Bearer oauth2"
   ```