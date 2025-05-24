"""
YouTube Publisher module for Dr. Memoria's Anthology system.
Implements publishing pipeline for YouTube content.
"""

import os
import asyncio
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

# Import from existing modules
from content_generation_engine import ContentGenerator
from models import CreativeWork, ContentType, WorkStatus

# Google API libraries
import googleapiclient.discovery
import googleapiclient.errors
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# YouTube API scopes
SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


class YouTubePublisher:
    """Handles the publishing of content to YouTube"""
    
    def __init__(self, content_generator: ContentGenerator, credentials_file: str = 'youtube_credentials.json'):
        """
        Initialize YouTube publisher
        
        Args:
            content_generator: The content generator to use
            credentials_file: Path to YouTube API credentials file
        """
        self.content_generator = content_generator
        self.credentials_file = credentials_file
        self.youtube = None
    
    async def authenticate(self) -> bool:
        """
        Authenticate with YouTube API
        
        Returns:
            bool: True if authentication successful
        """
        try:
            credentials = None
            token_path = 'youtube_token.json'
            
            # Check if token file exists
            if os.path.exists(token_path):
                credentials = Credentials.from_authorized_user_info(
                    json.load(open(token_path)), SCOPES)
            
            # If credentials don't exist or are invalid, authenticate
            if not credentials or not credentials.valid:
                if credentials and credentials.expired and credentials.refresh_token:
                    credentials.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, SCOPES)
                    credentials = flow.run_local_server(port=0)
                
                # Save credentials
                with open(token_path, 'w') as token:
                    token.write(credentials.to_json())
            
            # Build YouTube API service
            self.youtube = googleapiclient.discovery.build(
                "youtube", "v3", credentials=credentials)
            
            return True
        
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False
    
    async def format_for_youtube(self, work: CreativeWork) -> Dict[str, Any]:
        """
        Format a creative work for YouTube publishing
        
        Args:
            work: The creative work to format
            
        Returns:
            Dict containing formatted content for YouTube
        """
        # Validate the content type
        if work.content_type != ContentType.VIDEO:
            # Try to convert from other content types
            formatted_content = await self._convert_to_video_content(work)
        else:
            # Extract components from the creative work
            formatted_content = await self._extract_video_components(work)
        
        return formatted_content
    
    async def _convert_to_video_content(self, work: CreativeWork) -> Dict[str, Any]:
        """
        Convert non-video content to video format
        
        Args:
            work: The creative work to convert
            
        Returns:
            Dict containing video components
        """
        # Get LLM provider for conversion
        provider = await self.content_generator._get_provider()
        
        # Consolidate content
        consolidated_content = self.content_generator._consolidate_content(work)
        
        # Generate video script from content
        prompt = f"""
        Convert the following content into a video script format suitable for YouTube.
        Include sections for:
        1. Introduction
        2. Main content (broken into logical segments)
        3. Conclusion
        4. Call to action
        
        Also suggest:
        - A catchy title (70 characters max)
        - Video description (5000 characters max)
        - Tags (up to 500 characters total)
        - Thumbnail concept
        
        Content to convert:
        {consolidated_content}
        
        Return in JSON format with keys: title, description, tags, thumbnail_concept, and script.
        """
        
        try:
            result_text = await provider.generate_content(prompt, max_tokens=3000)
            
            # Parse JSON response
            try:
                result = json.loads(result_text)
            except json.JSONDecodeError:
                # If not valid JSON, extract components manually
                result = {
                    "title": work.title,
                    "description": consolidated_content[:5000],
                    "tags": [],
                    "thumbnail_concept": "Default thumbnail",
                    "script": consolidated_content
                }
                
                # Try to extract tags from content
                keywords = await self._extract_keywords(consolidated_content)
                result["tags"] = keywords[:10]  # Limit to 10 tags
            
            return result
            
        except Exception as e:
            logger.error(f"Content conversion error: {e}")
            # Fallback to basic conversion
            return {
                "title": work.title,
                "description": consolidated_content[:5000],
                "tags": [],
                "thumbnail_concept": "Default thumbnail",
                "script": consolidated_content
            }
    
    async def _extract_video_components(self, work: CreativeWork) -> Dict[str, Any]:
        """
        Extract video components from a video creative work
        
        Args:
            work: The video creative work
            
        Returns:
            Dict containing video components
        """
        # Initialize components
        components = {
            "title": work.title,
            "description": "",
            "tags": [],
            "thumbnail_concept": "",
            "script": ""
        }
        
        # Process each contribution to extract components
        for contribution in work.contributions:
            content = contribution.content
            
            # Look for JSON format in contributions
            if content.strip().startswith('{') and content.strip().endswith('}'):
                try:
                    content_json = json.loads(content)
                    
                    # Extract components from JSON
                    if "title" in content_json:
                        components["title"] = content_json["title"]
                    if "description" in content_json:
                        components["description"] = content_json["description"]
                    if "tags" in content_json:
                        components["tags"].extend(content_json["tags"])
                    if "thumbnail_concept" in content_json:
                        components["thumbnail_concept"] = content_json["thumbnail_concept"]
                    if "script" in content_json:
                        components["script"] = content_json["script"]
                        
                except json.JSONDecodeError:
                    # Not valid JSON, treat as script content
                    components["script"] += "\n\n" + content
            
            # If not JSON, append as script content
            else:
                components["script"] += "\n\n" + content
        
        # If no tags extracted, generate some
        if not components["tags"]:
            components["tags"] = await self._extract_keywords(components["script"])
        
        # If no description, generate one
        if not components["description"]:
            components["description"] = await self._generate_description(components["script"])
        
        # If no thumbnail concept, generate one
        if not components["thumbnail_concept"]:
            components["thumbnail_concept"] = await self._generate_thumbnail_concept(
                components["title"], components["script"])
        
        return components
    
    async def _extract_keywords(self, content: str) -> List[str]:
        """
        Extract keywords from content for video tags
        
        Args:
            content: The content to extract keywords from
            
        Returns:
            List of keywords
        """
        try:
            provider = await self.content_generator._get_provider()
            
            prompt = f"""
            Extract 10-15 relevant keywords or tags for a YouTube video based on this content:
            
            {content[:2000]}
            
            Return only the keywords as a JSON array, no explanation.
            """
            
            result_text = await provider.generate_content(prompt, max_tokens=200)
            
            # Try to parse as JSON
            try:
                tags = json.loads(result_text)
                if isinstance(tags, list):
                    return tags[:15]  # Limit to 15 tags
            except json.JSONDecodeError:
                # If not valid JSON, extract manually
                # Split by commas, newlines, or other common separators
                tags = result_text.replace('"', '').replace('[', '').replace(']', '')
                tags = [tag.strip() for tag in tags.replace('\n', ',').split(',')]
                return [tag for tag in tags if tag][:15]  # Filter empty and limit to 15
                
        except Exception as e:
            logger.error(f"Keyword extraction error: {e}")
            # Return empty list on failure
            return []
    
    async def _generate_description(self, content: str) -> str:
        """
        Generate a description for YouTube video
        
        Args:
            content: The content to generate description from
            
        Returns:
            Generated description
        """
        try:
            provider = await self.content_generator._get_provider()
            
            prompt = f"""
            Write an engaging YouTube video description based on this script:
            
            {content[:2000]}
            
            Include:
            1. A hook in the first line
            2. Brief summary of video content
            3. Key points or timestamps
            4. Call to action (subscribe, like, comment)
            
            Keep under 5000 characters. Return only the description.
            """
            
            description = await provider.generate_content(prompt, max_tokens=1000)
            
            # Limit to 5000 chars (YouTube max)
            return description[:5000]
            
        except Exception as e:
            logger.error(f"Description generation error: {e}")
            # Return basic description on failure
            return content[:5000]
    
    async def _generate_thumbnail_concept(self, title: str, content: str) -> str:
        """
        Generate a thumbnail concept for YouTube video
        
        Args:
            title: The video title
            content: The video content
            
        Returns:
            Thumbnail concept description
        """
        try:
            provider = await self.content_generator._get_provider()
            
            prompt = f"""
            Suggest a compelling thumbnail concept for a YouTube video titled:
            "{title}"
            
            With this content:
            {content[:1000]}
            
            Describe the thumbnail in one paragraph (what it should show, text overlay, style, etc.).
            Focus on creating a thumbnail that will get clicks while accurately representing the content.
            """
            
            thumbnail_concept = await provider.generate_content(prompt, max_tokens=200)
            return thumbnail_concept
            
        except Exception as e:
            logger.error(f"Thumbnail concept generation error: {e}")
            # Return basic concept on failure
            return f"Thumbnail for '{title}' showing the main topic visually with title text overlay"
    
    async def publish(self, work: CreativeWork, video_file_path: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Publish a video to YouTube
        
        Args:
            work: The creative work to publish
            video_file_path: Path to the video file to upload
            
        Returns:
            Tuple of (success, video_id, error_message)
        """
        try:
            # Ensure authenticated
            if not self.youtube:
                authenticated = await self.authenticate()
                if not authenticated:
                    return False, None, "Authentication failed"
            
            # Format work for YouTube
            formatted_content = await self.format_for_youtube(work)
            
            # Prepare upload request
            request_body = {
                "snippet": {
                    "title": formatted_content["title"],
                    "description": formatted_content["description"],
                    "tags": formatted_content["tags"],
                    "categoryId": "22"  # People & Blogs category
                },
                "status": {
                    "privacyStatus": "private",  # Start as private for review
                    "selfDeclaredMadeForKids": False
                }
            }
            
            # Create upload request
            request = self.youtube.videos().insert(
                part="snippet,status",
                body=request_body,
                media_body=googleapiclient.http.MediaFileUpload(
                    video_file_path, resumable=True)
            )
            
            # Execute upload
            response = request.execute()
            
            # Get video ID
            video_id = response["id"]
            
            # Log success
            logger.info(f"Successfully uploaded video: {video_id}")
            
            # Update work status
            work.status = WorkStatus.PUBLISHED
            work.metadata = {
                "platform": "youtube",
                "video_id": video_id,
                "publish_date": datetime.now().isoformat(),
                "url": f"https://www.youtube.com/watch?v={video_id}"
            }
            
            return True, video_id, None
            
        except googleapiclient.errors.HttpError as e:
            error_message = f"YouTube API error: {e.reason}"
            logger.error(error_message)
            return False, None, error_message
            
        except Exception as e:
            error_message = f"YouTube publishing error: {e}"
            logger.error(error_message)
            return False, None, error_message
    
    async def publish_draft(self, work: CreativeWork) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Create a draft publication for review without actually uploading a video
        
        Args:
            work: The creative work to draft
            
        Returns:
            Tuple of (success, draft_data, error_message)
        """
        try:
            # Format work for YouTube
            formatted_content = await self.format_for_youtube(work)
            
            # Create draft data
            draft_data = {
                "platform": "youtube",
                "title": formatted_content["title"],
                "description": formatted_content["description"],
                "tags": formatted_content["tags"],
                "thumbnail_concept": formatted_content["thumbnail_concept"],
                "script": formatted_content["script"],
                "draft_created": datetime.now().isoformat(),
                "status": "draft"
            }
            
            # Update work with draft data
            work.metadata = {
                "youtube_draft": draft_data
            }
            
            return True, draft_data, None
            
        except Exception as e:
            error_message = f"Draft creation error: {e}"
            logger.error(error_message)
            return False, None, error_message
    
    async def update_metadata(self, video_id: str, updates: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Update metadata for an existing YouTube video
        
        Args:
            video_id: The YouTube video ID to update
            updates: Dictionary of updates to apply
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Ensure authenticated
            if not self.youtube:
                authenticated = await self.authenticate()
                if not authenticated:
                    return False, "Authentication failed"
            
            # Get current video data
            video_response = self.youtube.videos().list(
                part="snippet,status",
                id=video_id
            ).execute()
            
            if not video_response["items"]:
                return False, f"Video with ID {video_id} not found"
            
            video = video_response["items"][0]
            snippet = video["snippet"]
            status = video["status"]
            
            # Update fields
            if "title" in updates:
                snippet["title"] = updates["title"]
            if "description" in updates:
                snippet["description"] = updates["description"]
            if "tags" in updates:
                snippet["tags"] = updates["tags"]
            if "privacyStatus" in updates:
                status["privacyStatus"] = updates["privacyStatus"]
            
            # Execute update
            self.youtube.videos().update(
                part="snippet,status",
                body={
                    "id": video_id,
                    "snippet": snippet,
                    "status": status
                }
            ).execute()
            
            return True, None
            
        except googleapiclient.errors.HttpError as e:
            error_message = f"YouTube API error: {e.reason}"
            logger.error(error_message)
            return False, error_message
            
        except Exception as e:
            error_message = f"Metadata update error: {e}"
            logger.error(error_message)
            return False, error_message
    
    async def get_analytics(self, video_id: str, days: int = 28) -> Dict[str, Any]:
        """
        Get analytics for a YouTube video
        
        Args:
            video_id: The YouTube video ID
            days: Number of days to get analytics for
            
        Returns:
            Dict containing analytics data
        """
        try:
            # Ensure authenticated
            if not self.youtube:
                authenticated = await self.authenticate()
                if not authenticated:
                    return {"error": "Authentication failed"}
            
            # Get video statistics
            video_response = self.youtube.videos().list(
                part="statistics",
                id=video_id
            ).execute()
            
            if not video_response["items"]:
                return {"error": f"Video with ID {video_id} not found"}
            
            stats = video_response["items"][0]["statistics"]
            
            # Basic analytics from statistics
            analytics = {
                "video_id": video_id,
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "favorites": int(stats.get("favoriteCount", 0)),
                "last_updated": datetime.now().isoformat()
            }
            
            # Add engagement metrics
            if analytics["views"] > 0:
                analytics["engagement_rate"] = round(
                    (analytics["likes"] + analytics["comments"]) / analytics["views"] * 100, 2
                )
            else:
                analytics["engagement_rate"] = 0
            
            return analytics
            
        except googleapiclient.errors.HttpError as e:
            error_message = f"YouTube API error: {e.reason}"
            logger.error(error_message)
            return {"error": error_message}
            
        except Exception as e:
            error_message = f"Analytics error: {e}"
            logger.error(error_message)
            return {"error": error_message}


# Example usage
async def main():
    try:
        # Set up content generator (simplified example)
        from content_generation_engine import LLMProviderFactory, ContentGenerator
        
        # Create LLM providers
        primary_provider = LLMProviderFactory.create_provider("openai")
        fallback_provider = LLMProviderFactory.create_provider("anthropic")
        
        # Create content generator
        content_generator = ContentGenerator(
            primary_provider=primary_provider,
            fallback_provider=fallback_provider
        )
        
        # Create YouTube publisher
        youtube_publisher = YouTubePublisher(
            content_generator=content_generator,
            credentials_file="youtube_credentials.json"
        )
        
        # Load a creative work (simulated)
        work = CreativeWork(
            owner_id="user123",
            title="AI and Human Collaboration in Creative Projects",
            content_type=ContentType.ARTICLE
        )
        
        # Create a draft publication
        success, draft, error = await youtube_publisher.publish_draft(work)
        
        if success:
            print(f"Created YouTube draft: {draft['title']}")
            print(f"Description: {draft['description'][:100]}...")
            print(f"Tags: {', '.join(draft['tags'])}")
            print(f"Thumbnail concept: {draft['thumbnail_concept']}")
        else:
            print(f"Draft creation failed: {error}")
        
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
