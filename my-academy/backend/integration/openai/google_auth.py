#!/usr/bin/env python3
"""
Google service account authentication module for OpenAI API calls.

This module provides utilities to authenticate with OpenAI using Google service accounts.
It handles loading service account keys, generating OAuth tokens, and creating
authenticated headers for API requests.
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, Optional, Any

# These libraries need to be installed via pip
try:
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request
    import requests
except ImportError:
    logging.error("Required libraries not installed. Run: pip install google-auth requests")
    raise

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_KEY_ENV_VAR = "GOOGLE_SERVICE_ACCOUNT_KEY_PATH"
DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))))), "config", "integration.json")

class GoogleAuthError(Exception):
    """Exception raised for errors in the Google authentication process."""
    pass

def load_service_account_key(key_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load the Google service account key from the specified path.
    
    Args:
        key_path: Path to the service account key JSON file. If not provided,
                 will try to get it from environment variable or config file.
    
    Returns:
        Dict containing the service account key data
    
    Raises:
        GoogleAuthError: If key file cannot be loaded or is invalid
    """
    # Try to get key path from parameter
    if not key_path:
        # Try environment variable
        key_path = os.environ.get(DEFAULT_KEY_ENV_VAR)
        
        # If not in environment, try config file
        if not key_path and os.path.exists(DEFAULT_CONFIG_PATH):
            try:
                with open(DEFAULT_CONFIG_PATH, 'r') as f:
                    config = json.load(f)
                key_path = config.get('services', {}).get('openAI', {}).get('googleServiceAccountKeyPath')
            except Exception as e:
                logger.warning(f"Failed to load config file: {e}")
    
    if not key_path:
        raise GoogleAuthError(
            f"Service account key path not provided. Set {DEFAULT_KEY_ENV_VAR} "
            f"environment variable or configure it in the integration config file."
        )
    
    # Resolve path and check if file exists
    key_path = os.path.expanduser(key_path)
    if not os.path.exists(key_path):
        raise GoogleAuthError(f"Service account key file does not exist: {key_path}")
    
    try:
        with open(key_path, 'r') as f:
            key_data = json.load(f)
        return key_data
    except json.JSONDecodeError:
        raise GoogleAuthError(f"Invalid JSON in service account key file: {key_path}")
    except IOError as e:
        raise GoogleAuthError(f"Failed to read service account key file: {e}")

def generate_oauth_token(key_data: Optional[Dict[str, Any]] = None,
                          key_path: Optional[str] = None,
                          scopes: Optional[list] = None) -> str:
    """
    Generate a Google OAuth token using the service account.
    
    Args:
        key_data: Service account key data dictionary. If not provided, will try to load from key_path.
        key_path: Path to the service account key file. Only used if key_data is not provided.
        scopes: OAuth scopes to request. Defaults to OAuth2 token.
        
    Returns:
        str: The generated OAuth token
        
    Raises:
        GoogleAuthError: If token generation fails
    """
    if scopes is None:
        scopes = ['https://www.googleapis.com/auth/cloud-platform']
    
    try:
        if key_data is None:
            key_data = load_service_account_key(key_path)
        
        credentials = service_account.Credentials.from_service_account_info(
            key_data, 
            scopes=scopes
        )
        
        # Force token refresh
        credentials.refresh(Request())
        return credentials.token
    except Exception as e:
        raise GoogleAuthError(f"Failed to generate OAuth token: {e}")

def get_openai_headers(key_data: Optional[Dict[str, Any]] = None, 
                       key_path: Optional[str] = None) -> Dict[str, str]:
    """
    Create authenticated headers for OpenAI API calls using Google service account.
    
    Args:
        key_data: Service account key data. If not provided, will attempt to load from key_path.
        key_path: Path to service account key file. Only used if key_data is not provided.
        
    Returns:
        Dict containing the headers needed for authenticated OpenAI API calls
        
    Raises:
        GoogleAuthError: If header creation fails
    """
    try:
        token = generate_oauth_token(key_data, key_path)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    except Exception as e:
        raise GoogleAuthError(f"Failed to create OpenAI headers: {e}")

def verify_authentication(key_data: Optional[Dict[str, Any]] = None,
                         key_path: Optional[str] = None) -> bool:
    """
    Verify that authentication is working by making a test API call.
    
    Args:
        key_data: Service account key data. If not provided, will attempt to load from key_path.
        key_path: Path to service account key file.
        
    Returns:
        bool: True if authentication is successful, False otherwise
    """
    try:
        headers = get_openai_headers(key_data, key_path)
        response = requests.get(
            "https://api.openai.com/v1/models",
            headers=headers
        )
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Authentication verification failed: {e}")
        return False

if __name__ == "__main__":
    # Simple test to verify the module works when run directly
    try:
        # Try to load key from environment or config
        key_data = load_service_account_key()
        
        # Get headers and print them (with token value masked)
        headers = get_openai_headers(key_data)
        token = headers.get("Authorization", "")
        if token and len(token) > 15:
            masked_token = f"{token[:10]}...{token[-5:]}"
            headers["Authorization"] = masked_token
        
        print("Successfully generated headers:")
        print(json.dumps(headers, indent=2))
        
        # Verify authentication
        if verify_authentication(key_data):
            print("✅ Authentication verification successful")
        else:
            print("❌ Authentication verification failed")
    except Exception as e:
        logging.error(f"Test failed: {e}")

