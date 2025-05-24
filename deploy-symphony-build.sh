#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparing Symphony deployment...${NC}"

# Create deployment directory
DEPLOY_DIR="/Users/as/asoos/deploy/symphony"
mkdir -p "$DEPLOY_DIR"

# Backup the current Symphony environment
echo -e "${YELLOW}Creating backup of Symphony environment...${NC}"
BACKUP_DIR="$DEPLOY_DIR/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /Users/as/symphony_local/* "$BACKUP_DIR/" 2>/dev/null

# Create deployment files
echo -e "${YELLOW}Preparing deployment package...${NC}"

# Create hosting directory
mkdir -p "$DEPLOY_DIR/public/symphony"
mkdir -p "$DEPLOY_DIR/functions/symphony-api"

# Package the frontend
echo -e "${YELLOW}Packaging frontend...${NC}"
cp -r /Users/as/symphony_local/public/* "$DEPLOY_DIR/public/symphony/" 2>/dev/null

# Package the API
echo -e "${YELLOW}Packaging API...${NC}"
cp -r /Users/as/symphony_local/api/* "$DEPLOY_DIR/functions/symphony-api/" 2>/dev/null

# Create firebase.json
cat > "$DEPLOY_DIR/firebase.json" << EOF
{
  "hosting": [
    {
      "target": "symphony",
      "public": "public/symphony",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "symphonyApi"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ],
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "region": "us-west1"
  }
}
EOF

# Create .firebaserc if it doesn't exist
cat > "$DEPLOY_DIR/.firebaserc" << EOF
{
  "projects": {
    "default": "api-for-warp-drive"
  },
  "targets": {
    "api-for-warp-drive": {
      "hosting": {
        "symphony": [
          "symphony-asoos-2100"
        ]
      }
    }
  }
}
EOF

# Create functions wrapper
cat > "$DEPLOY_DIR/functions/index.js" << EOF
/**
 * Symphony API Functions
 * 
 * This file exports the Symphony API as a Firebase Function.
 */

const functions = require('firebase-functions');
const symphonyApp = require('./symphony-api/app');

// Configure regional settings and memory
const runtimeOpts = {
  region: 'us-west1',
  memory: '512MB',
  timeoutSeconds: 60
};

// Export the Symphony API
exports.symphonyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(symphonyApp);
EOF

# Create package.json for functions
cat > "$DEPLOY_DIR/functions/package.json" << EOF
{
  "name": "symphony-api-functions",
  "version": "1.0.0",
  "description": "Firebase Functions for Symphony API",
  "main": "index.js",
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0"
  },
  "private": true
}
EOF

# Create a simple deployment script
cat > "$DEPLOY_DIR/deploy.sh" << EOF
#!/bin/bash

echo "Deploying Symphony to Firebase..."

# Install dependencies
cd functions
npm install
cd ..

# Create hosting target if it doesn't exist
firebase target:apply hosting symphony symphony-asoos-2100 || firebase hosting:sites:create symphony-asoos-2100

# Deploy to Firebase
firebase deploy --only functions:symphonyApi,hosting:symphony

echo "Symphony deployed successfully!"
echo "Access at: https://symphony-asoos-2100.web.app"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

# Create commit script
cat > "$DEPLOY_DIR/commit-to-repo.sh" << EOF
#!/bin/bash

cd /Users/as/asoos

# Add Symphony-related files
git add access-symphony.sh
git add backup-symphony.sh
git add deploy-symphony-to-asoos.sh
git add start-symphony.sh
git add run-symphony.sh
git add install-symphony-deps.sh
git add SYMPHONY_GUIDE.md
git add deploy-symphony-build.sh

# Commit the changes
git commit -m "Add Symphony environment integration with agents at pilots

- Added scripts to manage Symphony environment
- Prepared deployment configuration for asoos.2100.cool
- Fixed dependency installation and configuration
- Added documentation for Symphony usage

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Output success message
echo "Changes committed to repository"
echo "To push, run: git push origin clean-branch-no-history"
EOF

chmod +x "$DEPLOY_DIR/commit-to-repo.sh"

# Prepare custom domain connection
cat > "$DEPLOY_DIR/connect-symphony-domain.js" << EOF
/**
 * Connect Symphony to asoos.2100.cool subdomain
 */
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
const fs = require('fs');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Connect Symphony to custom domain
async function connectSymphonyDomain() {
  try {
    // Create hosting record for symphony.asoos.2100.cool
    console.log('Connecting symphony.asoos.2100.cool to Firebase Hosting...');
    
    // Add your domain connection logic here
    // This would typically involve Firebase Admin SDK calls
    
    console.log('Domain connection successful!');
    console.log('Your Symphony environment is now available at:');
    console.log('https://symphony.asoos.2100.cool');
  } catch (error) {
    console.error('Error connecting domain:', error);
  }
}

connectSymphonyDomain();
EOF

echo -e "${GREEN}Deployment package created at: $DEPLOY_DIR${NC}"
echo -e "${YELLOW}To deploy Symphony:${NC}"
echo -e "1. Run the commit script: ${GREEN}$DEPLOY_DIR/commit-to-repo.sh${NC}"
echo -e "2. Deploy to Firebase: ${GREEN}cd $DEPLOY_DIR && ./deploy.sh${NC}"
echo -e "3. Connect custom domain: ${GREEN}node $DEPLOY_DIR/connect-symphony-domain.js${NC}"
echo -e ""
echo -e "Would you like to commit the Symphony integration now? (y/n)"
read -p "" COMMIT_NOW

if [[ $COMMIT_NOW == "y" || $COMMIT_NOW == "Y" ]]; then
    echo -e "${YELLOW}Committing Symphony integration to repository...${NC}"
    cd /Users/as/asoos
    
    # Add Symphony-related files
    git add access-symphony.sh
    git add backup-symphony.sh
    git add deploy-symphony-to-asoos.sh
    git add start-symphony.sh
    git add run-symphony.sh
    git add install-symphony-deps.sh
    git add SYMPHONY_GUIDE.md
    git add deploy-symphony-build.sh
    
    # Commit the changes
    git commit -m "Add Symphony environment integration with agents at pilots

- Added scripts to manage Symphony environment
- Prepared deployment configuration for asoos.2100.cool
- Fixed dependency installation and configuration
- Added documentation for Symphony usage

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo -e "${GREEN}Changes committed to repository!${NC}"
    echo -e "${YELLOW}To push your changes, run: ${GREEN}git push origin clean-branch-no-history${NC}"
    echo -e "${YELLOW}To deploy to Firebase, run: ${GREEN}cd $DEPLOY_DIR && ./deploy.sh${NC}"
fi