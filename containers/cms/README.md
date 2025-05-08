# Anthology CMS Integration Container

This container provides CMS integration capabilities for Anthology subscribers, allowing seamless content publishing and synchronization with various Content Management Systems.

## Supported CMS Platforms

- WordPress
- Drupal
- Joomla
- Shopify
- Contentful
- Sanity

## Features

- **Content Publishing**: Push Anthology content to your CMS
- **Content Synchronization**: Keep content in sync between Anthology and your CMS
- **Media Asset Management**: Manage images and other media across platforms
- **Webhooks**: React to content changes in either system
- **User Management**: Map Anthology users to CMS users
- **Permissions**: Apply Anthology permission model to CMS actions

## Configuration

This container is configured via environment variables:

```
SUBSCRIBER_ID=your-subscriber-id
SUBSCRIBER_TIER=business|enterprise|individual
CMS_TYPE=wordpress|drupal|joomla|shopify|contentful|sanity
CMS_URL=https://your-cms-url
ANTHOLOGY_API_KEY=your-api-key
```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /api/v1/connect` - Connect to a CMS instance
- `POST /api/v1/publish` - Publish content to connected CMS
- `POST /api/v1/sync` - Sync content between Anthology and CMS
- `GET /api/v1/status` - Get connection status

## Resource Requirements

- **Minimum**: 0.25 CPU cores, 512MB memory
- **Recommended**: 0.5 CPU cores, 1GB memory
- **Maximum**: 2 CPU cores, 4GB memory

## Scaling

This container is designed to scale horizontally. Multiple replicas can be deployed to handle increased load.

## Security

- All credentials are stored in environment variables or mounted secrets
- Communication is encrypted with TLS
- API access requires authentication
- All actions are logged for audit purposes
