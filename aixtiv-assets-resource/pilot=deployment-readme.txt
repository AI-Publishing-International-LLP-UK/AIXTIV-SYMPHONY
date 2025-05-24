# AIXTIV Symphony Deployment Guide

## Prerequisites

1. **Google Cloud Platform Account**
   - Project: `api-for-warp-drive`
   - Region: `us-west1`

2. **Tools Required**
   - Node.js 18+
   - Docker
   - Google Cloud SDK
   - kubectl
   - gcloud CLI

## Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/coaching2100/aixtiv-symphony.git
cd aixtiv-symphony
```

2. Install Dependencies
```bash
npm install
```

3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your specific configurations
```

## Local Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run security scan
npm run security:scan
```

## Docker Build

```bash
# Build Docker image
docker build -t aixtiv-symphony:local .

# Run locally
docker run -p 3000:3000 aixtiv-symphony:local
```

## Kubernetes Deployment

### Initial Setup

1. Authenticate with Google Cloud
```bash