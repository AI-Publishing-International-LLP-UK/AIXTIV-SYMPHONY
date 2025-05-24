#!/bin/bash

# Exit on error
set -e

echo "=== Starting Cleanup Finalization Process ==="
echo "Timestamp: $(date)"

# Create directories for organizing
echo "=== Creating organization directories ==="
mkdir -p build/backups
mkdir -p build/logs
mkdir -p build/deployment
mkdir -p build/configs
mkdir -p build/documentation

# Move cleanup and migration logs to build/logs
echo "=== Moving logs to build/logs ==="
find . -name "cleanup_log_*" -type f -exec mv {} build/logs/ \;
find . -name "migration_*" -type f -exec mv {} build/logs/ \;
find . -name "*.log" -type f -exec mv {} build/logs/ \;
if [ -d "migration_logs" ]; then
  mv migration_logs/* build/logs/ 2>/dev/null || true
  rmdir migration_logs 2>/dev/null || true
fi

# Move backup directories to build/backups
echo "=== Moving backups to build/backups ==="
find . -name "*backup*" -type d -exec mv {} build/backups/ \; 2>/dev/null || true
find . -name "pre_cleanup*" -type d -exec mv {} build/backups/ \; 2>/dev/null || true

# Move build-related files to build/deployment
echo "=== Moving deployment files to build/deployment ==="
if [ -d "deployment" ]; then
  cp -r deployment/* build/deployment/ 2>/dev/null || true
  rm -rf deployment 2>/dev/null || true
fi

# Move config files to build/configs
echo "=== Moving config files to build/configs ==="
find . -name "firebase.json" -exec cp {} build/configs/ \; 2>/dev/null || true
find . -name "*.yaml" -exec cp {} build/configs/ \; 2>/dev/null || true
find . -name "cloud-config" -type d -exec cp -r {} build/configs/ \; 2>/dev/null || true

# Move documentation files to build/documentation
echo "=== Moving documentation to build/documentation ==="
find . -name "*.md" -exec cp {} build/documentation/ \; 2>/dev/null || true

# Delete files that are in git status as "deleted"
echo "=== Cleaning up deleted files ==="
git status | grep "deleted:" | awk '{print $2}' | xargs git rm || true

# Create an organized .gitignore
echo "=== Creating proper .gitignore ==="
cat > .gitignore << EOF
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
build/backups/
build/logs/

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

# Desktop database
desktop/controller/dbs/
EOF

# Create a minimal README that points to the proper documentation
echo "=== Creating proper README.md ==="
cat > README.md << 'EOF'
# ASOOS - AI Symphony Opus Operating System

AI Symphony Opus Operating System (ASOOS) is a comprehensive application platform for managing AI systems, with a focus on security, scalability, and collaboration.

## Structure

- `aixtiv-cli/` - Command-line interface for SalleyPort security management
- `build/` - Build artifacts and deployment configurations
- `frontend/` - Frontend web application
- `backend/` - Backend API services
- `functions/` - Firebase Cloud Functions

## Deployment

To deploy the application, run:

```bash
./deployment.sh
```

## Documentation

For complete documentation, see the files in `build/documentation/`.

## Security

This repository contains sensitive configurations. Ensure you have proper authorization before accessing or modifying files.

## License

Copyright (c) 2025 AI Publishing International LLP
All rights reserved.

UNLICENSED - Proprietary software. Do not distribute.
EOF

# Commit the changes
echo "=== Committing changes ==="
git add .gitignore README.md
git add build/
git add functions/
git config user.name "Dr. Lucy Automation"
git config user.email "drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com"
git commit -m "🧹 Complete repository cleanup and structure reorganization" || echo "No changes to commit"

echo "=== Cleanup Finalization Completed ==="
echo "Timestamp: $(date)"
echo "The repository is now organized and ready for deployment."
echo "Use ./deployment.sh to deploy the application to Google Cloud Run."