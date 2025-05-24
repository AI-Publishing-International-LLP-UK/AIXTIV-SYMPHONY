from google.cloud import secretmanager
from google.cloud import storage
import requests
import json
import logging
import os
from datetime import datetime
from typing import Dict, List

class KDPPublisher:
    def __init__(self, project_id="api-for-warp-drive"):
        self.project_id = project_id
        self.account_id = "AQHWLWHP2WMD6"
        self._init_clients()
        self._setup_logging()
        
    def _init_clients(self):
        """Initialize API clients"""
        self.secret_client = secretmanager.SecretManagerServiceClient()
        self.storage_client = storage.Client()
        self._load_credentials()
        
    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('KDPPublisher')
        
    def _load_credentials(self):
        """Load KDP credentials from Secret Manager"""
        name = f"projects/{self.project_id}/secrets/kdp-credentials/versions/latest"
        response = self.secret_client.access_secret_version(request={"name": name})
        self.credentials = json.loads(response.payload.data.decode("UTF-8"))
        
    def publish_book(self, content_path: str, metadata: Dict) -> Dict:
        """Publish book to KDP"""
        try:
            self.logger.info(f"Starting publication process for {metadata['title']}")
            
            # Prepare content
            book_package = self._prepare_book_package(content_path, metadata)
            
            # Create KDP book
            book_id = self._create_kdp_book(metadata)
            
            # Upload content
            self._upload_book_content(book_id, book_package)
            
            # Set pricing and rights
            self._configure_book_settings(book_id, metadata)
            
            # Submit for review
            submission_id = self._submit_for_review(book_id)
            
            return {
                'status': 'success',
                'book_id': book_id,
                'submission_id': submission_id
            }
            
        except Exception as e:
            self.logger.error(f"Publication failed: {str(e)}")
            raise
            
    def _prepare_book_package(self, content_path: str, metadata: Dict) -> Dict:
        """Prepare book content for KDP"""
        # Load content from Vision Lake
        bucket = self.storage_client.bucket('vision-lake-main')
        content_blob = bucket.blob(content_path)
        content = content_blob.download_as_string().decode('utf-8')
        
        # Generate formats
        formats = {
            'kindle': self._generate_kindle_format(content),
            'paperback': self._generate_paperback_format(content)
        }
        
        # Add metadata
        package = {
            'formats': formats,
            'metadata': self._prepare_metadata(metadata),
            'cover': self._prepare_cover(metadata)
        }
        
        return package
        
    def _generate_kindle_format(self, content: str) -> Dict:
        """Generate Kindle format"""
        # Convert to EPUB
        epub_content = self._markdown_to_epub(content)
        
        # Add Kindle specific formatting
        kindle_package = {
            'content': epub_content,
            'toc': self._generate_toc(content),
            'preview': self._generate_preview(content)
        }
        
        return kindle_package
        
    def _generate_paperback_format(self, content: str) -> Dict:
        """Generate paperback format"""
        # Convert to print-ready PDF
        pdf_content = self._markdown_to_pdf(content)
        
        # Add print specific formatting
        print_package = {
            'content': pdf_content,
            'cover': self._generate_print_cover(),
            'spine': self._calculate_spine_width()
        }
        
        return print_package
        
    def _create_kdp_book(self, metadata: Dict) -> str:
        """Create new book in KDP"""
        url = f"https://kdp.amazon.com/api/books/create"
        headers = self._get_auth_headers()
        
        response = requests.post(
            url,
            headers=headers,
            json={
                'title': metadata['title'],
                'authors': metadata['authors'],
                'language': metadata.get('language', 'en'),
                'formats': ['kindle', 'paperback']
            }
        )
        
        response.raise_for_status()
        return response.json()['book_id']
        
    def _upload_book_content(self, book_id: str, package: Dict):
        """Upload book content to KDP"""
        # Upload Kindle format
        self._upload_kindle_format(book_id, package['formats']['kindle'])
        
        # Upload paperback format
        self._upload_paperback_format(book_id, package['formats']['paperback'])
        
        # Upload cover
        self._upload_cover(book_id, package['cover'])
        
    def _configure_book_settings(self, book_id: str, metadata: Dict):
        """Configure book pricing and rights"""
        url = f"https://kdp.amazon.com/api/books/{book_id}/settings"
        headers = self._get_auth_headers()
        
        settings = {
            'pricing': {
                'kindle': metadata.get('kindle_price', 9.99),
                'paperback': metadata.get('paperback_price', 19.99)
            },
            'territories': metadata.get('territories', ['US', 'UK', 'DE', 'FR', 'ES', 'IT', 'NL', 'JP', 'BR', 'CA', 'MX', 'AU', 'IN']),
            'rights': metadata.get('rights', 'all'),
            'categories': metadata.get('categories', [])
        }
        
        response = requests.put(
            url,
            headers=headers,
            json=settings
        )
        
        response.raise_for_status()
        
    def _submit_for_review(self, book_id: str) -> str:
        """Submit book for KDP review"""
        url = f"https://kdp.amazon.com/api/books/{book_id}/submit"
        headers = self._get_auth_headers()
        
        response = requests.post(
            url,
            headers=headers
        )
        
        response.raise_for_status()
        return response.json()['submission_id']
        
    def _get_auth_headers(self) -> Dict:
        """Get KDP authentication headers"""
        return {
            'Authorization': f"Bearer {self.credentials['access_token']}",
            'X-Account-Id': self.account_id,
            'Content-Type': 'application/json'
        }

def main():
    publisher = KDPPublisher()
    
    # Example usage
    metadata = {
        'title': 'Example Book',
        'authors': ['Author Name'],
        'language': 'en',
        'kindle_price': 9.99,
        'paperback_price': 19.99
    }
    
    result = publisher.publish_book(
        content_path='processed/example_book/content.md',
        metadata=metadata
    )
    
    print(f"Publication result: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    main()