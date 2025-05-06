#!/bin/bash
# MCP Server Startup Script
# This script starts the MCP server with the proper configuration

# Default configuration
PORT=3000
MODE="production"
SERVER_TYPE="main"  # Options: main, test
DEPLOY_CONFIG="local"  # Options: local, cloud, firebase

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --mode=*)
      MODE="${1#*=}"
      shift
      ;;
    --server=*)
      SERVER_TYPE="${1#*=}"
      shift
      ;;
    --config=*)
      DEPLOY_CONFIG="${1#*=}"
      shift
      ;;
    --help)
      echo "MCP Server Startup Script"
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --port=PORT          Port to run the server on (default: 3000)"
      echo "  --mode=MODE          Server mode: production, development (default: production)"
      echo "  --server=TYPE        Server type: main, test (default: main)"
      echo "  --config=CONFIG      Deployment config: local, cloud, firebase (default: local)"
      echo "  --help               Display this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Set environment variables
export PORT=$PORT
export NODE_ENV=$MODE
export AUTH_TOKEN="oauth2"  # In production, this should be set securely

# Choose proper server file based on server type
if [[ "$SERVER_TYPE" == "test" ]]; then
  SERVER_FILE="mcp-test-server.js"
else
  SERVER_FILE="mcp-server.js"
fi

# Load deployment-specific configuration
if [[ "$DEPLOY_CONFIG" == "cloud" || "$DEPLOY_CONFIG" == "firebase" ]]; then
  # GCP and Firebase configuration
  export FIREBASE_PROJECT_ID="api-for-warp-drive"
  export GCP_REGION="us-west1"
  export GCP_SERVICE_ACCOUNT="drlucyautomation@api-for-warp-drive.iam.gservicecloud.com"
  
  # Blockchain configuration for S2DO
  export BLOCKCHAIN_RPC="https://eth-mainnet.alchemyapi.io/v2/your-api-key"
  export S2DO_CONTRACT_ADDRESS="0x123456789abcdef"
  export FMS_CONTRACT_ADDRESS="0xabcdef123456789"
  
  # Use cloud service account credentials
  export GOOGLE_APPLICATION_CREDENTIALS="./deploy/credentials/service-account.json"
fi

# Ensure necessary directories exist
mkdir -p ./logs
mkdir -p ./test_logs

# Start the server with proper logging
echo "Starting MCP Server ($SERVER_TYPE) on port $PORT in $MODE mode with $DEPLOY_CONFIG configuration"
node $SERVER_FILE 2>&1 | tee ./logs/mcp-server-$(date +%Y%m%d_%H%M%S).log