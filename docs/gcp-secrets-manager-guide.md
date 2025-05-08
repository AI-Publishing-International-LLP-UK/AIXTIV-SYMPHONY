# GCP Secret Manager Integration Guide

This guide provides comprehensive documentation for the Google Cloud Secret Manager integration implemented in the Aixtiv Symphony platform. The integration allows for secure management of sensitive credentials and API keys across both the integration-gateway and aixtiv-cli projects.

## Table of Contents

1. [Introduction](#introduction)
2. [Implementation Overview](#implementation-overview)
3. [Setting Up the Integration](#setting-up-the-integration)
4. [Using GCP Secret Manager in Integration Gateway](#using-gcp-secret-manager-in-integration-gateway)
5. [Using GCP Secret Manager in Aixtiv CLI](#using-gcp-secret-manager-in-aixtiv-cli)
6. [API Key Rotation](#api-key-rotation)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Introduction

Google Cloud Secret Manager provides a secure and convenient way to store and access sensitive information such as API keys, passwords, and certificates. This integration allows us to centralize the management of all sensitive data, implement proper access controls, and automate key rotation.

Key benefits:
- Centralized management of all secrets
- Version control for secrets
- Fine-grained access control
- Audit logging
- Automated key rotation
- Integration with Google Cloud's IAM system

## Implementation Overview

### Integration Gateway Project

The integration includes:

1. **GCPSecretsManager Class** (`/services/common/gcp-secrets-manager.js`)
   - Core class for interacting with Google Cloud Secret Manager
   - Implements caching for improved performance
   - Handles encryption for additional security
   - Provides comprehensive error handling and statistics

2. **GCPSecretsClient** (`/services/common/gcp-secrets-client.js`)
   - High-level client wrapper with simplified API
   - Implements singleton pattern for consistent access
   - Handles credential discovery and configuration management

3. **API Key Rotation Script** (`/scripts/rotate-api-keys.js`)
   - Automates rotation of various API keys and credentials
   - Integrates with Secret Manager for storage and retrieval
   - Provides scheduling capabilities and notifications

### Aixtiv CLI Project

The CLI implementation includes:

1. **Secrets Command Domain**
   - `secrets:init` - Initialize Secret Manager configuration
   - `secrets:list` - List all secrets
   - `secrets:get` - Get a secret value
   - `secrets:create` - Create or update a secret
   - `secrets:delete` - Delete a secret
   - `secrets:rotate` - Rotate service account credentials

## Setting Up the Integration

### Prerequisites

- Google Cloud Platform account with Secret Manager API enabled
- Service account with Secret Manager Admin role
- Google Cloud SDK (gcloud CLI) installed
- Node.js v14 or higher

### Adding Required Dependencies

We've provided a utility script to add the required dependencies to both projects. Run:

```bash
cd /Users/as/asoos/integration-gateway
node scripts/update-dependencies.js
```

This will update the package.json files in both projects to include:
- @google-cloud/secret-manager
- node-cache

### Setting Up GCP Project and Service Account

1. Create a GCP project (if you don't have one):
   ```bash
   gcloud projects create api-for-warp-drive --name="Aixtiv Symphony"
   ```

2. Enable the Secret Manager API:
   ```bash
   gcloud services enable secretmanager.googleapis.com --project=api-for-warp-drive
   ```

3. Create a service account:
   ```bash
   gcloud iam service-accounts create drlucyautomation \
     --display-name="Dr. Lucy Automation" \
     --project=api-for-warp-drive
   ```

4. Grant the service account access to Secret Manager:
   ```bash
   gcloud projects add-iam-policy-binding api-for-warp-drive \
     --member="serviceAccount:drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com" \
     --role="roles/secretmanager.admin"
   ```

5. Create and download a service account key:
   ```bash
   gcloud iam service-accounts keys create service-account-key.json \
     --iam-account=drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com
   ```

6. Move the key file to a secure location:
   ```bash
   mv service-account-key.json /Users/as/asoos/integration-gateway/
   chmod 600 /Users/as/asoos/integration-gateway/service-account-key.json
   ```

### Initializing the Integration

Use the aixtiv-cli to initialize the Secret Manager configuration:

```bash
cd /Users/as/asoos/aixtiv-cli
npm run start -- secrets:init --project-id=api-for-warp-drive --key-file=/Users/as/asoos/integration-gateway/service-account-key.json
```

This will:
1. Create a configuration file in `~/.aixtiv/secrets/config.json`
2. Validate the service account credentials
3. Set up environment variables in your shell configuration files

## Using GCP Secret Manager in Integration Gateway

### Importing the Client

```javascript
// Import the client
const { getSecretsManager } = require('./services/common/gcp-secrets-client');

// Get a reference to the singleton instance
const secretsManager = getSecretsManager();

// Initialize it (only needed once)
await secretsManager.initialize();
```

### Getting a Secret

```javascript
// Get a secret value
try {
  const apiKey = await secretsManager.getSecret('openai-api-key');
  console.log(`Successfully retrieved API key: ${apiKey.substring(0, 4)}...`);
} catch (error) {
  console.error(`Error retrieving secret: ${error.message}`);
}
```

### Creating or Updating a Secret

```javascript
// Create or update a secret
try {
  const result = await secretsManager.createOrUpdateSecret(
    'database-password', 
    'very-secure-password',
    { labels: { environment: 'production' } }
  );
  console.log(`Secret created/updated: ${result.name}, version: ${result.version}`);
} catch (error) {
  console.error(`Error creating/updating secret: ${error.message}`);
}
```

### Listing Secrets

```javascript
// List all secrets
try {
  const secrets = await secretsManager.listSecrets();
  console.log(`Found ${secrets.length} secrets:`);
  secrets.forEach(secretName => console.log(`- ${secretName}`));
} catch (error) {
  console.error(`Error listing secrets: ${error.message}`);
}
```

### Deleting a Secret

```javascript
// Delete a secret
try {
  await secretsManager.deleteSecret('old-api-key');
  console.log('Secret deleted successfully');
} catch (error) {
  console.error(`Error deleting secret: ${error.message}`);
}
```

### Working with Cache

The client includes caching to improve performance and reduce API calls:

```javascript
// Get a cached secret (will try cache first)
const apiKey = await secretsManager.getSecret('openai-api-key');

// Force a fresh fetch from GCP, bypassing cache
const freshApiKey = await secretsManager.getSecret('openai-api-key', { ignoreCache: true });

// Invalidate cache when needed (e.g., after updating secrets externally)
secretsManager.invalidateCache();

// Get cache statistics
const stats = secretsManager.getStats();
console.log(`Cache hits: ${stats.cacheHits}, misses: ${stats.cacheMisses}`);
```

## Using GCP Secret Manager in Aixtiv CLI

The Aixtiv CLI provides a complete set of commands to manage secrets from the command line.

### Initializing Secret Manager Configuration

```bash
aixtiv secrets:init --project-id=api-for-warp-drive
```

Options:
- `--project-id <id>` - GCP Project ID
- `--key-file <path>` - Path to service account key file
- `--force` - Force overwrite of existing configuration
- `--no-validate` - Skip validation of GCP credentials

### Listing Secrets

```bash
aixtiv secrets:list
```

Options:
- `--output <format>` - Output format: table, json, yaml (default: table)
- `--filter <pattern>` - Filter secrets by name pattern

Example with filtering:
```bash
aixtiv secrets:list --filter="api-key-*" --output=json
```

### Getting a Secret Value

```bash
aixtiv secrets:get openai-api-key
```

Options:
- `--version <version>` - Secret version (default: latest)
- `--output <format>` - Output format: raw, json, env (default: raw)
- `--no-decode` - Do not decode base64 values

Example for specific version:
```bash
aixtiv secrets:get firebase-credentials --version=1 --output=json
```

### Creating or Updating a Secret

```bash
aixtiv secrets:create anthropic-api-key --value="sk_ant_123456789"
```

Options:
- `--value <value>` - Secret value (if not provided, will prompt)
- `--file <path>` - Read secret value from file
- `--env-var <variable>` - Read secret value from environment variable
- `--labels <labels>` - Secret labels (comma-separated key=value pairs)
- `--force` - Skip confirmation prompt

Example reading from file:
```bash
aixtiv secrets:create firebase-credentials --file=./firebase-key.json
```

### Deleting a Secret

```bash
aixtiv secrets:delete old-api-key
```

Options:
- `--force` - Skip confirmation prompt

### Rotating Service Account Credentials

```bash
aixtiv secrets:rotate --email=drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com
```

Options:
- `--email <email>` - Service account email
- `--delete-old` - Delete old service account key after rotation
- `--force` - Skip confirmation prompt

## API Key Rotation

The API key rotation script automates the process of rotating various types of secrets and credentials.

### Available Key Types

The script supports rotating these types of keys:
- JWT authentication keys
- OpenAI API keys
- Anthropic API keys
- Hugging Face API keys
- Pinecone API keys
- Firebase credentials
- GoDaddy API keys
- Firestore credentials

### Running the Rotation Script

```bash
cd /Users/as/asoos/integration-gateway
node scripts/rotate-api-keys.js --key-type=jwt
```

Options:
- `--key-type <type>` - Specify key type to rotate (default: all)
- `--force` - Force rotation even if not due
- `--dry-run` - Simulate rotation without making changes
- `--notify <email>` - Send notification to specified email
- `--schedule <schedule>` - Set up a rotation schedule

### Setting Up Scheduled Rotation

You can set up a cron job to automatically rotate keys on a schedule:

```bash
# Edit crontab
crontab -e

# Add this line to run weekly rotation at 2 AM on Sundays
0 2 * * 0 cd /Users/as/asoos/integration-gateway && node scripts/rotate-api-keys.js >> /Users/as/asoos/integration-gateway/logs/key-rotation.log 2>&1
```

## Best Practices

### Security Best Practices

1. **Never Store Credentials in Code**
   - Always use Secret Manager for sensitive data
   - Never commit secrets to Git repositories

2. **Minimize Access to Secrets**
   - Use IAM to restrict access to secrets
   - Follow principle of least privilege

3. **Rotate Keys Regularly**
   - Set up automated rotation for all keys
   - Follow service-specific recommendations for rotation frequency

4. **Monitor Secret Access**
   - Enable audit logging for Secret Manager
   - Review access logs regularly

5. **Secure Service Account Keys**
   - Store service account keys securely
   - Rotate service account keys periodically
   - Set restrictive permissions on key files (chmod 600)

### Secret Naming Conventions

Follow these conventions for secret names:

- Use kebab-case for secret names (e.g., `openai-api-key`)
- Include the service name as prefix (e.g., `firebase-admin-key`)
- For environment-specific secrets, use suffixes (e.g., `database-password-prod`)

### Deployment Considerations

1. **CI/CD Integration**
   - Set up secrets access in your CI/CD pipeline
   - Never print secrets in build logs

2. **Environment Management**
   - Use different secrets for dev, staging, and production
   - Consider using secret labels to organize by environment

3. **Application Startup**
   - Load secrets during application startup
   - Implement retry logic for secret retrieval
   - Have fallback mechanisms for critical services

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check that the service account key is valid
   - Ensure the service account has the right permissions
   - Verify that the GOOGLE_APPLICATION_CREDENTIALS environment variable is set

2. **Secret Not Found**
   - Verify the secret name is correct
   - Check that you're using the correct project ID
   - Ensure the secret exists in the specified project

3. **Access Denied**
   - Check IAM permissions for the service account
   - Verify that the Secret Manager API is enabled

### Logs and Debugging

The integration provides extensive logging to help debug issues:

- Integration Gateway logs are stored in `logs/secrets-manager.log`
- Key rotation logs are stored in `logs/key-rotation.log`
- CLI command errors are displayed in the console

Enable debug mode for more verbose logging:

```javascript
// In code
const secretsManager = getSecretsManager({ debug: true });

// In CLI
aixtiv secrets:list --debug
```

### Getting Help

If you encounter issues that aren't covered here:

1. Check the GCP Secret Manager documentation: https://cloud.google.com/secret-manager/docs
2. Review the logs for specific error messages
3. Contact the Aixtiv Symphony support team for assistance

