# Integration Gateway System

## Overview

The Integration Gateway system provides a secure and flexible way to connect Aixtiv Symphony Opus1 with external systems and services. It implements tier-specific access controls and functionality based on the user's subscription level (Owner Subscriber, Team, Group, Practitioner, or Enterprise).

Key features include:
- Multi-tier authentication and authorization
- Secure secrets management (global and tier-specific)
- Simplified onboarding flows
- Blockchain integration and verification
- Service provisioning and management
- Comprehensive logging and analytics

## Architecture

The Integration Gateway system follows a factory pattern architecture with the following components:

- **IntegrationGateway**: Base abstract class that defines the common interface
- **Tier-specific Implementations**: Concrete gateway classes for each subscription tier
- **GatewayFactory**: Creates the appropriate gateway instance based on tier
- **Secret Manager**: Handles secure storage and retrieval of credentials
- **Onboarding Service**: Manages different onboarding flows and experiences

## Gateway Tiers

The system supports five different gateway tiers, each with specific capabilities and access levels:

| Tier | Description | Key Features |
|------|-------------|--------------|
| Owner Subscriber | Individual content creators | Basic publishing, personal analytics |
| Team | Small collaborative groups | Shared resources, team analytics, basic workflow |
| Group | Mid-sized organizations | Advanced workflows, moderate scaling, basic rights management |
| Practitioner | Professional entities | Comprehensive workflows, advanced analytics, full rights management |
| Enterprise | Large organizations | Customizable workflows, white labeling, enterprise-grade security |

## Usage Examples

### Creating a Gateway Using Factory

```javascript
const { GatewayFactory } = require('./functions/integration-gateway/gateway-factory');
const logger = require('./functions/utils/logger');

// Initialize the factory
const gatewayFactory = new GatewayFactory(logger);

// Create a gateway for a specific tier
try {
  // For an Owner Subscriber
  const ownerGateway = await gatewayFactory.createGateway('owner_subscriber', {
    userId: 'user123',
    apiKey: 'sample-api-key',
    environment: 'production'
  });
  
  // For an Enterprise client
  const enterpriseGateway = await gatewayFactory.createGateway('enterprise', {
    organizationId: 'org456',
    apiKey: 'enterprise-api-key',
    environment: 'production'
  });
} catch (error) {
  logger.error('Failed to create gateway:', error);
}
```

### Authentication & Authorization

```javascript
// Authenticate with the gateway
const authResult = await gateway.authenticate({
  credentials: {
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret'
  },
  scopes: ['read:content', 'write:content']
});

if (authResult.success) {
  console.log('Authentication successful!');
  console.log('Token:', authResult.token);
  console.log('Expires in:', authResult.expiresIn);
} else {
  console.error('Authentication failed:', authResult.error);
}

// Authorize a specific action
const isAuthorized = await gateway.authorizeAction('create:publication', resourceId);
```

### Onboarding Examples

```javascript
// Quick start mode (minimizes configuration)
const quickStartResult = await gateway.startOnboarding({
  mode: 'quick_start',
  defaults: {
    contentType: 'article',
    publishTarget: 'blog',
    distribution: 'public'
  }
});

// Guided journey with step-by-step process
const guidedResult = await gateway.startOnboarding({
  mode: 'guided_journey',
  steps: ['project', 'content', 'review', 'publish'],
  callbacks: {
    onStepComplete: (step, data) => console.log(`Step ${step} completed!`)
  }
});

// Template-based onboarding
const templateResult = await gateway.startOnboarding({
  mode: 'template',
  templateId: 'memoir-template-01',
  customizations: {
    title: 'My Journey',
    chapters: 12,
    coverStyle: 'minimalist'
  }
});
```

### Publishing Content

```javascript
// Basic publishing
const publishResult = await gateway.publishContent({
  content: {
    title: 'My First Publication',
    body: 'This is the content of my first publication...',
    tags: ['memoir', 'personal']
  },
  options: {
    platforms: ['kindle', 'web'],
    schedule: 'immediate',
    visibility: 'public'
  }
});

console.log('Content ID:', publishResult.contentId);
console.log('Publication URLs:', publishResult.urls);
```

### Analytics

```javascript
// Get basic analytics
const analyticsData = await gateway.getAnalytics({
  contentId: 'content-123',
  metrics: ['views', 'shares', 'revenue'],
  timeRange: {
    start: '2023-01-01',
    end: '2023-01-31'
  }
});

console.log('Total Views:', analyticsData.metrics.views.total);
console.log('Revenue:', analyticsData.metrics.revenue.total);
```

## Security & Secrets

The Integration Gateway handles authentication securely and manages secrets at different tiers:

1. **Global Secrets**: Available to all gateway tiers (system-wide configurations)
2. **Tier-specific Secrets**: Only available to specific gateway tiers
3. **User-specific Secrets**: Tied to individual users or organizations

Secrets are encrypted at rest and in transit, and access is controlled through the appropriate gateway tier.

## Configuration Examples

Configuration for different environments (staging/production):

```javascript
// Environment-specific configuration
const gateway = await gatewayFactory.createGateway('practitioner', {
  userId: 'user123',
  environment: 'production', // or 'staging', 'development'
  features: {
    blockchainVerification: true,
    advancedAnalytics: true
  }
});
```

## Error Handling

The gateway implements standard error handling patterns:

```javascript
try {
  const result = await gateway.performAction('some-action', params);
  // Handle successful result
} catch (error) {
  if (error.code === 'AUTHENTICATION_FAILED') {
    // Handle authentication error
  } else if (error.code === 'INSUFFICIENT_PERMISSIONS') {
    // Handle permission error
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

## Extending the Gateway

For custom functionality, you can extend the base gateway classes:

```javascript
const { IntegrationGateway } = require('./functions/integration-gateway');

class CustomGateway extends IntegrationGateway {
  constructor(config) {
    super(config);
    this.customFeature = config.customFeature;
  }
  
  async customMethod() {
    // Custom implementation
    return { success: true, data: 'Custom method result' };
  }
}
```

        title: 'Welcome to Aixtiv Symphony Opus1',
