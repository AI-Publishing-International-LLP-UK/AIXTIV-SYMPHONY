#!/usr/bin/env python3
"""
Claude Embedded Repository Analysis with OAuth2 Authentication

This script:
1. Retrieves OAuth2 credentials from Google Cloud Secret Manager
2. Performs OAuth2 authentication flow with Anthropic
3. Makes an API request to analyze embedded repository management strategies
"""

import os
import json
import base64
import subprocess
import requests
from google.cloud import secretmanager
from anthropic import Anthropic

# Google Cloud project and secret details
PROJECT_ID = "api-for-warp-drive"
SECRET_NAME = "oauth-credentials"
SECRET_VERSION = "latest"

def get_oauth_credentials():
    """Retrieve OAuth credentials from Google Cloud Secret Manager."""
    print("Retrieving OAuth credentials from Google Cloud Secret Manager...")
    
    # Create the Secret Manager client
    client = secretmanager.SecretManagerServiceClient()
    
    # Build the resource name of the secret version
    name = f"projects/{PROJECT_ID}/secrets/{SECRET_NAME}/versions/{SECRET_VERSION}"
    
    try:
        # Access the secret version
        response = client.access_secret_version(request={"name": name})
        
        # Parse the secret data
        payload = response.payload.data.decode("UTF-8")
        credentials = json.loads(payload)
        
        print(f"Successfully retrieved OAuth credentials for {SECRET_NAME}")
        return credentials
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        raise

def get_oauth_token(credentials):
    """
    Exchange OAuth credentials for an access token.
    This implementation uses the client credentials flow.
    """
    print("Obtaining OAuth access token...")
    
    token_url = credentials.get("token_url", "https://auth.anthropic.com/oauth2/token")
    
    # Prepare the token request
    token_data = {
        'grant_type': 'client_credentials',
        'client_id': credentials['client_id'],
        'client_secret': credentials['client_secret'],
        'scope': credentials.get('scope', 'anthropic.claude')
    }
    
    # Make the token request
    response = requests.post(token_url, data=token_data)
    
    if response.status_code != 200:
        print(f"Token request failed: {response.status_code} - {response.text}")
        raise Exception(f"Failed to get access token: {response.text}")
    
    token_info = response.json()
    print(f"Successfully obtained access token (expires in {token_info.get('expires_in', 'unknown')} seconds)")
    
    return token_info['access_token']

def analyze_embedded_repos(access_token):
    """
    Use the Anthropic API with OAuth authentication to analyze embedded repository strategies.
    """
    print("Sending request to Claude for embedded repository analysis...")
    
    # Initialize Anthropic client with OAuth token instead of API key
    client = Anthropic(auth_token=access_token)
    
    # Make the API request
    response = client.messages.create(
        model="claude-3-opus-20240229",
        system="You are an expert in software architecture, DevOps, and repository management with specialized knowledge on monorepo strategies and embedded repository patterns. Provide comprehensive, technically accurate evaluations with practical implementation guidance.",
        max_tokens=4000,
        messages=[
            {
                "role": "user", 
                "content": [
                    {
                        "type": "text",
                        "text": """Evaluate the best approaches for managing embedded repositories in a complex software project, focusing on:

1. Comparison of techniques including:
   - Git submodules
   - Git subtrees
   - Sparse checkout
   - Git LFS for large files
   - Externalized dependencies management
   - Monorepo tooling (Nx, Turborepo, etc.)
   - Workspace packages (yarn/npm workspaces, pnpm)

2. For each approach, analyze:
   - Pros and cons
   - Setup complexity and maintenance overhead
   - Impact on CI/CD pipelines
   - Team collaboration considerations
   - Versioning strategy
   - Performance with large codebases

3. Specific recommendations for:
   - When an embedded repo contains shared libraries
   - When repos have different release cycles
   - Cross-repo change management
   - How to handle conflicts and dependencies

4. Architectural patterns that work best with each strategy

Include code examples for the most recommended approaches, and migration strategies for projects currently using embedded repositories inefficiently."""
                    }
                ]
            }
        ]
    )
    
    return response.content[0].text

def main():
    """Main function to orchestrate the OAuth flow and API request."""
    try:
        # Get OAuth credentials from Secret Manager
        credentials = get_oauth_credentials()
        
        # Exchange credentials for an access token
        access_token = get_oauth_token(credentials)
        
        # Use the access token to analyze embedded repositories
        analysis = analyze_embedded_repos(access_token)
        
        # Print the analysis
        print("\nClaude's Analysis of Embedded Repository Management (OAuth):")
        print("="*80)
        print(analysis)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

