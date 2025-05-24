import os
import logging
from dotenv import load_dotenv
from integrations_gateway import IntegrationsGateway

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_credentials():
    required_vars = ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_SECONDARY_SECRET']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return False
        
    logger.info("All required LinkedIn credentials are present")
    # Log presence without values
    logger.debug("Client ID length: %d", len(os.getenv('LINKEDIN_CLIENT_ID', '')))
    logger.debug("Client Secret length: %d", len(os.getenv('LINKEDIN_CLIENT_SECRET', '')))
    logger.debug("Secondary Secret length: %d", len(os.getenv('LINKEDIN_SECONDARY_SECRET', '')))
    return True

def main():
    try:
        load_dotenv()
        logger.info("Starting LinkedIn integration process")
        
        if not verify_credentials():
            logger.error("Failed to verify LinkedIn credentials")
            return False
            
        logger.info("Initializing IntegrationsGateway")
        gateway = IntegrationsGateway()
        
        logger.info("Attempting LinkedIn reauthentication")
        linkedin_status = gateway.linkedin.reauthenticate()
        
        logger.info(f"LinkedIn Dr Match Authentication Status: {linkedin_status}")
        return linkedin_status
        
    except Exception as e:
        logger.error(f"Error during LinkedIn integration: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    main()

