# Integration Gateway - Technology Registration Guide

## Overview

The Integration Gateway provides a secure, multi-tenant platform for registering and integrating different technologies, languages, and services with the AIXTIV Symphony ecosystem. This README explains how to register your technology and make it available to customers across the platform.

## Registration Process

The Integration Gateway supports multiple types of technology integrations:

1. **Language Runtimes** - Programming languages like Go, Python, JavaScript
2. **AI Services** - LLM providers, vector databases, other AI capabilities
3. **Third-party Services** - External APIs, data sources, and platforms
4. **Custom Adapters** - Specialized integrations for customer-specific needs

## Prerequisites

- Access to AIXTIV Symphony Integration Gateway
- Understanding of your technology's API and authentication requirements
- OAuth2 credentials (for most integrations)
- Service account for programmatic access (optional)

## Registration Steps

### 1. Create an Adapter

All technology integrations require an adapter that follows the ServiceAdapter interface:

```javascript
// Create a new file in the appropriate directory:
// - Languages: /adapters/language-adapters/[technology]-adapter.js
// - AI Services: /adapters/ai-adapters/[service]-adapter.js
// - External Services: /adapters/service-adapters/[name]-adapter.js

const { ServiceAdapter } = require('../base-adapter');

class MyTechnologyAdapter extends ServiceAdapter {
  constructor(config) {
    super(config);
    this.serviceId = config.serviceId || `my-technology-${uuidv4()}`;
    // Add technology-specific configuration and state
  }

  async connect(credentials) {
    // Implement connection logic
    // Should return connection information
  }

  async disconnect() {
    // Implement disconnection logic
  }

  // Implement other required methods
}

module.exports = {
  MyTechnologyAdapter
};
```

### 2. Set Up Authentication

The Integration Gateway uses OAuth2 as the primary authentication protocol. Register your authentication information:

```javascript
// Example for OAuth2-based service

const { OAuth2Config } = require('../../auth/openid/oauth2-interface');

// Define OAuth2 configuration
const oauth2Config = {
  clientId: '${CLIENT_ID}',         // Replace with actual or placeholders
  clientSecret: '${CLIENT_SECRET}', // Will be replaced by customer values
  redirectUri: '${REDIRECT_URI}',   // Platform will handle this
  scopes: ['read', 'write'],        // Define required scopes
  authorizationEndpoint: 'https://api.myservice.com/oauth2/authorize',
  tokenEndpoint: 'https://api.myservice.com/oauth2/token',
  userInfoEndpoint: 'https://api.myservice.com/oauth2/userinfo',
  revokeEndpoint: 'https://api.myservice.com/oauth2/revoke'
};

// Register the OAuth config in your adapter
this.oauth2Config = oauth2Config;
```

### 3. Register Service Models and Features

Define the capabilities and models your technology provides:

```javascript
// Define models for AI services
const models = [
  {
    modelId: 'my-model-v1',
    displayName: 'My Technology Model v1',
    capabilities: ['text-generation', 'translation'],
    maxInputTokens: 8192,
    maxOutputTokens: 4096,
    pricing: {
      inputTokens: 0.0001,
      outputTokens: 0.0002
    }
  }
];

// Define features for other services
const features = [
  {
    featureId: 'data-extraction',
    displayName: 'Data Extraction',
    description: 'Extract structured data from documents',
    pricing: {
      unit: 'document',
      price: 0.05
    }
  }
];
```

### 4. Register the Service

Register your service with the Integration Gateway using the following code pattern:

```javascript
// Import the gateway factory
const { GatewayFactory } = require('./gateway-factory');
const { MyTechnologyAdapter } = require('./adapters/my-technology-adapter');

async function registerMyTechnology() {
  // Initialize gateway factory
  const gatewayFactory = new GatewayFactory({
    secretManager: secretManager,
    configProvider: configProvider
  });

  // Get appropriate gateway based on tier
  const gateway = await gatewayFactory.createGateway('enterprise', {
    userId: 'my-technology-service-account',
    orgId: 'my-organization'
  });

  // Register the service
  const result = await gateway.registerService({
    serviceId: 'my-technology-service',
    serviceName: 'My Technology Service',
    authType: 'oauth2',
    apiVersion: 'v1',
    endpoints: {
      base: 'https://api.myservice.com/v1',
      management: 'https://api.myservice.com/v1/manage',
      status: 'https://api.myservice.com/v1/status'
    },
    models: models,
    features: features,
    bindingType: 'standard',
    adapter: MyTechnologyAdapter,
    oauth2Config: oauth2Config
  });

  console.log('Service registration result:', result);
  return result;
}
```

## Multi-Tenant Considerations

The Integration Gateway is designed for multi-tenant usage, allowing customer-specific configurations:

### Customer Registration Process

1. **Customer Portal**: Customers can register their technologies through the Symphony Management Portal
2. **API Registration**: Programmatic registration through the Integration Gateway API
3. **Configuration Files**: JSON/YAML configuration files that can be uploaded

### Customer-Specific Credentials

For each customer tenant, store credentials securely:

```javascript
// Add customer-specific credentials
await gateway.addTenantCredentials('tenant-id', 'my-technology-service', {
  clientId: 'customer-specific-client-id',
  clientSecret: 'customer-specific-client-secret',
  additionalConfig: {
    // Customer-specific settings
  }
});
```

### Tenant Isolation

The Integration Gateway enforces strong tenant isolation:

1. **Separate Credential Storage**: Each tenant's credentials are stored separately
2. **Request Isolation**: Requests from different tenants never share connections
3. **Rate Limiting**: Per-tenant rate limits prevent resource monopolization
4. **Usage Tracking**: Separate usage metrics for billing and monitoring

## Health Checks and Monitoring

Register health checks for your technology:

```javascript
// Define health check in your adapter
async checkHealth() {
  try {
    const response = await axios.get(`${this.endpoints.status}`);
    return {
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      details: response.data,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      lastChecked: new Date().toISOString()
    };
  }
}
```

## Security Best Practices

1. **Never Hardcode Credentials**: Use environment variables or the secret manager
2. **Use OAuth2 When Possible**: Follow the OAuth2 flow for secure authentication
3. **Request Minimal Scopes**: Only request the permissions your service needs
4. **Enable Audit Logging**: Ensure all operations are logged for accountability
5. **Implement Rate Limiting**: Protect your service from abuse

## Example Registrations

### Language Runtime (Go)

```javascript
await gateway.registerService({
  serviceId: 'go-language-runtime',
  serviceName: 'Go Language Runtime',
  authType: 'api_key',
  apiVersion: 'v1',
  endpoints: {
    base: 'http://localhost:8080',
    management: 'http://localhost:8080/manage',
    status: 'http://localhost:8080/status'
  },
  features: [
    {
      featureId: 'go-compilation',
      displayName: 'Go Compilation',
      description: 'Compile Go source code',
      parameters: {
        supportedVersions: ['1.22', '1.23', '1.24']
      }
    }
  ],
  adapter: GoAdapter
});
```

### AI Service (Custom LLM)

```javascript
await gateway.registerService({
  serviceId: 'custom-llm-service',
  serviceName: 'Enterprise LLM',
  authType: 'oauth2',
  apiVersion: 'v1',
  endpoints: {
    base: 'https://llm-api.enterprise.com/v1',
    management: 'https://llm-api.enterprise.com/v1/manage',
    status: 'https://llm-api.enterprise.com/v1/status'
  },
  models: [
    {
      modelId: 'enterprise-llm',
      displayName: 'Enterprise LLM',
      capabilities: ['text-generation', 'code-generation'],
      maxInputTokens: 16384,
      maxOutputTokens: 8192
    }
  ],
  adapter: CustomLLMAdapter,
  oauth2Config: {
    // OAuth2 configuration
  }
});
```

## Support and Troubleshooting

If you encounter issues with registration:

1. Check the Integration Gateway logs
2. Verify your adapter implements all required methods
3. Ensure your OAuth2 configuration is correct
4. Validate your endpoints are accessible
5. Contact support at integration-support@aixtiv.symphony.com

## Additional Resources

- [Integration Gateway API Documentation](https://docs.aixtiv.symphony.com/integration-gateway)
- [OAuth2 Implementation Guide](https://docs.aixtiv.symphony.com/oauth2)
- [Adapter Development Kit](https://github.com/AIXTIV-Symphony/adapter-development-kit)
- [Example Integrations](https://github.com/AIXTIV-Symphony/example-integrations)
