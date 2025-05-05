# Google OAuth 2.0 Integration for Aixtiv Symphony

This guide explains how to implement OAuth 2.0 authentication for Google APIs within the Aixtiv Symphony ecosystem. OAuth 2.0 enables secure access to Google services without sharing sensitive credentials.

## Overview

The `google_oauth_demo.py` script demonstrates a complete OAuth 2.0 flow for web server applications accessing Google APIs. This implementation:

1. Redirects users to Google's authentication page
2. Handles the OAuth callback with authorization code
3. Exchanges the code for access and refresh tokens
4. Makes authenticated API requests
5. Refreshes tokens when they expire
6. Provides token revocation

## Prerequisites

1. **Google Cloud Project**:
   - Project already configured in us-west1 region
   - API & Services enabled for the APIs you need to access

2. **OAuth Credentials**:
   - OAuth 2.0 Client ID configured for web application
   - Authorized redirect URIs configured (e.g., `http://localhost:8090/oauth2callback`)

3. **Python Dependencies**:
   ```bash
   pip install google-auth google-auth-oauthlib google-api-python-client flask
   ```

## Setup Instructions

1. **Download OAuth Credentials**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Select your project (api-for-warp-drive)
   - Find your OAuth 2.0 Client ID or create a new one (Web application type)
   - Download the JSON file and save as `client_secret.json` in the scripts directory

2. **Configure Scopes**:
   - Edit the `SCOPES` variable in the script to include only the permissions your app needs
   - Follow the principle of least privilege - request only what's necessary
   - Example scopes are included for Google Cloud Platform and Drive access

3. **Run the Demo**:
   ```bash
   cd /Users/as/asoos
   python scripts/google_oauth_demo.py
   ```

4. **Integration with Aixtiv Symphony**:
   - For production deployment, adapt the Flask routes to work with your existing web application
   - Store tokens securely using SalleyPort Security Management
   - Use the `aixtiv agent:grant` command to manage API access permissions

## Integration with Symphony Components

### Integration Gateway

The OAuth flow can be integrated into the gateway middleware for authentication:

```javascript
// Example integration in /integration/gateway/auth.js
const { authenticate } = require('./google-oauth');

router.use('/api/cloud-resources', authenticate, resourceController);
```

### Dr. Grant Authentication

This OAuth flow complements the Dr. Grant authentication system:

```javascript
// In Dr. Grant authentication module
function federatedLogin(provider) {
  if (provider === 'google') {
    return redirectToGoogleOAuth();
  }
  // Other providers...
}
```

### Flight Memory System (FMS)

Record OAuth events in the FMS for audit trails:

```javascript
// Example logging
const { logToFMS } = require('./fms-client');

function handleOAuthCallback(req, res) {
  // Process OAuth callback
  // ...
  
  // Log to FMS
  logToFMS({
    event: 'google_oauth_token_obtained',
    user: userId,
    timestamp: new Date(),
    scopes: grantedScopes
  });
}
```

## Token Security

1. **Storage**: Store tokens using encryption at rest
2. **Transmission**: Only transmit tokens over HTTPS
3. **Expiration**: Handle token expiration and refresh properly
4. **Revocation**: Implement the ability for users to revoke access
5. **Monitoring**: Log token usage for security auditing

## Troubleshooting

- **Invalid Grant**: Usually means the authorization code was already used or expired
- **Invalid Client**: Check that your client_secret.json is correct and up to date
- **Redirect URI Mismatch**: Ensure the redirect URI in the code matches what's configured in Google Cloud Console
- **Token Expiration**: If access tokens expire (typically after 1 hour), use the refresh token to get a new one

## References

- [Google's OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google API Client Library for Python](https://github.com/googleapis/google-api-python-client)
- [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)

---

*This documentation is part of the Aixtiv Symphony Orchestrating Operating System.*
