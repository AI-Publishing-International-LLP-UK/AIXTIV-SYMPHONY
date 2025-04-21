#!/bin/bash

# update-service-account-key.sh
# 
# This is a wrapper script for service-account-key-manager.js that automatically 
# sources the .zshrc file after updating the service account key.
#
# Usage:
#   ./update-service-account-key.sh [path-to-new-key-file]

echo "🔑 Starting service account key update process..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the Node.js script with all arguments passed to this script
node "$SCRIPT_DIR/service-account-key-manager.js" "$@"

# Check if the Node.js script executed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "🔄 Refreshing environment variables..."
    
    # Source the .zshrc file to update environment variables in the current session
    if [ -f ~/.zshrc ]; then
        echo "✅ Sourcing ~/.zshrc for you automatically!"
        source ~/.zshrc
        echo "✅ GOOGLE_APPLICATION_CREDENTIALS is now set to: $GOOGLE_APPLICATION_CREDENTIALS"
    else
        echo "❌ Could not find ~/.zshrc file to source."
    fi
    
    echo ""
    echo "✨ Service account key update process completed!"
fi

