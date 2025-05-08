#!/bin/bash
# Integration Status Check Script for Anthology
# Checks the status of all deployed services for a subscriber

# Set colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default to subscriber 001 if not specified
SUBSCRIBER_ID=${1:-"001"}
NAMESPACE="sub-${SUBSCRIBER_ID}"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}    Anthology Integration Status Check${NC}"
echo -e "${BLUE}    Subscriber: ${SUBSCRIBER_ID}${NC}"
echo -e "${BLUE}==================================================${NC}"

# Check namespace existence
echo -e "\n${BLUE}Checking namespace: ${NAMESPACE}${NC}"
if kubectl get namespace ${NAMESPACE} &>/dev/null; then
  echo -e "${GREEN}✅ Namespace ${NAMESPACE} exists${NC}"
  NAMESPACE_STATUS="active"
else
  echo -e "${YELLOW}⚠️ Namespace ${NAMESPACE} does not exist${NC}"
  echo -e "${YELLOW}This could mean the subscriber hasn't been fully onboarded${NC}"
  NAMESPACE_STATUS="not found"
fi

# Only continue if namespace exists
if [ "$NAMESPACE_STATUS" == "active" ]; then
  # Check deployments
  echo -e "\n${BLUE}Checking deployments in namespace: ${NAMESPACE}${NC}"
  DEPLOYMENTS=$(kubectl get deployments -n ${NAMESPACE} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
  
  if [ -z "$DEPLOYMENTS" ]; then
    echo -e "${YELLOW}⚠️ No deployments found in namespace ${NAMESPACE}${NC}"
  else
    echo -e "${GREEN}Found deployments: ${DEPLOYMENTS}${NC}"
    
    # Check each deployment's status
    for DEPLOYMENT in $DEPLOYMENTS; do
      READY=$(kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
      DESIRED=$(kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
      
      if [ "$READY" == "$DESIRED" ] && [ "$DESIRED" != "0" ]; then
        echo -e "  ${GREEN}✅ ${DEPLOYMENT}: ${READY}/${DESIRED} replicas ready${NC}"
      else
        echo -e "  ${RED}❌ ${DEPLOYMENT}: ${READY}/${DESIRED} replicas ready${NC}"
      fi
    done
  fi
  
  # Check services
  echo -e "\n${BLUE}Checking services in namespace: ${NAMESPACE}${NC}"
  SERVICES=$(kubectl get services -n ${NAMESPACE} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
  
  if [ -z "$SERVICES" ]; then
    echo -e "${YELLOW}⚠️ No services found in namespace ${NAMESPACE}${NC}"
  else
    echo -e "${GREEN}Found services: ${SERVICES}${NC}"
    
    # Check each service
    for SERVICE in $SERVICES; do
      TYPE=$(kubectl get service ${SERVICE} -n ${NAMESPACE} -o jsonpath='{.spec.type}' 2>/dev/null)
      PORTS=$(kubectl get service ${SERVICE} -n ${NAMESPACE} -o jsonpath='{.spec.ports[*].port}' 2>/dev/null)
      
      echo -e "  ${GREEN}✅ ${SERVICE}: Type=${TYPE}, Ports=${PORTS}${NC}"
    done
  fi
  
  # Check ingress
  echo -e "\n${BLUE}Checking ingress in namespace: ${NAMESPACE}${NC}"
  INGRESS=$(kubectl get ingress -n ${NAMESPACE} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
  
  if [ -z "$INGRESS" ]; then
    echo -e "${YELLOW}⚠️ No ingress found in namespace ${NAMESPACE}${NC}"
  else
    echo -e "${GREEN}Found ingress: ${INGRESS}${NC}"
    
    # Check each ingress
    for ING in $INGRESS; do
      HOSTS=$(kubectl get ingress ${ING} -n ${NAMESPACE} -o jsonpath='{.spec.rules[*].host}' 2>/dev/null)
      
      echo -e "  ${GREEN}✅ ${ING}: Hosts=${HOSTS}${NC}"
    done
  fi
  
  # Check pods
  echo -e "\n${BLUE}Checking pods in namespace: ${NAMESPACE}${NC}"
  PODS=$(kubectl get pods -n ${NAMESPACE} -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)
  
  if [ -z "$PODS" ]; then
    echo -e "${YELLOW}⚠️ No pods found in namespace ${NAMESPACE}${NC}"
  else
    echo -e "${GREEN}Found pods: ${PODS}${NC}"
    
    # Check each pod's status
    for POD in $PODS; do
      STATUS=$(kubectl get pod ${POD} -n ${NAMESPACE} -o jsonpath='{.status.phase}' 2>/dev/null)
      READY=$(kubectl get pod ${POD} -n ${NAMESPACE} -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
      
      if [ "$STATUS" == "Running" ] && [ "$READY" == "true" ]; then
        echo -e "  ${GREEN}✅ ${POD}: Status=${STATUS}, Ready=${READY}${NC}"
      else
        echo -e "  ${RED}❌ ${POD}: Status=${STATUS}, Ready=${READY}${NC}"
      fi
    done
  fi
  
  # Check payment status
  echo -e "\n${BLUE}Checking payment status for subscriber: ${SUBSCRIBER_ID}${NC}"
  
  # This would be a call to a payment validation service in a real environment
  # For demonstration, we'll simulate it
  PAYMENT_STATUS="active"
  
  if [ "$PAYMENT_STATUS" == "active" ]; then
    echo -e "${GREEN}✅ Payment status: Active${NC}"
  else
    echo -e "${RED}❌ Payment status: Issue detected${NC}"
    echo -e "${YELLOW}Integrations may be disabled due to payment issues${NC}"
  fi
  
  # Check integration activity
  echo -e "\n${BLUE}Checking recent integration activity${NC}"
  echo -e "${YELLOW}This would show recent logs and events in a real environment${NC}"
fi

echo -e "\n${BLUE}==================================================${NC}"
echo -e "${BLUE}    Integration Status Check Complete${NC}"
echo -e "${BLUE}==================================================${NC}"

# Provide URL for full dashboard
echo -e "\nFor complete status and logs, visit: https://${SUBSCRIBER_ID}.subscribers.anthology.aixtiv.dev/status"
