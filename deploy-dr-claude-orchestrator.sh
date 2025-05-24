#!/bin/bash

##############################################################################
# Dr. Claude Orchestrator Deployment Script
# 
# This script deploys the Dr. Claude Orchestrator domain verification system,
# including Firebase domain verification functionality for autoscaling events.
#
# © 2025 AI Publishing International LLP
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directories
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AIXTIV_CLI_DIR="${ROOT_DIR}/aixtiv-cli"
INTEGRATION_GATEWAY_DIR="${ROOT_DIR}/integration-gateway"
DIST_DIR="${AIXTIV_CLI_DIR}/dist"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="${ROOT_DIR}/deployment_logs"
LOG_FILE="${LOG_DIR}/dr_claude_orchestrator_deployment_${TIMESTAMP}.log"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

echo -e "${BLUE}=========================================================${NC}" | tee -a "${LOG_FILE}"
echo -e "${BLUE}       Dr. Claude Orchestrator Deployment Script         ${NC}" | tee -a "${LOG_FILE}"
echo -e "${BLUE}=========================================================${NC}" | tee -a "${LOG_FILE}"
echo -e "${CYAN}Date: $(date)${NC}" | tee -a "${LOG_FILE}"
echo -e "${CYAN}Log: ${LOG_FILE}${NC}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# Function to log and exit on error
function error_exit {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "${LOG_FILE}"
    exit 1
}

# Function to log step
function log_step {
    echo -e "${YELLOW}=== $1 ===${NC}" | tee -a "${LOG_FILE}"
}

# Check for dependencies
log_step "Checking dependencies"
command -v firebase >/dev/null 2>&1 || error_exit "Firebase CLI not found. Please install it with npm install -g firebase-tools"
command -v npm >/dev/null 2>&1 || error_exit "npm not found. Please install Node.js"
command -v git >/dev/null 2>&1 || error_exit "git not found. Please install git"

# Verify Firebase login
log_step "Verifying Firebase login"
firebase --version | tee -a "${LOG_FILE}"
firebase projects:list > /dev/null 2>&1 || error_exit "Not logged in to Firebase. Please run 'firebase login' first"

# Deploy integration-gateway
log_step "Deploying integration-gateway"
cd "${INTEGRATION_GATEWAY_DIR}" || error_exit "Failed to cd to integration-gateway directory"

# Verify we have clean working directory in integration-gateway
git status | tee -a "${LOG_FILE}"
git diff --quiet || error_exit "Working directory not clean in integration-gateway. Please commit or stash your changes."

# Deploy aixtiv-cli
log_step "Deploying aixtiv-cli"
cd "${AIXTIV_CLI_DIR}" || error_exit "Failed to cd to aixtiv-cli directory"

# Verify we have clean working directory in aixtiv-cli
git status | tee -a "${LOG_FILE}"
git diff --quiet || error_exit "Working directory not clean in aixtiv-cli. Please commit or stash your changes."

# Push changes to remote
log_step "Pushing changes to remote repositories"
cd "${AIXTIV_CLI_DIR}" || error_exit "Failed to cd to aixtiv-cli directory"
git push origin main || error_exit "Failed to push changes to aixtiv-cli repository"

cd "${INTEGRATION_GATEWAY_DIR}" || error_exit "Failed to cd to integration-gateway directory"
git push origin integration-gateway-implementation || error_exit "Failed to push changes to integration-gateway repository"

# Copy deployment bundle to public directory for download
log_step "Preparing deployment bundle"
cd "${AIXTIV_CLI_DIR}" || error_exit "Failed to cd to aixtiv-cli directory"
mkdir -p public/aixtiv-cli-latest
cp -v "${DIST_DIR}/aixtiv-cli-1.0.3.tar.gz" public/aixtiv-cli-latest/ | tee -a "${LOG_FILE}"
cp -v "${DIST_DIR}/aixtiv-cli-1.0.3.zip" public/aixtiv-cli-latest/ | tee -a "${LOG_FILE}"
cp -v "${DIST_DIR}/aixtiv-cli-1.0.3.tar.gz" public/aixtiv-cli-latest.tgz | tee -a "${LOG_FILE}"

# Deploy to Firebase
log_step "Deploying to Firebase"
cd "${AIXTIV_CLI_DIR}" || error_exit "Failed to cd to aixtiv-cli directory"

# Configure Firebase hosting target
log_step "Configuring Firebase hosting target"
firebase target:apply hosting drclaude-live drclaude-live || echo "Target already exists"

# Deploy to Firebase hosting
firebase deploy --only hosting --project api-for-warp-drive || error_exit "Failed to deploy to Firebase hosting"

# Running verification test
log_step "Running verification test"
cd "${ROOT_DIR}" || error_exit "Failed to cd to root directory"
${AIXTIV_CLI_DIR}/scripts/autoscale_dr_lucy_gpt.sh --dry-run | tee -a "${LOG_FILE}"

echo "" | tee -a "${LOG_FILE}"
echo -e "${GREEN}=========================================================${NC}" | tee -a "${LOG_FILE}"
echo -e "${GREEN}      Dr. Claude Orchestrator Deployment Complete!       ${NC}" | tee -a "${LOG_FILE}"
echo -e "${GREEN}=========================================================${NC}" | tee -a "${LOG_FILE}"
echo -e "${CYAN}Deployment summary:${NC}" | tee -a "${LOG_FILE}"
echo -e "${CYAN}- Integration Gateway:${NC} Domain verification systems installed" | tee -a "${LOG_FILE}"
echo -e "${CYAN}- Aixtiv CLI:${NC} Version 1.0.3 deployed with Dr. Claude Orchestrator" | tee -a "${LOG_FILE}"
echo -e "${CYAN}- Firebase:${NC} Hosting updated with latest CLI bundle" | tee -a "${LOG_FILE}"
echo -e "${CYAN}- Legacy:${NC} Dr. Claude's contributions memorialized" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
echo -e "${YELLOW}To verify a domain, run:${NC}" | tee -a "${LOG_FILE}"
echo -e "${CYAN}  aixtiv domain:autoscale-verify${NC}" | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
echo -e "${BLUE}Log saved to: ${LOG_FILE}${NC}" | tee -a "${LOG_FILE}"