from google.cloud import storage
from google.cloud import aiplatform
from google.oauth2 import service_account
from googleapiclient.discovery import build
import functions_framework
import os
import json
import markdown
import yaml

DRIVE_FOLDER_ID = "1CL3IGKxJcFzs04CWCgfpiUQEP8hOn5Ip"
PROJECT_ID = "api-for-warp-drive"
BUCKET_NAME = "vision-lake-main"

class DocumentProcessor:
    def __init__(self):
        self.storage_client = storage.Client()
        self.bucket = self.storage_client.bucket(BUCKET_NAME)
        self._init_drive_service()
        
    def _init_drive_service(self):
        """Initialize Google Drive API service"""
        credentials = service_account.Credentials.from_service_account_file(
            'service-account.json',
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        self.drive_service = build('drive', 'v3', credentials=credentials)
        
    def process_document(self, file_id):
        """Process single document from Drive"""
        try:
            # Get file metadata
            file = self.drive_service.files().get(
                fileId=file_id, 
                fields='id, name, mimeType, parents'
            ).execute()
            
            # Download content
            content = self.drive_service.files().export(
                fileId=file_id,
                mimeType='text/plain'
            ).execute()
            
            # Process content
            processed_content = self._process_content(content, file)
            
            # Save to Vision Lake
            self._save_to_vision_lake(processed_content, file)
            
            return {
                'status': 'success',
                'file_id': file_id,
                'destination': f"gs://{BUCKET_NAME}/processed/{file['name']}"
            }
            
        except Exception as e:
            print(f"Error processing document {file_id}: {str(e)}")
            return {
                'status': 'error',
                'file_id': file_id,
                'error': str(e)
            }
            
    def _process_content(self, content, file_metadata):
        """Process document content"""
        # Convert to markdown
        md_content = self._convert_to_markdown(content)
        
        # Extract metadata
        metadata = self._extract_metadata(content)
        
        # Add file info
        metadata.update({
            'source_id': file_metadata['id'],
            'source_name': file_metadata['name'],
            'processed_at': datetime.now().isoformat()
        })
        
        return {
            'content': md_content,
            'metadata': metadata
        }
        
    def _convert_to_markdown(self, content):
        """Convert Google Doc content to markdown"""
        # Implementation for markdown conversion
        return markdown.markdown(content)
        
    def _extract_metadata(self, content):
        """Extract metadata from document"""
        # Look for YAML front matter
        if content.startswith('---'):
            try:
                end_idx = content.index('---', 3)
                front_matter = content[3:end_idx]
                return yaml.safe_load(front_matter)
            except:
                pass
                
        # Default metadata
        return {
            'title': '',
            'author': '',
            'date': ''
        }
        
    def _save_to_vision_lake(self, processed_content, file_metadata):
        """Save processed content to Vision Lake"""
        # Save content
        content_blob = self.bucket.blob(f"processed/{file_metadata['name']}/content.md")
        content_blob.upload_from_string(
            processed_content['content'],
            content_type='text/markdown'
        )
        
        # Save metadata
        metadata_blob = self.bucket.blob(f"processed/{file_metadata['name']}/metadata.json")
        metadata_blob.upload_from_string(
            json.dumps(processed_content['metadata']),
            content_type='application/json'
        )

@functions_framework.cloud_event
def process_drive_file(cloud_event):
    """Cloud Function entry point"""
    data = cloud_event.data
    
    # Check if file is in target folder
    file_id = data['id']
    file = drive_service.files().get(
        fileId=file_id,
        fields='parents'
    ).execute()
    
    if DRIVE_FOLDER_ID not in file.get('parents', []):
        return {
            'status': 'skipped',
            'reason': 'File not in target folder'
        }
        
    # Process document
    processor = DocumentProcessor()
    result = processor.process_document(file_id)
    
    print(f"Processing result: {json.dumps(result)}")
    return result