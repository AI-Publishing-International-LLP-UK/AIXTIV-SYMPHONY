#!/bin/bash

# Simple script to check Firebase deployment and DNS status

DOMAIN="2100.cool"
SUBDOMAIN="asoos"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"

echo "=== ASOOS.2100.COOL Deployment Check ==="
echo

# Check Firebase deployment
echo "Checking Firebase deployment at https://2100-cool.web.app..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://2100-cool.web.app)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Firebase hosting is deployed successfully at https://2100-cool.web.app"
else
  echo "❌ Firebase hosting is not accessible or returning $HTTP_CODE error at https://2100-cool.web.app"
fi

# Check DNS
echo
echo "Checking DNS records for $FULL_DOMAIN..."
DNS_RECORDS=$(dig $FULL_DOMAIN +short)

if [ -z "$DNS_RECORDS" ]; then
  echo "❌ No DNS records found for $FULL_DOMAIN"
  echo "Recommendation: Check DNS configuration in GoDaddy or other DNS provider"
else
  echo "Current DNS records for $FULL_DOMAIN:"
  echo "$DNS_RECORDS"
  
  # Check if pointing to Firebase
  if echo "$DNS_RECORDS" | grep -q "storage.googleapis.com" || echo "$DNS_RECORDS" | grep -q "199.36.158"; then
    echo "✅ DNS appears to be correctly pointing to Firebase hosting"
  else
    echo "❌ DNS is not pointing to Firebase hosting"
    echo "Recommendation: Update DNS to point to Firebase (A record to 199.36.158.100 or CNAME to c.storage.googleapis.com)"
  fi
fi

# Check if accessible via custom domain
echo
echo "Checking if site is accessible via https://$FULL_DOMAIN..."
CUSTOM_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 https://$FULL_DOMAIN 2>/dev/null || echo "Timeout")

if [ "$CUSTOM_HTTP_CODE" = "200" ]; then
  echo "✅ Site is accessible via https://$FULL_DOMAIN"
else
  echo "❌ Site is not accessible via https://$FULL_DOMAIN (status: $CUSTOM_HTTP_CODE)"
  echo "This may be due to:"
  echo "  1. DNS records not set or not propagated yet"
  echo "  2. Custom domain not connected in Firebase Console"
  echo "  3. SSL certificate not provisioned yet"
fi

echo
echo "=== Next Steps ==="
echo "1. If Firebase hosting is working but custom domain is not:"
echo "   - Connect custom domain in Firebase Console: https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites"
echo "   - Update DNS records in GoDaddy to point to Firebase hosting"
echo "   - Wait for DNS propagation (can take up to 24-48 hours)"
echo
echo "2. If you need to update DNS records:"
echo "   - Run the domain update script: node /Users/as/asoos/update-asoos-dns.js"
echo "   - When you receive verification code from Firebase, add it with: node /Users/as/asoos/update-asoos-dns.js VERIFICATION_CODE"
echo
echo "3. To verify deployment:"
echo "   - Run this script again after DNS changes have propagated"
echo "   - Check site at https://2100-cool.web.app (should always work if deployed correctly)"
echo "   - Check site at https://$FULL_DOMAIN (requires DNS and custom domain setup)"