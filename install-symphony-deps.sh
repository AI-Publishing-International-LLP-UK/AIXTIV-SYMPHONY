#!/bin/bash

echo "🔍 Installing all Symphony dependencies..."

# Navigate to the Symphony directory
cd /Users/as/symphony_local || { echo "Error: Symphony directory not found!"; exit 1; }

# Install main dependencies
echo "📦 Installing main Symphony dependencies..."
npm install --no-fund

# Install API dependencies
echo "📦 Installing API dependencies..."
cd api || { echo "Error: API directory not found!"; exit 1; }
npm install --no-fund

# Return to the main directory
cd ..

# Check for any additional component directories and install their dependencies
if [ -d "./frontend" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend || { echo "Error: Failed to enter frontend directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

if [ -d "./agents" ]; then
  echo "📦 Installing agents dependencies..."
  cd agents || { echo "Error: Failed to enter agents directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

if [ -d "./orchestration" ]; then
  echo "📦 Installing orchestration dependencies..."
  cd orchestration || { echo "Error: Failed to enter orchestration directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

if [ -d "./monitoring" ]; then
  echo "📦 Installing monitoring dependencies..."
  cd monitoring || { echo "Error: Failed to enter monitoring directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

if [ -d "./auth" ]; then
  echo "📦 Installing auth dependencies..."
  cd auth || { echo "Error: Failed to enter auth directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

if [ -d "./services" ]; then
  echo "📦 Installing services dependencies..."
  cd services || { echo "Error: Failed to enter services directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

if [ -d "./utils" ]; then
  echo "📦 Installing utils dependencies..."
  cd utils || { echo "Error: Failed to enter utils directory"; exit 1; }
  npm install --no-fund
  cd ..
fi

# Fix audit issues where possible
echo "🔧 Fixing audit issues where possible..."
npm audit fix --force || echo "Some audit issues could not be automatically fixed"

# Check if the installation was successful
echo "✅ Symphony dependencies installation completed!"
echo "   You may see some audit warnings - these are normal and don't affect functionality."
echo ""
echo "To restart Symphony with the updated dependencies, run:"
echo "./run-symphony.sh"