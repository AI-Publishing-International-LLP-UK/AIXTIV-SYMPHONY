# Gateway Classes Usage Documentation

## Table of Contents
1. [Overview](#overview)
2. [Available Gateways](#available-gateways)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Usage Examples](#usage-examples)
6. [Configuration Options](#configuration-options)
7. [Authentication Flow](#authentication-flow)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Advanced Usage](#advanced-usage)
11. [Troubleshooting](#troubleshooting)

## Overview

The Gateway system provides a secure authentication and authorization layer for various service types in the Integration Gateway. Each gateway implementation serves a specific user or organization type and incorporates SallyPort verification for enhanced security.

The system follows a hierarchical design:
- A base abstract `BaseGateway` class that implements common authentication functionality
- Specialized gateway implementations for different service types
- SallyPort verification integrated into the authentication process

Key features of the Gateway system include:
- Standardized authentication flow across all gateway types
- SallyPort token verification
- Comprehensive error handling
- Detailed logging
- Service-specific authentication logic

## Available Gateways

The following gateway classes are available:

### BaseGateway

An abstract base class that implements common authentication functionality. Cannot be instantiated directly.

**Key Functionality:**
- Core authentication structure
- Error handling and logging
- Abstract methods requiring implementation in subclasses

### OwnerSubscriberGateway

Gateway for Owner Subscriber service authentication and authorization.

**Use Case:** 
Authenticate requests from users who own a subscription to your services.

### TeamGateway

Gateway for Team service authentication and authorization.

**Use Case:**
Handle authentication for team-based access and permissions.

### GroupGateway

Gateway for Group service authentication and authorization.

**Use Case:**
Control access based on group memberships and handle group-based interactions.

### PractitionerGateway

Gateway for Practitioner service authentication and authorization.

**Use Case:**
Manage authentication for practitioner-specific functionality.

### EnterpriseGateway

Gateway for Enterprise service authentication and authorization.

**Use Case:**
Handle authentication and integration for enterprise-wide access.

## Prerequisites

Before using the gateway classes, ensure you have the following prerequisites:

1. **Node.js Environment:**
   - Node.js version 14.x or higher
   - npm or yarn package manager

2. **Required Dependencies:**
   - A functional SallyPort verification system
   - The relevant service implementation for your gateway type

3. **Configuration:**
   - SallyPort verifier configuration
   - Logging system setup
   - Service-specific configurations

## Installation

The gateway classes are part of the Integration Gateway package. To install:

```bash
# Using npm
npm install @aixtiv/integration-gateway

# Using yarn
yarn add @aixtiv/integration-gateway
```

Alternatively, if you're working directly in the project repository:

```bash
# Clone the repository
git clone https://github.com/your-org/integration-gateway.git

# Install dependencies
cd integration-gateway
npm install
```

## Usage Examples

### Basic Usage

```javascript
const { OwnerSubscriberGateway } = require('@aixtiv/integration-gateway/services/gateway');
const SallyPortVerifier = require('@aixtiv/integration-gateway/services/auth/SallyPortVerifier');
const OwnerSubscriberService = require('@aixtiv/integration-gateway/services/owner-subscriber/OwnerSubscriberService');

// Create dependencies
const sallyPortVerifier = new SallyPortVerifier({
  secretKey: process.env.SALLYPORT_SECRET_KEY,
  // Other configuration options
});

const ownerSubscriberService = new OwnerSubscriberService({
  // Service-specific configuration
});

// Create the gateway instance
const gateway = new OwnerSubscriberGateway({
  sallyPortVerifier,
  ownerSubscriberService,
  logger: console // Use your preferred logging system
});

// Use the gateway for authentication
async function authenticateRequest(req, res, next) {
  const authContext = {
    requestId: req.id,
    userId: req.headers['user-id'],
    sallyPortToken: req.headers['authorization']?.replace('Bearer ', ''),
    // Other context properties
  };
  
  const authResult = await gateway.authenticate(authContext);
  
  if (authResult.success) {
    req.user = authResult.user;
    next();
  } else {
    res.status(authResult.status).json({ 
      error: authResult.error 
    });
  }
}
```

### Using Multiple Gateways

```javascript
const { 
  OwnerSubscriberGateway, 
  EnterpriseGateway 
} = require('@aixtiv/integration-gateway/services/gateway');

// Initialize services and dependencies
// ...

// Create gateway instances
const ownerGateway = new OwnerSubscriberGateway({
  sallyPortVerifier,
  ownerSubscriberService,
  logger
});

const enterpriseGateway = new EnterpriseGateway({
  sallyPortVerifier,
  enterpriseService,
  logger
});

// Select the appropriate gateway based on the request
function selectGateway(req) {
  const userType = req.headers['user-type'];
  
  switch (userType) {
    case 'owner-subscriber':
      return ownerGateway;
    case 'enterprise':
      return enterpriseGateway;
    default:
      throw new Error(`Unsupported user type: ${userType}`);
  }
}

// Use in Express middleware
app.use(async (req, res, next) => {
  try {
    const gateway = selectGateway(req);
    
    const authContext = {
      requestId: req.id,
      userId: req.headers['user-id'],
      sallyPortToken: req.headers['authorization']?.replace('Bearer ', ''),
    };
    
    const authResult = await gateway.authenticate(authContext);
    
    if (authResult.success) {
      req.user = authResult.user;
      next();
    } else {
      res.status(authResult.status).json({ error: authResult.error });
    }
  } catch (error) {
    res.status(500).json({ 
      error: { 
        code: 'GATEWAY_ERROR', 
        message: error.message 
      } 
    });
  }
});
```

## Configuration Options

Each gateway class accepts a configuration object with the following options:

### Common Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `sallyPortVerifier` | `SallyPortVerifier` | Yes | An instance of the SallyPortVerifier used to verify authentication tokens |
| `logger` | `Object` | No | A logger instance that implements info, warn, and error methods. Defaults to console. |

### Gateway-Specific Options

#### OwnerSubscriberGateway

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `ownerSubscriberService` | `OwnerSubscriberService` | Yes | Service for owner-subscriber operations |

#### TeamGateway

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `teamService` | `TeamService` | Yes | Service for team operations |

#### GroupGateway

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `groupService` | `GroupService` | Yes | Service for group operations |

#### PractitionerGateway

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `practitionerService` | `PractitionerService` | Yes | Service for practitioner operations |

#### EnterpriseGateway

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `enterpriseService` | `EnterpriseService` | Yes | Service for enterprise operations |

## Authentication Flow

The gateway authentication process follows these steps:

1. **Receive Authentication Context:**
   - The gateway receives an authentication context object with credentials and request details

2. **Basic Validation:**
   - Validate that required credentials are present

3. **SallyPort Verification:**
   - If a SallyPort token is provided, verify its validity
   - Extract user and tenant information from the verified token

4. **Service-Specific Authentication:**
   - Perform additional authentication specific to the service type
   - Validate user permissions for the requested operation

5. **Result Generation:**
   - Generate a standardized authentication result object
   - Include user information and permissions on success
   - Include error details on failure

### Authentication Context Structure

```javascript
{
  requestId: String,     // Unique identifier for the request
  userId: String,        // Optional user identifier
  sallyPortToken: String, // SallyPort authorization token
  // Additional context properties specific to the gateway type
}
```

### Authentication Result Structure

**Success Result:**
```javascript
{
  success: true,
  status: 200,
  user: {
    id: String,
    tenantId: String,
    permissions: Array<String>,
    // Additional user information
  }
}
```

**Failure Result:**
```javascript
{
  success: false,
  status: Number, // HTTP status code (400, 401, 403, 500, etc.)
  error: {
    code: String, // Error code (e.g., 'UNAUTHORIZED', 'INVALID_TOKEN')
    message: String // Human-readable error message
  }
}
```

## Error Handling

The gateway system handles errors consistently across all implementations. Common error scenarios include:

### Authentication Errors

| Error Code | Status | Description |
|------------|--------|-------------|
| `MISSING_TOKEN` | 401 | SallyPort token is missing |
| `UNAUTHORIZED` | 401 | Invalid or expired SallyPort token |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `INVALID_TENANT` | 403 | User not authorized for the requested tenant |
| `AUTHENTICATION_ERROR` | 500 | Generic authentication error |
| `INTERNAL_ERROR` | 500 | Unexpected internal error |
| `SALLYPORT_ERROR` | 500 | Error during SallyPort verification |
| `SERVICE_ERROR` | 503 | Backend service error |

### Handling Authentication Errors

```javascript
const authResult = await gateway.authenticate(context);

if (!authResult.success) {
  switch (authResult.error.code) {
    case 'MISSING_TOKEN':
    case 'UNAUTHORIZED':
      // Handle unauthorized access
      logAuthFailure(authResult);
      return respondWithUnauthorized(res, authResult.error);
      
    case 'FORBIDDEN':
      // Handle forbidden access
      logAccessViolation(authResult);
      return respondWithForbidden(res, authResult.error);
      
    case 'INTERNAL_ERROR':
    case 'SALLYPORT_ERROR':
    case 'SERVICE_ERROR':
      // Handle system errors
      logSystemError(authResult);
      return respondWithSystemError(res, authResult.error);
      
    default:
      // Handle other errors
      logUnknownError(authResult);
      return respondWithGenericError(res, authResult.error);
  }
}
```

## Best Practices

### Security Best Practices

1. **Always Use HTTPS:**
   - Ensure all communication occurs over secure connections
   - Set the `secure` flag on cookies

2. **Protect Tokens:**
   - Never expose SallyPort tokens in URLs or logs
   - Store tokens securely (e.g., in HTTP-only cookies or secure storage)

3. **Implement Token Expiration:**
   - Set reasonable expiration times for SallyPort tokens
   - Implement token refresh mechanisms

4. **Log Securely:**
   - Never log sensitive information like tokens or passwords
   - Include requestId in logs for request tracing

### Implementation Best Practices

1. **Dependency Injection:**
   - Always inject dependencies (services, verifiers, loggers) rather than creating them internally
   - This improves testability and flexibility

2. **Error Handling:**
   - Always handle errors gracefully
   - Provide clear error messages
   - Do not expose internal error details to clients

3. **Logging:**
   - Log authentication attempts
   - Log authentication failures with appropriate context
   - Include request identifiers for traceability

4. **Validation:**
   - Validate all inputs
   - Check for required services in the constructor

5. **Testing:**
   - Write unit tests for your gateway implementations
   - Test error scenarios and edge cases

## Advanced Usage

### Custom Gateway Implementation

To create a custom gateway implementation, extend the BaseGateway class:

```javascript
const BaseGateway = require('@aixtiv/integration-gateway/services/gateway/BaseGateway');

class CustomGateway extends BaseGateway {
  constructor(options = {}) {
    super(options);
    this.customService = options.customService;
    
    if (!this.customService) {
      throw new Error('customService is required for CustomGateway');
    }
  }
  
  async _performAuthentication(context) {
    try {
      // Check for SallyPort token
      if (context.sallyPortToken) {
        const verificationResult = await this.sallyPortVerifier.verify(context.sallyPortToken);
        
        if (!verificationResult.isValid) {
          return {
            success: false,
            status: 401,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid SallyPort token'
            }
          };
        }
        
        // Custom verification logic
        const customVerification = await this.customService.verifyAccess(
          verificationResult.userId,
          context.resourceId
        );
        
        if (!customVerification.hasAccess) {
          return {
            success: false,
            status: 403,
            error: {
              code: 'FORBIDDEN',
              message: customVerification.reason
            }
          };
        }
        
        return {
          success: true,
          status: 200,
          user: {
            id: verificationResult.userId,
            tenantId: verificationResult.tenantId,
            permissions: verificationResult.permissions,
            customData: customVerification.userData
          }
        };
      }
      
      return {
        success: false,
        status: 401,
        error: {
          code: 'MISSING_TOKEN',
          message: 'SallyPort token is required'
        }
      };
    } catch (error) {
      this.logger.error(`Custom authentication error: ${error.message}`, { 
        requestId: context.requestId,
        error 
      });
      
      return {
        success: false,
        status: 500,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Failed to authenticate request'
        }
      };
    }
  }
}

module.exports = CustomGateway;
```

### Multi-Tenant Authentication

For multi-tenant environments:

```javascript
// EnterpriseGateway with multi-tenant support
class EnhancedEnterpriseGateway extends EnterpriseGateway {
  async _performAuthentication(context) {
    // Start with the basic authentication
    const basicResult = await super._performAuthentication(context);
    
    if (!basicResult.success) {
      return basicResult;
    }
    
    // Additional tenant-specific validation
    if (context.tenantId) {
      // Verify that the authenticated user has access to this tenant
      const tenantAccess = await this.enterpriseService.verifyTenantAccess(
        basicResult.user.id, 
        context.tenantId
      );
      
      if (!tenantAccess.hasAccess) {
        return {
          success: false,
          status: 403,
          error: {
            code: 'INVALID_TENANT',
            message: `User does not have access to tenant: ${context.tenantId}`
          }
        };
      }
      
      // Add tenant-specific permissions and information
      return {
        ...basicResult,
        user: {
          ...basicResult.user,
          tenantPermissions: tenantAccess.permissions,
          tenantRole: tenantAccess.role,
          tenantSettings: tenantAccess.settings
        }
      };
    }
    
    return basicResult;
  }
}
```

### Implementing Role-Based Access Control

You can enhance your gateway implementations with role-based access control:

```javascript
// Extend a gateway with RBAC functionality
class RBACGateway extends BaseGateway {
  constructor(options = {}) {
    super(options);
    this.rbacService = options.rbacService;
    this.supportedRoles = options.supportedRoles || [];
    
    if (!this.rbacService) {
      throw new Error('rbacService is required for RBACGateway');
    }
  }
  
  // Check if a user has a specific permission
  async hasPermission(userId, permission) {
    const userRoles = await this.rbacService.getUserRoles(userId);
    const permissions = await this.rbacService.getPermissionsForRoles(userRoles);
    
    return permissions.includes(permission);
  }
  
  // Check if a user has one of the required roles
  async hasRole(userId, requiredRoles) {
    const userRoles = await this.rbacService.getUserRoles(userId);
    return requiredRoles.some(role => userRoles.includes(role));
  }
  
  // Middleware factory for permission-based access control
  requirePermission(permission) {
    return async (req, res, next) => {
      try {
        const hasPermission = await this.hasPermission(req.user.id, permission);
        
        if (hasPermission) {
          next();
        } else {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: `Missing required permission: ${permission}`
            }
          });
        }
      } catch (error) {
        this.logger.error(`Permission check error: ${error.message}`, {
          userId: req.user.id,
          permission,
          error
        });
        
        res.status(500).json({
          error: {
            code: 'PERMISSION_CHECK_ERROR',
            message: 'Error checking permission'
          }
        });
      }
    };
  }
}
```

## Troubleshooting

This section covers common issues and their solutions when working with the gateway system.

### Common Issues

#### Authentication Failures

**Issue:** Authentication consistently fails with "Invalid SallyPort token" errors.

**Possible Causes:**
1. The SallyPort token is expired
2. The token was generated with an incorrect secret key
3. The token has been tampered with

**Solutions:**
1. Check token expiration:
   ```javascript
   // Decode token without verification to check expiration
   const jwt = require('jsonwebtoken');
   const decodedToken = jwt.decode(token);
   
   if (decodedToken.exp && decodedToken.exp < Math.floor(Date.now() / 1000)) {
     console.log('Token is expired. Generate a new token.');
   }
   ```

2. Verify that the SallyPortVerifier is configured with the correct secret key:
   ```javascript
   // Ensure environment variables or configuration sources are correctly set
   console.log('Using key from environment:', !!process.env.SALLYPORT_SECRET_KEY);
   ```

3. Implement token refresh logic:
   ```javascript
   async function getValidToken(currentToken) {
     try {
       // Check if token is still valid
       const verificationResult = await sallyPortVerifier.verify(currentToken);
       
       if (verificationResult.isValid) {
         return currentToken;
       }
       
       // Token is invalid, request a new one
       return await tokenService.refreshToken(currentToken);
     } catch (error) {
       console.error('Token validation error:', error);
       throw new Error('Unable to obtain a valid token');
     }
   }
   ```

#### Missing Dependencies

**Issue:** Errors when instantiating gateway classes about missing services.

**Error Message:** `Error: customService is required for CustomGateway`

**Solutions:**
1. Ensure all required services are provided in the gateway constructor:
   ```javascript
   // Example of complete gateway instantiation
   const gateway = new CustomGateway({
     sallyPortVerifier,
     customService, // This was missing
     logger
   });
   ```

2. Implement default service behavior:
   ```javascript
   constructor(options = {}) {
     super(options);
     this.customService = options.customService || new DefaultCustomService();
   }
   ```

#### Performance Issues

**Issue:** Authentication is taking too long.

**Solutions:**
1. Implement token caching:
   ```javascript
   class CachingSallyPortVerifier {
     constructor(options) {
       this.verifier = options.verifier;
       this.cache = new Map();
       this.ttl = options.ttl || 60000; // 1 minute by default
     }
     
     async verify(token) {
       // Check cache first
       if (this.cache.has(token)) {
         const cachedResult = this.cache.get(token);
         
         // Return cached result if not expired
         if (cachedResult.timestamp + this.ttl > Date.now()) {
           return cachedResult.result;
         }
         
         // Remove expired result
         this.cache.delete(token);
       }
       
       // Verify token
       const result = await this.verifier.verify(token);
       
       // Cache the result if valid
       if (result.isValid) {
         this.cache.set(token, {
           result,
           timestamp: Date.now()
         });
       }
       
       return result;
     }
   }
   ```

2. Optimize service calls:
   - Batch related service calls
   - Use service client pooling
   - Implement circuit breakers for unreliable services

#### Gateway Selection Issues

**Issue:** Difficulty determining which gateway to use for a request.

**Solutions:**
1. Implement a gateway factory:
   ```javascript
   class GatewayFactory {
     constructor(options = {}) {
       this.gateways = new Map();
       this.defaultGateway = options.defaultGateway;
       this.logger = options.logger || console;
     }
     
     registerGateway(type, gateway) {
       this.gateways.set(type, gateway);
       return this;
     }
     
     getGateway(type) {
       if (!this.gateways.has(type)) {
         this.logger.warn(`No gateway registered for type: ${type}, using default`);
         
         if (!this.defaultGateway) {
           throw new Error(`No gateway registered for type: ${type} and no default gateway set`);
         }
         
         return this.defaultGateway;
       }
       
       return this.gateways.get(type);
     }
   }
   
   // Usage
   const gatewayFactory = new GatewayFactory({ 
     defaultGateway: ownerGateway,
     logger 
   });
   
   gatewayFactory
     .registerGateway('owner-subscriber', ownerGateway)
     .registerGateway('enterprise', enterpriseGateway)
     .registerGateway('team', teamGateway)
     .registerGateway('group', groupGateway)
     .registerGateway('practitioner', practitionerGateway);
   
   // Get the appropriate gateway
   const gateway = gatewayFactory.getGateway(userType);
   ```

### Debugging Techniques

#### Enable Debug Logging

Increase the verbosity of logging to trace authentication issues:

```javascript
const gateway = new OwnerSubscriberGateway({
  sallyPortVerifier,
  ownerSubscriberService,
  logger: createDebugLogger('gateway:owner-subscriber')
});

function createDebugLogger(namespace) {
  return {
    info: (message, meta) => console.log(`[${namespace}] INFO:`, message, meta),
    warn: (message, meta) => console.log(`[${namespace}] WARN:`, message, meta),
    error: (message, meta) => console.log(`[${namespace}] ERROR:`, message, meta),
    debug: (message, meta) => console.log(`[${namespace}] DEBUG:`, message, meta)
  };
}
```

#### Inspect SallyPort Tokens

Use a tool to inspect token contents without verification:

```javascript
function inspectToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Not a valid JWT format' };
    }
    
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return {
      header,
      payload,
      expiresIn: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
      isExpired: payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false
    };
  } catch (error) {
    return { error: `Failed to decode token: ${error.message}` };
  }
}

// Usage
console.log(inspectToken(sallyPortToken));
```

#### Test Gateway in Isolation

Create a utility to test gateway authentication in isolation:

```javascript
async function testGateway(gateway, token, additionalContext = {}) {
  const context = {
    requestId: `test-${Date.now()}`,
    userId: 'test-user',
    sallyPortToken: token,
    ...additionalContext
  };
  
  console.log('Testing gateway with context:', context);
  
  try {
    const result = await gateway.authenticate(context);
    console.log('Authentication result:', result);
    return result;
  } catch (error) {
    console.error('Gateway test failed with error:', error);
    throw error;
  }
}

// Usage
testGateway(ownerGateway, token, { resourceId: '123' })
  .then(result => {
    if (result.success) {
      console.log('User authenticated successfully:', result.user);
    } else {
      console.log('Authentication failed:', result.error);
    }
  });
```

### Troubleshooting Service-Specific Issues

#### OwnerSubscriberGateway Issues

**Common Issue:** Ownership verification failures

**Solution:**
```javascript
// Add this method to your OwnerSubscriberGateway class
async verifyOwnership(userId, resourceId) {
  try {
    return await this.ownerSubscriberService.verifyOwnership(userId, resourceId);
  } catch (error) {
    this.logger.error(`Ownership verification error: ${error.message}`, {
      userId,
      resourceId,
      error
    });
    
    return {
      isOwner: false,
      error: error.message
    };
  }
}
```

#### EnterpriseGateway Issues

**Common Issue:** Cross-tenant access problems

**Solution:**
```javascript
// Add this method to your EnterpriseGateway class
async getAccessibleTenants(userId) {
  try {
    const tenants = await this.enterpriseService.getUserTenants(userId);
    
    return {
      tenants,
      primaryTenant: tenants.find(t => t.isPrimary) || tenants[0]
    };
  } catch (error) {
    this.logger.error(`Error fetching accessible tenants: ${error.message}`, {
      userId,
      error
    });
    
    return {
      tenants: [],
      error: error.message
    };
  }
}
```

### Support Resources

If you continue to experience issues with the gateway system after following the troubleshooting steps above, consider the following resources:

1. **Documentation:**
   - Refer to this gateway usage guide
   - Check the SallyPort verification system documentation

2. **Logging:**
   - Enable detailed logging
   - Analyze log patterns for recurring issues

3. **Community Support:**
   - Post questions in the Integration Gateway GitHub repository
   - Join the Integration Gateway Slack channel

4. **Professional Support:**
   - Contact the Integration Gateway team for dedicated support
   - Schedule a troubleshooting session with gateway experts

By following these troubleshooting guidelines, you should be able to resolve most issues encountered when using the gateway classes with SallyPort verification.

