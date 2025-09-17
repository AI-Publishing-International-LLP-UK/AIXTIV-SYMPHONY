#!/bin/sh

# ASOOS Integration Gateway Startup Script
echo "🚀 Starting ASOOS Integration Gateway..."
echo "Node version: $(node --version)"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Start the application
if [ -f "server.js" ]; then
    echo "Starting server.js..."
    exec node server.js
elif [ -f "index.js" ]; then
    echo "Starting index.js..."
    exec node index.js
elif [ -f "src/server.js" ]; then
    echo "Starting src/server.js..."
    exec node src/server.js
else
    echo "❌ No main server file found. Available files:"
    ls -la
    echo "Exiting..."
    exit 1
fi
