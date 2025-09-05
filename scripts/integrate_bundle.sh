#!/bin/bash

# integrate_bundle.sh
# Script to integrate agent bundles into the consolidated structure

# Check if a bundle path was provided
if [ -z "$1" ]; then
  echo "Usage: ./integrate_bundle.sh <path_to_bundle.zip> [agent_type]"
  echo "  agent_type: Optional. Either 'crx' or 'rix'. Defaults to auto-detection."
  exit 1
fi

BUNDLE_PATH="$1"
AGENT_TYPE="$2"
TEMP_DIR="/tmp/bundle_extract_$(date +%s)"
REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"

# Check if bundle exists
if [ ! -f "$BUNDLE_PATH" ]; then
  echo "Error: Bundle file not found at $BUNDLE_PATH"
  exit 1
fi

# Create temporary directory
mkdir -p "$TEMP_DIR"
echo "Extracting bundle to $TEMP_DIR..."

# Extract bundle
unzip -q "$BUNDLE_PATH" -d "$TEMP_DIR"

# Verify bundle structure
echo "Verifying bundle contents..."
if [ -f "$TEMP_DIR/manifest.json" ]; then
  echo "✅ Manifest file found"
else
  echo "⚠️  Warning: No manifest.json found in bundle"
fi

# Auto-detect agent type if not specified
if [ -z "$AGENT_TYPE" ]; then
  if grep -q "crx" "$TEMP_DIR/manifest.json" 2>/dev/null; then
    AGENT_TYPE="crx"
    echo "Detected agent type: CRX"
  elif grep -q "rix" "$TEMP_DIR/manifest.json" 2>/dev/null; then
    AGENT_TYPE="rix"
    echo "Detected agent type: RIX"
  else
    echo "Could not auto-detect agent type. Please specify 'crx' or 'rix' as the second argument."
    exit 1
  fi
fi

# Create target directory
TARGET_DIR="$REPO_ROOT/agent-pairs/$AGENT_TYPE/$(basename "$BUNDLE_PATH" .zip)"
mkdir -p "$TARGET_DIR"

# Move files to target directory
echo "Integrating files into $TARGET_DIR..."
cp -r "$TEMP_DIR"/* "$TARGET_DIR"

# Create identity file
AGENT_NAME=$(basename "$BUNDLE_PATH" .zip)
cat > "$TARGET_DIR/identity.json" << EOID
{
  "agent_name": "$AGENT_NAME",
  "agent_type": "$AGENT_TYPE",
  "created_at": "2025-05-26T21:24:02Z",
  "integrated_by": "integration_script",
  "bundle_source": "$BUNDLE_PATH"
}
EOID

echo "Creating agent-specific Docker configuration..."
cat > "$TARGET_DIR/Dockerfile" << EODF
# Dockerfile for $AGENT_NAME
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "start"]
EODF

# Clean up
echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo "Integration complete! Agent integrated at: $TARGET_DIR"
echo "Next steps:"
echo "1. Review the agent files"
echo "2. Update the manifest if needed"
echo "3. Test the agent functionality"
echo "4. Commit the changes to the repository"

exit 0
