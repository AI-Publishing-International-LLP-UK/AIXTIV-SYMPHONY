"""
Google Docs Content Synchronization Script
"""
import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.cloud import secretmanager

class ContentSynchronizer:
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.secrets_client = secretmanager.SecretManagerServiceClient()
        self.setup_credentials()
        
    def setup_credentials(self):
        """Set up Google APIs credentials from Secret Manager."""
        name = f"projects/{self.project_id}/secrets/gdocs-credentials/versions/latest"
        response = self.secrets_client.access_secret_version(request={"name": name})
        credentials_dict = json.loads(response.payload.data.decode("UTF-8"))
        
        self.credentials = service_account.Credentials.from_service_account_info(
            credentials_dict,
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        
        self.drive_service = build('drive', 'v3', credentials=self.credentials)
        self.docs_service = build('docs', 'v1', credentials=self.credentials)
        
    def list_documents(self, folder_id: str = None):
        """List all documents in specified folder."""
        query = f"'{folder_id}' in parents" if folder_id else None
        
        results = self.drive_service.files().list(
            q=query,
            pageSize=1000,
            fields="files(id, name, mimeType, modifiedTime)"
        ).execute()
        
        return results.get('files', [])
        
    def process_document(self, doc_id: str, output_path: str):
        """Process individual document and convert to publishing format."""
        doc = self.docs_service.documents().get(documentId=doc_id).execute()
        
        # Extract content and metadata
        content = self.extract_content(doc)
        metadata = self.extract_metadata(doc)
        
        # Process for different publishing formats
        self.generate_book_format(content, metadata, output_path)
        self.generate_training_format(content, metadata, output_path)
        self.generate_video_script(content, metadata, output_path)
        
    def extract_content(self, doc):
        """Extract and structure document content."""
        content = {
            'title': doc.get('title', ''),
            'body': [],
            'sections': []
        }
        
        current_section = None
        for element in doc['body']['content']:
            if 'paragraph' in element:
                para = element['paragraph']
                
                # Check if this is a heading
                if 'paragraphStyle' in para and 'headingId' in para['paragraphStyle']:
                    if current_section:
                        content['sections'].append(current_section)
                    current_section = {
                        'heading': self.get_text_from_paragraph(para),
                        'content': []
                    }
                elif current_section:
                    current_section['content'].append(
                        self.get_text_from_paragraph(para)
                    )
                else:
                    content['body'].append(
                        self.get_text_from_paragraph(para)
                    )
        
        if current_section:
            content['sections'].append(current_section)
            
        return content
        
    def get_text_from_paragraph(self, paragraph):
        """Extract text from paragraph elements."""
        text = ''
        for element in paragraph.get('elements', []):
            if 'textRun' in element:
                text += element['textRun'].get('content', '')
        return text
        
    def extract_metadata(self, doc):
        """Extract document metadata and publishing instructions."""
        metadata = {
            'title': doc.get('title', ''),
            'created_time': doc.get('createdTime', ''),
            'modified_time': doc.get('modifiedTime', ''),
            'publishing_instructions': {}
        }
        
        # Look for publishing instructions in document properties
        if 'properties' in doc:
            props = doc['properties']
            if 'publishing' in props:
                metadata['publishing_instructions'] = props['publishing']
                
        return metadata
        
    def generate_book_format(self, content, metadata, output_path):
        """Generate book publishing format."""
        book_path = os.path.join(output_path, 'books', f"{metadata['title']}.md")
        os.makedirs(os.path.dirname(book_path), exist_ok=True)
        
        with open(book_path, 'w') as f:
            f.write(f"# {content['title']}\n\n")
            
            # Write front matter
            f.write("---\n")
            for key, value in metadata.items():
                f.write(f"{key}: {value}\n")
            f.write("---\n\n")
            
            # Write content
            for section in content['sections']:
                f.write(f"## {section['heading']}\n\n")
                for para in section['content']:
                    f.write(f"{para}\n\n")
                    
    def generate_training_format(self, content, metadata, output_path):
        """Generate training material format."""
        training_path = os.path.join(output_path, 'training', f"{metadata['title']}.md")
        os.makedirs(os.path.dirname(training_path), exist_ok=True)
        
        with open(training_path, 'w') as f:
            f.write(f"# Training Module: {content['title']}\n\n")
            
            # Write learning objectives
            f.write("## Learning Objectives\n\n")
            for section in content['sections']:
                f.write(f"* {section['heading']}\n")
            f.write("\n")
            
            # Write content with exercises
            for section in content['sections']:
                f.write(f"## {section['heading']}\n\n")
                f.write("### Content\n\n")
                for para in section['content']:
                    f.write(f"{para}\n\n")
                f.write("### Exercise\n\n")
                f.write("Practice activities related to this section.\n\n")
                
    def generate_video_script(self, content, metadata, output_path):
        """Generate Synthesia video script format."""
        script_path = os.path.join(output_path, 'videos', f"{metadata['title']}.json")
        os.makedirs(os.path.dirname(script_path), exist_ok=True)
        
        script = {
            'title': content['title'],
            'templateId': metadata.get('publishing_instructions', {}).get('video_template_id'),
            'scenes': []
        }
        
        # Convert sections to video scenes
        for section in content['sections']:
            script['scenes'].append({
                'text': section['heading'],
                'duration': 5  # Section heading duration
            })
            
            # Break content into digestible segments
            for para in section['content']:
                script['scenes'].append({
                    'text': para,
                    'duration': len(para.split()) / 2  # Rough estimate of duration
                })
                
        with open(script_path, 'w') as f:
            json.dump(script, f, indent=2)

def main():
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--folder-id', help='Google Drive folder ID to process')
    args = parser.parse_args()
    
    synchronizer = ContentSynchronizer('api-for-warp-drive')
    
    # Process all documents
    documents = synchronizer.list_documents(args.folder_id)
    for doc in documents:
        if doc['mimeType'] == 'application/vnd.google-apps.document':
            synchronizer.process_document(doc['id'], args.output_dir)

if __name__ == '__main__':
    main()