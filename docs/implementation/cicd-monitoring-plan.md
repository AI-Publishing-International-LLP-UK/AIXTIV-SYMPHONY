# CI/CD and Monitoring Plan for Integration Gateway

This document outlines the plan for setting up continuous integration and deployment (CI/CD) pipelines, as well as comprehensive monitoring, logging, and alerting for the Integration Gateway system on Google Cloud Platform.

## 1. CI/CD Pipeline Setup

### 1.1. GitHub Actions CI/CD Pipeline

We'll use GitHub Actions to implement a robust CI/CD pipeline that automates testing, building, and deploying the Integration Gateway to Google Cloud Run.

#### 1.1.1. Main Workflow Configuration

Create a `.github/workflows/main.yml` file with the following configuration:

```yaml
name: Integration Gateway CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  PROJECT_ID: api-for-warp-drive
  SERVICE_NAME: integration-gateway
  REGION: us-west1

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        run: npm run test:integration
  
  security-scan:
    name: Security Scan
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run SAST with SonarCloud
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Run dependency scanning
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  build-and-deploy:
    name: Build and Deploy
    needs: [test, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true

      - name: Build and push Docker image
        run: |
          # Generate version tag
          VERSION=$(date +%Y%m%d)-$(git rev-parse --short HEAD)
          echo "VERSION=$VERSION" >> $GITHUB_ENV
          
          # Build Docker image
          docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$VERSION .
          docker tag gcr.io/$PROJECT_ID/$SERVICE_NAME:$VERSION gcr.io/$PROJECT_ID/$SERVICE_NAME:latest
          
          # Configure Docker to use gcloud credentials
          gcloud auth configure-docker -q
          
          # Push Docker image to GCR
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$VERSION
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: ${{ env.SERVICE_NAME }}
          image: gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ env.VERSION }}
          region: ${{ env.REGION }}
          platform: managed
          env_vars: |
            NODE_ENV=production
            PROJECT_ID=${{ env.PROJECT_ID }}

      - name: Show Output
        run: echo ${{ steps.deploy.outputs.url }}

  notify:
    name: Notify Deployment
    needs: build-and-deploy
    runs-on: ubuntu-latest
    
    steps:
      - name: Send Slack notification
        uses: rtCamp/action-slack-notify@master
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_CHANNEL: #deployments
          SLACK_TITLE: 'Integration Gateway Deployment'
          SLACK_MESSAGE: 'New deployment to Cloud Run completed successfully!'
          SLACK_COLOR: good
```

#### 1.1.2. Staged Deployment Workflow

Create a `.github/workflows/staged-deployment.yml` for multiple environments:

```yaml
name: Staged Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to (dev/staging/prod)'
        required: true
        default: 'dev'
      version:
        description: 'Version to deploy (latest if empty)'
        required: false

env:
  PROJECT_ID: api-for-warp-drive
  SERVICE_NAME: integration-gateway
  REGION: us-west1

jobs:
  deploy:
    name: Deploy to ${{ github.event.inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ env.PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          export_default_credentials: true

      - name: Set version tag
        run: |
          if [ -z "${{ github.event.inputs.version }}" ]; then
            echo "VERSION=latest" >> $GITHUB_ENV
          else
            echo "VERSION=${{ github.event.inputs.version }}" >> $GITHUB_ENV
          fi

      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: ${{ env.SERVICE_NAME }}-${{ github.event.inputs.environment }}
          image: gcr.io/${{ env.PROJECT_ID }}/${{ env.SERVICE_NAME }}:${{ env.VERSION }}
          region: ${{ env.REGION }}
          platform: managed
          env_vars: |
            NODE_ENV=${{ github.event.inputs.environment }}
            PROJECT_ID=${{ env.PROJECT_ID }}
            ENVIRONMENT=${{ github.event.inputs.environment }}

      - name: Show Output
        run: echo ${{ steps.deploy.outputs.url }}
```

### 1.2. Service Account Setup

1. Create a dedicated GitHub Actions service account:

```bash
# Create the service account
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding api-for-warp-drive \
  --member="serviceAccount:github-actions-deployer@api-for-warp-drive.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding api-for-warp-drive \
  --member="serviceAccount:github-actions-deployer@api-for-warp-drive.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding api-for-warp-drive \
  --member="serviceAccount:github-actions-deployer@api-for-warp-drive.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create and download the key
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=github-actions-deployer@api-for-warp-drive.iam.gserviceaccount.com
```

2. Add the key content to GitHub repository secrets as `GCP_SA_KEY`.

### 1.3. Dockerfile Optimization

Ensure the `Dockerfile` is optimized for production:

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run lint and tests
RUN npm run lint
RUN npm test

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=build /app/dist ./dist

# Create and use non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
```

## 2. Monitoring, Logging, and Alerting Setup

### 2.1. Cloud Monitoring Setup

#### 2.1.1. Custom Dashboard

Create a custom monitoring dashboard for the Integration Gateway:

```bash
# Deploy the monitoring dashboard
gcloud monitoring dashboards create \
  --config-from-file=monitoring/dashboard-config.json
```

Sample dashboard config (`monitoring/dashboard-config.json`):

```json
{
  "displayName": "Integration Gateway Monitoring",
  "gridLayout": {
    "widgets": [
      {
        "title": "CPU Utilization",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/cpu/utilization\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"integration-gateway\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Memory Utilization",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/container/memory/utilization\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"integration-gateway\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Request Count",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"integration-gateway\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_SUM"
                  }
                }
              }
            }
          ]
        }
      },
      {
        "title": "Request Latency",
        "xyChart": {
          "dataSets": [
            {
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.label.\"service_name\"=\"integration-gateway\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_PERCENTILE_99"
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

#### 2.1.2. Custom Metrics

Implement custom metrics using the Google Cloud Monitoring API:

```typescript
// src/utils/Metrics.ts
import { Monitoring } from '@google-cloud/monitoring';

export class MetricsClient {
  private client: Monitoring.MetricServiceClient;
  private projectId: string;
  
  constructor(projectId: string) {
    this.client = new Monitoring.MetricServiceClient();
    this.projectId = projectId;
  }
  
  async recordAuthenticationAttempt(success: boolean, gatewayType: string): Promise<void> {
    const dataPoint = {
      interval: {
        endTime: {
          seconds: Math.floor(Date.now() / 1000),
          nanos: 0
        }
      },
      value: {
        int64Value: 1
      }
    };
    
    const metric = {
      type: 'custom.googleapis.com/integration_gateway/authentication_attempts',
      labels: {
        success: success.toString(),
        gateway_type: gatewayType
      }
    };
    
    const resource = {
      type: 'global',
      labels: {
        project_id: this.projectId
      }
    };
    
    const timeSeries = {
      metric,
      resource,
      points: [dataPoint]
    };
    
    const request = {
      name: this.client.projectPath(this.projectId),
      timeSeries: [timeSeries]
    };
    
    await this.client.createTimeSeries(request);
  }
  
  async recordOperationLatency(operation: string, latencyMs: number): Promise<void> {
    const dataPoint = {
      interval: {
        endTime: {
          seconds: Math.floor(Date.now() / 1000),
          nanos: 0
        }
      },
      value: {
        doubleValue: latencyMs
      }
    };
    
    const metric = {
      type: 'custom.googleapis.com/integration_gateway/operation_latency',
      labels: {
        operation
      }
    };
    
    const resource = {
      type: 'global',
      labels: {
        project_id: this.projectId
      }
    };
    
    const timeSeries = {
      metric,
      resource,
      points: [dataPoint]
    };
    
    const request = {
      name: this.client.projectPath(this.projectId),
      timeSeries: [timeSeries]
    };
    
    await this.client.createTimeSeries(request);
  }
}
```

### 2.2. Structured Logging

Implement structured logging to Cloud Logging for better analysis:

```typescript
// src/utils/Logger.ts
import { Logging } from '@google-cloud/logging';

export class CloudLogger {
  private logging: Logging;
  private logName: string;
  private projectId: string;
  private resource: any;
  
  constructor(options: any) {
    this.projectId = options.projectId;
    this.logName = options.logName || 'integration-gateway';
    this.logging = new Logging({ projectId: this.projectId });
    
    this.resource = {
      

