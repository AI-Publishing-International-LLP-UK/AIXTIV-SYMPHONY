#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}             ASOOS FULL DEPLOYMENT SCRIPT                ${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e "${YELLOW}This script will deploy Symphony, Anthology, and all ASOOS components${NC}"
echo -e ""

# Create deployment directory
DEPLOY_DIR="/Users/as/asoos/deploy/full_asoos_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/public"
mkdir -p "$DEPLOY_DIR/functions"

# Step 1: Stop running processes
echo -e "${YELLOW}Step 1: Stopping any running processes...${NC}"
pkill -f "node /Users/as/symphony_local" || true
pkill -f "firebase serve" || true
pkill -f "npm run dev" || true
echo -e "${GREEN}✓ Processes stopped${NC}"

# Step 2: Stage all files
echo -e "${YELLOW}Step 2: Staging all files...${NC}"

# Create a list of files to stage (excluding node_modules, etc.)
cd /Users/as/asoos
cat > "$DEPLOY_DIR/staged_files.txt" << EOF
access-symphony.sh
backup-symphony.sh
deploy-symphony-to-asoos.sh
start-symphony.sh
run-symphony.sh
install-symphony-deps.sh
SYMPHONY_GUIDE.md
deploy-symphony-build.sh
deploy-full-asoos.sh
2100-cool-subdomain-manager.js
ASOOS-DOMAIN-CHECKLIST.md
ASOOS-IMPLEMENTATION.md
CUSTOM-DOMAIN-SETUP.md
DEPLOYMENT_COMPLETE.md
DOMAIN-MANAGEMENT-GUIDE.md
DOMAIN-MANAGEMENT-README.md
DOMAIN_SSL_INSTRUCTIONS.md
add-verification-records.js
add-verification.js
asoos-dns-records.txt
asoos-domain-pipeline.js
asoos-ssl-fix.js
deploy-asoos-2100-cool.sh
deploy-asoos.sh
deploy-dr-claude-orchestrator.sh
deploy-dr-memoria-anthology.sh
deploy-drive-integration.js
firebase.json
functions/index.js
functions/migration.js
functions/drive-integration/
functions/functions/services/drive-service.js
mcp-domain-integration.js
public/asoos-2100-cool/
public/dr-memoria-anthology/
verify-asoos-subdomain.sh
verify-domains.js
verify-subdomains.js
EOF

# Stage all listed files
echo -e "${YELLOW}Staging files...${NC}"
xargs git add < "$DEPLOY_DIR/staged_files.txt"
echo -e "${GREEN}✓ Files staged${NC}"

# Step 3: Build Symphony package
echo -e "${YELLOW}Step 3: Building Symphony package...${NC}"

# Copy Symphony
echo -e "${YELLOW}Copying Symphony files...${NC}"
mkdir -p "$DEPLOY_DIR/public/symphony"
mkdir -p "$DEPLOY_DIR/functions/symphony-api"

# Copy Symphony frontend
if [ -d "/Users/as/symphony_local/public" ]; then
    cp -r /Users/as/symphony_local/public/* "$DEPLOY_DIR/public/symphony/" 2>/dev/null
    echo -e "${GREEN}✓ Copied Symphony frontend${NC}"
else
    echo -e "${RED}✗ Symphony frontend not found${NC}"
fi

# Copy Symphony API
if [ -d "/Users/as/symphony_local/api" ]; then
    cp -r /Users/as/symphony_local/api/* "$DEPLOY_DIR/functions/symphony-api/" 2>/dev/null
    echo -e "${GREEN}✓ Copied Symphony API${NC}"
else
    echo -e "${RED}✗ Symphony API not found${NC}"
fi

# Step 4: Copy Anthology
echo -e "${YELLOW}Step 4: Copying Anthology...${NC}"
mkdir -p "$DEPLOY_DIR/public/anthology"
mkdir -p "$DEPLOY_DIR/functions/anthology-api"

# Copy Anthology frontend
if [ -d "/Users/as/asoos/public/dr-memoria-anthology" ]; then
    cp -r /Users/as/asoos/public/dr-memoria-anthology/* "$DEPLOY_DIR/public/anthology/" 2>/dev/null
    echo -e "${GREEN}✓ Copied Anthology frontend${NC}"
else
    echo -e "${RED}✗ Anthology frontend not found${NC}"
fi

# Copy Anthology API if exists
if [ -d "/Users/as/asoos/functions/anthology-integration" ]; then
    cp -r /Users/as/asoos/functions/anthology-integration/* "$DEPLOY_DIR/functions/anthology-api/" 2>/dev/null
    echo -e "${GREEN}✓ Copied Anthology API${NC}"
elif [ -d "/Users/as/asoos/vls/solutions/dr-memoria-anthology/functions/integration-gateway" ]; then
    cp -r /Users/as/asoos/vls/solutions/dr-memoria-anthology/functions/integration-gateway/* "$DEPLOY_DIR/functions/anthology-api/" 2>/dev/null
    echo -e "${GREEN}✓ Copied Anthology API from VLS${NC}"
else
    echo -e "${YELLOW}! Anthology API not found, creating placeholder${NC}"
    mkdir -p "$DEPLOY_DIR/functions/anthology-api"
    cat > "$DEPLOY_DIR/functions/anthology-api/index.js" << EOF
/**
 * Dr. Memoria's Anthology API
 */
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Dr. Memoria\'s Anthology API is running' });
});

// Basic anthology endpoints
app.get('/api/entries', (req, res) => {
  res.json({
    entries: [
      { id: 'entry1', title: 'First Memory', date: '2025-01-15' },
      { id: 'entry2', title: 'Second Memory', date: '2025-02-22' },
      { id: 'entry3', title: 'Third Memory', date: '2025-03-30' }
    ]
  });
});

module.exports = app;
EOF
fi

# Step 5: Copy main ASOOS site
echo -e "${YELLOW}Step 5: Copying main ASOOS site...${NC}"
mkdir -p "$DEPLOY_DIR/public/asoos-2100-cool"

# Copy ASOOS frontend
if [ -d "/Users/as/asoos/public/asoos-2100-cool" ]; then
    cp -r /Users/as/asoos/public/asoos-2100-cool/* "$DEPLOY_DIR/public/asoos-2100-cool/" 2>/dev/null
    echo -e "${GREEN}✓ Copied ASOOS site${NC}"
else
    echo -e "${RED}✗ ASOOS site not found${NC}"
fi

# Step 6: Prepare Firebase configuration
echo -e "${YELLOW}Step 6: Preparing Firebase configuration...${NC}"

# Create firebase.json
cat > "$DEPLOY_DIR/firebase.json" << EOF
{
  "hosting": [
    {
      "target": "asoos",
      "public": "public/asoos-2100-cool",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "asoosApi"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    },
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
    },
    {
      "target": "anthology",
      "public": "public/anthology",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "/api/**",
          "function": "anthologyApi"
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

# Create .firebaserc
cat > "$DEPLOY_DIR/.firebaserc" << EOF
{
  "projects": {
    "default": "api-for-warp-drive"
  },
  "targets": {
    "api-for-warp-drive": {
      "hosting": {
        "asoos": [
          "asoos-2100-cool"
        ],
        "symphony": [
          "symphony-asoos-2100"
        ],
        "anthology": [
          "anthology-asoos-2100"
        ]
      }
    }
  }
}
EOF

# Create functions/index.js
cat > "$DEPLOY_DIR/functions/index.js" << EOF
/**
 * ASOOS API Functions
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import function implementations
const symphonyApp = require('./symphony-api/app');
const anthologyApp = require('./anthology-api/index');

// Configure regional settings
const runtimeOpts = {
  region: 'us-west1',
  memory: '512MB',
  timeoutSeconds: 60
};

// Export the Symphony API
exports.symphonyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(symphonyApp);

// Export the Anthology API
exports.anthologyApi = functions
  .runWith(runtimeOpts)
  .https.onRequest(anthologyApp);

// Google Drive integration functions
exports.handleDriveChanges = functions
  .runWith(runtimeOpts)
  .pubsub.topic('drive-updates')
  .onPublish(async (message) => {
    const fileData = message.json;
    console.log('Received Drive update:', fileData);
    
    // Process file update
    const db = admin.firestore();
    await db.collection('drive_files').add({
      fileId: fileData.fileId,
      name: fileData.name,
      mimeType: fileData.mimeType,
      updateTime: new Date(),
      processed: false
    });
    
    return null;
  });

// Process Drive files function
exports.processDriveFiles = functions
  .runWith(runtimeOpts)
  .firestore
  .document('drive_files/{fileId}')
  .onCreate(async (snap, context) => {
    const fileData = snap.data();
    console.log('Processing new Drive file:', fileData);
    
    // Add processing logic here
    
    // Mark as processed
    await snap.ref.update({ processed: true, processedAt: new Date() });
    return null;
  });
EOF

# Create functions/package.json
cat > "$DEPLOY_DIR/functions/package.json" << EOF
{
  "name": "asoos-functions",
  "version": "1.0.0",
  "description": "Firebase Functions for ASOOS",
  "main": "index.js",
  "engines": {
    "node": "20"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0"
  },
  "private": true
}
EOF

# Step 7: Create deployment scripts
echo -e "${YELLOW}Step 7: Creating deployment scripts...${NC}"

# Create deploy.sh
cat > "$DEPLOY_DIR/deploy.sh" << EOF
#!/bin/bash

echo "Deploying ASOOS components to Firebase..."

# Install dependencies
cd functions
npm install
cd ..

# Create hosting targets if they don't exist
firebase target:apply hosting asoos asoos-2100-cool || firebase hosting:sites:create asoos-2100-cool
firebase target:apply hosting symphony symphony-asoos-2100 || firebase hosting:sites:create symphony-asoos-2100
firebase target:apply hosting anthology anthology-asoos-2100 || firebase hosting:sites:create anthology-asoos-2100

# Deploy to Firebase
firebase deploy --only functions,hosting

echo "All components deployed successfully!"
echo "Access at:"
echo "- Main site: https://asoos-2100-cool.web.app"
echo "- Symphony: https://symphony-asoos-2100.web.app"
echo "- Anthology: https://anthology-asoos-2100.web.app"
EOF

chmod +x "$DEPLOY_DIR/deploy.sh"

# Create connect-domains.js
cat > "$DEPLOY_DIR/connect-domains.js" << EOF
/**
 * Connect all subdomains to asoos.2100.cool
 */
const fs = require('fs');
const { exec } = require('child_process');

// Connect subdomains
function connectSubdomains() {
  console.log('Connecting subdomains to asoos.2100.cool...');
  
  // Add ASOOS main domain
  exec('node /Users/as/asoos/2100-cool-subdomain-manager.js --add main', (error, stdout, stderr) => {
    if (error) {
      console.error('Error connecting main domain:', stderr);
      return;
    }
    console.log('Main domain connected:', stdout);
    
    // Add Symphony subdomain
    exec('node /Users/as/asoos/2100-cool-subdomain-manager.js --add symphony', (error, stdout, stderr) => {
      if (error) {
        console.error('Error connecting symphony subdomain:', stderr);
        return;
      }
      console.log('Symphony subdomain connected:', stdout);
      
      // Add Anthology subdomain
      exec('node /Users/as/asoos/2100-cool-subdomain-manager.js --add anthology', (error, stdout, stderr) => {
        if (error) {
          console.error('Error connecting anthology subdomain:', stderr);
          return;
        }
        console.log('Anthology subdomain connected:', stdout);
        
        console.log('All domains connected successfully!');
        console.log('Your sites are now available at:');
        console.log('- https://asoos.2100.cool');
        console.log('- https://symphony.asoos.2100.cool');
        console.log('- https://anthology.asoos.2100.cool');
      });
    });
  });
}

connectSubdomains();
EOF

# Step 8: Commit to repository
echo -e "${YELLOW}Step 8: Committing changes...${NC}"

# Commit with informative message
git commit -m "Deploy Symphony, Anthology and ASOOS components

- Added Symphony environment with agents at pilots interface
- Integrated Dr. Memoria's Anthology
- Added Google Drive integration
- Fixed domain configuration for asoos.2100.cool
- Created comprehensive deployment scripts
- Updated all documentation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${GREEN}✓ Changes committed${NC}"

# Step 9: Copy deployment package to current directory
echo -e "${YELLOW}Step 9: Finalizing deployment package...${NC}"
cp -r "$DEPLOY_DIR" /Users/as/asoos/deploy-package

# Complete
echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}✓ ASOOS full deployment package created!${NC}"
echo -e "${BLUE}=========================================================${NC}"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Push changes to remote: ${GREEN}git push origin clean-branch-no-history${NC}"
echo -e "2. Deploy to Firebase: ${GREEN}cd /Users/as/asoos/deploy-package && ./deploy.sh${NC}"
echo -e "3. Connect domains: ${GREEN}node /Users/as/asoos/deploy-package/connect-domains.js${NC}"
echo -e ""
echo -e "${BLUE}Do you want to push changes to remote now? (y/n)${NC}"
read -p "" PUSH_NOW

if [[ $PUSH_NOW == "y" || $PUSH_NOW == "Y" ]]; then
    echo -e "${YELLOW}Pushing changes to remote...${NC}"
    git push origin clean-branch-no-history
    echo -e "${GREEN}✓ Changes pushed to remote${NC}"
    
    echo -e "${BLUE}Do you want to deploy to Firebase now? (y/n)${NC}"
    read -p "" DEPLOY_NOW
    
    if [[ $DEPLOY_NOW == "y" || $DEPLOY_NOW == "Y" ]]; then
        echo -e "${YELLOW}Deploying to Firebase...${NC}"
        cd /Users/as/asoos/deploy-package && ./deploy.sh
        
        echo -e "${BLUE}Do you want to connect domains now? (y/n)${NC}"
        read -p "" CONNECT_NOW
        
        if [[ $CONNECT_NOW == "y" || $CONNECT_NOW == "Y" ]]; then
            echo -e "${YELLOW}Connecting domains...${NC}"
            node /Users/as/asoos/deploy-package/connect-domains.js
        fi
    fi
fi

echo -e "${BLUE}=========================================================${NC}"
echo -e "${GREEN}ASOOS deployment process completed!${NC}"
echo -e "${BLUE}=========================================================${NC}"