#!/bin/sh
# start.sh - Debug script for integration-gateway startup

echo "===== STARTUP DEBUG INFO ====="
echo "Starting integration-gateway service at $(date)"
echo "Current directory: $(pwd)"

# List directory contents
echo "\n===== DIRECTORY CONTENTS ====="
ls -la

# Check if server.js exists
echo "\n===== SERVER.JS CHECK ====="
if [ -f "server.js" ]; then
    echo "server.js file exists"
    echo "File size: $(ls -lh server.js | awk '{print $5}')"
    echo "File permissions: $(ls -la server.js | awk '{print $1}')"
else
    echo "ERROR: server.js file does not exist!"
fi

# Check node_modules
echo "\n===== NODE_MODULES CHECK ====="
if [ -d "node_modules" ]; then
    echo "node_modules directory exists"
    echo "Total size: $(du -sh node_modules | cut -f1)"
    echo "Number of packages: $(find node_modules -maxdepth 1 -type d | wc -l)"
    
    # Check for critical packages
    echo "\nChecking for key dependencies:"
    for pkg in express winston dotenv
    do
        if [ -d "node_modules/$pkg" ]; then
            echo "✅ $pkg found"
        else
            echo "❌ $pkg NOT found - this may cause startup to fail"
        fi
    done
else
    echo "ERROR: node_modules directory does not exist or is empty!"
fi

# Check package.json
echo "\n===== PACKAGE.JSON CHECK ====="
if [ -f "package.json" ]; then
    echo "package.json file exists"
    echo "Dependencies:"
    grep -A 20 '"dependencies"' package.json
else
    echo "ERROR: package.json file does not exist!"
fi

# Print environment variables
echo "\n===== ENVIRONMENT VARIABLES ====="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "SERVICE_NAME: $SERVICE_NAME"
echo "GCP_PROJECT: $GCP_PROJECT"
echo "GCP_REGION: $GCP_REGION"

# Check for log directory
echo "\n===== LOG DIRECTORY CHECK ====="
if [ ! -d "logs" ]; then
    echo "Creating logs directory..."
    mkdir -p logs
fi

# Check if node is available
echo "\n===== NODE VERSION ====="
node --version

# Attempt to start the server
echo "\n===== STARTING SERVER ====="
echo "Starting with: node server.js"
node server.js || {
    exit_code=$?
    echo "\n===== SERVER STARTUP FAILED WITH CODE $exit_code ====="
    echo "Checking for common errors:"
    
    # Check for port conflicts
    echo "\nChecking port usage:"
    netstat -tulpn 2>/dev/null || echo "netstat not available"
    
    # Try to validate server.js with node
    echo "\nValidating server.js syntax:"
    node --check server.js || echo "server.js has syntax errors"
    
    # Exit with the original error code
    exit $exit_code
}

