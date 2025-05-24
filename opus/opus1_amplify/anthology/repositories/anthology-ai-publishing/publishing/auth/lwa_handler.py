from google.cloud import secretmanager
import requests
import yaml
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from cryptography.fernet import Fernet
import os

class LwaAuthManager:
    def __init__(self, config_path=None):
        self.config_path = config_path or Path(__file__).parent / 'lwa_config.yaml'
        self._load_config()
        self._init_encryption()
        self.token = None
        self.token_expiry = None
        
    def _load_config(self):
        """Load LwA configuration"""
        with open(self.config_path) as f:
            self.config = yaml.safe_load(f)
            
        self.client_id = self.config['lwa']['client']['id']
        self.client_secret = self.config['lwa']['client']['secret']
        self.auth_endpoint = self.config['lwa']['auth_endpoint']
        
    def _init_encryption(self):
        """Initialize encryption for token storage"""
        key = Fernet.generate_key()
        self.cipher_suite = Fernet(key)
        
    def authenticate(self):
        """Perform LwA authentication"""
        if self._is_token_valid():
            return self.token
            
        return self._get_new_token()
        
    def _is_token_valid(self):
        """Check if current token is valid"""
        if not self.token or not self.token_expiry:
            return False
            
        # Add configured refresh window
        refresh_window = self.config['lwa']['security']['refresh_window']
        return datetime.now() < (self.token_expiry - timedelta(seconds=refresh_window))
        
    def _get_new_token(self):
        """Get new OAuth2 token"""
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': ' '.join(self.config['lwa']['client']['scopes'])
        }
        
        response = requests.post(self.auth_endpoint, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.token = token_data['access_token']
        self.token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'])
        
        self._store_token(token_data)
        return self.token
        
    def _store_token(self, token_data):
        """Securely store token data"""
        if self.config['lwa']['security']['token_storage'] == 'SECURE_ENCLAVE':
            encrypted_data = self.cipher_suite.encrypt(json.dumps(token_data).encode())
            
            # Store in secure location
            token_path = Path.home() / '.anthology' / 'tokens'
            token_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(token_path / 'lwa_token.enc', 'wb') as f:
                f.write(encrypted_data)
                
    def _load_stored_token(self):
        """Load stored token data"""
        token_path = Path.home() / '.anthology' / 'tokens' / 'lwa_token.enc'
        if not token_path.exists():
            return None
            
        with open(token_path, 'rb') as f:
            encrypted_data = f.read()
            
        try:
            token_data = json.loads(self.cipher_suite.decrypt(encrypted_data).decode())
            
            # Check if token is still valid
            expiry = datetime.fromtimestamp(token_data['created_at'] + token_data['expires_in'])
            if datetime.now() < expiry:
                self.token = token_data['access_token']
                self.token_expiry = expiry
                return self.token
                
        except Exception:
            return None
            
    def get_auth_headers(self):
        """Get authentication headers"""
        token = self.authenticate()
        
        return {
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
    def get_user_profile(self):
        """Get LwA user profile data"""
        headers = self.get_auth_headers()
        response = requests.get(
            self.config['lwa']['profile_endpoint'],
            headers=headers
        )
        
        response.raise_for_status()
        return response.json()

def main():
    auth = LwaAuthManager()
    headers = auth.get_auth_headers()
    profile = auth.get_user_profile()
    print("Auth successful!")
    print("User profile:", json.dumps(profile, indent=2))

if __name__ == "__main__":
    main()