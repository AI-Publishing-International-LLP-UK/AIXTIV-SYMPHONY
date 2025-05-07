# Integration Gateway

A comprehensive integration gateway for Aixtiv Symphony, providing secure access to multiple services and APIs with intelligent self-healing capabilities.

## Overview

The Integration Gateway serves as a central security and integration hub, providing:

- Multi-tenant authentication and authorization
- Service integration and orchestration
- Self-healing and automated recovery
- Comprehensive audit logging
- Webhook-based event integration
- DeepMind integration for intelligent error analysis
- Claude Automation for security incident response

## Architecture

The gateway follows a modular architecture with these key components:

- **Core Gateway** - Base authentication and routing framework
- **Service Adapters** - Integrations with external services
- **Self-Healing** - Automatic detection and recovery of errors
- **Security** - Token management and API registry
- **Audit** - Comprehensive logging of all actions
- **Webhooks** - Event-driven integration

## Getting Started

### Prerequisites

- Node.js 18+
- Docker
- Google Cloud SDK

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/aixtiv/integration-gateway.git
   cd integration-gateway
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. Build the project:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

### Docker Deployment

Build and run with Docker:

```
docker build -t integration-gateway .
docker run -p 3000:3000 integration-gateway
```

### Cloud Deployment

Deploy to Google Cloud Run:

```
./scripts/deploy.sh
```

## API Reference

The gateway exposes these main endpoints:

- `/health` - Health check endpoint
- `/api/v1/services` - Service management
- `/api/v1/services/:serviceId/:operation` - Service operations
- `/api/v1/auth` - Authentication endpoints
- `/api/v1/admin` - Administrative endpoints
- `/api/v1/audit` - Audit log endpoints
- `/webhooks/:serviceId` - Service webhooks

## Development

### Testing

Run tests:

```
npm test
```

### Linting

Run linter:

```
npm run lint
```

## License

Proprietary - All rights reserved
