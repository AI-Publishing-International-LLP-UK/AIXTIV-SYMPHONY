#!/bin/bash

# Script to commit changes in all submodules and update parent repository
# Created: May 28, 2025

# Set error handling
set -e

# Store the parent directory
PARENT_DIR="$(pwd)"
COMMIT_MSG="Update submodule contents $(date +%Y-%m-%d)"
SUBMODULES=(
  "Aixtiv-Symphony"
  "Roark-5.0-Framework"
  "academy"
  "adk-samples" 
  "aixtiv-push"
  "deployment-ready/deployment-ready"
  "fomc-agent-repo"
  "integration-gateway"
  "opus/opus1.0.1"
)

echo "🚀 Starting submodule update process..."
echo "Found ${#SUBMODULES[@]} submodules to process"

# Function to commit changes in a submodule
commit_submodule() {
  local submodule="$1"
  echo "-----------------------------------"
  echo "📂 Processing: $submodule"
  
  # Check if directory exists
  if [ ! -d "$submodule" ]; then
    echo "⚠️  Warning: Submodule directory '$submodule' not found, skipping..."
    return 1
  fi
  
  # Change to submodule directory
  cd "$submodule" || { echo "❌ Error: Failed to change to directory '$submodule'"; return 1; }
  
  # Check if it's a git repository
  if [ ! -d ".git" ] && [ ! -f ".git" ]; then
    echo "⚠️  Warning: '$submodule' is not a git repository, skipping..."
    cd "$PARENT_DIR"
    return 1
  fi
  
  # Add all changes
  echo "📝 Adding all changes in $submodule..."
  git add -A
  
  # Check if there are changes to commit
  if git diff-index --quiet HEAD --; then
    echo "✓ No changes to commit in $submodule"
  else
    # Commit changes
    echo "💾 Committing changes in $submodule..."
    git commit -m "$COMMIT_MSG"
    echo "✅ Successfully committed changes in $submodule"
  fi
  
  # Return to parent directory
  cd "$PARENT_DIR"
  return 0
}

# Process each submodule
SUCCESS_COUNT=0
FAILURE_COUNT=0

for submodule in "${SUBMODULES[@]}"; do
  if commit_submodule "$submodule"; then
    ((SUCCESS_COUNT++))
  else
    ((FAILURE_COUNT++))
  fi
done

# Update parent repository with submodule references
echo "-----------------------------------"
echo "🔄 Updating parent repository with submodule references..."

for submodule in "${SUBMODULES[@]}"; do
  if [ -d "$submodule" ] || [ -f "$submodule" ]; then
    echo "📎 Adding reference to $submodule in parent repository..."
    git add "$submodule"
  fi
done

echo "-----------------------------------"
echo "📊 Summary:"
echo "✅ Successfully processed: $SUCCESS_COUNT submodules"
echo "❌ Failed to process: $FAILURE_COUNT submodules"
echo "🏁 All submodule references have been updated in the parent repository"
echo "📝 You can now commit the parent repository with: git commit -m \"Update submodule references\""
echo "-----------------------------------"

