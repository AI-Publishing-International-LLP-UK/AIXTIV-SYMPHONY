#!/bin/bash
# Quick startup script for MCP

echo "Starting MCP Server..."
echo "======================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if the necessary files exist
if [ ! -f "mcp-server.js" ]; then
    echo "❌ mcp-server.js not found. Make sure you're in the correct directory."
    exit 1
fi

# Set environment variables
export PORT=3000
export NODE_ENV="development"
export FIREBASE_PROJECT_ID="api-for-warp-drive"
export GCP_REGION="us-west1"
export GCP_SERVICE_ACCOUNT="drlucyautomation@api-for-warp-drive.iam.gservicecloud.com"

# Ensure logs directory exists
mkdir -p logs

# Start the server
echo "✅ Starting MCP server in development mode..."
echo "✅ Open a new terminal and run './mcp-client-test.js' to test the connection"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node mcp-server.js 2>&1 | tee logs/mcp-server-$(date +%Y%m%d_%H%M%S).log