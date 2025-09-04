#!/bin/bash

# GCP Setup Script for MOCOA Owner Interface with Secret Manager
# Run this script to set up GCP secrets and service account permissions

set -e  # Exit on error

PROJECT_ID="api-for-warp-drive"
SERVICE_ACCOUNT_NAME="mocoa-cloud-run-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
REGION="us-central1"

echo "🚀 Setting up GCP infrastructure for MOCOA Owner Interface"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo ""

# Check if user is authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "⚡ Enabling required GCP APIs..."
gcloud services enable secretmanager.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com

# Create secrets (you'll need to set these values manually)
echo "🔐 Creating GCP secrets..."

# Check if secrets exist, create if they don't
if ! gcloud secrets describe elevenlabs-api-key --quiet 2>/dev/null; then
    echo "Creating elevenlabs-api-key secret..."
    echo "Please enter your ElevenLabs API key (it will be hidden):"
    read -s ELEVENLABS_KEY
    echo "$ELEVENLABS_KEY" | gcloud secrets create elevenlabs-api-key --data-file=-
    echo "✅ ElevenLabs API key secret created"
else
    echo "✅ elevenlabs-api-key secret already exists"
fi

if ! gcloud secrets describe openai-api-key --quiet 2>/dev/null; then
    echo "Creating openai-api-key secret..."
    echo "Please enter your OpenAI API key (it will be hidden):"
    read -s OPENAI_KEY
    echo "$OPENAI_KEY" | gcloud secrets create openai-api-key --data-file=-
    echo "✅ OpenAI API key secret created"
else
    echo "✅ openai-api-key secret already exists"
fi

if ! gcloud secrets describe anthropic-api-key --quiet 2>/dev/null; then
    echo "Creating anthropic-api-key secret..."
    echo "Please enter your Anthropic API key (it will be hidden):"
    read -s ANTHROPIC_KEY
    echo "$ANTHROPIC_KEY" | gcloud secrets create anthropic-api-key --data-file=-
    echo "✅ Anthropic API key secret created"
else
    echo "✅ anthropic-api-key secret already exists"
fi

# Dr. Lucy specific secrets for conversation history and knowledge access
echo "🧠 Creating Dr. Lucy specific secrets..."

# Dr. Lucy conversation history
if ! gcloud secrets describe dr-lucy-conversation-history --quiet 2>/dev/null; then
    echo "Creating dr-lucy-conversation-history secret..."
    echo '{"conversations": [], "last_updated": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "version": "1.0"}' | gcloud secrets create dr-lucy-conversation-history --data-file=-
    echo "✅ Dr. Lucy conversation history secret created"
else
    echo "✅ dr-lucy-conversation-history secret already exists"
fi

# Dr. Lucy knowledge base
if ! gcloud secrets describe dr-lucy-knowledge-base --quiet 2>/dev/null; then
    echo "Creating dr-lucy-knowledge-base secret..."
    echo '{"knowledge_base": {}, "flight_memory": {}, "last_sync": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | gcloud secrets create dr-lucy-knowledge-base --data-file=-
    echo "✅ Dr. Lucy knowledge base secret created"
else
    echo "✅ dr-lucy-knowledge-base secret already exists"
fi

# Dr. Lucy flight memory
if ! gcloud secrets describe dr-lucy-flight-memory --quiet 2>/dev/null; then
    echo "Creating dr-lucy-flight-memory secret..."
    echo '{"memory_archive": {}, "pilot_connections": 20000000, "last_accessed": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | gcloud secrets create dr-lucy-flight-memory --data-file=-
    echo "✅ Dr. Lucy flight memory secret created"
else
    echo "✅ dr-lucy-flight-memory secret already exists"
fi

# Claude.ai conversation history for Dr. Claude
if ! gcloud secrets describe claude-ai-conversation-history --quiet 2>/dev/null; then
    echo "Creating claude-ai-conversation-history secret..."
    echo '{"claude_conversations": [], "history_span": "2_years", "last_archived": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | gcloud secrets create claude-ai-conversation-history --data-file=-
    echo "✅ Claude.ai conversation history secret created"
else
    echo "✅ claude-ai-conversation-history secret already exists"
fi

# ChatGPT conversation vectors
if ! gcloud secrets describe chatgpt-conversation-vectors --quiet 2>/dev/null; then
    echo "Creating chatgpt-conversation-vectors secret..."
    echo '{"vectors": [], "embeddings": {}, "vector_count": 0, "last_updated": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | gcloud secrets create chatgpt-conversation-vectors --data-file=-
    echo "✅ ChatGPT conversation vectors secret created"
else
    echo "✅ chatgpt-conversation-vectors secret already exists"
fi

# OpenAI conversation history
if ! gcloud secrets describe openai-conversation-history --quiet 2>/dev/null; then
    echo "Creating openai-conversation-history secret..."
    echo '{"openai_conversations": [], "gpt_memory": {}, "context_tokens": 0, "last_sync": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' | gcloud secrets create openai-conversation-history --data-file=-
    echo "✅ OpenAI conversation history secret created"
else
    echo "✅ openai-conversation-history secret already exists"
fi

# Dr. Lucy credentials (service account specific)
if ! gcloud secrets describe dr-lucy-credentials --quiet 2>/dev/null; then
    echo "Creating dr-lucy-credentials secret..."
    echo '{"service_account": "drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com", "capabilities": {"ml_engine": true, "deep_mind_access": true, "flight_memory": true}, "auth_level": 5}' | gcloud secrets create dr-lucy-credentials --data-file=-
    echo "✅ Dr. Lucy credentials secret created"
else
    echo "✅ dr-lucy-credentials secret already exists"
fi

# Create service account
echo "👤 Setting up service account..."
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --quiet 2>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="MOCOA Cloud Run Service Account" \
        --description="Service account for MOCOA application with Secret Manager access"
    echo "✅ Service account created: $SERVICE_ACCOUNT_EMAIL"
else
    echo "✅ Service account already exists: $SERVICE_ACCOUNT_EMAIL"
fi

# Grant necessary permissions to the service account
echo "🔒 Granting permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/monitoring.metricWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/trace.agent"

echo "✅ Permissions granted to service account"

# Grant specific secret access
echo "🗝️  Granting specific secret access..."
for secret in elevenlabs-api-key openai-api-key anthropic-api-key dr-lucy-conversation-history dr-lucy-knowledge-base dr-lucy-flight-memory claude-ai-conversation-history chatgpt-conversation-vectors openai-conversation-history dr-lucy-credentials; do
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="roles/secretmanager.secretAccessor"
    echo "✅ Granted access to $secret"
done

# Create Cloud Build trigger (optional)
echo "🔨 Setting up Cloud Build..."
if ! gcloud builds triggers list --filter="name:mocoa-owner-interface-trigger" --format="value(name)" | grep -q .; then
    echo "Creating Cloud Build trigger..."
    gcloud builds triggers create github \
        --repo-name="mocoa-owner-interface-fixed" \
        --repo-owner="asoos" \
        --branch-pattern="^main$" \
        --build-config="cloudbuild.yaml" \
        --name="mocoa-owner-interface-trigger" \
        --description="Automated deployment for MOCOA Owner Interface" || true
    echo "✅ Cloud Build trigger created (if GitHub repo is connected)"
else
    echo "✅ Cloud Build trigger already exists"
fi

echo ""
echo "🎉 GCP setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "  • Project: $PROJECT_ID"
echo "  • Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "  • Secrets created: elevenlabs-api-key, openai-api-key, anthropic-api-key"
echo "  • APIs enabled: Secret Manager, Cloud Run, Cloud Build"
echo "  • IAM permissions configured"
echo ""
echo "🚀 Next steps:"
echo "  1. Deploy to Cloud Run:"
echo "     gcloud builds submit --config=cloudbuild.yaml ."
echo ""
echo "  2. Or deploy manually:"
echo "     gcloud run deploy mocoa-owner-interface \\"
echo "       --source . \\"
echo "       --region=$REGION \\"
echo "       --service-account=$SERVICE_ACCOUNT_EMAIL \\"
echo "       --set-env-vars=\"GCP_PROJECT_ID=$PROJECT_ID\" \\"
echo "       --set-secrets=\"ELEVENLABS_API_KEY=elevenlabs-api-key:latest\" \\"
echo "       --set-secrets=\"OPENAI_API_KEY=openai-api-key:latest\" \\"
echo "       --set-secrets=\"ANTHROPIC_API_KEY=anthropic-api-key:latest\" \\"
echo "       --allow-unauthenticated \\"
echo "       --port=3000"
echo ""
echo "  3. Update your DNS to point to the Cloud Run service URL"
echo ""
