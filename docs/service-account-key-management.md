# Service Account Key Management

This document describes the automated service account key management system set up for the ASOOS Integration Gateway.

## Overview

The service account key manager automates the process of updating Google Cloud service account keys, ensuring secure handling of credentials and maintaining version control. The system consists of:

1. A Node.js script for managing key files, backups, and git integration
2. A shell wrapper script that automates environment variable updates
3. A convenient alias for easy access to the functionality

## Usage

Updating a service account key is as simple as running:

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

### 3. Zsh Alias

An alias has been added to your .zshrc file:
```bash
alias update-gcp-key="~/asoos/integration-gateway/utils/update-service-account-key.sh"
```

This provides a convenient shorthand for running the update script.

## Security Considerations

- The service account key is stored with 0o600 permissions (owner read/write only)
- Backups are created before any changes
- Git integration ensures changes are tracked and logged
- The key file is never exposed in plain text during operations

## Troubleshooting

If you encounter issues with the key manager:

1. Ensure your git working directory is clean
2. Check that you have the correct permissions for the key file
3. Verify that the target directory is within a git repository
4. Ensure the new key file is a valid Google service account key

For manual environment variable updates, run:
```bash
source ~/.zshrc
```

## Maintenance

When rotating service account keys:

1. Generate a new key in the Google Cloud Console
2. Download the key to a secure location
3. Run `update-gcp-key /path/to/downloaded/key.json`
4. Verify the update was successful by checking your environment variable
