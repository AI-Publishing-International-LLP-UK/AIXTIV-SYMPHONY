# Anthology Subscriber Reference (ID: 001)

## IMPORTANT SECURITY NOTICE

This directory contains only reference information for subscriber 001. Per security policy, **personal identifiable information (PII)** including names, personal emails, and contact details should not be stored in the integration gateway.

## Subscriber Reference

This subscriber is referenced by:
- **ID**: 001
- **UUID**: sub-001-aaf4c61ddca3949c31d4e9c8af6b
- **Namespace**: sub-001

## Authentication

This subscriber uses Google SSO for authentication with the following details:
- **Domain**: google.com
- **SSO Enabled**: Yes
- **Auth Type**: OAuth 2.0

## Resources

As an enterprise-tier subscriber, this account is allocated:
- **CPU**: 8 cores
- **Memory**: 16GB
- **Storage**: 500GB
- **Namespace**: sub-001
- **Region**: us-west1

## Integrations

This subscriber has the following integrations enabled:
1. **CMS Integration** (WordPress)
2. **LMS Integration** (Custom)
3. **CRM Integration** (Salesforce)

## API Reference

The subscriber API is available at:
```
https://api.anthology.aixtiv.dev/subscriber/001
```

## Permissions

This subscriber has owner-level permissions.

## Security Guidelines

1. Always reference subscribers by UUID rather than personal information
2. Do not store PII in configuration files or the integration gateway
3. For user details, query the secure user management service
4. Authentication tokens and API keys should be stored in Secret Manager, never in files
