import logging
import requests
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from typing import Union, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
from dotenv import load_dotenv
import os
from google.oauth2 import service_account
from datetime import datetime, timedelta

@dataclass
class SuperClaude3:
    service_account_email: str = "super-claude@api-for-warp-drive.iam.gserviceaccount.com"
    credentials: Optional[service_account.Credentials] = None
    last_verified: Optional[datetime] = None
    
    def authenticate(self) -> bool:
        try:
            self.credentials = service_account.Credentials.from_service_account_email(
                self.service_account_email
            )
            self.last_verified = datetime.now()
            return True
        except Exception:
            return False
    
    def verify_assistant(self) -> bool:
        if not self.credentials or not self.last_verified:
            return False
        if datetime.now() - self.last_verified > timedelta(hours=24):
            return self.authenticate()
        return True

class LinkedInAuthError(Exception):
    """Base exception for LinkedIn authentication errors."""
    pass

class LinkedInTokenExpiredError(LinkedInAuthError):
    """Exception raised when LinkedIn OAuth token has expired."""
    pass

class LinkedInInvalidCredentialsError(LinkedInAuthError):
    """Exception raised when LinkedIn credentials are invalid."""
    pass

@dataclass
class LinkedInDrMatch:
    def health_check(self) -> bool:
        """Health check method to test LinkedIn Dr. Match app connection"""
        self.logger.info("Performing health check on LinkedIn Dr. Match app")

        if not self._access_token:
            self.logger.warning("No access token available - attempting to reauthenticate")
            if not self.reauthenticate():
                return False
        
        try:
            response = requests.get(
                f"{self.api_endpoint}/health-check",
                headers={"Authorization": f"Bearer {self._access_token}"}
            )
            response.raise_for_status()
            self.logger.info("Health check successful")
            return True
        except requests.exceptions.HTTPError as e:
            self.logger.error(f"HTTP error during health check: {str(e)}")
        except Exception as e:
            self.logger.error(f"Error during health check: {str(e)}")
        
        return False

    client_id: str
    primary_secret: str
    secondary_secret: str
    api_endpoint: str
    match_threshold: float = 0.85
    _access_token: Optional[str] = None
    _token_expiry: Optional[datetime] = None
    
    def __post_init__(self):
        self.logger = logging.getLogger(f"{__name__}.LinkedInDrMatch")
        
    def _refresh_token(self) -> Dict[str, Any]:
        """Internal method to refresh OAuth token."""
        self.logger.debug("Attempting to refresh LinkedIn OAuth token")
        
        try:
            response = requests.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.primary_secret
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise LinkedInInvalidCredentialsError("Invalid LinkedIn credentials")
            raise LinkedInAuthError(f"HTTP error during token refresh: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise LinkedInAuthError(f"Network error during token refresh: {str(e)}")
        
    def reauthenticate(self) -> bool:
        """Refresh LinkedIn OAuth token if expired or missing."""
        try:
            self.logger.info("Starting LinkedIn reauthentication")
            
            # Check if token exists and is still valid
            if (self._access_token and self._token_expiry and 
                self._token_expiry > datetime.now() + timedelta(minutes=5)):
                self.logger.debug("Existing token is still valid")
                return True
                
            # Refresh token
            token_data = self._refresh_token()
            self._access_token = token_data["access_token"]
            expires_in = token_data.get("expires_in", 3600)  # Default 1 hour
            self._token_expiry = datetime.now() + timedelta(seconds=expires_in)
            
            self.logger.info("Successfully refreshed LinkedIn OAuth token")
            return True
            
        except LinkedInInvalidCredentialsError as e:
            self.logger.error(f"Authentication failed - invalid credentials: {str(e)}")
            return False
        except LinkedInAuthError as e:
            self.logger.error(f"Authentication failed: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error during authentication: {str(e)}")
            return False
    
    def validate_match(self, profile_id: str) -> bool:
        """Validate a match using LinkedIn's API."""
        if not self._access_token:
            self.logger.warning("No access token available - attempting to reauthenticate")
            if not self.reauthenticate():
                return False
                
        try:
            self.logger.info(f"Validating match for profile: {profile_id}")
            response = requests.get(
                f"{self.api_endpoint}/validate",
                params={"profile_id": profile_id},
                headers={"Authorization": f"Bearer {self._access_token}"}
            )
            response.raise_for_status()
            
            match_score = response.json().get("match_score", 0)
            is_match = match_score >= self.match_threshold
            
            self.logger.info(f"Match validation complete - Score: {match_score}, Threshold: {self.match_threshold}")
            return is_match
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                self.logger.warning("Token expired during validation - attempting to reauthenticate")
                if self.reauthenticate():
                    return self.validate_match(profile_id)
            self.logger.error(f"HTTP error during match validation: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Error during match validation: {str(e)}")
            return False

class IntegrationStatus(Enum):
    ACTIVE = "active"
    PENDING = "pending" 
    FAILED = "failed"
    BLOCKED = "blocked"
    UNVERIFIED = "unverified"
    VERIFIED = "verified"

@dataclass
class GitHubDRLucy:
    app_id: str
    installation_id: str
    private_key: str
    webhook_secret: str
    
    def verify_automation(self, repo: str) -> bool:
        # Integration with GitHub app API
        return True

class IntegrationsGateway:
    # LinkedIn OAuth configuration
    LINKEDIN_CONFIG = {
        'token_expiration': 5184000,  # 2 months in seconds
        'redirect_urls': [
            'https://coaching2100.com',
            'https://www.linkedin.com/developers/tools/oauth/redirect'
        ],
        'scopes': [
            'openid',
            'profile',
            'w_member_social',
            'email'
        ]
    }
    # Required OAuth scopes for LinkedIn integration

    def __init__(self):
        load_dotenv()
        self.super_claude = SuperClaude3()
        self.linkedin = LinkedInDrMatch(
            client_id=os.getenv('LINKEDIN_CLIENT_ID'),
            primary_secret=os.getenv('LINKEDIN_CLIENT_SECRET'),
            secondary_secret=os.getenv('LINKEDIN_SECONDARY_SECRET'),
            api_endpoint="https://api.linkedin.com/v2/drmatch"
        )
        
        self.dr_lucy = GitHubDRLucy(
            app_id="",
            installation_id="",
            private_key="",
            webhook_secret=""
        )
        
        self.integration_status = {}
        
    def reauthenticate_all_agents(self) -> Dict[str, bool]:
        """Reauthenticate all integration agents and return their status"""
        results = {}
        
        # Reauthenticate Super Claude
        try:
            results["super_claude"] = self.reauth_super_claude()
        except Exception as e:
            results["super_claude"] = False
            print(f"Failed to reauth Super Claude: {str(e)}")
            
        # Reauthenticate LinkedIn
        try:
            results["linkedin"] = self.reauth_linkedin()
        except Exception as e:
            results["linkedin"] = False
            print(f"Failed to reauth LinkedIn: {str(e)}")
            
        # Reauthenticate GitHub
        try:
            results["github"] = self.reauth_github()
        except Exception as e:
            results["github"] = False
            print(f"Failed to reauth GitHub: {str(e)}")
            
        # Update integration status
        for agent, status in results.items():
            self.integration_status[agent] = IntegrationStatus.ACTIVE if status else IntegrationStatus.FAILED
            
        return results
        
    def reauth_super_claude(self) -> bool:
        """Reauthenticate Super Claude AI assistant"""
        return self.super_claude.authenticate()
        
    def reauth_linkedin(self) -> bool:
        """Reauthenticate LinkedIn Dr Match integration with required OAuth scopes"""
        try:
            # Validate auth with required scopes
            match_result = self.dr_match.validate_match("reauth", scopes=self.LINKEDIN_CONFIG['scopes'])
            self.integration_status["linkedin"] = IntegrationStatus.ACTIVE if match_result else IntegrationStatus.FAILED
            return match_result
        except Exception:
            self.integration_status["linkedin"] = IntegrationStatus.FAILED
            return False
            
    def reauth_github(self) -> bool:
        """Reauthenticate GitHub DRLucy automation"""
        try:
            verify_result = self.dr_lucy.verify_automation("reauth")
            self.integration_status["github"] = IntegrationStatus.ACTIVE if verify_result else IntegrationStatus.FAILED
            return verify_result
        except Exception:
            self.integration_status["github"] = IntegrationStatus.FAILED
            return False
        
    def authenticate_linkedin(self, profile_id: str) -> bool:
        """Authenticate with LinkedIn Dr Match integration"""
        try:
            match_result = self.dr_match.validate_match(profile_id)
            self.integration_status["linkedin"] = IntegrationStatus.ACTIVE if match_result else IntegrationStatus.FAILED
            return match_result
        except Exception:
            self.integration_status["linkedin"] = IntegrationStatus.FAILED
            return False
            
    def verify_github_automation(self, repo: str) -> bool:
        """Verify automation with DRLucyAutomation app"""
        try:
            verify_result = self.dr_lucy.verify_automation(repo)
            self.integration_status["github"] = IntegrationStatus.ACTIVE if verify_result else IntegrationStatus.FAILED
            return verify_result
        except Exception:
            self.integration_status["github"] = IntegrationStatus.FAILED
            return False
            
    def get_integration_status(self) -> Dict[str, IntegrationStatus]:
        """Get current status of all integrations"""
        return self.integration_status.copy()

        def verify_ai_assistant(self) -> bool:
            """Verify AI assistant authentication and status"""
            try:
                verify_result = self.super_claude.verify_assistant()
                self.integration_status["super_claude"] = IntegrationStatus.ACTIVE if verify_result else IntegrationStatus.FAILED
                return verify_result
            except Exception:
                self.integration_status["super_claude"] = IntegrationStatus.FAILED
                return False
