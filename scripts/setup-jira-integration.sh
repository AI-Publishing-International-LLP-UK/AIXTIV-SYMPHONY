#!/bin/bash

# Jira Integration Setup Script for Coaching 2100
# This script sets up the Jira integration with GCP

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
JIRA_USER="C2100-PCR"
SECRET_NAME_TOKEN="jira-api-token"
SECRET_NAME_WEBHOOK="jira-webhook-secret"

echo "=== Setting up Jira Integration for Coaching 2100 ==="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Jira User: $JIRA_USER"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if the user is logged in to gcloud
gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q . || {
    echo "Error: You are not logged in to gcloud. Please run 'gcloud auth login' first."
    exit 1
}

# Check if the correct project is set
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$GCP_PROJECT_ID" ]; then
    echo "Setting GCP project to $GCP_PROJECT_ID..."
    gcloud config set project $GCP_PROJECT_ID
fi

# Create Jira API token secret if it doesn't exist
echo "Checking if Jira API token secret exists..."
if ! gcloud secrets describe $SECRET_NAME_TOKEN &> /dev/null; then
    echo "Creating Jira API token secret..."
    read -sp "Enter your Jira API token: " JIRA_API_TOKEN
    echo
    
    echo "$JIRA_API_TOKEN" | gcloud secrets create $SECRET_NAME_TOKEN \
        --replication-policy="automatic" \
        --data-file=-
    
    echo "Jira API token secret created."
else
    echo "Jira API token secret already exists."
fi

# Create webhook secret if it doesn't exist
echo "Checking if Jira webhook secret exists..."
if ! gcloud secrets describe $SECRET_NAME_WEBHOOK &> /dev/null; then
    echo "Creating Jira webhook secret..."
    WEBHOOK_SECRET=$(openssl rand -base64 32)
    
    echo "$WEBHOOK_SECRET" | gcloud secrets create $SECRET_NAME_WEBHOOK \
        --replication-policy="automatic" \
        --data-file=-
    
    echo "Jira webhook secret created: $WEBHOOK_SECRET"
    echo "Please use this secret when setting up webhooks in Jira."
else
    echo "Jira webhook secret already exists."
fi

# Set up IAM permissions for the function to access secrets
echo "Setting up IAM permissions..."
SERVICE_ACCOUNT="$GCP_PROJECT_ID@appspot.gserviceaccount.com"

gcloud secrets add-iam-policy-binding $SECRET_NAME_TOKEN \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding $SECRET_NAME_WEBHOOK \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

echo "IAM permissions set up."

# Install required dependencies
echo "Installing required dependencies..."
cd /Users/as/asoos/integration-gateway
npm install @google-cloud/secret-manager axios uuid

echo "=== Jira Integration Setup Complete ==="
echo "Next steps:"
echo "1. Set up webhook endpoints in Jira Cloud for issue events"
echo "2. Configure Jira project templates for new workspaces"
echo "3. Test the integration by creating a new project in the dashboard"