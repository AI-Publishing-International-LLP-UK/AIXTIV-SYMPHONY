#!/bin/bash
# MCP Activation Script
# This script prepares all necessary components for MCP production deployment

set -e  # Exit on error

echo "ASOOS MCP Activation"
echo "===================="

# Check if running as root or with sudo (needed for system-level operations)
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Warning: This script should ideally be run with sudo for system-level operations"
  echo "   Some operations may fail without sufficient permissions"
  echo ""
fi

# 1. Ensure directories exist
echo "1. Creating necessary directories..."
mkdir -p contracts
mkdir -p logs
mkdir -p test_logs
mkdir -p deploy/credentials

# 2. Install dependencies
echo "2. Installing dependencies..."
npm install

# 3. Setup environment for testing
echo "3. Setting up environment for testing..."

# Create service account key file if it doesn't exist
if [ ! -f "deploy/credentials/service-account.json" ]; then
  echo "⚠️  Service account key file not found. Creating placeholder..."
  cat > deploy/credentials/service-account.json << EOF
{
  "type": "service_account",
  "project_id": "api-for-warp-drive",
  "private_key_id": "place-your-actual-key-here",
  "private_key": "place-your-actual-private-key-here",
  "client_email": "drlucyautomation@api-for-warp-drive.iam.gservicecloud.com",
  "client_id": "place-your-actual-client-id-here",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/drlucyautomation%40api-for-warp-drive.iam.gservicecloud.com"
}
EOF
  echo "⚠️  Please replace the placeholder values in deploy/credentials/service-account.json with your actual service account key"
fi

# Ensure all scripts are executable
echo "4. Making scripts executable..."
chmod +x mcp-start.sh
chmod +x mcp-start-now.sh
chmod +x mcp-client-test.js
chmod +x agent-driven-mcp-test.js
chmod +x deploy/deploy.sh

# 5. Create symbolic links for integration
echo "5. Creating integration links..."

# Link to core-protocols
if [ ! -L "/Users/as/asoos/mcp" ]; then
  ln -sf "/Users/as/asoos/core-protocols/mcp" "/Users/as/asoos/mcp"
  echo "✅ Created symlink: /Users/as/asoos/mcp"
fi

# Link to agent system
AGENT_DIR="/Users/as/asoos/agents/capabilities"
mkdir -p $AGENT_DIR

if [ ! -L "$AGENT_DIR/mcp-client.js" ]; then
  cp "/Users/as/asoos/core-protocols/mcp/index.js" "$AGENT_DIR/mcp-client.js"
  echo "✅ Created agent capability: $AGENT_DIR/mcp-client.js"
fi

# 6. Set up environment variables
echo "6. Setting up environment variables..."

# Add to .bashrc or .zshrc if available
if [ -f "$HOME/.bashrc" ]; then
  PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then
  PROFILE="$HOME/.zshrc"
else
  PROFILE="/dev/null"
  echo "⚠️  Could not find .bashrc or .zshrc. Environment variables will not be saved."
fi

if [ "$PROFILE" != "/dev/null" ]; then
  # Check if already set
  if ! grep -q "MCP_SERVICE_ACCOUNT" "$PROFILE"; then
    echo "" >> "$PROFILE"
    echo "# ASOOS MCP Environment Variables" >> "$PROFILE"
    echo "export MCP_SERVICE_ACCOUNT=\"drlucyautomation@api-for-warp-drive.iam.gservicecloud.com\"" >> "$PROFILE"
    echo "export MCP_PROJECT_ID=\"api-for-warp-drive\"" >> "$PROFILE"
    echo "export MCP_REGION=\"us-west1\"" >> "$PROFILE"
    echo "export MCP_PORT=\"3000\"" >> "$PROFILE"
    echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$PWD/deploy/credentials/service-account.json\"" >> "$PROFILE"
    echo "✅ Added environment variables to $PROFILE"
    echo "⚠️  Please reload your profile with 'source $PROFILE' or restart your terminal"
  else
    echo "⚠️  Environment variables already exist in $PROFILE"
  fi
fi

# 7. Run configuration check
echo "7. Running configuration check..."
echo "⚠️  Note: Full configuration check requires valid service account credentials"
echo "⚠️  If using placeholder credentials, actual Firebase/GCP connections will fail"
echo ""

if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$PWD/deploy/credentials/service-account.json"
fi

# 8. Finalize
echo ""
echo "MCP Activation Completed"
echo "========================"
echo ""
echo "Next steps:"
echo "1. If you used placeholder credentials, replace them with actual service account keys"
echo "2. Run './mcp-start-now.sh' to start the MCP server for testing"
echo "3. In a new terminal, run './mcp-client-test.js' to verify the connection"
echo "4. When ready for production, use './deploy/deploy.sh' to deploy to GCP"
echo ""
echo "The MCP is now ready to coordinate the ASOOS system!"