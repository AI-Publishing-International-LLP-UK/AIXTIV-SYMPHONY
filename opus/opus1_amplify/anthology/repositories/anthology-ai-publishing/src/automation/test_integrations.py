import unittest
import logging
from integrations_gateway import IntegrationsGateway

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestIntegrationsGateway(unittest.TestCase):
    def setUp(self):
        """Initialize the integration gateway and configure test logging"""
        self.gateway = IntegrationsGateway()
        self.service_account = "drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com"
        
    def test_agent_reauthentication(self):
        """Test reauthentication of all integrated agents"""
        try:
            # Attempt to reauthenticate all agents
            auth_results = self.gateway.reauthenticate_all_agents()
            
            # Log the results
            logger.info("Authentication Results:")
            logger.info("-" * 50)
            
            # Verify LinkedIn Dr Match
            self.assertTrue(
                auth_results["linkedin_dr_match"]["success"],
                "LinkedIn Dr Match authentication failed"
            )
            logger.info("LinkedIn Dr Match Status: %s", 
                auth_results["linkedin_dr_match"]["status"])
            
            # Verify GitHub DRLucyAutomation
            self.assertTrue(
                auth_results["github_dr_lucy"]["success"],
                "GitHub DRLucyAutomation authentication failed"
            )
            logger.info("GitHub DRLucyAutomation Status: %s",
                auth_results["github_dr_lucy"]["status"])
            
            # Verify Super Claude 3
            self.assertTrue(
                auth_results["super_claude"]["success"],
                "Super Claude 3 authentication failed"
            )
            logger.info("Super Claude 3 Status: %s",
                auth_results["super_claude"]["status"])
            
            # Verify all integrations are active
            integration_status = self.gateway.get_integration_status()
            self.assertTrue(
                all(integration_status.values()),
                "Not all integrations are active"
            )
            
        except Exception as e:
            logger.error("Authentication test failed: %s", str(e))
            raise
            
    def test_service_account_auth(self):
        """Test service account authentication"""
        try:
            auth_status = self.gateway.authenticate_service_account(
                self.service_account
            )
            self.assertTrue(
                auth_status["success"],
                f"Service account authentication failed: {auth_status['message']}"
            )
            logger.info("Service Account Status: %s", auth_status["status"])
            
        except Exception as e:
            logger.error("Service account test failed: %s", str(e))
            raise
            
if __name__ == "__main__":
    unittest.main()

