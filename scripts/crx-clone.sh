#!/bin/bash

# crx-clone.sh
# Script to clone and manage CRX agents

# Check if a source agent was provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./crx-clone.sh <source_agent> <new_agent_name> [configuration_file]"
  echo "  source_agent: Name of the source CRX agent to clone"
  echo "  new_agent_name: Name for the new CRX agent"
  echo "  configuration_file: Optional. Path to a JSON configuration file with custom settings"
  exit 1
fi

SOURCE_AGENT="$1"
NEW_AGENT_NAME="$2"
CONFIG_FILE="$3"
REPO_ROOT="/Users/as/asoos/opus/opus1.0.1"
SOURCE_DIR="$REPO_ROOT/agent-pairs/crx/$SOURCE_AGENT"
TARGET_DIR="$REPO_ROOT/agent-pairs/crx/$NEW_AGENT_NAME"

# Check if source agent exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source agent '$SOURCE_AGENT' not found at $SOURCE_DIR"
  exit 1
fi

# Check if target directory already exists
if [ -d "$TARGET_DIR" ]; then
  echo "Error: Target directory '$TARGET_DIR' already exists"
  exit 1
fi

# Create target directory
mkdir -p "$TARGET_DIR"

# Clone agent files
echo "Cloning $SOURCE_AGENT to $NEW_AGENT_NAME..."
cp -r "$SOURCE_DIR"/* "$TARGET_DIR"

# Update identity file
echo "Updating identity information..."
if [ -f "$TARGET_DIR/identity.json" ]; then
  # Create a new identity file
  cat > "$TARGET_DIR/identity.json" << EOID
{
  "agent_name": "$NEW_AGENT_NAME",
  "agent_type": "crx",
  "created_at": "2025-05-26T21:32:17Z",
  "cloned_from": "$SOURCE_AGENT",
  "cloned_by": "crx-clone-script"
}
EOID
else
  # Create a new identity file if it doesn't exist
  cat > "$TARGET_DIR/identity.json" << EOID
{
  "agent_name": "$NEW_AGENT_NAME",
  "agent_type": "crx",
  "created_at": "2025-05-26T21:32:17Z",
  "cloned_from": "$SOURCE_AGENT",
  "cloned_by": "crx-clone-script"
}
EOID
fi

# Apply custom configuration if provided
if [ ! -z "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
  echo "Applying custom configuration from $CONFIG_FILE..."
  # Here you would parse the JSON file and apply settings
  # For example, using jq to extract and apply settings
  if command -v jq &> /dev/null; then
    # This is a simple example - you would need to expand this based on your configuration needs
    if jq -e '.name' "$CONFIG_FILE" > /dev/null 2>&1; then
      CUSTOM_NAME=$(jq -r '.name' "$CONFIG_FILE")
      echo "  Setting custom name to: $CUSTOM_NAME"
      # Apply the custom name to relevant files
      find "$TARGET_DIR" -type f -name "*.json" -exec sed -i "s/$SOURCE_AGENT/$CUSTOM_NAME/g" {} \;
    fi
  else
    echo "Warning: jq is not installed. Skipping custom configuration."
  fi
fi

# Update package.json if it exists
if [ -f "$TARGET_DIR/package.json" ]; then
  echo "Updating package.json..."
  sed -i "s/\"name\": \".*\"/\"name\": \"$NEW_AGENT_NAME\"/" "$TARGET_DIR/package.json"
fi

echo "CRX agent cloned successfully!"
echo "New agent created at: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "1. Review and customize the cloned agent"
echo "2. Test the functionality"
echo "3. Update documentation as needed"
echo "4. Commit the changes to the repository"

exit 0
