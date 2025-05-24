#!/bin/bash

# =========================================================
# ASOOS.2100.COOL Subdomain Verification Script
# This script checks if the asoos.2100.cool subdomain is properly 
# configured in your Firebase project and DNS settings
# =========================================================

# Set variables
PROJECT_ID="api-for-warp-drive"
DOMAIN="2100.cool"
SUBDOMAIN="asoos"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
HOSTING_TARGET="asoos-2100-cool"
SITE_NAME="asoos-2100-cool"
PUBLIC_DIR="public/asoos-2100-cool"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}    ASOOS.2100.COOL Subdomain Verification Script    ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""

# Check if Firebase CLI is installed
check_firebase_cli() {
  echo "Checking for Firebase CLI..."
  
  if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI not found. Please install it with: npm install -g firebase-tools${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Firebase CLI is installed${NC}"
}

# Check if logged in to Firebase
check_firebase_login() {
  echo "Checking Firebase login status..."
  
  firebase projects:list > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo -e "${RED}Not logged in to Firebase. Please run 'firebase login' first.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Logged in to Firebase${NC}"
}

# Check if project exists and can be accessed
check_project_access() {
  echo "Checking access to Firebase project $PROJECT_ID..."
  
  firebase projects:list | grep -q "$PROJECT_ID"
  if [ $? -ne 0 ]; then
    echo -e "${RED}Project $PROJECT_ID not found or not accessible.${NC}"
    exit 1
  fi
  
  # Set project
  firebase use $PROJECT_ID > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to set project $PROJECT_ID. Check permissions.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Have access to project $PROJECT_ID${NC}"
}

# Check if hosting site exists
check_hosting_site() {
  echo "Checking if hosting site $SITE_NAME exists..."
  
  firebase hosting:sites:list | grep -q "$SITE_NAME"
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Hosting site $SITE_NAME not found.${NC}"
    echo -e "${YELLOW}Recommendation: Create the site with 'firebase hosting:sites:create $SITE_NAME'${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Hosting site $SITE_NAME exists${NC}"
  return 0
}

# Check if hosting target is configured
check_hosting_target() {
  echo "Checking if hosting target $HOSTING_TARGET is configured..."
  
  firebase target:apply hosting $HOSTING_TARGET $SITE_NAME --dry-run 2>/dev/null
  RESULT=$?
  
  if [ $RESULT -eq 0 ]; then
    echo -e "${YELLOW}Target $HOSTING_TARGET is not yet associated with site $SITE_NAME.${NC}"
    echo -e "${YELLOW}Recommendation: Apply target with 'firebase target:apply hosting $HOSTING_TARGET $SITE_NAME'${NC}"
    return 1
  else
    echo -e "${GREEN}✓ Hosting target $HOSTING_TARGET is configured${NC}"
    return 0
  fi
}

# Check if domain is connected to Firebase
check_domain_connection() {
  echo "Checking if domain $FULL_DOMAIN is connected to Firebase hosting..."
  
  firebase hosting:sites:list | grep -q "$FULL_DOMAIN"
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Domain $FULL_DOMAIN is not connected to Firebase hosting.${NC}"
    echo -e "${YELLOW}Recommendation: Connect domain through Firebase console or CLI.${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Domain $FULL_DOMAIN is connected to Firebase hosting${NC}"
  return 0
}

# Check if SSL certificate is provisioned
check_ssl_certificate() {
  echo "Checking SSL certificate status for $FULL_DOMAIN..."
  
  # Simple check using curl to verify SSL
  curl -s -o /dev/null -w "%{http_code}" https://$FULL_DOMAIN 2>/dev/null
  HTTP_CODE=$?
  
  if [ $HTTP_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate appears to be provisioned for $FULL_DOMAIN${NC}"
    return 0
  else
    echo -e "${YELLOW}! Could not verify SSL certificate for $FULL_DOMAIN${NC}"
    echo -e "${YELLOW}  This could be due to DNS propagation delay or certificate provisioning in progress.${NC}"
    return 1
  fi
}

# Check if site mappings configuration is updated
check_site_mappings() {
  echo "Checking site mappings configuration..."
  
  SITE_MAPPINGS_FILE="/Users/as/asoos/domain-management/config/site-mappings.json"
  
  if [ ! -f "$SITE_MAPPINGS_FILE" ]; then
    echo -e "${RED}✗ Site mappings file not found at $SITE_MAPPINGS_FILE${NC}"
    return 1
  fi
  
  grep -q "\"asoos.2100.cool\"" $SITE_MAPPINGS_FILE
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Domain mapping for $FULL_DOMAIN not found in site mappings.${NC}"
    echo -e "${YELLOW}Recommendation: Update $SITE_MAPPINGS_FILE to include $FULL_DOMAIN${NC}"
    return 1
  fi
  
  grep -q "\"$SITE_NAME\"" $SITE_MAPPINGS_FILE
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Site $SITE_NAME not found in site mappings.${NC}"
    echo -e "${YELLOW}Recommendation: Update $SITE_MAPPINGS_FILE to include $SITE_NAME${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Site mappings configuration is updated${NC}"
  return 0
}

# Check if Firebase projects configuration is updated
check_firebase_projects() {
  echo "Checking Firebase projects configuration..."
  
  FIREBASE_PROJECTS_FILE="/Users/as/asoos/domain-management/config/firebase-projects.json"
  
  if [ ! -f "$FIREBASE_PROJECTS_FILE" ]; then
    echo -e "${RED}✗ Firebase projects file not found at $FIREBASE_PROJECTS_FILE${NC}"
    return 1
  fi
  
  grep -q "\"$SITE_NAME\"" $FIREBASE_PROJECTS_FILE
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Site $SITE_NAME not found in Firebase projects configuration.${NC}"
    echo -e "${YELLOW}Recommendation: Update $FIREBASE_PROJECTS_FILE to include $SITE_NAME${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Firebase projects configuration is updated${NC}"
  return 0
}

# Check if public directory exists
check_public_directory() {
  echo "Checking if public directory for the site exists..."
  
  if [ ! -d "$PUBLIC_DIR" ]; then
    echo -e "${RED}✗ Public directory $PUBLIC_DIR not found.${NC}"
    echo -e "${YELLOW}Recommendation: Create directory and add website files${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Public directory exists${NC}"
  return 0
}

# Check if index.html exists
check_index_file() {
  echo "Checking if index.html exists in public directory..."
  
  if [ ! -f "$PUBLIC_DIR/index.html" ]; then
    echo -e "${RED}✗ index.html not found in $PUBLIC_DIR${NC}"
    echo -e "${YELLOW}Recommendation: Create an index.html file${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ index.html exists${NC}"
  return 0
}

# Check DNS configuration
check_dns_configuration() {
  echo "Checking DNS configuration for $FULL_DOMAIN..."
  
  # Using dig to check DNS CNAME
  if command -v dig &> /dev/null; then
    DIG_RESULT=$(dig CNAME $FULL_DOMAIN +short)
    
    if [ -z "$DIG_RESULT" ]; then
      echo -e "${RED}✗ No CNAME record found for $FULL_DOMAIN${NC}"
      echo -e "${YELLOW}Recommendation: Create a CNAME record pointing to c.storage.googleapis.com${NC}"
      return 1
    else
      echo -e "${GREEN}✓ CNAME record exists: $DIG_RESULT${NC}"
      
      if [[ "$DIG_RESULT" == *"storage.googleapis.com"* ]]; then
        echo -e "${GREEN}✓ CNAME record points to Google storage (correct)${NC}"
      else
        echo -e "${YELLOW}! CNAME record does not point to Google storage. This might cause issues.${NC}"
        echo -e "${YELLOW}  Recommended value: c.storage.googleapis.com${NC}"
      fi
      
      return 0
    fi
  else
    echo -e "${YELLOW}! Could not check DNS configuration - 'dig' command not available${NC}"
    echo -e "${YELLOW}  Please ensure a CNAME record exists for $SUBDOMAIN.$DOMAIN pointing to c.storage.googleapis.com${NC}"
    return 1
  fi
}

# Check Firebase configuration file
check_firebase_config() {
  echo "Checking Firebase configuration file..."
  
  CONFIG_FILE="/Users/as/asoos/2100-cool-firebase.json"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}✗ Firebase configuration file not found at $CONFIG_FILE${NC}"
    return 1
  fi
  
  grep -q "\"target\": \"$HOSTING_TARGET\"" $CONFIG_FILE
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Firebase configuration does not contain correct hosting target.${NC}"
    echo -e "${YELLOW}Recommendation: Update $CONFIG_FILE with target: $HOSTING_TARGET${NC}"
    return 1
  fi
  
  grep -q "\"public\": \"$PUBLIC_DIR\"" $CONFIG_FILE
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Firebase configuration does not contain correct public directory.${NC}"
    echo -e "${YELLOW}Recommendation: Update $CONFIG_FILE with public: $PUBLIC_DIR${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Firebase configuration file is correct${NC}"
  return 0
}

# Calculate overall status
calculate_status() {
  echo ""
  echo "Calculating overall configuration status..."
  
  PASSED=0
  FAILED=0
  
  if check_hosting_site; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_hosting_target; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_domain_connection; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_ssl_certificate; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_site_mappings; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_firebase_projects; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_public_directory; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_index_file; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_dns_configuration; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  if check_firebase_config; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
  
  TOTAL=$((PASSED+FAILED))
  PASS_PERCENT=$((PASSED*100/TOTAL))
  
  echo ""
  echo -e "${GREEN}=========================================================${NC}"
  echo -e "${GREEN}    Verification Results for ASOOS.2100.COOL    ${NC}"
  echo -e "${GREEN}=========================================================${NC}"
  echo ""
  echo -e "Passed checks: ${GREEN}$PASSED${NC}/$TOTAL (${GREEN}$PASS_PERCENT%${NC})"
  echo -e "Failed checks: ${RED}$FAILED${NC}/$TOTAL"
  echo ""
  
  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ASOOS.2100.COOL is correctly configured!${NC}"
    echo -e "${GREEN}  Website should be accessible at https://$FULL_DOMAIN${NC}"
  else
    echo -e "${YELLOW}! ASOOS.2100.COOL configuration needs attention.${NC}"
    echo -e "${YELLOW}  Please address the recommendations above.${NC}"
  fi
  
  echo ""
}

# Main function
main() {
  check_firebase_cli
  check_firebase_login
  check_project_access
  calculate_status
}

# Execute main function
main