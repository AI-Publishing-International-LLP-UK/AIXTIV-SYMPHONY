#!/bin/bash
# MCP Server Deployment Script

# Configuration
SERVER="drclaude.live"  # Back to domain name
USERNAME="root"  # Replace with your actual username
REMOTE_DIR="/root/mcp-server"  # Replace with your preferred directory
SSH_KEY_PATH="$HOME/.ssh/google_compute_engine"  # Using Google Cloud compute engine key
SSH_PORT="22"  # Adjust if using non-standard port

# SSH and SCP command options
SSH_OPTS="-o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no"
SCP_OPTS="-o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no"
if [ -f "$SSH_KEY_PATH" ]; then
  SSH_OPTS="$SSH_OPTS -i $SSH_KEY_PATH"
  SCP_OPTS="$SCP_OPTS -i $SSH_KEY_PATH"
fi

# Ensure directory exists
echo "Creating directories..."
ssh $SSH_OPTS $USERNAME@$SERVER "mkdir -p $REMOTE_DIR/test_logs"
ssh $SSH_OPTS $USERNAME@$SERVER "mkdir -p $REMOTE_DIR/domain-management/scripts"
ssh $SSH_OPTS $USERNAME@$SERVER "mkdir -p $REMOTE_DIR/domain-management/config"

# Copy files to server
echo "Copying files to server..."
scp $SCP_OPTS -r package.json ecosystem.config.js mcp-test-server.js mcp-testing-tools.json mcp-domain-integration.js oauth2-config.js $USERNAME@$SERVER:$REMOTE_DIR/
scp $SCP_OPTS -r domain-management/scripts/* $USERNAME@$SERVER:$REMOTE_DIR/domain-management/scripts/
scp $SCP_OPTS -r domain-management/config/* $USERNAME@$SERVER:$REMOTE_DIR/domain-management/config/

# Create credentials directory and copy service account key
echo "Copying service account credentials..."
ssh $SSH_OPTS $USERNAME@$SERVER "mkdir -p $REMOTE_DIR/credentials"
scp $SCP_OPTS credentials/service-account.json $USERNAME@$SERVER:$REMOTE_DIR/credentials/

# Copy NGINX configuration
echo "Setting up NGINX configuration..."
scp $SCP_OPTS nginx-config $USERNAME@$SERVER:/tmp/mcp-nginx-config
ssh $SSH_OPTS $USERNAME@$SERVER "sudo mv /tmp/mcp-nginx-config /etc/nginx/sites-available/mcp-server && \
    sudo ln -sf /etc/nginx/sites-available/mcp-server /etc/nginx/sites-enabled/ && \
    sudo nginx -t && \
    sudo systemctl reload nginx"

# Install dependencies and start the server
echo "Installing dependencies and starting the server..."
echo "Setting up environment variables..."
ssh $SSH_OPTS $USERNAME@$SERVER "cd $REMOTE_DIR && \
    sed -i 's/{{GODADDY_API_KEY}}/'\"$GODADDY_API_KEY\"'/g' ecosystem.config.js && \
    sed -i 's/{{GODADDY_API_SECRET}}/'\"$GODADDY_API_SECRET\"'/g' ecosystem.config.js && \
    npm install && \
    npm install -g pm2 && \
    pm2 start ecosystem.config.js && \
    pm2 save && \
    pm2 startup"

# Set up SSL with Let's Encrypt
echo "Setting up SSL with Let's Encrypt..."
ssh $SSH_OPTS $USERNAME@$SERVER "sudo apt-get update && \
    sudo apt-get install -y certbot python3-certbot-nginx && \
    sudo certbot --nginx -d drclaude.live --non-interactive --agree-tos --email admin@drclaude.live"

echo "Deployment completed successfully!"