# Jira License Management Service

This service manages Jira Cloud licensing for Coaching 2100 customers who don't use their own project management software.

## Overview

The Jira License Management service handles:

1. Creating and managing Jira licenses for projects
2. Setting up Jira workspaces for licensees
3. Inviting users to Jira workspaces
4. Processing monthly billing for active licenses
5. Sending invoices and email notifications

## Features

- **Transparent task visibility**: All project tasks are visible to team members
- **2SDO-compliant tracking**: Project progress tracking follows 2SDO standards
- **Agent operability**: Full support for Claude, XO Pilot, and FMS S01-S03 agents
- **User privileges**: Licensed users get view, comment, and prompt-instruct privileges
- **Milestone integration**: Linked milestones visible from the agent dashboard

## Pricing

- $5 per month per user (not per enterprise)

## Technical Implementation

### Firebase Components

- **Cloud Functions**: Handle all backend business logic
- **Firestore Collections**:
  - `projectLicenses`: Stores license information
  - `jiraWorkspaces`: Stores workspace information
  - `licenseBillings`: Stores billing records

### Cloud Functions

- `setupJiraWorkspace`: Creates a new Jira workspace for a project
- `inviteToJiraWorkspace`: Invites a user to a Jira workspace
- `processJiraLicenseBilling`: Processes monthly billing for active licenses
- `sendLicenseInvoices`: Sends invoice emails to users

### Frontend Components

- `ProjectTrackingLicense.tsx`: React component for the license selection flow
- `JiraLicenseManagement.tsx`: Admin component for managing Jira licenses
- `jiraLicenseService.ts`: Service for interacting with license data

## Deployment

1. Ensure Firebase CLI is installed: `npm install -g firebase-tools`
2. Navigate to the functions directory: `cd backend/services/jira-license/functions`
3. Install dependencies: `npm install`
4. Deploy the functions: `firebase deploy --only functions`

## Environment Variables

The following environment variables need to be set in Firebase:

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

## Integration Points

- **Frontend Onboarding**: Offers license option during project setup
- **Agent Dashboard**: Shows Jira tasks and milestones
- **Billing System**: Integrates with existing billing infrastructure

## Development

To run functions locally for testing:

```bash
firebase emulators:start --only functions
```