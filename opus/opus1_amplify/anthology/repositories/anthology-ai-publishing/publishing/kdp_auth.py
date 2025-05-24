from google.cloud import secretmanager
import requests
import yaml
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

class KDPAuthManager:
    def __init__(self, project_id="api-for-warp-drive"):
        self.project_id = project_id
        self._load_config()
        self.token = None
        self.token_expiry = None
        
    def _load_config(self):
        """Load OAuth2 configuration"""
        config_path = Path(__file__).parent / 'config' / 'kdp_auth.yaml'
        with open(config_path) as f:
            self.config = yaml.safe_load(f)
            
        self.client_id = self.config['oauth2']['client_id']
        self.client_secret = self.config['oauth2']['client_secret']
        self.auth_url = self.config['oauth2']['auth_url']
        
    def get_auth_token(self):
        """Get valid authentication token"""
        if self._is_token_valid():
            return self.token
            
        return self._refresh_token()
        
    def _is_token_valid(self):
        """Check if current token is valid"""
        if not self.token or not self.token_expiry:
            return False
            
        # Add 5 minute buffer
        return datetime.now() < (self.token_expiry - timedelta(minutes=5))
        
    def _refresh_token(self):
        """Get new OAuth2 token"""
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': ' '.join(self.config['oauth2']['scopes'])
        }
        
        response = requests.post(self.auth_url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.token = token_data['access_token']
        self.token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'])
        
        return self.token
        
    def get_auth_headers(self):
        """Get authentication headers for API requests"""
        token = self.get_auth_token()
        
        return {
            'Authorization': f"Bearer {token}",
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Amz-Access-Token': token,
            'X-Amz-Account-Id': self.config['account']['id']
        }
        
def main():
    auth = KDPAuthManager()
    headers = auth.get_auth_headers()
    print("Auth headers generated:", json.dumps(headers, indent=2))

if __name__ == "__main__":
    main()