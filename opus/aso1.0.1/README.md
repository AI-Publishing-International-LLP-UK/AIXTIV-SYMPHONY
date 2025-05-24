# Aixtiv Symphony Opus 1.0.1

A comprehensive platform leveraging AI technologies to provide text-to-speech and sentiment analysis services.

> **Note:** This repository has been migrated from C2100-PR to C2100-AIPI organization. Please update your repository references accordingly.

## Project Structure

```
aixtiv-symphony-opus1.0.1/
├── frontend/              # Frontend application
├── backend/
│   ├── api/
│   │   ├── graphql/       # GraphQL API endpoints
│   │   ├── grpc/          # gRPC API endpoints
│   │   └── rest/          # REST API endpoints
│   ├── services/
│   │   ├── analytics/     # Analytics service
│   │   ├── content/       # Content management service
│   │   ├── notification/  # Notification service
│   │   ├── payment/       # Payment processing service
│   │   ├── search/        # Search service
│   │   ├── user/          # User management service
│   │   ├── tts/           # Text-to-Speech service
│   │   └── sentiment/     # Sentiment analysis service
│   ├── cache/             # Caching mechanisms
│   ├── deployment/        # Deployment configurations
│   ├── event-bus/         # Event bus system
│   ├── integration/       # Third-party integrations
│   ├── job-queue/         # Background job processing
│   └── monitoring/        # Monitoring and logging
└── README.md              # Project documentation
```

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (v7 or later)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Docker](https://www.docker.com/get-started) (for local container testing)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for Firebase deployments)

## Setup

### Google Cloud Setup

1. Create a Google Cloud project or use an existing one
2. Enable the required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable language.googleapis.com
   gcloud services enable texttospeech.googleapis.com
   ```
3. Set up authentication:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### Environment Configuration

Each service requires its own environment variables. Create `.env` files in each service directory:

#### TTS Service

Create `backend/services/tts/.env`:

```
PORT=8080
NODE_ENV=development
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
LOG_LEVEL=info
```

#### Sentiment Analysis Service

Create `backend/services/sentiment/.env`:

```
PORT=8080
NODE_ENV=development
GOOGLE_APPLICATION_CREDENTIALS=drla-api-for-warp-drive-148a01c2006b.json
LOG_LEVEL=info
```

## Running Locally

### Text-to-Speech Service

```bash
cd backend/services/tts
npm install
npm start
```

The service will be available at `http://localhost:8080`.

API Endpoints:
- POST `/synthesize` - Convert text to speech
- GET `/voices` - List available voices

### Sentiment Analysis Service

```bash
cd backend/services/sentiment
npm install
npm start
```

The service will be available at `http://localhost:8080`.

API Endpoints:
- POST `/analyze` - Analyze text sentiment

## Deployment to Cloud Run

### Building and Deploying the TTS Service

```bash
# Navigate to the TTS service directory
cd backend/services/tts

# Build the container
gcloud builds submit --tag gcr.io/api-for-warp-drive/tts-service

# Deploy to Cloud Run
gcloud run deploy tts-service \
  --image gcr.io/api-for-warp-drive/tts-service \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars NODE_ENV=production
```

### Building and Deploying the Sentiment Analysis Service

```bash
# Navigate to the Sentiment service directory
cd backend/services/sentiment

# Build the container
gcloud builds submit --tag gcr.io/api-for-warp-drive/sentiment-service

# Deploy to Cloud Run
gcloud run deploy sentiment-service \
  --image gcr.io/api-for-warp-drive/sentiment-service \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars NODE_ENV=production
```

### Environment Variables in Cloud Run

You can set environment variables during deployment:

```bash
gcloud run deploy SERVICE_NAME \
  --image gcr.io/api-for-warp-drive/SERVICE_NAME \
  --set-env-vars KEY1=VALUE1,KEY2=VALUE2
```

For sensitive data, use Secret Manager:

```bash
# Create a secret
gcloud secrets create my-secret --replication-policy automatic
echo -n "my-secret-value" | gcloud secrets versions add my-secret --data-file=-

# Use the secret in Cloud Run
gcloud run deploy SERVICE_NAME \
  --image gcr.io/api-for-warp-drive/SERVICE_NAME \
  --set-secrets /path/to/file.json=my-secret:latest
```

### Continuous Deployment

You can set up continuous deployment using Cloud Build:

1. Create a `cloudbuild.yaml` file in each service directory
2. Configure triggers in the Cloud Build console to build and deploy on repository changes

## Monitoring

The application uses structured logging. In production, logs are automatically sent to Cloud Logging.

To view logs:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=SERVICE_NAME"
```

## Troubleshooting

### Common Issues

1. **Authentication Issues**: Ensure your service account has the necessary permissions:
   - roles/run.admin
   - roles/storage.admin
   - roles/logging.admin

2. **Deployment Errors**: Check your Dockerfile for errors, ensure all dependencies are properly declared in package.json.

3. **API Errors**: Verify that the required Google Cloud APIs are enabled for your project.

### Getting Help

If you encounter problems:

1. Check the service logs using Cloud Logging
2. Verify environment variables are correctly set
3. Ensure your service account has the necessary permissions

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

