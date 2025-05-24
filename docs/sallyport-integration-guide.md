# SallyPort Verification Module Integration Guide

This guide explains how to integrate the SallyPort Verification module into your ASOOS application.

## Overview

The SallyPort Verification module provides token verification and security validation for the ASOOS (Aixtiv Symphony Operational Orchestration System) platform. It's designed to work with the existing Gateway components and provides a consistent security model across the platform.

## Installation

The module is included in the ASOOS codebase and doesn't require separate installation.

## Core Components

1. **TypeScript Interfaces** - Located in `integration-gateway/types/gateway.d.ts`
2. **SallyPort Verifier** - Located in `integration-gateway/auth/security/sallyport-verifier.js`
3. **Authentication Middleware** - Located in `integration-gateway/middleware/authentication.js`
4. **Fastify Auth Plugin** - Located in `integration-gateway/plugins/auth.js`

## Usage with Fastify

### Registering the Plugin

```javascript
// In your server.js file
const fastify = require('fastify')({ logger: true });

// Register the authentication plugin
fastify.register(require('./integration-gateway/plugins/auth'));

// Now your routes can use authentication
```

### Protecting Routes

#### Method 1: Using the config property

```javascript
fastify.get('/api/protected-resource', {
  config: {
    auth: true  // This route will require authentication
  },
  handler: async (request, reply) => {
    // Access the authenticated user
    const user = request.user;
    return { message: `Hello, ${user.uuid}!` };
  }
});
```

#### Method 2: Using the protectRoute decorator

```javascript
fastify.get('/api/another-protected-resource', 
  fastify.protectRoute({
    handler: async (request, reply) => {
      return { message: 'This route is protected' };
    }
  })
);
```

#### Method 3: Manual preHandler

```javascript
fastify.get('/api/custom-protected', {
  preHandler: fastify.sallyPortAuth,
  handler: async (request, reply) => {
    return { message: 'Protected with custom handler' };
  }
});
```

## Environment Configuration

The module requires the following environment variables:

- `JWT_SECRET` - Secret key for JWT verification (fallback)
- `GCP_PROJECT` - Google Cloud Project ID (default: api-for-warp-drive)
- `SALLYPORT_BASE_URL` - Base URL for SallyPort verification service

## CI/CD Integration

The ASOOS CI/CD pipeline (`asoos-pipeline.yml`) automatically deploys the application to Google Cloud Run in the us-west1 region and creates zone-specific resources in us-west1b as needed.

## Security Considerations

- The module uses RS256 as the default JWT algorithm
- Tokens are verified using the SallyPort service with a fallback to local verification
- User permissions and roles are extracted from the token payload
- All verification errors are logged for security monitoring

## Troubleshooting

If you encounter issues with token verification:

1. Check the application logs for detailed error messages
2. Verify that the JWT_SECRET environment variable is properly set
3. Ensure the SallyPort service is accessible at the configured URL
4. Validate that tokens include the correct claims (sub, roles, permissions)
