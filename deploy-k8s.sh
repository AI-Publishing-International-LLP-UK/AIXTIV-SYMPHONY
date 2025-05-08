#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Deploying ASOOS Integration Gateway to Kubernetes ===${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud is not installed. Please install Google Cloud SDK first.${NC}"
    exit 1
fi

# Set GCP project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project api-for-warp-drive

# Get GKE credentials
echo -e "${YELLOW}Getting GKE cluster credentials...${NC}"
if ! gcloud container clusters get-credentials autopilot-cluster-1 --region us-west1 --project api-for-warp-drive; then
    echo -e "${RED}Error: Failed to get GKE credentials. Check if the cluster exists and you have the necessary permissions.${NC}"
    exit 1
fi

# Check if the k8s directory exists
if [ ! -d k8s ]; then
    echo -e "${RED}Error: k8s directory not found. Make sure you're in the right directory.${NC}"
    exit 1
fi

# Apply Kubernetes manifests
echo -e "${YELLOW}Applying Kubernetes manifests...${NC}"
kubectl apply -f k8s/deployment.yaml

# Check if the deployment was successful
echo -e "${YELLOW}Checking deployment status...${NC}"

# Wait for the deployment to be ready
echo -e "${YELLOW}Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/asoos-integration-gateway --timeout=120s

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment successful!${NC}"
else
    echo -e "${RED}Deployment may have issues. Check the status with: kubectl get pods${NC}"
fi

# Get deployed pods
echo -e "${YELLOW}Deployed pods:${NC}"
kubectl get pods -l app=asoos-integration-gateway

# Get service information
echo -e "${YELLOW}Service information:${NC}"
kubectl get service asoos-integration-gateway

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}To check logs: kubectl logs -l app=asoos-integration-gateway${NC}"
echo -e "${GREEN}To delete deployment: kubectl delete -f k8s/deployment.yaml${NC}"
