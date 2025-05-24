/**
 * REST API Client Example
 * Demonstrates how to use the OAuth2 authentication with the API
 */

import { OAuth2Client, createOAuth2Client } from '../auth/oauth2-client';

/**
 * Example of using the OAuth2 client for authenticated API requests
 */
async function exampleApiUsage() {
  try {
    // Initialize OAuth2 client with service credentials
    const client = createOAuth2Client({
      baseURL: 'https://api-for-warp-drive.us-west1.run.app',
      clientId: 'example-client',
      clientSecret: 'example-secret',
      scope: 'api.products.read api.video.read api.speech.read',
    });

    console.log('Authenticating with OAuth2...');
    
    // Get product catalog example
    try {
      console.log('\nFetching product catalog:');
      const productResponse = await client.get('/api/products');
      console.log(`Retrieved ${productResponse.data.length} products`);
      console.log(`First product: ${productResponse.data[0].name}`);
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    // Search products example
    try {
      console.log('\nSearching for "memory" products:');
      const searchResponse = await client.get('/api/products/search', {
        params: { q: 'memory' }
      });
      console.log(`Found ${searchResponse.data.length} matching products`);
    } catch (error) {
      console.error('Error searching products:', error);
    }

    // Get supported languages example
    try {
      console.log('\nFetching supported languages:');
      const languagesResponse = await client.get('/api/speech/languages');
      console.log(`Supported ${languagesResponse.data.languages.length} languages`);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
    
    // Create a video room example (requires api.video.write scope)
    try {
      console.log('\nCreating a video room:');
      const roomResponse = await client.post('/api/video/rooms', {
        userId: 'example-user',
        context: {
          sessionName: 'example-session',
          maxParticipants: 5
        }
      });
      console.log(`Created room: ${roomResponse.data.name}`);
      console.log(`Room URL: ${roomResponse.data.url}`);
    } catch (error) {
      console.error('Error creating video room:', error);
      console.log('This operation might have failed due to insufficient scope permissions.');
    }

    // Text-to-speech example (requires api.speech.write scope)
    try {
      console.log('\nConverting text to speech:');
      const ttsResponse = await client.post('/api/speech/tts/base64', {
        text: 'Welcome to the ASOOS API with OAuth2 authentication.',
        languageCode: 'en-US',
        voiceType: 'FEMALE'
      });
      console.log('Text-to-speech conversion successful');
      console.log(`Audio metadata: ${JSON.stringify(ttsResponse.data.metadata)}`);
    } catch (error) {
      console.error('Error converting text to speech:', error);
      console.log('This operation might have failed due to insufficient scope permissions.');
    }

  } catch (error) {
    console.error('OAuth2 authentication error:', error);
  }
}

// Run the example
exampleApiUsage().catch(console.error);

/**
 * Example of handling user authentication flow
 * This would typically be used in a web application
 */
async function exampleUserAuthFlow() {
  // These functions simulate a web application flow
  
  /**
   * Generate login URL for user authentication
   * @returns OAuth2 authorization URL
   */
  function getLoginUrl() {
    const clientId = 'example-client';
    const redirectUri = 'https://example.com/callback';
    const scope = 'api.products.read api.video.read api.speech.read';
    const state = Math.random().toString(36).substring(2);
    
    // Store state in session (simulated)
    console.log(`Storing state "${state}" in session`);
    
    return `https://oauth.aixtiv-api.us-west1.run.app/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`;
  }
  
  /**
   * Handle OAuth callback after user authorization
   * @param code Authorization code from callback URL
   * @param state State parameter from callback URL
   */
  async function handleCallback(code: string, state: string) {
    // Verify state matches stored state (simulated)
    console.log(`Verifying state "${state}" matches session state`);
    
    // Exchange code for token
    console.log(`Exchanging code "${code}" for token`);
    
    // Simulated token response
    const tokenResponse = {
      access_token: 'example-access-token',
      refresh_token: 'example-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600
    };
    
    // Store tokens in session (simulated)
    console.log('Storing tokens in session');
    
    return tokenResponse;
  }
  
  // Example usage
  const loginUrl = getLoginUrl();
  console.log(`\nUser Auth Flow Example - Redirect user to: ${loginUrl}`);
  
  // Simulate callback with authorization code
  console.log('\nSimulating callback after user authorization');
  const callbackResponse = await handleCallback('example-auth-code', 'example-state');
  
  console.log('Authentication successful!');
  console.log(`Access Token: ${callbackResponse.access_token}`);
  console.log(`Token expiry: ${callbackResponse.expires_in} seconds`);
}

// Run the user auth example
exampleUserAuthFlow().catch(console.error);