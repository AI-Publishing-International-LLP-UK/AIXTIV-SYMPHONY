# GitLab CI/CD with Firebase and Jira Integration Setup Guide

This guide will walk you through setting up CI/CD pipelines in GitLab for Firebase deployment and configuring Jira integration for your project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
   - [Create Firebase Project](#create-firebase-project)
   - [Generate Firebase Token](#generate-firebase-token)
3. [GitLab CI/CD Setup](#gitlab-cicd-setup)
   - [Configure CI/CD Variables](#configure-cicd-variables)
   - [Understanding the .gitlab-ci.yml File](#understanding-the-gitlab-ciyml-file)
4. [Jira Integration](#jira-integration)
   - [Configure Jira in GitLab](#configure-jira-in-gitlab)
   - [Jira Smart Commits](#jira-smart-commits)
5. [Testing Your Pipeline](#testing-your-pipeline)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- A GitLab account with administrator access to your repository
- A Jira account with project administration privileges
- Firebase account with billing enabled (required for certain deployments)
- Node.js and npm installed locally
- Firebase CLI installed (`npm install -g firebase-tools`)

## Firebase Setup

### Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Set up separate projects for staging and production environments:
   - dr-memoria-staging
   - dr-memoria-production

### Generate Firebase Token

The Firebase token is required for CI/CD pipelines to authenticate with Firebase:

1. Open a terminal and run:
   ```bash
   firebase login:ci
   ```

2. Follow the browser authentication flow

3. Copy the token provided in the terminal output. It will look like:
   ```
   1/a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
   ```

> **IMPORTANT**: This token grants full access to your Firebase projects. Treat it as a sensitive secret!

## GitLab CI/CD Setup

### Configure CI/CD Variables

In GitLab, navigate to:
1. Your project → Settings → CI/CD → Variables
2. Click "Add Variable" and add the following variables:

| Variable Name | Value | Description | Protection | Masking |
|---------------|-------|-------------|------------|---------|
| `FIREBASE_TOKEN` | Your Firebase CI token | Authentication for Firebase | Yes | Yes |
| `FIREBASE_STAGING_API_KEY` | Staging API key | Found in Firebase Console | Yes | Yes |
| `FIREBASE_PRODUCTION_API_KEY` | Production API key | Found in Firebase Console | Yes | Yes |
| `NODE_ENV` | `production` | Environment setting | No | No |

> **Notes on Protection and Masking**:
> - **Protected** variables are only available in protected branches
> - **Masked** variables are hidden in job logs (essential for secrets)

### Understanding the .gitlab-ci.yml File

Our `.gitlab-ci.yml` file defines several stages:

- **test**: Runs linting and unit tests
- **deploy_staging**: Deploys to staging environment
- **deploy_production**: Deploys to production environment

Key features:
- Caching of node_modules between jobs
- Test coverage reporting
- Branch-specific deployments (develop → staging, main → production)
- Manual approval required for production deployment

## Jira Integration

### Configure Jira in GitLab

1. In GitLab, go to: Settings → Integrations → Jira
2. Fill in the following details:
   - **Web URL**: `https://c2100pcr.atlassian.net`
   - **Username or Email**: Your Jira username/email
   - **Password/API Token**: [Create an API token here](https://id.atlassian.com/manage/api-tokens)
   - **Jira Issue Transition ID**: Optional - IDs of transitions for closed/fixed issues

3. Configure additional settings:
   - Enable "Jira issues" checkbox
   - Enable "Comments" checkbox
   - Enable "Commit events" checkbox
   - Enable "Merge request events" checkbox
   
4. Click "Test settings and save changes"

### Jira Smart Commits

With the integration configured, you can use Jira issue keys in your commit messages:

```
git commit -m "C2100PCR-123 Fix navigation bug"
```

For advanced usage, you can:
- Transition issues: `C2100PCR-123 #resolve`
- Add comments: `C2100PCR-123 #comment Fixed the timezone issue`
- Log time: `C2100PCR-123 #time 2h 30m`

## Testing Your Pipeline

To test your CI/CD pipeline:

1. Ensure your `.gitlab-ci.yml` file is in the root of your repository
2. Make a small change and commit to a development branch:
   ```bash
   git checkout -b feature/test-pipeline
   touch test-file.txt
   git add test-file.txt
   git commit -m "C2100PCR-XXX Test CI/CD pipeline"
   git push origin feature/test-pipeline
   ```

3. Create a merge request to your develop branch
4. Observe the pipeline execution in the GitLab CI/CD interface

## Troubleshooting

### Common Issues and Solutions

- **Firebase Authentication Errors**:
  - Verify your Firebase token is correct and hasn't expired
  - Ensure the token has access to the target projects

- **Deployment Failures**:
  - Check that your Firebase project names match in `.firebaserc`
  - Verify your Node.js version in the CI/CD environment matches your local version

- **Jira Integration Issues**:
  - Confirm your Jira credentials are correct
  - Check that your project key prefix (e.g., C2100PCR) is used correctly in commits

For additional help, please refer to:
- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Jira Integration Documentation](https://docs.gitlab.com/ee/integration/jira.html)

