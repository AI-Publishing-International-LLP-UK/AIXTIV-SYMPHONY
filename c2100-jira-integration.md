# Jira Integration Setup for Coaching 2100

This guide explains how to set up the Jira integration with both repository types:
1. Personal C2100-PCR repository
2. Coaching 2100 organization repository

## Repository Structure

The code is organized as follows:
- `integration-gateway/integrations/jira/` - Core Jira integration code
- `integration-gateway/api/jira-webhooks.ts` - Webhook handlers for bidirectional integration
- `integration-gateway/cloudbuild.yaml` - Build configuration
- `frontend/opus1/dashboard/` - Frontend components for licensing UI

## Personal Repository Setup (C2100-PCR)

### 1. Connect GitHub Repository

1. Visit: https://console.cloud.google.com/cloud-build/triggers/connect?project=api-for-warp-drive
2. Select "GitHub (Cloud Build GitHub App)"
3. Authenticate with GitHub if prompted
4. Select your personal repository
5. Click "Connect"

### 2. Create Cloud Build Trigger

1. Visit: https://console.cloud.google.com/cloud-build/triggers/create?project=api-for-warp-drive
2. Fill in the form with these values:
   - Name: `jira-integration-personal`
   - Description: `Deploy Jira integration from personal repo`
   - Event: `Push to a branch`
   - Repository: Select your personal repository
   - Branch: `^main$` (Regular expression)
   - Configuration: `Cloud Build configuration file (yaml or json)`
   - Location: `Repository`
   - Cloud Build configuration file location: `integration-gateway/cloudbuild.yaml`
   - Include files filter (optional): 
     ```
     integration-gateway/integrations/jira/**
     integration-gateway/api/jira-webhooks.ts
     integration-gateway/cloudbuild.yaml
     ```
   - Substitution variables:
     - _REGION: `us-west1`
     - _SERVICE_NAME: `jira-integration`
     - _MIN_INSTANCES: `1`
     - _MAX_INSTANCES: `10`
     - _JIRA_USER: `C2100-PCR`
3. Click "Create"

## Organization Repository Setup (coaching2100)

### 1. Connect Organization Repository

1. Visit: https://console.cloud.google.com/cloud-build/triggers/connect?project=api-for-warp-drive
2. Select "GitHub (Cloud Build GitHub App)"
3. Authenticate with GitHub if prompted
4. Select the organization repository `coaching2100/asoos`
5. Click "Connect"

### 2. Create Cloud Build Trigger

1. Visit: https://console.cloud.google.com/cloud-build/triggers/create?project=api-for-warp-drive
2. Fill in the form with these values:
   - Name: `jira-integration-org`
   - Description: `Deploy Jira integration from organization repo`
   - Event: `Push to a branch`
   - Repository: Select `coaching2100/asoos`
   - Branch: `^main$` (Regular expression)
   - Configuration: `Cloud Build configuration file (yaml or json)`
   - Location: `Repository`
   - Cloud Build configuration file location: `integration-gateway/cloudbuild.yaml`
   - Include files filter (optional): 
     ```
     integration-gateway/integrations/jira/**
     integration-gateway/api/jira-webhooks.ts
     integration-gateway/cloudbuild.yaml
     ```
   - Substitution variables:
     - _REGION: `us-west1`
     - _SERVICE_NAME: `jira-integration`
     - _MIN_INSTANCES: `1`
     - _MAX_INSTANCES: `10`
     - _JIRA_USER: `C2100-PCR`
3. Click "Create"

## Environment Setup

After creating the trigger, you need to set up the required secrets:

1. Set up the Jira API token in Secret Manager:
```
gcloud secrets create jira-api-token \
    --replication-policy="automatic" \
    --data-file=- << EOF
your-jira-api-token-here
EOF
```

2. Set up the webhook secret for signature verification:
```
gcloud secrets create jira-webhook-secret \
    --replication-policy="automatic" \
    --data-file=- << EOF
$(openssl rand -base64 32)
EOF
```

## Manual Deployment

If you need to deploy manually, use the deployment script:

```bash
cd /Users/as/asoos
./scripts/deploy-jira-integration.sh
```

## Jira Webhook Configuration

After deployment, configure these webhook endpoints in Jira:

1. Go to Jira Administration > System > Webhooks
2. Add a new webhook for each event:
   - Issue Created: `https://[FUNCTION_URL]/issueCreated`
   - Issue Updated: `https://[FUNCTION_URL]/issueUpdated` 
   - Comment Added: `https://[FUNCTION_URL]/commentAdded`
3. Use the secret from `jira-webhook-secret` as the signing secret

## Testing the Integration

Test the integration by creating a new project in the dashboard and selecting the Jira licensing option. The system will automatically:

1. Create a license record in Firestore
2. Set up a Jira workspace for the project
3. Invite the project owner with appropriate permissions