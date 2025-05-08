# Anthology AI Publishing - Tokens

This directory contains token files for Anthology AI Publishing. The actual token files are not committed to version control for security reasons.

## Required Tokens

1. `anthology-api-key.token` - API key for accessing the Anthology API
2. `anthology-publishing-token.token` - Authentication token for publishing operations
3. `anthology-storage-credentials.token` - Credentials for accessing storage buckets

## Usage

The tokens are loaded by the Integration Gateway and used to authenticate with the Anthology AI Publishing service. They can be managed through Google Cloud Secret Manager using the fetch-all-secrets.sh script.

## Adding New Tokens

To add a new token:

1. Create the token in Google Cloud Secret Manager:
   ```bash
   gcloud secrets create anthology-new-token --replication-policy="automatic"
   ```

2. Add the token value:
   ```bash
   echo "your-token-value" | gcloud secrets versions add anthology-new-token --data-file=-
   ```

3. Update the integration-gateway.json to include the new token in the "anthology" section.

## Security Notes

- Never commit actual token values to version control
- Tokens should be rotated regularly
- Access to tokens should be restricted to authorized users only
