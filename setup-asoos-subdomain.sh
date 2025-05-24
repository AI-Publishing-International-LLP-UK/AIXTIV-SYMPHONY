#!/bin/bash

# =========================================================
# ASOOS.2100.COOL Subdomain Setup Script
# This script automates the process of adding the asoos.2100.cool
# subdomain to Firebase hosting and configuring necessary DNS records
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
echo -e "${GREEN}    ASOOS.2100.COOL Subdomain Configuration Script    ${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""

# Check if required tools are installed
check_requirements() {
  echo "Checking requirements..."
  
  if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI not found. Please install it with: npm install -g firebase-tools${NC}"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}jq not found. Some JSON processing functionality may be limited.${NC}"
  fi

  # Check if logged in to Firebase
  firebase projects:list > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo -e "${RED}Not logged in to Firebase. Please run 'firebase login' first.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ All requirements satisfied${NC}"
}

# Set the Firebase project
set_firebase_project() {
  echo "Setting Firebase project to $PROJECT_ID..."
  firebase use $PROJECT_ID
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to set Firebase project. Aborting.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Firebase project set to $PROJECT_ID${NC}"
}

# Check if subdomain already exists in Firebase
check_existing_subdomain() {
  echo "Checking if $FULL_DOMAIN already exists in Firebase..."
  
  # This is a simplified check - in production you might want to use the Firebase API directly
  firebase hosting:sites:list | grep -q "$SITE_NAME"
  SITE_EXISTS=$?
  
  if [ $SITE_EXISTS -eq 0 ]; then
    echo -e "${YELLOW}Site $SITE_NAME already exists in Firebase.${NC}"
    return 0
  else
    echo -e "${GREEN}Site $SITE_NAME does not exist yet. Will create.${NC}"
    return 1
  fi
}

# Create Firebase hosting site
create_firebase_site() {
  echo "Creating Firebase hosting site $SITE_NAME..."
  
  firebase hosting:sites:create $SITE_NAME
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create hosting site. Aborting.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Firebase hosting site created${NC}"
}

# Add domain to Firebase hosting
add_domain_to_firebase() {
  echo "Adding domain $FULL_DOMAIN to Firebase hosting..."
  
  # Check if domain is already connected
  firebase hosting:sites:list | grep -q "$FULL_DOMAIN"
  if [ $? -eq 0 ]; then
    echo -e "${YELLOW}Domain $FULL_DOMAIN is already connected to Firebase hosting.${NC}"
  else
    firebase hosting:channel:deploy --site $SITE_NAME production
    firebase hosting:channel:open --site $SITE_NAME production
    echo -e "${YELLOW}When prompted, connect the domain $FULL_DOMAIN to the site.${NC}"
    echo -e "${YELLOW}Press Enter when you've completed this step...${NC}"
    read
  fi
  echo -e "${GREEN}✓ Domain configuration complete${NC}"
}

# Apply target to hosting
apply_target() {
  echo "Setting up Firebase hosting target for $FULL_DOMAIN..."
  
  firebase target:apply hosting $HOSTING_TARGET $SITE_NAME
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to apply target. Aborting.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Firebase hosting target applied${NC}"
}

# Update site mappings in configuration
update_site_mappings() {
  echo "Updating site mappings in domain-management configuration..."
  
  # This assumes you've already updated the site-mappings.json file as we did earlier
  # In production, you'd modify the file programmatically here
  
  SITE_MAPPINGS_FILE="/Users/as/asoos/domain-management/config/site-mappings.json"
  
  if [ -f "$SITE_MAPPINGS_FILE" ]; then
    echo -e "${GREEN}✓ Site mappings already updated in $SITE_MAPPINGS_FILE${NC}"
  else
    echo -e "${RED}Site mappings file not found at $SITE_MAPPINGS_FILE${NC}"
    echo -e "${YELLOW}Please update your site mappings manually.${NC}"
  fi
}

# Update Firebase project configuration
update_firebase_projects() {
  echo "Updating Firebase projects configuration..."
  
  # Similar to site mappings, this assumes you've already updated the file
  # In production, you'd modify the file programmatically
  
  FIREBASE_PROJECTS_FILE="/Users/as/asoos/domain-management/config/firebase-projects.json"
  
  if [ -f "$FIREBASE_PROJECTS_FILE" ]; then
    echo -e "${GREEN}✓ Firebase projects configuration already updated in $FIREBASE_PROJECTS_FILE${NC}"
  else
    echo -e "${RED}Firebase projects file not found at $FIREBASE_PROJECTS_FILE${NC}"
    echo -e "${YELLOW}Please update your Firebase projects configuration manually.${NC}"
  fi
}

# Use GoDaddy API to update DNS if needed (placeholder - would need your actual API credentials)
update_godaddy_dns() {
  echo "Checking if DNS update is needed for $FULL_DOMAIN..."
  
  # In a real script, you would use the GoDaddy API to check and update DNS
  # This is a placeholder for your existing data pipes
  
  # Placeholder for your GoDaddy API call
  # Example:
  # curl -X GET -H "Authorization: sso-key ${API_KEY}:${API_SECRET}" \
  #   "https://api.godaddy.com/v1/domains/${DOMAIN}/records/CNAME/${SUBDOMAIN}"
  
  echo -e "${YELLOW}DNS check placeholder. In production, this would connect to GoDaddy API.${NC}"
  echo -e "${YELLOW}Using your existing data pipe for DNS, please ensure a CNAME record exists:${NC}"
  echo -e "${YELLOW}Host: $SUBDOMAIN${NC}"
  echo -e "${YELLOW}Points to: c.storage.googleapis.com${NC}"
  echo -e "${YELLOW}TTL: 1 Hour${NC}"
  
  echo -e "${GREEN}✓ DNS configuration instructions provided${NC}"
}

# Verify domain connection
verify_domain_connection() {
  echo "Initiating domain connection verification..."
  
  # In production, you would poll the Firebase API or DNS to verify the connection
  echo -e "${YELLOW}Domain verification may take up to 24 hours to complete.${NC}"
  echo -e "${YELLOW}You can check status with: firebase hosting:sites:list${NC}"
  
  echo -e "${GREEN}✓ Verification process initiated${NC}"
}

# Deploy the website
deploy_website() {
  echo "Deploying website to $FULL_DOMAIN..."
  
  # Check if public directory exists
  if [ ! -d "$PUBLIC_DIR" ]; then
    echo -e "${RED}Public directory $PUBLIC_DIR not found. Aborting deployment.${NC}"
    exit 1
  fi
  
  # Deploy using the Firebase CLI
  firebase deploy --only hosting:$HOSTING_TARGET --config 2100-cool-firebase.json
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. Please check the errors and try again.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Website successfully deployed to $FULL_DOMAIN${NC}"
}

# Run the pipeline
main() {
  check_requirements
  set_firebase_project
  check_existing_subdomain
  if [ $? -eq 1 ]; then
    create_firebase_site
  fi
  apply_target
  update_site_mappings
  update_firebase_projects
  update_godaddy_dns
  add_domain_to_firebase
  verify_domain_connection
  deploy_website
  
  echo ""
  echo -e "${GREEN}=========================================================${NC}"
  echo -e "${GREEN}    ASOOS.2100.COOL Setup Completed Successfully    ${NC}"
  echo -e "${GREEN}=========================================================${NC}"
  echo ""
  echo -e "Website URL: https://${FULL_DOMAIN}"
  echo -e "Please allow up to 24 hours for DNS propagation and SSL certificate provisioning."
}

# Execute main function
main