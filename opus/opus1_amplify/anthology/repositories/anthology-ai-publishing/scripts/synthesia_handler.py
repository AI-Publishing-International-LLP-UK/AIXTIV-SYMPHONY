"""
Synthesia API Handler for Video Generation
"""
import os
import requests
import json
from typing import Dict, List, Optional

class SynthesiaHandler:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.synthesia.io/v2"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def list_videos(self, source: str = "workspace") -> Dict:
        """
        List videos with specified source.
        """
        endpoint = f"{self.base_url}/videos"
        params = {"source": source}
        response = requests.get(endpoint, headers=self.headers, params=params)
        return response.json()

    def list_templates(self, source: str = "workspace", include_stock: bool = True) -> Dict:
        """
        List available templates.
        """
        endpoint = f"{self.base_url}/templates"
        params = {
            "source": source,
            "include_stock": include_stock
        }
        response = requests.get(endpoint, headers=self.headers, params=params)
        return response.json()

    def create_video(self, script: Dict, template_id: str) -> Dict:
        """
        Create a new video.
        """
        endpoint = f"{self.base_url}/videos"
        payload = {
            "script": script,
            "template_id": template_id,
            "output": {
                "formats": ["mp4"],
                "captions": ["srt", "vtt"],
                "thumbnail": True
            }
        }
        response = requests.post(endpoint, headers=self.headers, json=payload)
        return response.json()

    def get_video_status(self, video_id: str) -> Dict:
        """
        Get video generation status.
        """
        endpoint = f"{self.base_url}/videos/{video_id}"
        response = requests.get(endpoint, headers=self.headers)
        return response.json()

    def download_assets(self, video_id: str, output_dir: str):
        """
        Download video assets including captions and thumbnail.
        """
        video_info = self.get_video_status(video_id)
        
        # Download video
        video_url = video_info["download_url"]
        self._download_file(video_url, f"{output_dir}/{video_id}.mp4")
        
        # Download captions
        if "captions" in video_info:
            for format, url in video_info["captions"].items():
                self._download_file(url, f"{output_dir}/{video_id}.{format}")
        
        # Download thumbnail
        if "thumbnail_url" in video_info:
            self._download_file(video_info["thumbnail_url"], 
                              f"{output_dir}/{video_id}_thumb.jpg")

    def _download_file(self, url: str, destination: str):
        """
        Helper method to download files.
        """
        response = requests.get(url)
        with open(destination, "wb") as f:
            f.write(response.content)

    def handle_webhook_event(self, event_data: Dict):
        """
        Process webhook events.
        """
        event_type = event_data.get("type")
        video_id = event_data.get("video", {}).get("id")
        
        if event_type == "video.completed":
            self.handle_completion(video_id, event_data)
        elif event_type == "video.failed":
            self.handle_failure(video_id, event_data)

    def handle_completion(self, video_id: str, event_data: Dict):
        """
        Handle video completion event.
        """
        # Download all assets
        output_dir = f"output/{video_id}"
        os.makedirs(output_dir, exist_ok=True)
        self.download_assets(video_id, output_dir)
        
        # Log completion
        with open(f"{output_dir}/completion_log.json", "w") as f:
            json.dump(event_data, f, indent=2)

    def handle_failure(self, video_id: str, event_data: Dict):
        """
        Handle video failure event.
        """
        # Log failure
        os.makedirs("logs", exist_ok=True)
        with open(f"logs/failure_{video_id}.json", "w") as f:
            json.dump(event_data, f, indent=2)
        
        # Implement retry logic or notification system