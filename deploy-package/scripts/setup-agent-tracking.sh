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
