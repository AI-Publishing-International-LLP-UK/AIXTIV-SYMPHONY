#!/bin/bash
# Script to update Firebase dependencies
echo "\U0001F4E6 Updating Firebase dependencies..."
cd functions
# Update firebase-functions to latest
echo "Updating firebase-functions to latest version..."
npm install --save firebase-functions@latest
# Update Node.js version in package.json
echo "Setting Node.js engine to version 20..."
# This uses jq to update the engines field in package.json
# Install jq if needed: brew install jq (macOS) or apt-get install jq (Linux)
if command -v jq >/dev/null 2>&1; then
  jq '.engines.node = "20"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "✅ Updated Node.js engine version to 20 in package.json"
else
  echo "⚠️ jq not found. Please manually update the Node.js engine version in package.json to 20."
  echo "Change \"engines\": {\"node\": \"18\"} to \"engines\": {\"node\": \"20\"}"
fi
# Update firebase-admin if it's outdated
echo "Updating firebase-admin to latest version..."
npm install --save firebase-admin@latest
echo "✅ Dependencies updated successfully!"
echo ""
echo "\U0001F525 Next steps:"
echo "1. Verify your code works with the new versions"
echo "2. Deploy with: firebase deploy"
echo ""
echo "Note: You may need to update your code for breaking changes in the new versions."

