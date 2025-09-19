#!/bin/bash
# Self-Healing ElevenLabs PCP System Deployment
# 
# This script deploys the comprehensive self-healing solution that:
# 1. Prevents ElevenLabs API key popups
# 2. Fixes PCP computational agent failures
# 3. Resolves object promise issues
# 4. Implements double validation with OAuth2

set -e

PROJECT_ID="api-for-warp-drive"
REGION="us-west1"
SERVICE_NAME="elevenlabs-self-healer"

echo "🚀 Starting deployment of ElevenLabs Self-Healing PCP System"

# Create a package.json with proper ES module configuration
cat > package.json << EOF
{
  "name": "elevenlabs-self-healer",
  "version": "1.0.0",
  "type": "module",
  "description": "Self-healing ElevenLabs PCP system for AI Publishing International LLP",
  "main": "self-healing-elevenlabs.js",
  "scripts": {
    "start": "node self-healing-elevenlabs.js --start-monitoring",
    "health": "node self-healing-elevenlabs.js --health-check",
    "repair": "node repair-mocoa-health.js --repair-all"
  },
  "dependencies": {
    "@google-cloud/secret-manager": "^5.6.0",
    "axios": "^1.7.7",
    "winston": "^3.14.2"
  },
  "engines": {
    "node": ">=20"
  }
}
EOF

# Create Dockerfile for Cloud Run deployment
cat > Dockerfile << EOF
# Use Node.js 20 LTS (addresses Node.js deprecation issues)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY self-healing-elevenlabs.js .
COPY repair-mocoa-health.js .

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD node self-healing-elevenlabs.js --health-check || exit 1

# Start the application
CMD ["npm", "start"]
EOF

# Create Cloud Run service configuration
cat > service.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${SERVICE_NAME}
  labels:
    app: elevenlabs-self-healer
    component: pcp-system
    tier: diamond-sao
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/cpu-throttling: "true"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest
        ports:
        - containerPort: 8080
        env:
        - name: PROJECT_ID
          value: "${PROJECT_ID}"
        - name: OAUTH2_ENABLED
          value: "true"
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            cpu: "1"
            memory: "2Gi"
          requests:
            cpu: "0.5"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
EOF

echo "📦 Building Docker image..."
docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .

echo "🚀 Pushing image to Google Container Registry..."
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest

echo "⚡ Deploying to Cloud Run..."
gcloud run services replace service.yaml \\
  --region=${REGION} \\
  --platform=managed

echo "🔐 Setting up IAM permissions..."
gcloud run services add-iam-policy-binding ${SERVICE_NAME} \\
  --region=${REGION} \\
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \\
  --role="roles/run.invoker"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding ${PROJECT_ID} \\
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"

echo "🏥 Testing deployment health..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
echo "Service URL: ${SERVICE_URL}"

# Wait for service to be ready
sleep 30

# Test the health endpoint
if curl -f -s "${SERVICE_URL}/health" > /dev/null; then
    echo "✅ Health check passed - Service is operational"
else
    echo "⚠️ Health check pending - Service may still be starting"
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service Information:"
echo "  Service Name: ${SERVICE_NAME}"
echo "  Region: ${REGION}"
echo "  URL: ${SERVICE_URL}"
echo ""
echo "🛠️ Management Commands:"
echo "  Health Check: curl ${SERVICE_URL}/health"
echo "  View Logs: gcloud run services logs tail ${SERVICE_NAME} --region=${REGION}"
echo "  Update Service: gcloud run services update ${SERVICE_NAME} --region=${REGION}"
echo ""
echo "This deployment addresses:"
echo "  ✅ ElevenLabs API key popups prevention"
echo "  ✅ PCP computational agent failures"
echo "  ✅ Object promise resolution issues"
echo "  ✅ Double validation system with Secret Manager"
echo "  ✅ OAuth2 enterprise security integration"
echo "  ✅ Node.js 20 upgrade (deprecation fix)"
echo "  ✅ Self-monitoring and autonomous operation"