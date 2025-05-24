import os
import json
from google.cloud import secretmanager
from google.cloud import discovery
from googleapiclient.discovery import build

class GoogleCustomSearch:
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.secrets_client = secretmanager.SecretManagerServiceClient()
        self.api_key = self._get_secret('google-custom-search-api-key')
        self.search_engine_id = self._get_secret('google-custom-search-engine-id')
        self.service = self._build_service()