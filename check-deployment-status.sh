#!/bin/bash

# Script to check ASOOS.2100.COOL deployment status

echo "=== ASOOS.2100.COOL Deployment Status Check ==="
echo "$(date)"
echo

# Check Firebase hosting
echo "Checking Firebase site (https://2100-cool.web.app)..."
FIREBASE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://2100-cool.web.app)

if [ "$FIREBASE_STATUS" = "200" ]; then
  echo "✅ Firebase site is accessible (HTTP $FIREBASE_STATUS)"
else
  echo "❌ Firebase site is not accessible (HTTP $FIREBASE_STATUS)"
fi

# Check DNS propagation
echo
echo "Checking DNS records for asoos.2100.cool..."
echo "  Official DNS Records:"

# Try different DNS resolvers to check propagation
echo "  • Local DNS:"
dig +short asoos.2100.cool | sed 's/^/    /'

echo "  • Google DNS (8.8.8.8):"
dig @8.8.8.8 +short asoos.2100.cool | sed 's/^/    /'

echo "  • Cloudflare DNS (1.1.1.1):"
dig @1.1.1.1 +short asoos.2100.cool | sed 's/^/    /'

# Check GoDaddy's configured records
echo
echo "Checking GoDaddy's configured DNS records..."
NODE_DNS_CHECK=$(node -e "
const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  domain: '2100.cool',
  subdomain: 'asoos',
  apiUrl: 'https://api.godaddy.com/v1',
  configPath: path.join(process.cwd(), '.godaddy-credentials.json')
};

// Read credentials
try {
  const creds = JSON.parse(fs.readFileSync(CONFIG.configPath, 'utf8'));
  
  // Make API request
  const options = {
    hostname: 'api.godaddy.com',
    path: \`/v1/domains/\${CONFIG.domain}/records/A/\${CONFIG.subdomain}\`,
    method: 'GET',
    headers: {
      'Authorization': \`sso-key \${creds.apiKey}:\${creds.apiSecret}\`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } else {
        console.log('Error: ' + res.statusCode);
        console.log(data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Error: ' + error.message);
  });
  
  req.end();
} catch (error) {
  console.error('Error: ' + error.message);
}
")

echo "$NODE_DNS_CHECK"

# Check if custom domain is accessible
echo
echo "Checking custom domain (https://asoos.2100.cool)..."
CUSTOM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 https://asoos.2100.cool 2>/dev/null || echo "Timeout")

if [ "$CUSTOM_STATUS" = "200" ]; then
  echo "✅ Custom domain is accessible (HTTP $CUSTOM_STATUS)"
else
  echo "❌ Custom domain is not accessible (HTTP $CUSTOM_STATUS)"
  echo "   This is expected if DNS changes haven't propagated yet or if the domain"
  echo "   hasn't been connected in Firebase Console."
fi

# Check Firebase verification TXT record
echo
echo "Checking Firebase verification TXT record..."
TXT_RECORDS=$(dig +short TXT asoos.2100.cool)

if echo "$TXT_RECORDS" | grep -q "firebase="; then
  echo "✅ Firebase verification TXT record found:"
  echo "$TXT_RECORDS" | grep "firebase=" | sed 's/^/    /'
else
  echo "❌ No Firebase verification TXT record found"
  echo "   You can add it with: node /Users/as/asoos/add-verification.js VERIFICATION_CODE"
fi

# Summary and recommendations
echo
echo "=== Status Summary ==="
if [ "$FIREBASE_STATUS" = "200" ]; then
  echo "✅ Firebase deployment: ONLINE"
else
  echo "❌ Firebase deployment: OFFLINE"
fi

if dig +short asoos.2100.cool | grep -q "199.36.158"; then
  echo "✅ DNS propagation: COMPLETE"
elif dig +short asoos.2100.cool | grep -q "zena.2100.cool"; then
  echo "❌ DNS propagation: PENDING (still pointing to zena.2100.cool)"
else
  echo "❓ DNS propagation: UNKNOWN"
fi

if [ "$CUSTOM_STATUS" = "200" ]; then
  echo "✅ Custom domain: ONLINE"
else
  echo "❌ Custom domain: OFFLINE"
fi

if echo "$TXT_RECORDS" | grep -q "firebase="; then
  echo "✅ Verification record: PRESENT"
else
  echo "❌ Verification record: MISSING"
fi

echo
echo "Next steps:"
if [ "$FIREBASE_STATUS" != "200" ]; then
  echo "1. Check your Firebase deployment with: firebase deploy --only hosting:asoos"
fi

if ! dig +short asoos.2100.cool | grep -q "199.36.158"; then
  echo "1. DNS changes haven't propagated yet. Wait or check GoDaddy records."
  echo "   - Your site is still available at: https://2100-cool.web.app"
fi

if [ "$CUSTOM_STATUS" != "200" ] && dig +short asoos.2100.cool | grep -q "199.36.158"; then
  echo "1. Connect custom domain in Firebase Console"
  echo "2. Add verification record with: node /Users/as/asoos/add-verification.js VERIFICATION_CODE"
fi

echo
echo "To add Firebase verification record:"
echo "1. Go to Firebase Console and start the custom domain connection process"
echo "2. Copy the verification code provided by Firebase"
echo "3. Run: node /Users/as/asoos/add-verification.js VERIFICATION_CODE"
echo
echo "To check status again, run: bash /Users/as/asoos/check-deployment-status.sh"