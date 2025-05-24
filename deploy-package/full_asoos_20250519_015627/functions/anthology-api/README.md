# Integration Gateway Repository

Integration Gateway for the Dr. Memoria Anthology solutions suite. This gateway provides secure authentication and authorization mechanisms for different user tiers in the Aixtiv Symphony Opus1 platform.

## Overview

The Integration Gateway serves as a secure entry point for all services in the Aixtiv Symphony Opus1 platform. It manages authentication, authorization, and service provisioning for different user tiers:

- **Owner Subscriber**: Individual content creators with basic access
- **Team**: Small collaborative groups with moderate capabilities
- **Group**: Larger organizations with enhanced management features
- **Practitioner**: Professional practitioners with specialized tools
- **Enterprise**: Large organizations with customizable features and maximum control

## Architecture

The Integration Gateway follows a tiered architecture pattern:

```
┌───────────────────┐
│   Client Request  │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Integration       │
│ Gateway           │◄───┐
└─────────┬─────────┘    │
          ▼              │
┌───────────────────┐    │
│ SallyPort         │    │
│ Verification      │────┘
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Tier-Specific     │
│ Authentication    │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Tier-Specific     │
│ Authorization     │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Backend Services  │
└───────────────────┘
```

## Features

- **SallyPort Security Verification**: All gateway access requires SallyPort verification
- **Authentication Level Check**: Minimum level 3.5 required for all tiers
- **Tier-Specific Gateways**: Custom access control for each user tier
- **Authorization Scopes**: Fine-grained permission control based on user role and tier
- **Comprehensive Logging**: Detailed logging for security auditing
- **Error Handling**: Robust error handling throughout the authentication flow

## Authentication Flow

1. **Gateway Selection**: The appropriate gateway is selected based on the user's tier
2. **SallyPort Verification**: Authentication level is verified through SallyPort
3. **Tier-Specific Validation**: Additional validation specific to the tier (API key, OAuth token, etc.)
4. **Scope Assignment**: Authorization scopes are assigned based on successful authentication
5. **Access Decision**: The gateway allows or denies access to the requested resource

### SallyPort Verification Process

The SallyPort verification process checks if a user's authentication level meets the minimum required level (3.5). This ensures that users have completed the necessary security verification steps.

```javascript
// SallyPort verification code snippet
const userId = credentials.userId;
const command = `/Users/as/asoos/aixtiv-cli/bin/aixtiv.js auth:verify --user ${userId}`;
logger.debug(`Executing SallyPort command: ${command}`);

// Execute command and parse result
// ...

const authenticationLevel = parseFloat(result.authenticationLevel);
if (isNaN(authenticationLevel) || authenticationLevel < 3.5) {
  logger.warn(`User ${userId} has insufficient authentication level: ${authenticationLevel}`);
  return {
    authenticated: false,
    error: `Insufficient authentication level: ${authenticationLevel}`,
  };
}

logger.info(`User ${userId} passed authentication level verification with level: ${authenticationLevel}`);
```

## Gateway Implementations

### OwnerSubscriberGateway

The OwnerSubscriberGateway handles authentication for individual content creators with basic access rights.

```javascript
const ownerGateway = new OwnerSubscriberGateway();
const authResult = await ownerGateway.authenticate({
  userId: 'user-123'
});

if (authResult.authenticated) {
  console.log(`Authenticated with scopes: ${authResult.scope.join(', ')}`);
}
```

**Authorization Logic**: Owner subscribers can only access their own resources and have restricted actions.

### TeamGateway

The TeamGateway manages authentication for small collaborative teams with moderate capabilities.

```javascript
const teamGateway = new TeamGateway();
const authResult = await teamGateway.authenticate({
  userId: 'user-456',
  teamId: 'team-789',
  apiKey: 'api-key-abc'
});

if (authResult.authenticated) {
  console.log(`Team authenticated with scopes: ${authResult.scope.join(', ')}`);
}
```

**Authorization Logic**: Team members have access based on their role within the team.

### GroupGateway

The GroupGateway provides enhanced management capabilities for larger organizations with departments.

```javascript
const groupGateway = new GroupGateway();
const authResult = await groupGateway.authenticate({
  userId: 'user-789',
  groupId: 'group-123',
  apiKey: 'api-key-xyz'
});

// Alternative: OAuth token authentication
const oauthAuthResult = await groupGateway.authenticate({
  oauthToken: 'oauth-token-123'
});
```

**Authorization Logic**: Group members have access based on their role and department, with special consideration for cross-department access.

### PractitionerGateway

The PractitionerGateway serves professional practitioners with specialized tools.

```javascript
const practitionerGateway = new PractitionerGateway();
const authResult = await practitionerGateway.authenticate({
  userId: 'practitioner-123'
});
```

**Authorization Logic**: Practitioners have access based on their specialization.

### EnterpriseGateway

The EnterpriseGateway provides maximum control for large organizations with customizable features.

```javascript
const enterpriseGateway = new EnterpriseGateway();
const authResult = await enterpriseGateway.authenticate({
  userId: 'enterprise-admin-123'
});
```

**Authorization Logic**: Enterprise users have access based on custom authorization policies.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables by creating a `.env` file:
   ```
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=debug
   ```

3. Start the server:
   ```
   npm start
   ```

## API Usage

### Basic Health Check

```
GET /health
```

Example response:
```json
{
  "status": "ok",
  "service": "anthology-integration-gateway"
}
```

### Integration Endpoint (Authentication Required)

```
POST /api/integrate
```

Example request:
```json
{
  "userId": "user-123",
  "action": "publish",
  "resource": {
    "type": "document",
    "id": "doc-456",
    "ownerId": "user-123"
  },
  "options": {
    "tier": "owner-subscriber"
  }
}
```

Example successful response:
```json
{
  "success": true,
  "message": "Integration request processed",
  "data": {
    "resourceId": "doc-456",
    "action": "publish",
    "status": "completed"
  }
}
```

## Error Handling

The gateway provides detailed error responses for different authentication/authorization failures:

### Authentication Level Errors

```json
{
  "authenticated": false,
  "error": "Insufficient authentication level: 2.5",
  "requestId": "req-abc-123"
}
```

### Team Authentication Errors

```json
{
  "authenticated": false,
  "error": "API key and team ID are required for team authentication",
  "requestId": "req-def-456"
}
```

### Authorization Errors

```json
{
  "authorized": false,
  "reason": "User is not a member of the team that owns this resource",
  "requestId": "req-ghi-789"
}
```

## Troubleshooting

### Common Issues

1. **SallyPort Verification Failures**:
   - Check that the user has completed the required security verification steps
   - Verify that the Aixtiv CLI is properly installed at the expected path
   - Ensure the user's authentication level is at least 3.5

2. **API Key Authentication Issues**:
   - Verify that the API key is valid and active
   - Ensure the API key has the necessary permissions for the requested resource

3. **OAuth Token Issues**:
   - Check that the OAuth token is not expired
   - Verify that the token has the necessary scopes

### Logging

The gateway provides detailed logging at different levels:

```javascript
logger.debug('Detailed information for debugging');
logger.info('Important information about normal operation');
logger.warn('Warning about potential issues');
logger.error('Error information with details');
```

To increase logging verbosity, set the LOG_LEVEL environment variable to 'debug'.

## Advanced Configuration

### Custom Authentication Providers

You can create custom authentication providers by extending the IntegrationGateway class:

```javascript
class CustomGateway extends IntegrationGateway {
  constructor(config = {}) {
    super({
      tier: 'custom',
      maxRateLimit: 100,
      maxConnections: 50,
      ...config
    });
  }

  async _performAuthentication(credentials) {
    // Custom authentication logic
  }

  async _performAuthorization(authParams) {
    // Custom authorization logic
  }
}
```

### Rate Limiting

Rate limiting is configured per gateway tier:

- Owner Subscriber: 10 requests per minute
- Team: 50 requests per minute
- Group: 100 requests per minute
- Practitioner: 500 requests per minute
- Enterprise: 5000 requests per minute

You can customize these limits in the gateway constructor.

## Development

Contributing to this project requires understanding of the authentication flow and gateway-specific requirements. All gateway implementations extend the `IntegrationGateway` base class and implement specific methods for their tier.

### Running Tests

```
npm test
```

## Future Enhancements

1. **TypeScript Migration**: Convert to TypeScript for improved type safety
2. **Direct API Integration**: Replace shell commands with direct API calls
3. **Caching**: Implement caching for authentication results to improve performance
4. **Metrics**: Add metrics collection for authentication/authorization operations
5. **JWKS Support**: Add support for JWKS for verifying JWT tokens

## License and Copyright

AI Publishing International LLP (UK) © 2025  
Aixtiv Symphony Orchestrating Operating System, Coaching 2100 LLC,   
The Pilot of Vision Lake, Preparate 2100, AC, Coaching 2100 SA de CV.  
Dr. Memoria's Anthology® All Rights Protected and Reserved.
