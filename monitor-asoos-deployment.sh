#!/bin/bash
# Script to monitor ASOOS.2100.COOL deployment status

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
FIREBASE_URL="https://2100-cool.web.app"
CUSTOM_DOMAIN="asoos.2100.cool"
FIREBASE_IPS=("199.36.158.100" "199.36.158.101" "199.36.158.102" "199.36.158.103")

# Print header
echo -e "${BOLD}=== ASOOS.2100.COOL Deployment Monitor ===${NC}"
echo -e "$(date)"
echo

# Function to check if a URL is accessible
check_url() {
  local url=$1
  local description=$2
  
  echo -e "${BLUE}Checking ${description}...${NC}"
  
  # Use curl to check if the URL is accessible
  local status_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}")
  
  if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✅ ${description} is accessible (HTTP ${status_code})${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️ ${description} returned HTTP ${status_code}${NC}"
    return 1
  fi
}

# Check Firebase hosting URL
check_url "$FIREBASE_URL" "Firebase site (${FIREBASE_URL})"
firebase_accessible=$?

# Check custom domain
echo
check_url "https://${CUSTOM_DOMAIN}" "Custom domain (https://${CUSTOM_DOMAIN})"
custom_domain_accessible=$?

# Check DNS resolution
echo
echo -e "${BLUE}Checking DNS resolution for ${CUSTOM_DOMAIN}...${NC}"

# Get the IP address that the domain resolves to
domain_ip=$(dig +short ${CUSTOM_DOMAIN} | head -1)

if [ -z "$domain_ip" ]; then
  echo -e "${YELLOW}⚠️ DNS record not found for ${CUSTOM_DOMAIN}${NC}"
else
  # Check if the resolved IP is one of the Firebase IPs
  firebase_ip_match=0
  for fb_ip in "${FIREBASE_IPS[@]}"; do
    if [ "$domain_ip" == "$fb_ip" ]; then
      firebase_ip_match=1
      break
    fi
  done
  
  if [ $firebase_ip_match -eq 1 ]; then
    echo -e "${GREEN}✅ DNS is correctly configured to Firebase hosting (${domain_ip})${NC}"
  else
    echo -e "${YELLOW}⚠️ DNS is pointing to ${domain_ip} which is not a Firebase hosting IP${NC}"
    echo -e "${YELLOW}   Expected one of: ${FIREBASE_IPS[*]}${NC}"
  fi
fi

# Check TXT records for domain verification
echo
echo -e "${BLUE}Checking TXT records for domain verification...${NC}"
txt_records=$(dig +short TXT ${CUSTOM_DOMAIN})

if [ -z "$txt_records" ]; then
  echo -e "${YELLOW}⚠️ No TXT records found for ${CUSTOM_DOMAIN}${NC}"
else
  # Check if any TXT record starts with "firebase="
  firebase_verification=0
  echo -e "${CYAN}Found TXT records:${NC}"
  
  while IFS= read -r record; do
    echo -e "  $record"
    if [[ $record == *"firebase="* ]]; then
      firebase_verification=1
    fi
  done <<< "$txt_records"
  
  if [ $firebase_verification -eq 1 ]; then
    echo -e "${GREEN}✅ Firebase verification TXT record found${NC}"
  else
    echo -e "${YELLOW}⚠️ No Firebase verification TXT record found${NC}"
  fi
fi

# Provide summary and next steps
echo
echo -e "${BOLD}===== Summary =====${NC}"

if [ $firebase_accessible -eq 0 ]; then
  echo -e "${GREEN}✅ Firebase hosting is working correctly at ${FIREBASE_URL}${NC}"
else
  echo -e "${RED}❌ Firebase hosting is NOT accessible at ${FIREBASE_URL}${NC}"
fi

if [ $custom_domain_accessible -eq 0 ]; then
  echo -e "${GREEN}✅ Custom domain is working correctly at https://${CUSTOM_DOMAIN}${NC}"
else
  if [ -z "$domain_ip" ]; then
    echo -e "${YELLOW}⚠️ Custom domain has no DNS record yet${NC}"
  elif [ $firebase_ip_match -eq 0 ]; then
    echo -e "${YELLOW}⚠️ Custom domain is pointing to the wrong IP (${domain_ip})${NC}"
  else
    echo -e "${YELLOW}⚠️ Custom domain has correct DNS but is not accessible yet${NC}"
    echo -e "${YELLOW}   This could be due to pending domain verification or propagation delay${NC}"
  fi
fi

echo
echo -e "${BOLD}===== Next Steps =====${NC}"

if [ $custom_domain_accessible -ne 0 ]; then
  echo -e "1. If you haven't already connected the domain in Firebase Console:"
  echo -e "   - Go to Firebase Console > Hosting > Connect domain"
  echo -e "   - Enter ${CUSTOM_DOMAIN} as the domain name"
  echo -e "   - Get the verification code from Firebase"
  echo -e "   - Run: node update-asoos-dns.js VERIFICATION_CODE"
  echo
  echo -e "2. Wait for DNS changes to propagate (up to 24-48 hours)"
  echo -e "   - DNS changes can take time to propagate globally"
  echo -e "   - Run this script periodically to check status: bash monitor-asoos-deployment.sh"
  echo
  echo -e "3. Once verified, SSL certificates will be provisioned automatically"
  echo -e "   - This can take additional time after DNS propagation"
fi

# If everything is working
if [ $firebase_accessible -eq 0 ] && [ $custom_domain_accessible -eq 0 ]; then
  echo -e "${GREEN}🎉 Deployment is complete and fully operational! No further actions needed.${NC}"
fi