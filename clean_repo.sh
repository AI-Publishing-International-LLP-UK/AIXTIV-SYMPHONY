#!/bin/bash

# Exit on error
set -e

echo "=== Starting Targeted Repository Cleanup ==="
echo "Timestamp: $(date)"
echo "Working directory: $(pwd)"

# Create log directory
LOGDIR="cleanup_logs"
mkdir -p $LOGDIR
LOGFILE="$LOGDIR/cleanup_$(date +%Y%m%d_%H%M%S).log"
echo "Logging to: $LOGFILE"

# Function to log messages
log() {
  echo "[$(date +%H:%M:%S)] $1" | tee -a $LOGFILE
}

# 1. Remove deleted files from git tracking
log "Removing deleted files from git tracking..."
git rm $(git ls-files --deleted) 2>/dev/null || log "No deleted files to remove"

# 2. Clean out problematic directories
log "Cleaning problematic directories..."

# List of directories to clean up
PROBLEM_DIRS=(
  "dr-memoria-deploy"
  "pre_cleanup_backup_*"
  "temp-aixtiv-admin-core"
  "migration_logs"
  "node_modules"
  "__pycache__"
  ".firebase"
)

for dir in "${PROBLEM_DIRS[@]}"; do
  find . -name "$dir" -type d -not -path "*/\.*" | while read -r directory; do
    log "Removing directory: $directory"
    rm -rf "$directory" 2>/dev/null || log "Failed to remove $directory"
  done
done

# 3. Clean up large log files
log "Cleaning up large log files..."
find . -name "*.log" -size +10M -not -path "*/$LOGDIR/*" | while read -r file; do
  log "Removing large log file: $file"
  rm -f "$file" 2>/dev/null || log "Failed to remove $file"
done

# 4. Clean up temporary files
log "Cleaning up temporary files..."
find . -name "*temp*" -not -path "*/$LOGDIR/*" | while read -r file; do
  log "Removing temporary file: $file"
  rm -rf "$file" 2>/dev/null || log "Failed to remove $file"
done

# 5. Remove database files that are causing issues
log "Removing problematic database files..."
rm -rf ./desktop/controller/dbs/* 2>/dev/null || log "Failed to remove database files"

# 6. Create basic structure for essential directories
log "Creating essential directory structure..."
mkdir -p build/configs build/deployment build/logs

# 7. Move all log files to build/logs
log "Moving log files to build/logs..."
find . -name "*.log" -not -path "*/build/logs/*" -not -path "*/$LOGDIR/*" | while read -r file; do
  log "Moving log file: $file to build/logs/"
  cp "$file" build/logs/ 2>/dev/null || log "Failed to copy $file"
  rm "$file" 2>/dev/null || log "Failed to remove original $file"
done

# 8. Create a proper .gitignore to exclude problematic files
log "Creating proper .gitignore file..."
cat > .gitignore << 'EOF'
# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.npm/

# Logs
logs/
*.log

# Environment
.env
.env.*
*.env

# Build 
dist/
coverage/

# Database files
desktop/controller/dbs/

# Service accounts
*-service-account-*.json
*-firebase-adminsdk-*.json
service-account-key.json

# macOS
.DS_Store
.AppleDouble
.LSOverride
._*

# Editors
.idea/
.vscode/
*.swp
*.swo

# Temporary files
tmp/
temp/
*.tmp

# Firebase
.firebase/
firebase-debug.log*
ui-debug.log*
database-debug.log*
firestore-debug.log*

# Backups and old files
*backup*/
pre_cleanup*/
*cleanup*/
EOF

# 9. Perform git operations only if we're in a git repository
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  log "Committing cleanup changes..."
  git add .gitignore || log "Failed to add .gitignore"
  git add build/ || log "Failed to add build directory"
  git config user.name "Cleanup Automation" || log "Failed to set git user.name"
  git config user.email "cleanup@ai-publishing.international" || log "Failed to set git user.email"
  git commit -m "🧹 Clean up repository structure and remove problematic files" || log "No changes to commit or commit failed"
else
  log "Not in a git repository, skipping git operations"
fi

# 10. Report results
log "Cleanup completed successfully!"
echo "=== Cleanup Completed ==="
echo "Timestamp: $(date)"
echo "See $LOGFILE for details"