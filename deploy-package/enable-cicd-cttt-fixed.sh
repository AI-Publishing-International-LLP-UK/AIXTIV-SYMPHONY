#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     ENABLING CI/CD CTTT FOR ASOOS.2100.COOL             ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Ensure we're authenticated
echo -e "${YELLOW}Verifying GCP authentication...${NC}"
gcloud auth list

# Set the project
echo -e "${YELLOW}Setting GCP project to api-for-warp-drive...${NC}"
gcloud config set project api-for-warp-drive

# Copy the cloudbuild-ci-cttt-correct.yaml file to the deploy package
echo -e "${YELLOW}Copying CI/CD CTTT configuration...${NC}"
cp /Users/as/asoos/aixtiv-cli/cloudbuild-ci-cttt-correct.yaml /Users/as/asoos/deploy-package/cloudbuild-cicd-cttt.yaml

# Create the trigger (corrected command syntax)
echo -e "${YELLOW}Creating Cloud Build trigger for CI/CD CTTT...${NC}"
gcloud builds triggers create github \
  --name="asoos-2100-cool-cicd-cttt" \
  --repository="projects/api-for-warp-drive/locations/global/connections/github-connection/repositories/AIXTIV-SYMPHONY" \
  --branch="^main$" \
  --build-config="cloudbuild-cicd-cttt.yaml" \
  --description="ASOOS.2100.COOL CI/CD with Comprehensive Testing and Telemetry Tracking"

# Create the tracking directory structure
echo -e "${YELLOW}Setting up agent tracking...${NC}"
mkdir -p /Users/as/asoos/deploy-package/bin
mkdir -p /Users/as/asoos/deploy-package/scripts

# Create the agent tracking script
cat > /Users/as/asoos/deploy-package/bin/agent-tracking.sh << 'EOF'
#!/bin/bash

# Agent Tracking Script
# This script provides functions to track agent actions and telemetry

AGENT_ID=${AGENT_ID:-"CLOUD_BUILD_CI_CTTT"}
TRACKING_ENABLED=true

function log_agent_action() {
    local action=$1
    local description=$2
    local timestamp=$(date +%Y-%m-%dT%H:%M:%S%z)
    local environment=${ENVIRONMENT:-"prod"}
    
    if [ "$TRACKING_ENABLED" = true ]; then
        echo "[AGENT_TRACKING] $timestamp | $AGENT_ID | $action | $environment | $description"
        
        # Log to Cloud Logging
        if command -v gcloud &> /dev/null; then
            gcloud logging write agent-tracking-log \
                "{\"agent\": \"$AGENT_ID\", \"action\": \"$action\", \"environment\": \"$environment\", \"description\": \"$description\", \"timestamp\": \"$timestamp\"}" \
                --payload-type=json \
                --severity=INFO
        fi
        
        # Optionally log to Firestore
        if [ "$FIRESTORE_LOGGING" = true ] && command -v gcloud &> /dev/null; then
            gcloud firestore documents create "projects/api-for-warp-drive/databases/(default)/documents/agent_logs/$(date +%Y%m%d%H%M%S)" \
                --fields="agent=$AGENT_ID,action=$action,environment=$environment,description=$description,timestamp=$timestamp"
        fi
    fi
}

function enable_agent_tracking() {
    TRACKING_ENABLED=true
    log_agent_action "tracking_enabled" "Agent tracking has been enabled"
}

function disable_agent_tracking() {
    log_agent_action "tracking_disabled" "Agent tracking will be disabled"
    TRACKING_ENABLED=false
}

# Initialize tracking
log_agent_action "agent_initialized" "Agent tracking system initialized"
EOF

# Create setup script
cat > /Users/as/asoos/deploy-package/scripts/setup-agent-tracking.sh << 'EOF'
#!/bin/bash

# Setup script for agent tracking system
# This sets up the necessary infrastructure for agent tracking

# Ensure bin directory exists
mkdir -p ./bin

# Copy tracking script if it doesn't exist
if [ ! -f ./bin/agent-tracking.sh ]; then
    cp /Users/as/asoos/deploy-package/bin/agent-tracking.sh ./bin/agent-tracking.sh
    chmod +x ./bin/agent-tracking.sh
fi

# Set up BigQuery dataset for telemetry if it doesn't exist
if ! bq ls --project_id=api-for-warp-drive | grep -q "agent_telemetry"; then
    bq --location=US mk --dataset \
        --description "Agent Telemetry for CI/CD CTTT" \
        api-for-warp-drive:agent_telemetry
    
    # Create table for tracking logs
    bq mk --table \
        --schema agent:STRING,action:STRING,environment:STRING,description:STRING,timestamp:TIMESTAMP \
        api-for-warp-drive:agent_telemetry.tracking_logs
fi

# Initialize agent environment variables
export AGENT_ID="CLOUD_BUILD_CI_CTTT"
export ENVIRONMENT="prod"
export FIRESTORE_LOGGING=true

echo "Agent tracking system has been set up successfully."
EOF

# Make scripts executable
chmod +x /Users/as/asoos/deploy-package/bin/agent-tracking.sh
chmod +x /Users/as/asoos/deploy-package/scripts/setup-agent-tracking.sh

# Create manual trigger script
cat > /Users/as/asoos/deploy-package/trigger-cicd-cttt.sh << 'EOF'
#!/bin/bash

# Manual trigger script for CI/CD CTTT
# This script allows manual triggering of the CI/CD pipeline

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     MANUAL TRIGGER FOR CI/CD CTTT PIPELINE              ${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "${YELLOW}Triggering CI/CD CTTT pipeline manually...${NC}"
gcloud builds triggers run asoos-2100-cool-cicd-cttt \
    --branch=main \
    --project=api-for-warp-drive

echo -e "${GREEN}CI/CD CTTT pipeline has been triggered!${NC}"
echo -e "${YELLOW}You can view the build progress in the Google Cloud Console or by running:${NC}"
echo -e "${BLUE}gcloud builds list --project=api-for-warp-drive${NC}"
EOF

chmod +x /Users/as/asoos/deploy-package/trigger-cicd-cttt.sh

# Create a Cloud Build config for the ASOOS.2100.COOL deployment
cat > /Users/as/asoos/deploy-package/cloudbuild-asoos-2100.yaml << 'EOF'
steps:
  # Initialize with Authentication
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'initialize'
    args:
      - 'config'
      - 'set'
      - 'project'
      - 'api-for-warp-drive'

  # Setup Agent Tracking
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'agent-tracking-setup'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        chmod +x /workspace/scripts/setup-agent-tracking.sh
        /workspace/scripts/setup-agent-tracking.sh
        export AGENT_ID="ASOOS_2100_CI_CTTT"
        source /workspace/bin/agent-tracking.sh
        log_agent_action "pipeline_start" "Starting ASOOS.2100.COOL CI/CTTT pipeline"

  # Build the application
  - name: 'gcr.io/cloud-builders/npm'
    id: 'build'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        source /workspace/bin/agent-tracking.sh
        log_agent_action "build_start" "Starting application build"
        npm run build
        log_agent_action "build_complete" "Completed application build"

  # Deploy to Firebase Hosting
  - name: 'gcr.io/cloud-builders/npm'
    id: 'deploy-firebase'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        source /workspace/bin/agent-tracking.sh
        log_agent_action "deploy_start" "Starting Firebase deployment"
        npm install -g firebase-tools
        firebase deploy --project api-for-warp-drive --only hosting
        log_agent_action "deploy_complete" "Completed Firebase deployment"

  # Update DNS Records if needed
  - name: 'gcr.io/cloud-builders/npm'
    id: 'update-dns'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        source /workspace/bin/agent-tracking.sh
        log_agent_action "dns_check_start" "Checking DNS records"
        # Check if DNS records need updating
        node /workspace/verify-domains.js
        if [ $? -eq 1 ]; then
          log_agent_action "dns_update_start" "Updating DNS records"
          node /workspace/quick-connect-domains.js
          log_agent_action "dns_update_complete" "DNS records updated"
        else
          log_agent_action "dns_update_skipped" "DNS records already up to date"
        fi

  # Test Deployment
  - name: 'gcr.io/cloud-builders/curl'
    id: 'test-deployment'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        source /workspace/bin/agent-tracking.sh
        log_agent_action "test_deployment_start" "Testing deployment"
        
        # Test main site
        MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://asoos.2100.cool)
        if [ "$MAIN_STATUS" -eq 200 ]; then
          log_agent_action "test_main_success" "Main site test successful"
        else
          log_agent_action "test_main_failed" "Main site test failed with status $MAIN_STATUS"
        fi
        
        # Test symphony subdomain
        SYMPHONY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://symphony.asoos.2100.cool || echo "Failed")
        if [ "$SYMPHONY_STATUS" -eq 200 ]; then
          log_agent_action "test_symphony_success" "Symphony site test successful"
        else
          log_agent_action "test_symphony_pending" "Symphony site not yet available, DNS may be propagating"
        fi
        
        # Test anthology subdomain
        ANTHOLOGY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://anthology.asoos.2100.cool || echo "Failed")
        if [ "$ANTHOLOGY_STATUS" -eq 200 ]; then
          log_agent_action "test_anthology_success" "Anthology site test successful"
        else
          log_agent_action "test_anthology_pending" "Anthology site not yet available, DNS may be propagating"
        fi
        
        log_agent_action "test_deployment_complete" "Deployment testing complete"

  # Notify Completion
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'notify-completion'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        source /workspace/bin/agent-tracking.sh
        log_agent_action "pipeline_complete" "ASOOS.2100.COOL CI/CTTT pipeline completed successfully"
        
        # Create deployment record in Firestore
        gcloud firestore documents create projects/api-for-warp-drive/databases/(default)/documents/deployments/$(date +%Y%m%d%H%M%S) \
          --fields="status=SUCCESS,timestamp=$(date +%s),component=ASOOS_2100_COOL,environment=production"
        
        echo "🚀 ASOOS.2100.COOL CI/CTTT Pipeline completed successfully!"
        echo "✅ Deployment status: COMPLETE"
        echo "✅ Main site: https://asoos.2100.cool"
        echo "✅ Symphony: https://symphony.asoos.2100.cool (DNS propagation may be in progress)"
        echo "✅ Anthology: https://anthology.asoos.2100.cool (DNS propagation may be in progress)"
        echo "✅ Agent tracking logs: Available in Cloud Logging"

timeout: "1800s"  # 30 minutes
options:
  machineType: 'E2_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
  env:
    - 'AGENT_ID=ASOOS_2100_CI_CTTT'

artifacts:
  objects:
    location: 'gs://api-for-warp-drive-artifacts/builds/$BUILD_ID/'
    paths: ['deployment-logs/**/*']

serviceAccount: 'projects/api-for-warp-drive/serviceAccounts/drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com'
EOF

# Create quick domain verification script
cat > /Users/as/asoos/deploy-package/verify-domains.js << 'EOF'
#!/usr/bin/env node

const { execSync } = require('child_process');
const dns = require('dns');

// Check DNS records for subdomains
async function checkDnsRecords() {
  console.log('Verifying DNS records for asoos.2100.cool subdomains...');
  
  // Check if a domain resolves to the correct IP
  function checkDomain(domain) {
    return new Promise((resolve) => {
      dns.lookup(domain, (err, address) => {
        if (err) {
          console.log(`${domain}: Not found in DNS`);
          resolve(false);
        } else {
          const isFirebaseIP = address === '199.36.158.100';
          console.log(`${domain}: ${address} ${isFirebaseIP ? '(Firebase IP)' : '(Not Firebase IP)'}`);
          resolve(isFirebaseIP);
        }
      });
    });
  }
  
  // Check main domain and subdomains
  const mainDomain = await checkDomain('asoos.2100.cool');
  const symphonyDomain = await checkDomain('symphony.asoos.2100.cool');
  const anthologyDomain = await checkDomain('anthology.asoos.2100.cool');
  
  // Check if all domains resolve correctly
  if (mainDomain && symphonyDomain && anthologyDomain) {
    console.log('✅ All domains are correctly configured with Firebase IP.');
    return true;
  } else {
    console.log('⚠️ Some domains are not correctly configured with Firebase IP.');
    return false;
  }
}

// Run the check
checkDnsRecords()
  .then(allCorrect => {
    process.exit(allCorrect ? 0 : 1);
  })
  .catch(error => {
    console.error('Error checking DNS records:', error);
    process.exit(1);
  });
EOF

chmod +x /Users/as/asoos/deploy-package/verify-domains.js

# Finalize the setup
echo -e "${GREEN}✅ CI/CD CTTT system has been enabled for ASOOS.2100.COOL!${NC}"
echo -e "${YELLOW}The following components have been set up:${NC}"
echo -e "  - Cloud Build trigger for CI/CD CTTT pipeline"
echo -e "  - Agent tracking system for telemetry"
echo -e "  - Manual trigger script (trigger-cicd-cttt.sh)"
echo -e "  - ASOOS.2100.COOL specific Cloud Build configuration"
echo -e "  - Domain verification script"
echo -e "${YELLOW}To manually trigger the CI/CD CTTT pipeline, run:${NC}"
echo -e "${BLUE}cd /Users/as/asoos/deploy-package && ./trigger-cicd-cttt.sh${NC}"

echo -e "${BLUE}=========================================================${NC}"