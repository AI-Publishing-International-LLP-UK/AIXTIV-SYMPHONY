# AIXTIV Symphony CI/CD Pipeline

This directory contains configuration files and scripts for the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the AIXTIV Symphony project.

## Overview

The CI/CD pipeline automatically builds, tests, and deploys your application to Google Cloud Platform (GCP) whenever changes are pushed to the main branch. Additionally, a scheduled job is configured to trigger deployments every 10 minutes to ensure your latest changes are continuously deployed to the live environment.

## Components

- `cloudbuild.yaml`: Configuration file for Cloud Build that defines the build and deployment steps
- `deploy.sh`: Script for manually triggering deployments
- `setup-cicd.sh`: Script for setting up the CI/CD pipeline components
- `cloud-scheduler.yaml`: Configuration for scheduling automated deployments

## How It Works

1. **Code Changes**: When you push code to the main branch, a Cloud Build trigger automatically starts a build.
2. **Build Process**: Cloud Build builds Docker images for each service and pushes them to Artifact Registry.
3. **Deployment**: Cloud Build updates the Kubernetes deployments with the new images.
4. **Scheduled Deployments**: A Cloud Scheduler job triggers the deployment process every 10 minutes.

## Setup Instructions

1. Run the setup script to configure your GCP project:

```bash
./deployment/setup-cicd.sh
```

2. Follow the prompts to set up:
   - Cloud Build trigger
   - Service account permissions
   - Cloud Scheduler job

## Managing Deployments

### Manual Deployments

To manually trigger a deployment:

```bash
./deployment/deploy.sh
```

### Monitoring Deployments

1. **View Build Status**:
   - Go to [Cloud Build Console](https://console.cloud.google.com/cloud-build/builds)
   - Select your project
   - View current and past builds

2. **View Deployment Status**:
   - Go to [GKE Console](https://console.cloud.google.com/kubernetes/workload)
   - Check deployment status and pod health

### Troubleshooting

Common issues and solutions:

1. **Failed Builds**:
   - Check build logs in Cloud Build console
   - Verify Dockerfile syntax and build steps

2. **Failed Deployments**:
   - Check if images were pushed successfully
   - Verify Kubernetes configuration
   - Check if services have proper health checks

3. **Scheduler Issues**:
   - Verify scheduler job configuration
   - Check service account permissions

## Customizing the Pipeline

### Modifying Build Steps

Edit the `cloudbuild.yaml` file to:
- Add new services
- Modify build arguments
- Add testing steps
- Change deployment strategies

### Changing Deployment Frequency

To change how often deployments occur:
1. Edit the `cloud-scheduler.yaml` file
2. Modify the schedule using cron syntax (e.g., `*/10 * * * *` for every 10 minutes)
3. Update the scheduler job:
```bash
gcloud scheduler jobs update http deploy-aixtiv-symphony-frequent --schedule="*/15 * * * *"
```

## Best Practices

1. **Test Before Deployment**:
   - Add automated tests to your pipeline
   - Consider implementing staging environments

2. **Rollback Plan**:
   - Keep previous versions tagged in your registry
   - Know how to roll back: `kubectl rollout undo deployment/[deployment-name]`

3. **Monitoring**:
   - Set up alerts for failed deployments
   - Monitor application performance after deployments

## Security Considerations

1. Ensure service accounts have minimal required permissions
2. Store sensitive configurations in Secret Manager
3. Regularly audit CI/CD permissions and access

## Additional Resources

- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [GKE Continuous Deployment](https://cloud.google.com/kubernetes-engine/docs/tutorials/gitops-cloud-build)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)

