# ASOOS REST API with OAuth2 Authentication

This module provides REST API endpoints for ASOOS services with OAuth2 authentication. It includes endpoints for product catalog, video rooms, and speech services.

## Features

- OAuth2 authentication for secure API access
- Token-based authorization with scope-based permissions
- Support for client credentials and authorization code grant flows
- API endpoints for products, video rooms, and speech services
- Typescript implementation with proper types and interfaces

## API Endpoints

### Authentication

- `GET /auth/login` - Start OAuth2 authentication flow
- `GET /auth/callback` - OAuth2 callback after authorization
- `GET /auth/refresh` - Refresh OAuth2 access token
- `GET /auth/logout` - Log out user and clear session
- `GET /auth/token` - Get information about current access token

### Products API

- `GET /api/products` - Get all products
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search` - Search products by keyword
- `POST /api/products` - Add a new product (requires `api.products.write` scope)
- `PUT /api/products/:id` - Update a product (requires `api.products.write` scope)
- `DELETE /api/products/:id` - Delete a product (requires `api.products.write` scope)

### Video API

- `POST /api/video/rooms` - Create a new video room (requires `api.video.write` scope)
- `GET /api/video/rooms/:roomId` - Validate a video room (requires `api.video.read` scope)
- `DELETE /api/video/rooms/:roomId` - Delete a video room (requires `api.video.write` scope)

### Speech API

- `GET /api/speech/languages` - Get supported languages
- `GET /api/speech/voices/:languageCode` - Get voices for a language
- `POST /api/speech/tts` - Convert text to speech (requires `api.speech.write` scope)
- `POST /api/speech/tts/base64` - Convert text to speech with base64 response (requires `api.speech.write` scope)
- `POST /api/speech/stt/upload` - Convert speech to text from file upload (requires `api.speech.write` scope)
- `POST /api/speech/stt/base64` - Convert speech to text from base64 audio (requires `api.speech.write` scope)
- `POST /api/speech/detect-language` - Detect language of text (requires `api.speech.read` scope)
- `POST /api/speech/translate` - Translate text (requires `api.speech.write` scope)

## OAuth2 Scopes

The API uses the following OAuth2 scopes:

- `api.products.read` - Read access to product catalog
- `api.products.write` - Write access to product catalog
- `api.video.read` - Read access to video rooms
- `api.video.write` - Write access to video rooms
- `api.speech.read` - Read access to speech services
- `api.speech.write` - Write access to speech services
- `api.admin` - Administrative access to all services

## Authentication Flows

### Client Credentials Flow

For service-to-service authentication:

```typescript
import { createOAuth2Client } from './auth/oauth2-client';

// Create a client with client credentials
const client = createOAuth2Client({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  scope: 'api.products.read api.video.read',
});

// Make authenticated requests
const products = await client.get('/api/products');
```

### Authorization Code Flow

For user authentication in web applications:

1. Redirect the user to the authorization URL:

```typescript
// Generate login URL for user authentication
const clientId = 'your-client-id';
const redirectUri = 'https://your-app.com/callback';
const scope = 'api.products.read api.video.read';
const state = generateRandomState();

const authUrl = `https://oauth.aixtiv-api.us-west1.run.app/authorize?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `state=${state}&` +
  `scope=${encodeURIComponent(scope)}`;

// Redirect user to authUrl
```

2. Handle the callback after authorization:

```typescript
// In your callback handler
async function handleCallback(code, state) {
  // Verify state matches stored state
  
  // Exchange code for token
  const tokenResponse = await axios.post(
    'https://oauth.aixtiv-api.us-west1.run.app/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: 'your-client-id',
      client_secret: 'your-client-secret',
      redirect_uri: 'https://your-app.com/callback',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  
  // Store tokens
  const { access_token, refresh_token, expires_in } = tokenResponse.data;
  
  // Create client with user tokens
  const client = createOAuth2Client();
  client.setTokens(access_token, refresh_token, expires_in);
  
  return client;
}
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `SESSION_SECRET` - Secret for session cookies
- `CORS_ORIGIN` - CORS origin setting (default: '*')
- `OAUTH_CLIENT_ID` - Default OAuth client ID
- `OAUTH_CLIENT_SECRET` - Default OAuth client secret
- `OAUTH_TOKEN_ENDPOINT` - OAuth token endpoint
- `OAUTH_AUTH_ENDPOINT` - OAuth authorization endpoint
- `OAUTH_USERINFO_ENDPOINT` - OAuth user info endpoint
- `OAUTH_REDIRECT_URI` - Default OAuth redirect URI
- `OAUTH_SCOPE` - Default OAuth scope

## Development

### Installation

```bash
npm install
```

### Running the server

```bash
npm run dev
```

### Building for production

```bash
npm run build
npm start
```

## License

Aixtiv Symphony Core Services © 2025