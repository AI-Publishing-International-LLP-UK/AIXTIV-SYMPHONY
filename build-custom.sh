#!/bin/bash

echo "Starting custom build process..."

# Install dependencies with legacy-peer-deps flag
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Create the dist directory if it doesn't exist
mkdir -p dist

# Compile TypeScript files (if any)
if [ -f "$(which tsc)" ]; then
  echo "Compiling TypeScript files..."
  npx tsc
else
  echo "TypeScript compiler not found, skipping compilation"
fi

# Copy non-TypeScript files to dist directory
echo "Copying files to dist directory..."
cp -r server.js integration-gateway docs .github dist/

echo "Custom build process completed successfully!"
