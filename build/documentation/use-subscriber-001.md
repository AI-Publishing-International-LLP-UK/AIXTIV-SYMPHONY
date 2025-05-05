# Using Anthology as Owner Subscriber 001 with Google.com Credentials

This guide demonstrates how to use Anthology as the first owner subscriber (ID: 001) with Google.com credentials.

## Quick Start

To see the onboarding process demonstration, run:

```bash
./onboard-subscriber-001.sh
```

## Configuration Details

### Subscriber Information
- **ID**: 001
- **Name**: Owner Subscriber
- **Email**: owner@google.com
- **Tier**: Enterprise
- **Role**: Owner
- **Domain**: google.com

### Authentication
The system is configured to use Google SSO with your Google.com credentials. This provides secure, seamless access to all Anthology features.

### Accessing Your Environment

Once onboarded, you can access your Anthology environment at:
```
https://001.subscribers.anthology.aixtiv.dev
```

Key endpoints include:
- **Admin Dashboard**: /admin
- **Content Manager**: /content
- **Publishing System**: /publish
- **Integration Manager**: /integrations
- **Analytics**: /analytics

### Using Your API

Your environment includes a dedicated API available at:
```
https://api.anthology.aixtiv.dev/subscriber/001
```

Authentication uses your API key which is securely stored in Secret Manager and can be accessed from your admin dashboard.

Example API usage:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Content","body":"Hello world!"}' \
  https://api.anthology.aixtiv.dev/subscriber/001/content
```

### Integration Containers

Your environment includes the following integration containers:

1. **CMS Integration (WordPress)**
   - Syncs content between Anthology and your WordPress site
   - Supports automatic publishing of content
   - Manages media assets across platforms

2. **LMS Integration (Custom Learning System)**
   - Connects your learning content with Anthology
   - Syncs user progress and achievements
   - Supports course creation and management

3. **CRM Integration (Salesforce)**
   - Connects customer data with content strategy
   - Supports personalized content delivery
   - Tracks engagement and interactions

## Next Steps

1. **Customize Your Environment**
   - Configure integration settings
   - Set up publishing workflows
   - Customize your branding

2. **Invite Team Members**
   - Add users from your Google.com domain
   - Assign roles and permissions
   - Set up team workflows

3. **Create Your First Content**
   - Use the content creation tools
   - Publish across multiple platforms
   - Track performance with analytics

4. **Expand Your Integrations**
   - Add additional third-party services
   - Configure custom webhooks
   - Set up automated workflows

## Support

As an owner subscriber, you have priority support available 24/7:
- **Email**: support@anthology.aixtiv.dev
- **Phone**: 1-800-ANTHOLOGY
- **In-App**: Use the support chat in your admin dashboard
