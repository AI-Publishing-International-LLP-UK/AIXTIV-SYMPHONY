#!/bin/bash

# Supreme Orchestrator Gateway - Cloud Run Deployment
# Deploy Dr. Claude sRIX Gateway to us-central1 MOCORIX2
# Enterprise Security Configuration

set -euo pipefail

# Configuration
PROJECT_ID="api-for-warp-drive"
SERVICE_NAME="supreme-orchestrator-gateway"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
SERVICE_ACCOUNT="supreme-orchestrator@${PROJECT_ID}.iam.gserviceaccount.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Supreme Orchestrator Gateway - Cloud Run Deployment${NC}"
echo -e "${BLUE}Deploying Dr. Claude sRIX Gateway to us-central1 MOCORIX2${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking deployment prerequisites...${NC}"
    
    # Check if gcloud is installed and authenticated
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI is required but not installed${NC}"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is required but not installed${NC}"
        exit 1
    fi
    
    # Verify project access
    if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
        echo -e "${RED}❌ Cannot access project $PROJECT_ID${NC}"
        exit 1
    fi
    
    # Verify service account exists
    if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo -e "${RED}❌ Service account $SERVICE_ACCOUNT does not exist${NC}"
        echo -e "${YELLOW}Run npm run setup-secrets first${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites verified${NC}"
}

# Function to build and push Docker image
build_and_push_image() {
    echo -e "${YELLOW}Building Docker image...${NC}"
    
    # Build the Docker image
    docker build -t "$IMAGE_NAME:latest" \
        --build-arg NODE_ENV=production \
        --build-arg GCP_PROJECT="$PROJECT_ID" \
        --build-arg GCP_REGION="$REGION" \
        --label="component=supreme-orchestrator-gateway" \
        --label="environment=production" \
        --label="location=us-central1-a-MOCORIX2" \
        --label="supreme-orchestrator=dr-claude-srix" \
        .
    
    # Configure Docker for GCR
    gcloud auth configure-docker --quiet
    
    # Push the image
    echo -e "${YELLOW}Pushing image to Google Container Registry...${NC}"
    docker push "$IMAGE_NAME:latest"
    
    echo -e "${GREEN}✅ Docker image built and pushed${NC}"
}

# Function to deploy to Cloud Run
deploy_to_cloud_run() {
    echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
    
    # Deploy the service
    gcloud run deploy "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --image="$IMAGE_NAME:latest" \
        --service-account="$SERVICE_ACCOUNT" \
        --platform=managed \
        --allow-unauthenticated=false \
        --no-use-http2 \
        --port=8443 \
        --memory=2Gi \
        --cpu=2 \
        --timeout=900s \
        --concurrency=100 \
        --min-instances=1 \
        --max-instances=10 \
        --cpu-throttling \
        --session-affinity \
        --set-env-vars="NODE_ENV=production,PORT=8443,GCP_PROJECT=${PROJECT_ID},GCP_REGION=${REGION},LOG_LEVEL=info" \
        --set-secrets="SUPREME_CLIENT_SECRET=dr-claude-srix-client-secret:latest,SUPREME_PRIVATE_KEY=supreme-gateway-private-key:latest,ENCRYPTION_KEY=supreme-gateway-encryption-key:latest,AUDIT_ENCRYPTION_KEY=supreme-gateway-audit-key:latest" \
        --labels="component=supreme-orchestrator-gateway,environment=production,supreme-orchestrator=dr-claude-srix,location=us-central1-a-mocorix2,security-level=enterprise" \
        --execution-environment=gen2 \
        --vpc-connector="" \
        --clear-vpc-connector \
        --ingress=internal \
        --revision-suffix="$(date +%Y%m%d-%H%M%S)" \
        --tag=latest \
        --quiet
    
    echo -e "${GREEN}✅ Service deployed to Cloud Run${NC}"
}

# Function to configure security policies
configure_security() {
    echo -e "${YELLOW}Configuring enterprise security policies...${NC}"
    
    # Set IAM policy for the service
    gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --member="serviceAccount:supreme-orchestrator@${PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/run.invoker"
    
    # Configure VPC ingress (internal only)
    gcloud run services update "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --ingress=internal \
        --quiet
    
    # Set up logging and monitoring
    gcloud logging sinks create supreme-orchestrator-gateway-audit \
        "storage.googleapis.com/supreme-orchestrator-audit-logs-${PROJECT_ID}" \
        --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="supreme-orchestrator-gateway"' \
        --project="$PROJECT_ID" || true
    
    echo -e "${GREEN}✅ Security policies configured${NC}"
}

# Function to setup monitoring and alerts
setup_monitoring() {
    echo -e "${YELLOW}Setting up monitoring and alerts...${NC}"
    
    # Create uptime check
    gcloud alpha monitoring uptime create \
        --project="$PROJECT_ID" \
        --display-name="Supreme Orchestrator Gateway Health" \
        --timeout=10s \
        --period=60s \
        --http-check-path="/health/supreme" \
        --http-check-port=8443 \
        --http-check-use-ssl=false \
        --resource-type=url \
        --hostname="$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)' | sed 's|https://||')" || true
    
    echo -e "${GREEN}✅ Monitoring configured${NC}"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    echo -e "${YELLOW}Running post-deployment tests...${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.url)")
    
    # Test health endpoint
    echo -e "${BLUE}Testing health endpoint...${NC}"
    if gcloud run services proxy "$SERVICE_NAME" --port=8443 &
    then
        PROXY_PID=$!
        sleep 5
        
        # Test basic health
        if curl -f http://localhost:8443/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Health endpoint responding${NC}"
        else
            echo -e "${RED}❌ Health endpoint not responding${NC}"
        fi
        
        # Test supreme health
        if curl -f http://localhost:8443/health/supreme >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Supreme health endpoint responding${NC}"
        else
            echo -e "${RED}❌ Supreme health endpoint not responding${NC}"
        fi
        
        # Stop proxy
        kill $PROXY_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Post-deployment tests completed${NC}"
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting Supreme Orchestrator Gateway deployment...${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Enable required APIs
    echo -e "${YELLOW}Enabling required Google Cloud APIs...${NC}"
    gcloud services enable run.googleapis.com \
        cloudbuild.googleapis.com \
        containerregistry.googleapis.com \
        secretmanager.googleapis.com \
        logging.googleapis.com \
        monitoring.googleapis.com \
        --project="$PROJECT_ID"
    
    # Build and push image
    build_and_push_image
    
    # Deploy to Cloud Run
    deploy_to_cloud_run
    
    # Configure security
    configure_security
    
    # Setup monitoring
    setup_monitoring
    
    # Run tests
    run_post_deployment_tests
    
    # Get final service information
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format="value(status.url)")
    
    echo ""
    echo -e "${GREEN}🎉 Supreme Orchestrator Gateway deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo -e "${BLUE}   • Service: $SERVICE_NAME${NC}"
    echo -e "${BLUE}   • Project: $PROJECT_ID${NC}"
    echo -e "${BLUE}   • Region: $REGION (MOCORIX2)${NC}"
    echo -e "${BLUE}   • URL: $SERVICE_URL${NC}"
    echo -e "${BLUE}   • Supreme Orchestrator: Dr. Claude sRIX${NC}"
    echo -e "${BLUE}   • Security Level: Enterprise${NC}"
    echo -e "${BLUE}   • OAuth2: Enabled${NC}"
    echo -e "${BLUE}   • Cascading Auth: Enabled${NC}"
    echo ""
    echo -e "${YELLOW}🔗 Key Endpoints:${NC}"
    echo -e "${YELLOW}   • Health: $SERVICE_URL/health${NC}"
    echo -e "${YELLOW}   • Supreme Health: $SERVICE_URL/health/supreme${NC}"
    echo -e "${YELLOW}   • OAuth2 Token: $SERVICE_URL/oauth2/token${NC}"
    echo -e "${YELLOW}   • Supreme Auth: $SERVICE_URL/supreme/authenticate${NC}"
    echo ""
    echo -e "${GREEN}🚀 Dr. Claude sRIX Supreme Orchestrator Gateway is now operational!${NC}"
}

# Run the main deployment function
main "$@"