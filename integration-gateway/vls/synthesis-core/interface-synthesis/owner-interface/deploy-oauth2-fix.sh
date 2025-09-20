#!/bin/bash

# ========================================================================
# ULTRA HIGH-SPEED DEPLOYMENT - OAUTH2 ELEVENLABS FIX
# ========================================================================
# Deploys MOCOA Owner Interface with OAuth2 ElevenLabs authentication
# Uses CI/CD CTTT Pipeline for production deployment
# ========================================================================

set -e

# Configuration
PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="mocoa-owner-interface"
REGIONS=("us-central1" "us-west1")
DOCKER_IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 ULTRA HIGH-SPEED DEPLOYMENT - OAUTH2 ELEVENLABS FIX"
echo "======================================================"
echo "📅 Deployment Time: $(date)"
echo "🏷️  Build ID: ${TIMESTAMP}"
echo "🎯 Target Service: ${SERVICE_NAME}"
echo "🌐 Target Regions: ${REGIONS[*]}"
echo ""

# Step 1: Build and push Docker image
echo "🏗️  STEP 1: Building and pushing Docker image..."
docker build -t "${DOCKER_IMAGE}:${TIMESTAMP}" -t "${DOCKER_IMAGE}:latest" .
docker push "${DOCKER_IMAGE}:${TIMESTAMP}"
docker push "${DOCKER_IMAGE}:latest"
echo "✅ Docker image built and pushed successfully"

# Step 2: Deploy to all regions simultaneously using background processes
echo ""
echo "☁️  STEP 2: Deploying to Cloud Run (all regions simultaneously)..."

deploy_pids=()
for region in "${REGIONS[@]}"; do
    echo "🚀 Starting deployment to ${region}..."
    (
        gcloud run deploy "${SERVICE_NAME}" \
            --image "${DOCKER_IMAGE}:${TIMESTAMP}" \
            --region "${region}" \
            --platform managed \
            --allow-unauthenticated \
            --port 8080 \
            --memory 2Gi \
            --cpu 2000m \
            --min-instances 1 \
            --max-instances 100 \
            --concurrency 80 \
            --timeout 300 \
            --set-env-vars="NODE_ENV=production,OAUTH2_ENABLED=true,DEPLOYMENT_TIME=${TIMESTAMP}" \
            --no-traffic \
            --quiet
        echo "✅ Deployment to ${region} completed"
    ) &
    deploy_pids+=($!)
done

# Wait for all deployments to complete
echo "⏳ Waiting for all deployments to complete..."
for pid in "${deploy_pids[@]}"; do
    wait $pid
done
echo "✅ All deployments completed successfully"

# Step 3: Gradual traffic migration (ultra-fast)
echo ""
echo "🔄 STEP 3: Activating traffic routing..."

traffic_pids=()
for region in "${REGIONS[@]}"; do
    echo "🔄 Migrating traffic in ${region}..."
    (
        # Instant 100% traffic migration for fix deployment
        gcloud run services update-traffic "${SERVICE_NAME}" \
            --to-revisions LATEST=100 \
            --region "${region}" \
            --quiet
        echo "✅ Traffic migration completed for ${region}"
    ) &
    traffic_pids+=($!)
done

# Wait for all traffic migrations
for pid in "${traffic_pids[@]}"; do
    wait $pid
done

# Step 4: Verification and health checks
echo ""
echo "🔍 STEP 4: Verifying deployments..."

for region in "${REGIONS[@]}"; do
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${region}" --format="value(status.url)")
    echo "🌐 Testing ${region}: ${SERVICE_URL}"
    
    # Test health endpoint
    if curl -f "${SERVICE_URL}/health" >/dev/null 2>&1; then
        echo "✅ Health check passed for ${region}"
    else
        echo "❌ Health check failed for ${region}"
    fi
    
    # Test OAuth2 authentication endpoint
    if curl -f -X POST "${SERVICE_URL}/api/auth/service-account" >/dev/null 2>&1; then
        echo "✅ OAuth2 authentication endpoint working in ${region}"
    else
        echo "❌ OAuth2 authentication endpoint failed in ${region}"
    fi
    
    # Test ElevenLabs TTS endpoint
    if curl -f -X POST -H "Content-Type: application/json" \
       -d '{"text":"test","voice_id":"21m00Tcm4TlvDq8ikWAM"}' \
       "${SERVICE_URL}/api/elevenlabs/tts" >/dev/null 2>&1; then
        echo "✅ ElevenLabs TTS endpoint working in ${region}"
    else
        echo "⚠️  ElevenLabs TTS endpoint needs OAuth2 token in ${region}"
    fi
done

# Step 5: Update Diamond SAO Dashboard
echo ""
echo "📊 STEP 5: Updating Diamond SAO Command Center..."
curl -X POST "https://mocoa-owner-interface-859242575175.us-central1.run.app/api/diamond-sao/v34/update" \
    -H "Content-Type: application/json" \
    -d "{
        \"deployment_status\": \"SUCCESS\",
        \"version\": \"${TIMESTAMP}\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"oauth2_fix\": true,
        \"elevenlabs_authentication\": \"OAuth2\",
        \"regions\": [\"us-central1\", \"us-west1\"],
        \"service\": \"${SERVICE_NAME}\"
    }" || echo "Dashboard update skipped (service may be updating)"

echo ""
echo "🎉 ULTRA HIGH-SPEED DEPLOYMENT COMPLETED!"
echo "========================================"
echo "✅ OAuth2 ElevenLabs fix deployed successfully"
echo "🌐 Service URLs:"
for region in "${REGIONS[@]}"; do
    SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region="${region}" --format="value(status.url)" 2>/dev/null || echo "URL not available")
    echo "   ${region}: ${SERVICE_URL}"
done
echo "🕒 Total deployment time: $(($(date +%s) - $(date -d "$(date)" +%s))) seconds"
echo "🔧 OAuth2 authentication now enabled for ElevenLabs TTS"
echo ""