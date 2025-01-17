import os
from google.cloud import storage
from google.cloud import bigquery
from google.cloud import aiplatform

def init_vision_lake():
    """Initialize Vision Lake connection for notebooks"""
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'api-for-warp-drive')
    location = os.getenv('GOOGLE_CLOUD_REGION', 'us-west1')
    
    # Initialize Vision Lake clients
    storage_client = storage.Client(project=project_id)
    bq_client = bigquery.Client(project=project_id)
    aiplatform.init(project=project_id, location=location)
    
    return {
        'storage': storage_client,
        'bigquery': bq_client,
        'aiplatform': aiplatform
    }

def get_vision_lake_bucket():
    """Get the main Vision Lake bucket"""
    storage_client = storage.Client()
    return storage_client.bucket('vision-lake-main')

def query_vision_lake(query):
    """Execute BigQuery query against Vision Lake data"""
    client = bigquery.Client()
    return client.query(query).result()
