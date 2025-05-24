# Coaching2100.com Domain Connection Guide

## Overview

Your coaching2100.com website has been successfully deployed to Firebase hosting, but we need to properly connect the domain to fix the "Site Not Found" error and ensure HTTPS works correctly.

## The Issue

From my analysis, the coaching2100.com domain is correctly mapped in your domain management system, but the Firebase hosting connection may be incomplete or needs to be refreshed. This guide will help you:

1. Connect the coaching2100.com domain to Firebase hosting
2. Enable HTTPS 
3. Verify the domain ownership

## Step 1: Run the Connection Script

I've created a script to help you connect the domain. The script is designed to make minimal changes to your existing setup.

```bash
# Navigate to the directory
cd /Users/as/asoos/coaching2100-deploy

# Make sure the service account key is available
# It should be at /Users/as/asoos/service-account-key.json
# If it's elsewhere, set this environment variable:
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Run the script
node connect-domain.js
```

## Step 2: Configure DNS Records

After running the script, you'll see a list of DNS records that need to be configured. Make sure these records are set up at your domain provider (likely GoDaddy based on your system).

The DNS records will look something like:
- A TXT record for domain verification
- One or more A records pointing to Firebase IPs

## Step 3: Wait for DNS Propagation

DNS propagation can take 24-48 hours, though it often happens much faster (sometimes within an hour).

## Step 4: Verify in Firebase Console

You can verify that the domain is properly connected in the Firebase Console:

1. Go to https://console.firebase.google.com/project/api-for-warp-drive
2. Navigate to Hosting → Domains
3. Find coaching2100.com in the list
4. Check its status

## Troubleshooting

If you encounter issues:

1. **DNS Records Not Updating**: Check your domain provider's documentation for how to update DNS records.

2. **Verification Failed**: Make sure the TXT record is correctly configured. Sometimes it helps to add a period at the end of the record value.

3. **HTTPS Not Working**: SSL certificate provisioning happens automatically after domain verification. If it's still not working after 24 hours, you may need to refresh the certificate in the Firebase Console.

## Need More Help?

If you encounter any issues with this process, you can:

1. Check Firebase Hosting documentation: https://firebase.google.com/docs/hosting/custom-domain
2. Run `firebase hosting:domain:list` to see current domain connections
3. Use the Firebase Console for a graphical interface to manage domains