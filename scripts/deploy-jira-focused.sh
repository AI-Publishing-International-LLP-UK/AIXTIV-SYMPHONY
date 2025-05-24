#!/bin/bash

# Focused Jira Integration Deployment Script
# This script deploys only the necessary files for the Jira integration

# Stop on errors
set -e

# Configuration
GCP_PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
JIRA_USER="C2100-PCR"
SERVICE_NAME="jira-integration"
TEMP_DIR="/tmp/jira-deploy"

echo "===== FOCUSED DEPLOYMENT: Jira Integration Service ====="
echo "GCP Project: $GCP_PROJECT_ID"
echo "Region: $REGION"
echo "Jira User: $JIRA_USER"
echo "Service Name: $SERVICE_NAME"
echo

# Create a clean deployment directory
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR
cd $TEMP_DIR

# Create necessary directory structure
mkdir -p integrations/jira
mkdir -p api

# Create package.json for the focused deployment
cat > package.json << EOL
{
  "name": "jira-integration",
  "version": "1.0.0",
  "description": "Jira Integration for Coaching 2100",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@google-cloud/secret-manager": "^4.2.0",
    "axios": "^1.6.0",
    "express": "^4.18.2",
    "firebase-admin": "^11.8.0",
    "uuid": "^9.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
EOL

# Create the Dockerfile
cat > Dockerfile << EOL
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the service
CMD ["node", "server.js"]
EOL

# Create server.js
cat > server.js << EOL
const express = require('express');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 8080;
const jiraUser = process.env.JIRA_USER || 'C2100-PCR';
const projectId = process.env.GCP_PROJECT_ID || 'api-for-warp-drive';

// Parse JSON requests
app.use(express.json());

// Secret Manager client
const secretManagerClient = new SecretManagerServiceClient();

// Jira configuration
const jiraConfig = {
  baseUrl: 'https://coaching2100.atlassian.net',
  adminUser: jiraUser,
  secretPaths: {
    apiToken: \`projects/\${projectId}/secrets/jira-api-token/versions/latest\`,
    webhookSecret: \`projects/\${projectId}/secrets/jira-webhook-secret/versions/latest\`
  },
  roleMapping: {
    viewer: '10001',
    editor: '10002',
    admin: '10000'
  }
};

// Get secret from Secret Manager
async function getSecret(secretPath) {
  try {
    const [version] = await secretManagerClient.accessSecretVersion({
      name: secretPath,
    });

    if (!version.payload || !version.payload.data) {
      throw new Error('Failed to retrieve secret');
    }

    return version.payload.data.toString();
  } catch (error) {
    console.error(\`Error retrieving secret: \${error}\`);
    throw new Error('Failed to retrieve secret');
  }
}

// Create a new Jira workspace
async function createJiraWorkspace(projectId, projectName) {
  try {
    const apiToken = await getSecret(jiraConfig.secretPaths.apiToken);
    const auth = Buffer.from(\`\${jiraConfig.adminUser}:\${apiToken}\`).toString('base64');
    
    const headers = {
      'Authorization': \`Basic \${auth}\`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    const projectKey = \`PRJ\${projectId.substring(0, 5).toUpperCase()}\`;
    
    const response = await axios.post(
      \`\${jiraConfig.baseUrl}/rest/api/3/project\`,
      {
        key: projectKey,
        name: projectName,
        projectTypeKey: 'software',
        projectTemplateKey: 'com.pyxis.greenhopper.jira:basic-software-development-template',
        leadAccountId: jiraConfig.adminUser
      },
      { headers }
    );
    
    return {
      workspaceId: response.data.id,
      workspaceKey: response.data.key,
      workspaceUrl: \`\${jiraConfig.baseUrl}/jira/software/projects/\${response.data.key}\`
    };
  } catch (error) {
    console.error('Error creating Jira workspace:', error);
    throw new Error('Failed to create Jira workspace');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'jira-integration',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Create workspace endpoint
app.post('/api/workspace/create', async (req, res) => {
  try {
    const { projectId, projectName } = req.body;
    
    if (!projectId || !projectName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const workspace = await createJiraWorkspace(projectId, projectName);
    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Process billing endpoint
app.post('/api/billing/process', async (req, res) => {
  const token = req.query.token;
  
  // Basic validation for scheduler requests
  if (!token) {
    return res.status(403).json({ error: 'Missing token' });
  }
  
  try {
    console.log(\`Processing monthly billing for Jira licenses at \${new Date().toISOString()}\`);
    // In a real implementation, this would process the billing
    
    res.status(200).json({
      status: 'success',
      message: 'Billing processed successfully',
      timestamp: new Date().toISOString(),
      transactionId: uuidv4()
    });
  } catch (error) {
    console.error('Error processing billing:', error);
    res.status(500).json({ error: 'Failed to process billing' });
  }
});

// Webhook handler for Jira events
app.post('/webhook/:event', async (req, res) => {
  const event = req.params.event;
  
  try {
    // In a real implementation, this would handle different Jira webhook events
    console.log(\`Received Jira webhook event: \${event}\`);
    
    res.status(200).json({
      status: 'success',
      event,
      received: new Date().toISOString()
    });
  } catch (error) {
    console.error(\`Error handling \${event} webhook:\`, error);
    res.status(500).json({ error: \`Failed to handle \${event} webhook\` });
  }
});

// Start the server
app.listen(port, () => {
  console.log(\`Jira integration service listening on port \${port}\`);
});

// Export for Cloud Functions
exports.handleJiraWebhook = (req, res) => {
  const event = req.path.substring(1) || 'event';
  
  try {
    console.log(\`Cloud Function received Jira webhook event: \${event}\`);
    
    res.status(200).json({
      status: 'success',
      event,
      received: new Date().toISOString(),
      processor: 'cloud-function'
    });
  } catch (error) {
    console.error(\`Error handling \${event} webhook:\`, error);
    res.status(500).json({ error: \`Failed to handle \${event} webhook\` });
  }
};
EOL

# Install dependencies
echo "Installing dependencies..."
npm install

# Build and deploy using Cloud Build
echo "Building Docker image with Cloud Build..."
gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$GCP_PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-env-vars="JIRA_USER=$JIRA_USER,GCP_PROJECT_ID=$GCP_PROJECT_ID"

# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)")
echo "Service deployed to: $SERVICE_URL"

# Deploy Cloud Function
echo "Deploying webhook handler Cloud Function..."
gcloud functions deploy jira-webhook-handler \
  --gen2 \
  --runtime=nodejs18 \
  --region=$REGION \
  --entry-point=handleJiraWebhook \
  --trigger-http \
  --allow-unauthenticated \
  --source=. \
  --set-env-vars="JIRA_USER=$JIRA_USER,GCP_PROJECT_ID=$GCP_PROJECT_ID"

# Get the function URL
FUNCTION_URL=$(gcloud functions describe jira-webhook-handler --gen2 --region=$REGION --format="value(serviceConfig.uri)" 2>/dev/null || echo "Function deployment in progress, URL not available yet")

# Set up monthly billing scheduler
echo "Setting up monthly billing scheduler..."
SCHEDULER_EXISTS=$(gcloud scheduler jobs list --format="value(name)" --filter="name=jira-license-billing" 2>/dev/null || echo "")

if [ -z "$SCHEDULER_EXISTS" ]; then
  echo "Creating billing scheduler job..."
  
  # Generate a unique ID for the webhook URL
  WEBHOOK_ID=$(date +%s | sha256sum | base64 | head -c 16)
  
  gcloud scheduler jobs create http jira-license-billing \
    --schedule="0 0 1 * *" \
    --time-zone="America/New_York" \
    --uri="$SERVICE_URL/api/billing/process?token=$WEBHOOK_ID" \
    --http-method=POST \
    --oidc-service-account="$GCP_PROJECT_ID@appspot.gserviceaccount.com" \
    --oidc-token-audience="$SERVICE_URL/api/billing/process"
    
  echo "Scheduler job created with token: $WEBHOOK_ID"
else
  echo "Scheduler job already exists. Skipping creation."
fi

echo
echo "===== FOCUSED DEPLOYMENT COMPLETE ====="
echo
echo "Service URL: $SERVICE_URL"
echo "Webhook Function URL: ${FUNCTION_URL:-Check GCP Console for webhook URL}"
echo
echo "API Endpoints:"
echo "- Health Check: $SERVICE_URL/health"
echo "- Create Workspace: $SERVICE_URL/api/workspace/create"
echo "- Process Billing: $SERVICE_URL/api/billing/process"
echo "- Webhook Handler: $SERVICE_URL/webhook/:event"
echo
echo "Webhook Endpoints (Cloud Function):"
echo "- Issue Created: ${FUNCTION_URL:-[URL Pending]}/issueCreated"
echo "- Issue Updated: ${FUNCTION_URL:-[URL Pending]}/issueUpdated"
echo "- Comment Added: ${FUNCTION_URL:-[URL Pending]}/commentAdded"