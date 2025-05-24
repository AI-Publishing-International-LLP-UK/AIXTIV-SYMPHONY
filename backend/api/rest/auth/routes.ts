/**
 * OAuth2 Authentication Routes
 * Provides endpoints for OAuth2 authentication flow
 */

import express from 'express';
import crypto from 'crypto';
import { oauth2Service } from './oauth2-service';

const router = express.Router();

/**
 * @route   GET /auth/login
 * @desc    Redirects to the OAuth2 authorization page
 * @access  Public
 */
router.get('/login', (req, res) => {
  // Generate a state token to prevent CSRF
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;

  // Redirect to authorization endpoint
  const authUrl = oauth2Service.generateAuthorizationUrl(state);
  res.redirect(authUrl);
});

/**
 * @route   GET /auth/callback
 * @desc    Handles the OAuth2 callback after user authorization
 * @access  Public
 */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Verify state parameter for CSRF protection
  if (!state || !req.session.oauthState || req.session.oauthState !== state) {
    return res.status(403).send('Invalid state parameter');
  }

  // Clear oauth state from session
  delete req.session.oauthState;

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await oauth2Service.exchangeCodeForToken(code as string);
    
    // Store tokens in session
    req.session.accessToken = tokenResponse.access_token;
    req.session.refreshToken = tokenResponse.refresh_token;
    req.session.tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000);

    // Redirect to success page or dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect('/login?error=auth_failed');
  }
});

/**
 * @route   GET /auth/refresh
 * @desc    Refreshes an expired access token
 * @access  Private
 */
router.get('/refresh', async (req, res) => {
  const refreshToken = req.session.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available' });
  }

  try {
    const tokenResponse = await oauth2Service.refreshToken(refreshToken);
    
    // Update tokens in session
    req.session.accessToken = tokenResponse.access_token;
    
    // Update refresh token if a new one was provided
    if (tokenResponse.refresh_token) {
      req.session.refreshToken = tokenResponse.refresh_token;
    }
    
    req.session.tokenExpiresAt = Date.now() + (tokenResponse.expires_in * 1000);

    res.json({ success: true, expiresIn: tokenResponse.expires_in });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(400).json({ error: 'Failed to refresh token' });
  }
});

/**
 * @route   GET /auth/logout
 * @desc    Logs out the user by clearing the session
 * @access  Private
 */
router.get('/logout', (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

/**
 * @route   GET /auth/token
 * @desc    Returns information about the current access token
 * @access  Private
 */
router.get('/token', (req, res) => {
  const accessToken = req.session.accessToken;
  const tokenExpiresAt = req.session.tokenExpiresAt;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const tokenPayload = oauth2Service.validateToken(accessToken);
  if (!tokenPayload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Calculate remaining time
  const expiresIn = tokenExpiresAt ? Math.max(0, Math.floor((tokenExpiresAt - Date.now()) / 1000)) : 0;

  res.json({
    valid: true,
    subject: tokenPayload.sub,
    scopes: tokenPayload.scope ? tokenPayload.scope.split(' ') : [],
    expiresIn,
  });
});

export default router;