"""
OpenAI API client with Google Service Account authentication.

This module provides a convenient interface for making authenticated calls to the OpenAI API
using Google Service Account credentials. It exposes a Client class that handles common 
operations like completions and embeddings.
"""

import json
import logging
import os
from typing import Dict, List, Optional, Union, Any

import requests

from .google_auth import (
    load_service_account_key,
    generate_google_oauth_token,
    get_authenticated_headers
)

logger = logging.getLogger(__name__)

class ConfigurationError(Exception):
    """Raised when there's an issue with the configuration."""
    pass

class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass

class APIError(Exception):
    """Raised when the OpenAI API returns an error."""
    pass

class Client:
    """
    Client for interacting with OpenAI API using Google Service Account authentication.
    
    This client handles authentication and provides methods for common OpenAI API operations.
    """
    
    BASE_URL = "https://api.openai.com/v1"
    
    def __init__(self, config_path: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize the OpenAI client.
        
        Args:
            config_path: Path to the configuration file. If not provided, will look for
                        the path in the OPENAI_CONFIG_PATH environment variable or
                        default to 'config/integration.json'.
            api_key: OpenAI API key. If provided, direct API key authentication will be used
                    instead of Google service account authentication.
        """
        self.config_path = config_path or os.environ.get('OPENAI_CONFIG_PATH', 'config/integration.json')
        self.api_key = api_key
        self.config = self._load_config()
        self.service_account_key = None
        
        if not self.api_key:
            # Only load service account key if not using direct API key
            self.service_account_key = self._load_service_account_key()
    
    def _load_config(self) -> Dict:
        """Load configuration from the config file."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            
            if 'services' not in config or 'openAI' not in config['services']:
                raise ConfigurationError("OpenAI configuration not found in config file")
            
            return config['services']['openAI']
        except FileNotFoundError:
            logger.warning(f"Configuration file not found at {self.config_path}. Using default values.")
            return {}
        except json.JSONDecodeError:
            raise ConfigurationError(f"Invalid JSON in configuration file {self.config_path}")
    
    def _load_service_account_key(self) -> Dict:
        """Load the Google service account key."""
        key_path = self.config.get('serviceAccountKeyPath')
        if not key_path:
            raise ConfigurationError("Service account key path not specified in configuration")
        
        return load_service_account_key(key_path)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authenticated headers for OpenAI API requests."""
        if self.api_key:
            # Use direct API key authentication if provided
            return {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
        else:
            # Use Google service account authentication
            return get_authenticated_headers(self.service_account_key)
    
    def completions(self, 
                    model: str, 
                    messages: List[Dict[str, str]], 
                    temperature: float = 0.7, 
                    max_tokens: Optional[int] = None, 
                    **kwargs) -> Dict:
        """
        Create a chat completion with the OpenAI API.
        
        Args:
            model: The model to use (e.g., "gpt-4", "gpt-3.5-turbo")
            messages: A list of message objects (role and content)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional parameters to pass to the API
            
        Returns:
            The API response as a dictionary
            
        Raises:
            APIError: If the API call fails
            AuthenticationError: If authentication fails
        """
        url = f"{self.BASE_URL}/chat/completions"
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            **kwargs
        }
        
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        
        try:
            headers = self._get_headers()
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 401:
                raise AuthenticationError("Authentication to OpenAI API failed")
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error in OpenAI API call: {str(e)}")
            raise APIError(f"OpenAI API call failed: {str(e)}")
    
    def embeddings(self, 
                   model: str, 
                   input_texts: Union[str, List[str]], 
                   **kwargs) -> Dict:
        """
        Create embeddings with the OpenAI API.
        
        Args:
            model: The model to use (e.g., "text-embedding-ada-002")
            input_texts: String or list of strings to embed
            **kwargs: Additional parameters to pass to the API
            
        Returns:
            The API response as a dictionary
            
        Raises:
            APIError: If the API call fails
            AuthenticationError: If authentication fails
        """
        url = f"{self.BASE_URL}/embeddings"
        
        # Ensure input is a list
        if isinstance(input_texts, str):
            input_texts = [input_texts]
        
        payload = {
            "model": model,
            "input": input_texts,
            **kwargs
        }
        
        try:
            headers = self._get_headers()
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 401:
                raise AuthenticationError("Authentication to OpenAI API failed")
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error in OpenAI API call: {str(e)}")
            raise APIError(f"OpenAI API call failed: {str(e)}")

    def get_models(self) -> Dict:
        """
        Get available models from the OpenAI API.
        
        Returns:
            The API response as a dictionary with available models
            
        Raises:
            APIError: If the API call fails
            AuthenticationError: If authentication fails
        """
        url = f"{self.BASE_URL}/models"
        
        try:
            headers = self._get_headers()
            response = requests.get(url, headers=headers)
            
            if response.status_code == 401:
                raise AuthenticationError("Authentication to OpenAI API failed")
            
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error in OpenAI API call: {str(e)}")
            raise APIError(f"OpenAI API call failed: {str(e)}")

# Helper functions for simpler interaction
def create_client(config_path: Optional[str] = None, api_key: Optional[str] = None) -> Client:
    """
    Create a new OpenAI client.
    
    Args:
        config_path: Optional path to the configuration file
        api_key: Optional OpenAI API key for direct authentication
        
    Returns:
        A configured OpenAI Client instance
    """
    return Client(config_path=config_path, api_key=api_key)

def get_completion(prompt: Union[str, List[Dict[str, str]]], 
                  model: str = "gpt-3.5-turbo", 
                  client: Optional[Client] = None,
                  **kwargs) -> str:
    """
    Get a completion from OpenAI in a simpler format.
    
    Args:
        prompt: Either a string prompt or a list of message objects
        model: The model to use
        client: Optional client instance. If not provided, a new one will be created
        **kwargs: Additional parameters to pass to the completions API
        
    Returns:
        The generated text as a string
    """
    client = client or create_client()
    
    # Convert string prompt to messages format if needed
    if isinstance(prompt, str):
        messages = [{"role": "user", "content": prompt}]
    else:
        messages = prompt
    
    response = client.completions(model=model, messages=messages, **kwargs)
    return response["choices"][0]["message"]["content"]

def get_embedding(text: Union[str, List[str]], 
                 model: str = "text-embedding-ada-002", 
                 client: Optional[Client] = None,
                 **kwargs) -> Union[List[float], List[List[float]]]:
    """
    Get embeddings from OpenAI in a simpler format.
    
    Args:
        text: Text to embed (string or list of strings)
        model: The embedding model to use
        client: Optional client instance. If not provided, a new one will be created
        **kwargs: Additional parameters to pass to the embeddings API
        
    Returns:
        The embeddings as a list of floats (for single input) or list of lists of floats (for multiple inputs)
    """
    client = client or create_client()
    
    response = client.embeddings(model=model, input_texts=text, **kwargs)
    
    # Extract embeddings
    embeddings = [item["embedding"] for item in response["data"]]
    
    # Return single embedding if only one was requested
    if isinstance(text, str):
        return embeddings[0]
    return embeddings

