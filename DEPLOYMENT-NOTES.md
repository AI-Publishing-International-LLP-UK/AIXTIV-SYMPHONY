# CRITICAL DEPLOYMENT NOTES

## Authentication Method
**WE USE OAUTH2/OAUTH - NOT API KEYS**

This system is configured for OAuth2/OAuth authentication, not API key based authentication.

## Common Mistakes to Avoid:
1. DO NOT deploy with API key configurations
2. DO NOT use --allow-unauthenticated flags
3. DO NOT bypass OAuth2 authentication
4. USE proper OAuth2 flow for all deployments

## Correct Deployment Process:
- Ensure OAuth2 middleware is properly configured
- Use authenticated endpoints only
- Follow OAuth2 security protocols

---
**STOP MAKING THE SAME OAUTH2/API KEY MISTAKES**
