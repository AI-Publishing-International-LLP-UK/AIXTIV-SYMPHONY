# GoDaddy to Firebase DNS Migration Tool

This document outlines the process for migrating domains from GoDaddy to Firebase for the `api-for-warp-drive` project.

## Purpose

This migration tool automates the process of:
1. Setting up DNS records at GoDaddy to point to Firebase (199.36.158.100)
2. Excluding specific domains from the migration

## Excluded Domains

The following domains are explicitly EXCLUDED from migration:
- philliproark.com
- byfabriziodesign.com
- 2100.group
- kennedyryan.com

## Prerequisites

Before running the migration script, ensure:
1. You have the `gcloud` CLI installed and configured
2. You have the `firebase` CLI installed and configured
3. You have authenticated with the GCP project: `api-for-warp-drive`
4. The GoDaddy API credentials are stored in Secret Manager:
   - Secret: `godaddy_api` (in format "key:secret")

## Usage

The migration script `/Users/as/godaddy_to_firebase_migration.sh` supports several operations:

### Test Setup (Recommended First Step)

```bash
./godaddy_to_firebase_migration.sh test
```

This will:
- Verify connection to GoDaddy API
- Show the first 10 domains
- Show the excluded domains
- Make NO changes to any DNS records

### Migrate All Domains (DNS Only)

```bash
./godaddy_to_firebase_migration.sh all
```

This will:
- Fetch all domains from the predefined list
- Exclude the domains in the exclusion list
- Update DNS records for each remaining domain to point to Firebase

### Migrate Domains from a File (DNS Only)

```bash
./godaddy_to_firebase_migration.sh file domains.txt
```

The domains file should list one domain per line:
```
example.com
another-example.com
```

### Migrate a Single Domain

```bash
./godaddy_to_firebase_migration.sh setup example.com
```

### Same as Setup (Single Domain)

```bash
./godaddy_to_firebase_migration.sh dns-only example.com
```

## Logs

Migration logs are stored in `/Users/as/asoos/domain-management/domain-migrations-logs/` with timestamps.

## Troubleshooting

If you encounter issues:

1. Check the log files for detailed errors
2. Verify GCP Secret Manager has the correct API credentials
3. Ensure the Firebase CLI is logged in to the correct project
4. For DNS issues, wait 24-48 hours for propagation

## Manual Steps

After running the script, you may need to:
1. Verify domain ownership in Firebase Console
2. Add SSL certificates if not automatically provisioned
3. Update firebase.json if you're using multiple hosting sites