#!/bin/bash

# Exit on error
set -e

# Lint the code
npm run lint

# Transpile TypeScript to JavaScript
tsc

# Copy non-TS files to dist
rsync -avm --include='*.json' --include='*.yaml' --include='*.html' --include='*.css' --include='*.js' --include='*/' --exclude='*.ts' --exclude='*.tsx' --exclude='node_modules' . dist/

# Install production dependencies
cd dist
npm install --production

