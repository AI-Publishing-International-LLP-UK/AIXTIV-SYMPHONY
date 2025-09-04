# MOCOA Owner Interface - Secure Deployment Guide

This guide covers deploying the MOCOA Owner Interface with GCP Secret Manager integration for secure API key management.

## Overview

The deployment includes:
- 🔐 **GCP Secret Manager** for secure API key storage
- ☁️ **Cloud Run** for scalable containerized hosting  
- 🛡️ **Service Account** with least-privilege permissions
- 🎙️ **ElevenLabs TTS** server-side proxy endpoint
- ⚡ **Automated CI/CD** with Cloud Build

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Docker** (for local testing)
4. **API Keys** for ElevenLabs, OpenAI, and Anthropic

## Quick Setup

### 1. Run the Setup Script

```bash
# Make the script executable
chmod +x setup-gcp-secrets.sh

# Run the setup (will prompt for API keys)
./setup-gcp-secrets.sh
```

### 2. Deploy to Cloud Run

```bash
# Option A: Using Cloud Build (Recommended)
gcloud builds submit --config=cloudbuild.yaml .

# Option B: Direct deployment
gcloud run deploy mocoa-owner-interface \
  --source . \
  --region=us-central1 \
  --service-account=mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com \
  --set-env-vars="GCP_PROJECT_ID=api-for-warp-drive" \
  --set-secrets="ELEVENLABS_API_KEY=elevenlabs-api-key:latest" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
  --allow-unauthenticated \
  --port=3000 \
  --memory=2Gi \
  --cpu=2 \
  --concurrency=100 \
  --timeout=300
```

## Manual Setup (Step by Step)

### Step 1: Enable APIs

```bash
gcloud services enable secretmanager.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 2: Create Secrets

```bash
# ElevenLabs API Key
echo "your-elevenlabs-api-key" | gcloud secrets create elevenlabs-api-key --data-file=-

# OpenAI API Key  
echo "your-openai-api-key" | gcloud secrets create openai-api-key --data-file=-

# Anthropic API Key
echo "your-anthropic-api-key" | gcloud secrets create anthropic-api-key --data-file=-
```

### Step 3: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create mocoa-cloud-run-sa \
  --display-name="MOCOA Cloud Run Service Account" \
  --description="Service account for MOCOA application with Secret Manager access"

# Grant permissions
gcloud projects add-iam-policy-binding api-for-warp-drive \
  --member="serviceAccount:mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding api-for-warp-drive \
  --member="serviceAccount:mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

### Step 4: Grant Secret Access

```bash
for secret in elevenlabs-api-key openai-api-key anthropic-api-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Local Development

### Run Locally with Docker

```bash
# Build the container
docker build -t mocoa-owner-interface .

# Run with environment variables (for local testing)
docker run -p 3000:3000 \
  -e NODE_ENV=development \
  -e GCP_PROJECT_ID=api-for-warp-drive \
  -e ELEVENLABS_API_KEY=your-key-here \
  mocoa-owner-interface
```

### Run with Node.js

```bash
# Install dependencies
npm install

# Set environment variables
export GCP_PROJECT_ID=api-for-warp-drive
export NODE_ENV=development
export ELEVENLABS_API_KEY=your-key-here

# Start the server
npm start
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GCP_PROJECT_ID` | GCP project ID | Yes |
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Server port (default: 3000) | No |
| `CORS_ORIGIN` | Allowed CORS origins | No |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | No |

### Secrets (GCP Secret Manager)

| Secret Name | Description |
|-------------|-------------|
| `elevenlabs-api-key` | ElevenLabs API key for TTS |
| `openai-api-key` | OpenAI API key for TTS fallback |
| `anthropic-api-key` | Anthropic API key for Claude |

## Security Features

### 🔐 API Key Protection
- All API keys stored in GCP Secret Manager
- No keys exposed in environment variables or code
- Server-side proxy endpoints for external APIs

### 🛡️ Access Control
- Service account with minimal required permissions
- Allowed secrets list prevents unauthorized access
- Rate limiting on API endpoints

### 🌐 Network Security
- HTTPS enforced in production
- CORS properly configured
- Security headers with Helmet.js

### 📊 Monitoring
- Health check endpoints (`/health`, `/ready`)
- Structured logging to Cloud Logging
- Error tracking and monitoring

## API Endpoints

### Public Endpoints

- `GET /` - Main interface
- `GET /health` - Health check
- `GET /ready` - Readiness check

### Secure Endpoints

- `GET /api/gcp/secrets/:secretName` - Retrieve secrets (internal)
- `POST /api/elevenlabs/tts` - Text-to-speech proxy

### Allowed Secrets

Only these secrets can be accessed via the API:
- `elevenlabs-api-key`
- `openai-api-key` 
- `anthropic-api-key`

## Troubleshooting

### Common Issues

**1. Secret Access Denied**
```bash
# Check service account permissions
gcloud secrets get-iam-policy elevenlabs-api-key
```

**2. Container Build Fails**
```bash
# Check Cloud Build logs
gcloud builds log [BUILD_ID]
```

**3. Service Won't Start**
```bash
# Check Cloud Run logs
gcloud run logs tail mocoa-owner-interface --region=us-central1
```

### Debug Commands

```bash
# Test secret access
gcloud secrets versions access latest --secret=elevenlabs-api-key

# Check service account
gcloud iam service-accounts describe mocoa-cloud-run-sa@api-for-warp-drive.iam.gserviceaccount.com

# Verify Cloud Run deployment
gcloud run services describe mocoa-owner-interface --region=us-central1
```

## CI/CD Pipeline

The `cloudbuild.yaml` provides:

1. **Build** - Docker container build
2. **Push** - Push to Container Registry
3. **Deploy** - Deploy to Cloud Run
4. **Configure** - Set up service account and permissions

### Manual Trigger

```bash
# Trigger build manually
gcloud builds submit --config=cloudbuild.yaml .

# Or with specific tag
gcloud builds submit --config=cloudbuild.yaml --substitutions=_TAG=v1.0.2 .
```

## Monitoring and Maintenance

### Health Monitoring

The service provides health endpoints:
- `/health` - Basic health check
- `/ready` - Readiness probe

### Log Monitoring

```bash
# View recent logs
gcloud run logs tail mocoa-owner-interface --region=us-central1

# View specific time range
gcloud logging read "resource.type=cloud_run_revision" --since=1h
```

### Secret Rotation

```bash
# Update a secret
echo "new-api-key" | gcloud secrets versions add elevenlabs-api-key --data-file=-

# The service will automatically use the new version (cached for 5 minutes)
```

## Production Checklist

- [ ] All API keys stored in Secret Manager
- [ ] Service account has minimal permissions
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Health checks responding
- [ ] Monitoring and alerting configured
- [ ] SSL/TLS certificate configured
- [ ] Domain name pointing to Cloud Run service

## Support

For deployment issues:
1. Check Cloud Run logs
2. Verify service account permissions
3. Confirm API keys are valid
4. Test health endpoints

The secure configuration ensures API keys are never exposed while maintaining full functionality of the MOCOA interface.
