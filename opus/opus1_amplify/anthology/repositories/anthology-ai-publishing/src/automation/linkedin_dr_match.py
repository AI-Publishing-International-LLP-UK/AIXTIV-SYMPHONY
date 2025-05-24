import os
import json
import logging
from dataclasses import dataclass
from typing import Optional, Dict
from urllib.parse import urlencode
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LinkedInDrMatch:
    client_id: str
    client_secret: str
    redirect_uri: str = "http://localhost:8000/callback"
    access_token: Optional[str] = None
    scopes: str = "r_liteprofile r_emailaddress w_member_social"
    
    def __init__(self):
        load_dotenv()
        self.client_id = os.getenv('LINKEDIN_CLIENT_ID', '')
        self.client_secret = os.getenv('LINKEDIN_CLIENT_SECRET', '')
        if not self.client_id or not self.client_secret:
            raise ValueError("LinkedIn credentials not found in environment variables")
    
    def get_authorization_url(self) -> str:
        """Generate the authorization URL for OAuth flow"""
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': self.scopes,
            'state': 'random_state_string'  # In production, use a secure random string
        }
        return f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    
    def authenticate(self, auth_code: str) -> bool:
        """Complete OAuth authentication with the provided code"""
        try:
            token_url = "https://www.linkedin.com/oauth/v2/accessToken"
            data = {
                'grant_type': 'authorization_code',
                'code': auth_code,
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'redirect_uri': self.redirect_uri
            }
            
            response = requests.post(token_url, data=data)
            if response.status_code == 200:
                self.access_token = response.json().get('access_token')
                logger.info("Successfully authenticated with LinkedIn")
                return True
            else:
                logger.error(f"Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return False
    
    def get_profile(self) -> Dict:
        """Get the user's LinkedIn profile information"""
        if not self.access_token:
            raise ValueError("Not authenticated")
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            response = requests.get(
                'https://api.linkedin.com/v2/me',
                headers=headers
            )
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching profile: {str(e)}")
            return {}
    
    def create_post(self, text: str) -> bool:
        """Create a post on LinkedIn"""
        if not self.access_token:
            raise ValueError("Not authenticated")
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            
            post_data = {
                "author": f"urn:li:person:{self.get_profile().get('id')}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": text
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            response = requests.post(
                'https://api.linkedin.com/v2/ugcPosts',
                headers=headers,
                json=post_data
            )
            
            if response.status_code in (200, 201):
                logger.info("Successfully created LinkedIn post")
                return True
            else:
                logger.error(f"Failed to create post: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error creating post: {str(e)}")
            return False
    
    def is_connected(self) -> bool:
        """Check if we have a valid connection"""
        if not self.access_token:
            return False
            
        try:
            profile = self.get_profile()
            return bool(profile.get('id'))
        except:
            return False

def main():
    try:
        linkedin = LinkedInDrMatch()
        
        # Print the authorization URL (you'll need to visit this in a browser)
        auth_url = linkedin.get_authorization_url()
        print(f"\nPlease visit this URL to authorize the application:")
        print(auth_url)
        
        # Get the authorization code from user input
        auth_code = input("\nEnter the authorization code from the callback URL: ")
        
        # Authenticate with the code
        if linkedin.authenticate(auth_code):
            print("\nSuccessfully connected to LinkedIn!")
            
            # Get and display profile information
            profile = linkedin.get_profile()
            print(f"\nProfile information:")
            print(json.dumps(profile, indent=2))
            
            # Create a test post if desired
            should_post = input("\nWould you like to create a test post? (y/n): ")
            if should_post.lower() == 'y':
                post_text = input("Enter your post text: ")
                if linkedin.create_post(post_text):
                    print("Post created successfully!")
                else:
                    print("Failed to create post.")
        else:
            print("Failed to connect to LinkedIn")
            
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()
