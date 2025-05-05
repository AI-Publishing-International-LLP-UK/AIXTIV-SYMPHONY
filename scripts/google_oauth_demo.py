#!/usr/bin/env python3
"""
Google OAuth 2.0 Demo for Web Server Applications

This script demonstrates how to implement OAuth 2.0 authentication flow
for web server applications that need to access Google APIs.

For Aixtiv Symphony, this is useful for:
- Accessing Google Cloud APIs
- Integrating with Google Workspace
- Authenticating users with Google accounts

Prerequisites:
1. OAuth 2.0 client credentials (client_id and client_secret) from Google API Console
2. Required Python packages: google-auth, google-auth-oauthlib, google-api-python-client

To create OAuth credentials:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth client ID credentials (select "Web application" type)
3. Add authorized redirect URIs (e.g., http://localhost:8090/oauth2callback)
4. Download the client secrets JSON file
"""

import os
import sys
import json
import logging
import flask
import requests
from pathlib import Path

# Google API libraries
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask app for handling OAuth redirects
app = flask.Flask(__name__)

# Configuration
CLIENT_SECRETS_FILE = 'client_secret.json'  # Downloaded from Google API Console
SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',  # For GCP resources
    'https://www.googleapis.com/auth/drive.readonly',  # Example: read-only access to Drive
]
API_SERVICE_NAME = 'drive'  # Example: using Drive API
API_VERSION = 'v3'
REDIRECT_URI = 'http://localhost:8090/oauth2callback'
TOKEN_FILE = 'token.json'  # File to store the user's access and refresh tokens


@app.route('/')
def index():
    """
    Initial route that starts the OAuth 2.0 flow by redirecting the user
    to the Google authorization server.
    """
    return (
        '<h1>Google OAuth 2.0 Demo for Aixtiv Symphony</h1>'
        '<p>This application demonstrates the OAuth 2.0 authorization flow for web server applications.</p>'
        '<a href="/authorize"><button>Start OAuth Flow</button></a>'
    )


@app.route('/authorize')
def authorize():
    """
    Initiates the OAuth 2.0 authorization flow by redirecting the user to
    the Google authorization server.
    
    This is Step 2 in the basic OAuth 2.0 flow: "Obtain an access token from
    the Google Authorization Server."
    """
    try:
        # Create a flow instance from client secrets file
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )
        
        # Generate authorization URL
        authorization_url, state = flow.authorization_url(
            # Enable offline access so we can get a refresh token
            access_type='offline',
            # Enable incremental authorization
            include_granted_scopes='true',
            # Prompt the user for consent every time
            # Remove this if you want to re-use previously granted permissions
            prompt='consent'
        )
        
        # Store the state for CSRF protection
        flask.session['state'] = state
        
        # Redirect the user to the authorization URL
        logger.info(f"Redirecting user to Google authorization URL")
        return flask.redirect(authorization_url)
        
    except Exception as e:
        logger.error(f"Error in authorization flow: {e}")
        return flask.jsonify(error=str(e)), 500


@app.route('/oauth2callback')
def oauth2callback():
    """
    OAuth 2.0 redirect URI handler.
    
    This is the route that Google redirects to after the user grants or denies permission.
    """
    try:
        # Retrieve the state from the session
        state = flask.session.get('state', None)
        
        # Create a flow instance from client secrets file with the stored state
        flow = Flow.from_client_secrets_file(
            CLIENT_SECRETS_FILE,
            scopes=SCOPES,
            state=state,
            redirect_uri=REDIRECT_URI
        )
        
        # Process the authorization response
        flow.fetch_token(authorization_response=flask.request.url)
        
        # Get the credentials
        credentials = flow.credentials
        
        # Save credentials to token file
        save_credentials(credentials)
        
        # Now redirect to the main application
        return flask.redirect('/info')
        
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        return flask.jsonify(error=str(e)), 500


@app.route('/info')
def info():
    """
    Display API information retrieved using the OAuth credentials.
    
    This is Step 4 in the basic OAuth 2.0 flow: "Send the access token to an API."
    """
    if not os.path.exists(TOKEN_FILE):
        return flask.redirect('/authorize')
    
    try:
        # Get stored credentials
        credentials = load_credentials()
        
        # If credentials are expired and we have a refresh token, refresh them
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(requests.Request())
            save_credentials(credentials)
        
        # Build the API client
        service = build(API_SERVICE_NAME, API_VERSION, credentials=credentials)
        
        # Call the API
        files = service.files().list(pageSize=10).execute()
        items = files.get('files', [])
        
        # Format the response
        html = '<h1>Google Drive Files</h1>'
        html += '<p>Successfully authenticated with Google OAuth 2.0!</p>'
        html += '<a href="/revoke"><button>Revoke Access Token</button></a><br><br>'
        
        if not items:
            html += '<p>No files found.</p>'
        else:
            html += '<ul>'
            for item in items:
                html += f'<li>{item["name"]} ({item["id"]})</li>'
            html += '</ul>'
        
        return html
        
    except Exception as e:
        logger.error(f"Error retrieving file info: {e}")
        return flask.jsonify(error=str(e)), 500


@app.route('/revoke')
def revoke():
    """
    Revokes the current user's access token.
    
    This demonstrates how to allow a user to revoke access to your application.
    """
    if not os.path.exists(TOKEN_FILE):
        return flask.redirect('/')
    
    try:
        # Get stored credentials
        credentials = load_credentials()
        
        # Revoke the token
        revoke_url = f'https://oauth2.googleapis.com/revoke'
        params = {'token': credentials.token}
        response = requests.post(revoke_url, params=params)
        
        # Remove the token file
        os.remove(TOKEN_FILE)
        
        # Clear the session
        flask.session.clear()
        
        return (
            '<h1>Access Revoked</h1>'
            '<p>Your access token has been revoked and removed from this application.</p>'
            '<a href="/"><button>Back to Home</button></a>'
        )
        
    except Exception as e:
        logger.error(f"Error revoking token: {e}")
        return flask.jsonify(error=str(e)), 500


def save_credentials(credentials):
    """
    Save OAuth 2.0 credentials to a token file.
    
    Args:
        credentials: The OAuth 2.0 credentials to save.
    """
    token_data = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
    
    with open(TOKEN_FILE, 'w') as token_file:
        json.dump(token_data, token_file)
    
    logger.info(f"Credentials saved to {TOKEN_FILE}")


def load_credentials():
    """
    Load OAuth 2.0 credentials from a token file.
    
    Returns:
        The OAuth 2.0 credentials loaded from the token file.
    """
    with open(TOKEN_FILE, 'r') as token_file:
        token_data = json.load(token_file)
    
    return Credentials(
        token=token_data['token'],
        refresh_token=token_data['refresh_token'],
        token_uri=token_data['token_uri'],
        client_id=token_data['client_id'],
        client_secret=token_data['client_secret'],
        scopes=token_data['scopes']
    )


def check_client_secrets_file():
    """
    Check if the client secrets file exists.
    
    Returns:
        bool: True if the file exists, False otherwise.
    """
    if not os.path.exists(CLIENT_SECRETS_FILE):
        logger.error(
            f"Error: {CLIENT_SECRETS_FILE} not found. "
            "Please download this file from the Google API Console "
            "and place it in the same directory as this script."
        )
        return False
    return True


def main():
    """
    Main function to run the Flask web server.
    """
    # Check if client secrets file exists
    if not check_client_secrets_file():
        sys.exit(1)
    
    # Set Flask secret key for session management
    app.secret_key = os.urandom(24)
    
    # Run the Flask web server
    logger.info("Starting Flask web server...")
    logger.info(f"Please navigate to http://localhost:8090 in your web browser")
    app.run(host='localhost', port=8090, debug=True)


if __name__ == '__main__':
    main()
