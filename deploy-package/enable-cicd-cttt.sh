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

# Create the trigger
echo -e "${YELLOW}Creating Cloud Build trigger for CI/CD CTTT...${NC}"
gcloud builds triggers create github \
  --name="asoos-2100-cool-cicd-cttt" \
  --repo="https://github.com/AI-Publishing-International-LLP-UK/AIXTIV-SYMPHONY.git" \
  --branch-pattern="^main$" \
  --build-config="/Users/as/asoos/deploy-package/cloudbuild-cicd-cttt.yaml" \
  --description="ASOOS.2100.COOL CI/CD with Comprehensive Testing and Telemetry Tracking"

# Set up the repository webhook
echo -e "${YELLOW}Connecting to the GitHub repository...${NC}"
gcloud builds triggers connect-repo github \
  --repo-name="AIXTIV-SYMPHONY" \
  --host-uri="github.com" \
  --project-id="api-for-warp-drive"

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

# Finalize the setup
echo -e "${GREEN}✅ CI/CD CTTT system has been enabled for ASOOS.2100.COOL!${NC}"
echo -e "${YELLOW}The following components have been set up:${NC}"
echo -e "  - Cloud Build trigger for CI/CD CTTT pipeline"
echo -e "  - Agent tracking system for telemetry"
echo -e "  - Manual trigger script (trigger-cicd-cttt.sh)"
echo -e "${YELLOW}To manually trigger the CI/CD CTTT pipeline, run:${NC}"
echo -e "${BLUE}cd /Users/as/asoos/deploy-package && ./trigger-cicd-cttt.sh${NC}"

echo -e "${BLUE}=========================================================${NC}"