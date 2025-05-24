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
