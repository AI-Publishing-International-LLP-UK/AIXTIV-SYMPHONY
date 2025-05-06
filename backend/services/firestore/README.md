# Firestore Services

This directory contains all Firestore-related services, models, configurations, and utilities for the AIXTIV SYMPHONY Opus project.

## Overview

The Firestore services provide a centralized data layer for the project, managing various collections that support different components of the ecosystem. These services were migrated from the integration-gateway to align with the project's architectural principles of separation of concerns.

## Directory Structure

```
backend/services/firestore/
├── config/                    # Firebase and Firestore configuration files
├── connectors/                # Service connectors that interface with Firestore
├── core/                      # Core Firestore service implementations
├── docs/                      # Documentation for Firestore usage
├── integrations/              # Integration points with other systems (e.g., blockchain)
├── models/                    # Data models and schemas
├── user-types/                # User-related type definitions
└── utils/                     # Utility scripts for Firestore operations
```

## Collections

The following Firestore collections are managed by these services:

- **users** - User profiles and authentication information
- **organizations** - Organization data with member subcollections
- **teams** - Team information with member subcollections
- **agents** - AI agent configurations and state
- **conversations** - Conversation data with messages and participants subcollections
- **integrationGateways** - Integration gateway configuration
- **integrationApiKeys** - API keys for integration services
- **blockchainRecords** - Blockchain transaction and verification records
- **nftTokens** - NFT token data and ownership information
- **s2doObjects** - S2DO protocol objects with encryption and governance
- **raysComputeJobs** - Compute job tracking and results
- **aiResponseCache** - Cache for AI responses
- **aiRequestLogs** - Logs of AI requests
- **aiRequestErrorLogs** - Error logs for AI requests
- **activityLogs** - User activity tracking
- **performanceMetrics** - Performance metrics data
- **subscriptions** - Subscription data for services
- **vectorStores** - Vector database configurations
- **systemAlerts** - System-wide alerts
- **modelCatalog** - AI model information
- **silentAuth** - Authentication related data
- **sallyPort** - Security-related data

## Architectural Context

These Firestore services are part of the backend layer of the AIXTIV SYMPHONY Opus architecture. They interface with:

1. **API Layer** - Provides data to the REST, GraphQL, and gRPC endpoints
2. **Service Layer** - Supports other microservices like authentication, orchestration, and search
3. **Functions Layer** - Provides data persistence for serverless functions
4. **VLS Solutions** - Underpins data requirements for the Vision Lake Solutions
5. **Wing Agencies** - Stores agent configuration and state for AI pilot agents

## Migration Details

This directory contains code migrated from the integration-gateway to better align with the architectural vision. The migration included:

- Core Firestore interaction code
- Model definitions and schemas
- Configuration files
- User type definitions
- Documentation
- Integration points

## Usage Guidelines

### Connecting to Firestore

```javascript
// Import the Firestore service
const { getFirestoreInstance } = require('./core/as-backend-core');

// Get a Firestore instance
const db = getFirestoreInstance();

// Access a collection
const usersCollection = db.collection('users');
```

### Recommended Patterns

1. **Use Models** - Leverage the model definitions in the models directory to ensure data consistency
2. **Transactions** - Use Firestore transactions for operations that require atomicity
3. **Batched Writes** - For bulk operations, use batched writes to minimize API calls
4. **Security Rules** - Refer to the configuration files for Firestore security rules

## Integration with GCP

This service uses Google Cloud Platform (us-west1 region) rather than AWS. All secrets and credentials are managed through the integration-gateway's connection to GCP Secret Manager.

