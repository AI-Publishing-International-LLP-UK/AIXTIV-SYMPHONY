#!/bin/bash
# Anthology Subscriber Onboarding Script for ID: 001
# Owner Subscriber with Google.com credentials

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}    Anthology Subscriber Onboarding - ID: 001${NC}"
echo -e "${BLUE}==================================================${NC}"

# Load configuration
SUBSCRIBER_ID="001"
SUBSCRIBER_NAME="Owner Subscriber"
SUBSCRIBER_EMAIL="owner@google.com"
SUBSCRIBER_TIER="enterprise"
NAMESPACE="sub-001"
REGION="us-west1"

echo -e "${BLUE}Setting up subscriber: ${SUBSCRIBER_NAME} (${SUBSCRIBER_ID})${NC}"
echo -e "${BLUE}Email: ${SUBSCRIBER_EMAIL}${NC}"
echo -e "${BLUE}Tier: ${SUBSCRIBER_TIER}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"

# Create Kubernetes namespace
echo -e "\n${BLUE}Creating Kubernetes namespace: ${NAMESPACE}${NC}"
kubectl create namespace ${NAMESPACE} || echo "Namespace already exists"

# Apply resource quota
echo -e "\n${BLUE}Applying resource quota${NC}"
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: subscriber-quota
  namespace: ${NAMESPACE}
spec:
  hard:
    requests.cpu: "8"
    requests.memory: "16Gi"
    limits.cpu: "16"
    limits.memory: "32Gi"
    persistentvolumeclaims: "20"
    pods: "50"
    services: "20"
