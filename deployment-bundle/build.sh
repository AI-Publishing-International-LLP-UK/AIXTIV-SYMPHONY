#!/bin/bash

# ASOOS Build Script
echo "Building ASOOS components..."

# Create directories if they don't exist
mkdir -p integration-gateway/types
mkdir -p integration-gateway/auth/security
mkdir -p integration-gateway/middleware
mkdir -p integration-gateway/plugins
mkdir -p .github/workflows
mkdir -p docs

# Copy files to their correct locations
cp types/gateway.d.ts integration-gateway/types/
cp security/sallyport-verifier.js integration-gateway/auth/security/
cp middleware/authentication.js integration-gateway/middleware/
cp plugins/auth.js integration-gateway/plugins/
cp asoos-pipeline.yml .github/workflows/
cp sallyport-integration-guide.md docs/
cp server.js ./

# Install dependencies
npm install @fastify/auth fastify-plugin --save --legacy-peer-deps

echo "Build completed successfully!"
