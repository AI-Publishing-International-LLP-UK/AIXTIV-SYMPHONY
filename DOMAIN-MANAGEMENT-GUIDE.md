# Domain Management Guide

This guide explains how to use the bulk domain management tools for updating DNS records to point to Firebase hosting.

## Overview

The domain management tools allow you to:

1. Update all GoDaddy domains and subdomains to point to Firebase hosting
2. Exclude specific domains from the update
3. Verify DNS records after the update
4. Connect individual domains to Firebase hosting
5. Add verification TXT records for domain ownership

## Setup

### Prerequisites

- Node.js and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (for `gcloud` commands)
- GoDaddy API credentials

### Installation

1. Run the setup script to install and configure the tools:

```bash
bash setup-bulk-domain-update.sh
```

This script will:
- Check for required tools
- Install necessary Node.js packages
- Authenticate with Google Cloud
- Set up the Firebase project
- Update the Aixtiv CLI with domain management commands

## Bulk Domain Update

### Using the Script Directly

To update all domains (except excluded domains) to point to Firebase hosting:

```bash
node bulk-update-domains.js
```

To verify DNS records after the update:

```bash
node bulk-update-domains.js --verify
```

### Using the Aixtiv CLI

To update all domains (except excluded domains) to point to Firebase hosting:

```bash
aixtiv domain update-firebase --exclude=domain1.com,domain2.com
```

To verify DNS records after the update:

```bash
aixtiv domain update-firebase --verify
```

## Individual Domain Management

### Connect a Domain to Firebase Hosting

```bash
aixtiv domain connect-firebase example.com --project=api-for-warp-drive
```

### Add Verification TXT Record

After connecting a domain in the Firebase Console, you'll get a verification code. Add it with:

```bash
aixtiv domain verify example.com VERIFICATION_CODE
```

### Check Domain Status

To check the status of a domain (DNS, TXT records, HTTP status):

```bash
aixtiv domain status example.com
```

## Configuration

### Excluded Domains

The following domains are excluded from bulk updates by default:

- philliproark.com
- byfabriziodesign.com
- kennedypartain.com
- 2100.group
- fabriziosassano.com

You can modify this list in the `CONFIG.excludedDomains` array in `bulk-update-domains.js`.

### Firebase IPs

The script uses the following Firebase hosting IPs:

- 199.36.158.100 (primary)
- 199.36.158.101
- 199.36.158.102
- 199.36.158.103

You can modify these in the `CONFIG.firebaseIPs` array in `bulk-update-domains.js`.

### GoDaddy API Credentials

Store your GoDaddy API credentials in `.godaddy-credentials.json`:

```json
{
  "apiKey": "YOUR_API_KEY",
  "apiSecret": "YOUR_API_SECRET"
}
```

## Troubleshooting

### DNS Propagation

DNS changes can take up to 24-48 hours to propagate globally. Use the `--verify` flag to check the status of the DNS records.

### API Rate Limits

GoDaddy API has rate limits. The script includes delays between requests to avoid hitting these limits. If you encounter rate limit issues, increase the delay in the script.

### Firebase Project Issues

Make sure you're authenticated with `gcloud` and have set the correct Firebase project:

```bash
gcloud auth login
gcloud config set project api-for-warp-drive
firebase use api-for-warp-drive
```

### Invalid Credentials

If you encounter authentication errors, check that your GoDaddy API credentials are valid. You can test them by running:

```bash
aixtiv domain status example.com
```

## Domain Update Process

The domain update process follows these steps:

1. Retrieves all domains from GoDaddy
2. Filters out excluded domains
3. Updates the A record for each domain to point to Firebase hosting
4. Updates A records for www subdomains
5. Finds all other subdomains and updates their A records
6. Saves a report of successful and failed updates

## Results and Logging

The script saves results to `domain-update-results.json` and logs to `domain-update.log`. These files contain detailed information about the update process, including:

- Domains updated successfully
- Domains that failed to update
- Subdomains updated successfully
- Subdomains that failed to update
- Summary statistics

## Advanced Usage

### Custom Firebase Project

To use a different Firebase project:

```bash
aixtiv domain update-firebase --project=your-project-id
```

### Custom GoDaddy Credentials

To use a different GoDaddy API credentials file:

```bash
aixtiv domain update-firebase --credentials=/path/to/credentials.json
```

### Custom Domain Patterns

To update only domains matching a specific pattern:

```bash
aixtiv domain update-firebase --pattern=2100
```

This would only update domains containing "2100" in their name.

## Support

For support or questions, please contact the deployment team.