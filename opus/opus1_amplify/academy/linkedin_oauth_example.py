import os
from dotenv import load_dotenv
from urllib.parse import urlencode

load_dotenv()  # Load environment variables from a .env file

# Retrieve LinkedIn client ID and secret from environment variables
LINKEDIN_CLIENT_ID = os.getenv('DR_MEMORIA_7712fless1o4r9')
LINKEDIN_CLIENT_SECRET = os.getenv('DR_MEMORIA_WPL_AP1.PJHWxRTpIaCnoBkj.1kc+BA==')
REDIRECT_URI = "https://api-for-warp-drive.appspot.com/auth/dr-memoria/callback"

def get_linkedin_oauth_url():
    """
    Constructs the LinkedIn OAuth authorization URL.

    Returns:
        str: LinkedIn authorization URL
    """
    params = {
        'response_type': 'code',
        'client_id': LINKEDIN_CLIENT_ID,
        'redirect_uri': REDIRECT_URI,
        'scope': 'r_liteprofile r_emailaddress w_member_social r_organization_social',
        'state': 'random_generated_state'
    }
    return f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"

if __name__ == "__main__":
    auth_url = get_linkedin_oauth_url()
    print(f"Visit this URL to authorize the application: {auth_url}")

