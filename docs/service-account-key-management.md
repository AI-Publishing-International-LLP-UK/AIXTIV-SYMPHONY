# Service Account Key Management

This document describes the automated service account key management system set up for the ASOOS Integration Gateway.

## Overview

The service account key manager automates the process of updating Google Cloud service account keys, ensuring secure handling of credentials and maintaining version control. The system consists of:

1. A Node.js script for managing key files, backups, and git integration
2. A shell wrapper script that automates environment variable updates
3. A key rotation script that fully automates the creation of new keys
4. Convenient aliases for easy access to the functionality

## Usage

### Updating an Existing Key

To update an existing service account key:

```bash
update-gcp-key /path/to/new/service-account-key.json
```

This command will:
- Validate the new key file
- Create a backup of the current key
- Update the integration-gateway/service-account-key.json file
- Commit and push changes to git
- Update your .zshrc file with the new path
- Automatically refresh your environment variables

### Rotating Service Account Keys (Fully Automated)

To completely automate the process of creating a new key and updating it in the system:

```bash
rotate-gcp-key [service-account-email] [project-id]
```

If parameters are omitted, the script will:
- Use the service account from the current credentials file
- Use the currently active GCP project

This command will:
- Generate a new service account key in Google Cloud
- Download the key securely to a temporary location
- Update the key in the system (using update-gcp-key)
- Clean up temporary files
- List all keys for the service account (helping identify old keys to delete)

## Components

### 1. service-account-key-manager.js

Core script responsible for:
- Validating service account keys
- Comparing keys to avoid unnecessary updates
- Creating backups in `.key-backups/` directory
- Setting secure file permissions (0o600)
- Git integration (staging, committing, pushing)
- Updating .zshrc file

Path: `~/asoos/integration-gateway/utils/service-account-key-manager.js`

### 2. update-service-account-key.sh

Shell wrapper that:
- Runs the Node.js script
- Automatically sources .zshrc after update
- Provides better user experience by refreshing environment variables

Path: `~/asoos/integration-gateway/utils/update-service-account-key.sh`

### 3. rotate-service-account-key.sh

Full automation script that:
- Creates a new service account key in Google Cloud
- Downloads it securely
- Updates the key in the system
- Cleans up temporary files
- Lists existing keys to help with management

Path: `~/asoos/integration-gateway/utils/rotate-service-account-key.sh`

### 4. Zsh Aliases

Aliases have been added to your .zshrc file:
```bash
alias update-gcp-key="~/asoos/integration-gateway/utils/update-service-account-key.sh"
alias rotate-gcp-key="~/asoos/integration-gateway/utils/rotate-service-account-key.sh"
```

These provide convenient shorthands for running the scripts.

## Security Considerations

- The service account key is stored with 0o600 permissions (owner read/write only)
- Backups are created before any changes
- Git integration ensures changes are tracked and logged
- The key file is never exposed in plain text during operations
- Temporary files are securely managed and deleted after use
- Service account key rotation follows GCP best practices

## Troubleshooting

If you encounter issues with the key manager:

1. Ensure your git working directory is clean
2. Check that you have the correct permissions for the key file
3. Verify that the target directory is within a git repository
4. Ensure the new key file is a valid Google service account key
5. For rotation script, verify you are logged in to gcloud: `gcloud auth login`

For manual environment variable updates, run:
```bash
source ~/.zshrc
```

## Maintenance

### Automated Key Rotation

The recommended approach for key rotation is to use the fully automated script:

```bash
rotate-gcp-key
```

This will handle the entire process from creating a new key to updating it in your system.

### Manual Key Management

Alternatively, for manual key management:

1. Generate a new key in the Google Cloud Console
2. Download the key to a secure location
3. Run `update-gcp-key /path/to/downloaded/key.json`
4. Verify the update was successful by checking your environment variable

### Cleaning Up Old Keys

After rotating keys, it's a good practice to delete old keys:

```bash
gcloud iam service-accounts keys delete KEY_ID --iam-account=SERVICE_ACCOUNT_EMAIL
```

The `rotate-gcp-key` script will list existing keys to help identify old ones for deletion.
