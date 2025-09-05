# HQRIX Compliance Middleware Implementation

## Overview

This document describes the implementation of HQRIX compliance middleware for the Aixtiv Symphony integration gateway. The middleware ensures all API requests comply with HQRIX security and compliance standards as defined in the `HQRIX-Security-Implementation-Summary.md`.

## Architecture Components

### 1. Core Middleware (`hqrix-compliance-middleware.ts`)

The main compliance middleware that enforces:
- **Regional Restriction**: Ensures all requests originate from `us-west1`
- **Audit Logging**: Logs every request with 7-year retention
- **Emergency Procedures**: Checks for active emergency shutdown state
- **Agent Access Control**: Validates agent permissions based on HQRIX configuration

```typescript
import { hqrixComplianceMiddleware } from '../middleware';
app.use(hqrixComplianceMiddleware);
```

### 2. Supporting Services

#### HQRIX Logging Service (`hqrix-logging-service.ts`)
- Provides compliant logging with 7-year retention
- Logs both regular requests and compliance events
- Integrates with secure, tamper-proof storage systems

#### Emergency Service (`emergency-service.ts`)
- Manages emergency shutdown state
- Stores state in quarantine bucket (`asoos-hqrix-quarantine-us-west1`)
- Provides immediate system lockdown capabilities

#### Region Service (`region-service.ts`)
- Determines request origin region from multiple header sources
- Enforces `us-west1` regional restrictions
- Prevents cross-region data leaks

### 3. Configuration (`hqrix-config.ts`)

Centralized configuration based on the `wake-vision-iam-roles.yaml` specification:

```typescript
export const HQRIX_CONFIG: HQRIXConfig = {
  compliance: {
    standard: 'HQRIX-2025',
    auditRetentionYears: 7,
  },
  regional: {
    allowedRegions: ['us-west1'],
    crossRegionDataTransferAllowed: false,
  },
  agents: {
    serviceAccounts: {
      'rix-agents': {
        permissions: ['read', 'query', 'evaluate'],
        agentCount: 3096000,
      },
      // ... other agent types
    },
  },
};
```

## Middleware Pipeline Order

**Critical**: The middleware must be applied in the correct order:

1. **Basic Express middleware** (JSON parsing, etc.)
2. **Cloudflare JWT authentication** (`cloudflareJwtMiddleware`)
3. **Agent authentication** (`agentAuthMiddleware`)
4. **HQRIX compliance enforcement** (`hqrixComplianceMiddleware`)
5. **Application routes**

```typescript
app.use(express.json());
app.use(cloudflareJwtMiddleware);
app.use(agentAuthMiddleware);
app.use(hqrixComplianceMiddleware); // HQRIX compliance layer
```

## Agent Access Control Matrix

Based on the HQRIX security configuration:

| Agent Type | Permissions | Agent Count | Roles |
|------------|-------------|-------------|-------|
| RIX | read, query, evaluate | 3,096,000 | storage.objectViewer, pubsub.subscriber, firestore.reader |
| CRX | read, query, train | 4,128,000 | storage.objectViewer, pubsub.subscriber, firestore.reader, ml.admin |
| QRIX | read, query, train, evaluate, benchmark | 2,064,000 | storage.objectViewer, pubsub.subscriber, firestore.reader, ml.admin, monitoring.viewer |
| HQRIX | full-access | 3,032,000 | storage.admin, pubsub.admin, firestore.admin, ml.admin, monitoring.admin, iam.serviceAccountAdmin |

## Compliance Checks

### 1. Regional Restriction
- Validates request origin region from headers
- Blocks requests from non-`us-west1` regions
- Logs compliance violations

### 2. Audit Logging
- Every request logged with:
  - Timestamp
  - User context
  - Request details (method, URL, headers)
  - Compliance standard metadata
- Minimum 7-year retention policy
- Tamper-proof storage in BigQuery

### 3. Emergency Procedures
- Checks emergency shutdown state before processing
- Returns HTTP 503 if emergency shutdown active
- Logs emergency events for audit trail

### 4. Agent Permission Validation
- Validates agent type against requested resource
- Enforces path-based restrictions:
  - `/admin/*` - HQRIX agents only
  - `/train/*` - CRX, QRIX, HQRIX agents
  - `/benchmark/*` - QRIX, HQRIX agents
- HTTP method restrictions for write operations

## Error Responses

The middleware returns standardized error responses:

```json
{
  "error": "Request originated from a non-compliant region.",
  "code": "REGION_NOT_ALLOWED"
}
```

```json
{
  "error": "Access denied due to active emergency procedures.",
  "code": "EMERGENCY_SHUTDOWN"
}
```

```json
{
  "error": "Agent type 'rix' lacks permission for this operation.",
  "code": "PERMISSION_DENIED"
}
```

## Implementation Example

See `hqrix-middleware-pipeline.ts` for a complete implementation example including:
- Middleware setup
- Protected routes
- Error handling
- Usage instructions

## Emergency Procedures

### Activate Emergency Shutdown
```typescript
import { EmergencyService } from '../services/emergency-service';
await EmergencyService.activateEmergencyShutdown('Security incident detected');
```

### Deactivate Emergency Shutdown
```typescript
await EmergencyService.deactivateEmergencyShutdown();
```

### Check Emergency Status
```typescript
const isActive = await EmergencyService.isEmergencyShutdownActive();
```

## Testing

### Valid Request (us-west1)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-Region: us-west1" \
     -H "X-Agent-Type: hqrix" \
     http://localhost:3000/api/wake-vision/dataset
```

### Invalid Region Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-Region: eu-west1" \
     http://localhost:3000/api/wake-vision/dataset
# Expected: 403 REGION_NOT_ALLOWED
```

### Insufficient Permissions
```bash
curl -H "Authorization: Bearer RIX_AGENT_TOKEN" \
     -H "X-Region: us-west1" \
     -X POST \
     http://localhost:3000/api/training/start
# Expected: 403 PERMISSION_DENIED
```

## Monitoring and Alerts

The HQRIX compliance middleware integrates with:
- **BigQuery** for audit log storage
- **Cloud Monitoring** for real-time alerts
- **Security Event Dashboard** for compliance reporting

## Best Practices

1. **Always apply HQRIX middleware after authentication**
2. **Test emergency procedures regularly**
3. **Monitor audit logs for suspicious activity**
4. **Keep HQRIX configuration synchronized with IAM roles**
5. **Validate regional restrictions in load balancer configuration**

## Compliance Status

✅ **Regional Restriction**: Enforced (`us-west1` only)  
✅ **Audit Logging**: 7-year retention implemented  
✅ **Emergency Procedures**: Active shutdown capability  
✅ **Agent Access Control**: Role-based permission validation  
✅ **Cross-Region Data Leak Prevention**: Request validation  

This implementation fully complies with HQRIX-2025 security standards and integrates with the existing `wake-vision-iam-roles.yaml` configuration.
