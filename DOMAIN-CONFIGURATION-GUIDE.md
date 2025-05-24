# Domain Configuration Guide

This guide explains how to manage all domains in the ASOOS ecosystem using the new consolidated configuration system.

## Overview

The new system provides:

- Centralized configuration for all domains
- Automated DNS setup for Firebase hosting
- TXT verification record management
- Status tracking for all domains
- Clear instructions for manual steps

## Getting Started

### 1. Configure All Domains

Run the main script to configure all domains defined in the configuration:

```bash
node configure-all-domains.js
```

This will:
- Set up A records for all domains to point to Firebase hosting
- Remove any conflicting CNAME records
- Check existing TXT verification records
- Generate instructions for connecting domains in Firebase Console
- Save the current status to a verification log

### 2. Add Verification for a Domain

When you connect a domain in the Firebase Console, you'll receive a verification code. Add this code using:

```bash
node configure-all-domains.js verify yourdomain.com VERIFICATION_CODE
```

For example:
```bash
node configure-all-domains.js verify asoos.2100.cool firebase-verify-abcde12345
```

### 3. Check Domain Status

To check the status of all configured domains:

```bash
node configure-all-domains.js check
```

This will show you:
- Whether A records are configured
- Whether TXT verification records are configured
- Which Firebase site each domain points to
- Whether HTTPS is working properly

## Managing the Domain List

To add or modify domains, edit the `domains` array in `configure-all-domains.js`:

```javascript
domains: [
  {
    domain: '2100.cool',
    subdomains: [
      { name: 'asoos', firebaseSite: '2100-cool' },
      { name: 'vision', firebaseSite: '2100-cool' },
      // Add more subdomains as needed
    ]
  },
  // Add more domains as needed
]
```

## Firebase Connection Process

1. **Run the main script** to set up DNS records:
   ```
   node configure-all-domains.js
   ```

2. **Go to Firebase Console** for each domain/subdomain:
   - Navigate to: `https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites`
   - Click "Add custom domain"
   - Enter your domain (e.g., asoos.2100.cool)
   - Connect it to the appropriate site (e.g., 2100-cool)
   - Get the verification code

3. **Add the verification code**:
   ```
   node configure-all-domains.js verify asoos.2100.cool VERIFICATION_CODE
   ```

4. **Wait for verification** (can take 24-48 hours)

5. **Check the status**:
   ```
   node configure-all-domains.js check
   ```

## Troubleshooting

### DNS Issues

If DNS isn't updating, check:
- GoDaddy API credentials are correct
- Domain is correctly configured in GoDaddy
- Allow sufficient time for DNS propagation (up to 48 hours)

You can manually check DNS records using:
```
dig yourdomain.com
```

### SSL Issues

If SSL isn't working:
- Verify DNS records are correct
- Ensure TXT verification record is present
- Wait for Firebase to provision the certificate (up to 24 hours after verification)

## Maintenance

Regularly run the check command to ensure all domains remain properly configured:

```bash
node configure-all-domains.js check
```

This will help identify any domains that need attention.