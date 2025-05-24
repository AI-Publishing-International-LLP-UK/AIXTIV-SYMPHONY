import pytest
import os

@pytest.fixture
def gcp_credentials():
    """Provide GCP credentials for testing"""
    return {
        'project_id': 'test-project',
        'region': 'us-west1'
    }

@pytest.fixture
def test_config():
    """Provide test configuration"""
    return {
        'api_endpoint': 'http://localhost:8080',
        'test_mode': True
    }