# ASOOS.2100.COOL Custom Domain Setup Guide

This guide explains how to connect the asoos.2100.cool custom domain to your Firebase hosted site.

## Current Status

1. **Firebase Deployment**: The ASOOS interface is successfully deployed to Firebase hosting at https://2100-cool.web.app
2. **DNS Configuration**: The asoos.2100.cool subdomain currently points to a different server (zena.2100.cool - 34.169.95.205)
3. **Custom Domain Setup**: The custom domain is not yet connected to Firebase hosting

## Steps to Connect Custom Domain

### 1. Update DNS Records in GoDaddy

You need to update the DNS records for asoos.2100.cool to point to Firebase hosting. This can be done in two ways:

#### Option A: Through GoDaddy Dashboard

1. Log in to your GoDaddy account
2. Navigate to the Domain Manager and find 2100.cool
3. Go to DNS settings
4. Delete any existing records for the "asoos" subdomain
5. Add a new A record:
   - Type: A
   - Name: asoos
   - Value: 199.36.158.100
   - TTL: 1 Hour (or 3600 seconds)

#### Option B: Using the API Script (requires valid API credentials)

1. Create or update the .godaddy-credentials.json file in the root directory with your API credentials:

```json
{
  "apiKey": "YOUR_GODADDY_API_KEY",
  "apiSecret": "YOUR_GODADDY_API_SECRET"
}
```

2. Run the update script:

```bash
node /Users/as/asoos/update-asoos-dns.js
```

### 2. Connect Custom Domain in Firebase Console

1. Go to the Firebase Console: https://console.firebase.google.com/project/api-for-warp-drive
2. Navigate to Hosting section
3. Click "Add custom domain"
4. Enter: asoos.2100.cool
5. Follow the verification process 
6. You'll receive a verification code - copy it

### 3. Add Verification Record

Firebase will provide a verification code that needs to be added as a TXT record.

#### Option A: Through GoDaddy Dashboard

1. Add a new TXT record:
   - Type: TXT
   - Name: asoos
   - Value: firebase=VERIFICATION_CODE
   - TTL: 1 Hour (or 3600 seconds)

#### Option B: Using the API Script (requires valid API credentials)

```bash
node /Users/as/asoos/update-asoos-dns.js VERIFICATION_CODE
```

### 4. Wait for Verification and DNS Propagation

1. DNS changes can take 24-48 hours to propagate globally
2. Firebase will automatically provision SSL certificate once DNS is verified
3. Periodically check status with:

```bash
/Users/as/asoos/check-asoos-deployment.sh
```

### 5. Verify Final Setup

1. Ensure Firebase hosting is accessible at https://2100-cool.web.app
2. Verify custom domain is working at https://asoos.2100.cool
3. Check SSL certificate is correctly provisioned

## Common Issues and Troubleshooting

1. **DNS Not Updating**: Sometimes DNS caching can delay seeing changes. Try checking with different tools like [DNS Checker](https://dnschecker.org/).

2. **SSL Certificate Issues**: Firebase automatically provisions SSL certificates but it may take some time. Ensure your DNS settings are correct.

3. **API Script Errors**: If you encounter authentication errors with the GoDaddy API script, ensure your API credentials are valid and have the appropriate permissions.

4. **Subdomain Already In Use**: If the subdomain is being used by another service, you'll need to delete or update those records first.

## Manual Connection Instructions (if API script doesn't work)

To manually connect the custom domain:

1. Update DNS records in GoDaddy to point to Firebase hosting
2. Connect the custom domain in Firebase Console
3. Add the verification record provided by Firebase
4. Wait for verification and DNS propagation
5. Verify the setup is working

## Resources

- Firebase Hosting documentation: https://firebase.google.com/docs/hosting/custom-domain
- GoDaddy DNS Management: https://www.godaddy.com/help/manage-dns-records-680
- Firebase Console: https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites