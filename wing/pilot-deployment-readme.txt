## Docker Build ```bash
# Build Docker image
docker build -t aixtiv-symphony:local .

# Run locally
docker run -p 3000:3000 aixtiv-symphony:local
``` 

## Kubernetes Deployment

### Initial Setup

1. Authenticate with Google Cloud
```bash
# Login to Google Cloud
gcloud auth login

# Set project
gcloud config set project api-for-warp-drive

# Configure Docker to use Google Container Registry
gcloud auth configure-docker gcr.io

# Connect to Kubernetes cluster
gcloud container clusters get-credentials aixtiv-symphony-primary --region us-west1
```

2. Create Kubernetes Secrets
```bash
# Create namespace
kubectl create namespace production

# Create secrets (replace with your actual values)
kubectl create secret generic aixtiv-secrets \
    --from-literal=DATABASE_URL="your_database_connection_string" \
    --from-literal=JWT_SECRET="your_jwt_secret" \
    -n production
```

### Deployment Steps

```bash
# Build and push Docker image
docker build -t gcr.io/api-for-warp-drive/aixtiv-symphony:latest .
docker push gcr.io/api-for-warp-drive/aixtiv-symphony:latest

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml -n production
kubectl apply -f k8s/service.yaml -n production
kubectl apply -f k8s/hpa.yaml -n production
```

### Monitoring and Management

```bash
# Check deployment status
kubectl rollout status deployment/aixtiv-symphony -n production

# View pods
kubectl get pods -n production

# View service details
kubectl get services -n production

# Check horizontal pod autoscaler
kubectl get hpa -n production
```

### Scaling and Updates

```bash
# Manual scaling
kubectl scale deployment aixtiv-symphony --replicas=5 -n production

# Rolling update
kubectl set image deployment/aixtiv-symphony aixtiv-symphony=gcr.io/api-for-warp-drive/aixtiv-symphony:newversion -n production

# Rollback to previous version
kubectl rollout undo deployment/aixtiv-symphony -n production
```

## Continuous Integration and Deployment

We use GitHub Actions for CI/CD. The workflow handles:
- Running tests
- Building Docker image
- Pushing to Google Container Registry
- Deploying to Kubernetes

### Required GitHub Secrets
- `GCP_SERVICE_ACCOUNT_KEY`: GCP service account JSON key
- `SLACK_WEBHOOK`: Slack webhook for deployment notifications

## Troubleshooting

### Common Issues
- **Authentication Errors**: Ensure you're logged in with `gcloud auth login`
- **Deployment Failures**: Check pod logs with `kubectl logs POD_NAME -n production`
- **Network Issues**: Verify network policies and service configurations

### Viewing Logs
```bash
# View logs for a specific pod
kubectl logs POD_NAME -n production

# Follow logs in real-time
kubectl logs -f POD_NAME -n production
```

## Performance Monitoring

We use Google Cloud Monitoring and Logging:
- Metrics tracked: CPU, Memory, Request Latency
- Logs stored in Cloud Logging
- Dashboards available in Google Cloud Console

## Security Considerations

- Always use least-privilege service accounts
- Rotate secrets regularly
- Enable network policies
- Use Google Cloud's built-in security scanning

## Environment-Specific Configurations

- **Development**: Use `k8s/overlays/dev`
- **Staging**: Use `k8s/overlays/staging`
- **Production**: Use `k8s/overlays/production`

## Contact and Support

- **Deployment Team**: deployment@coaching2100.com
- **Support Slack**: #aixtiv-symphony-support

---

**Note**: Always consult with the DevOps team before making significant changes to the deployment configuration.
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