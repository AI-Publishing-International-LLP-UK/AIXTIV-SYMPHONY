"""
Rate Limit Handler for Synthesia API
"""
import time
from datetime import datetime, timedelta
from typing import Dict, Optional

class SynthesiaRateLimiter:
    def __init__(self):
        self.request_counts = {
            'create_video': {'minute': 0, 'hour': 0, 'day': 0},
            'update_video': {'minute': 0, 'hour': 0, 'day': 0},
            'retrieve_video': {'minute': 0, 'day': 0},
            'list_videos': {'minute': 0, 'day': 0}
        }
        self.last_reset = {
            'minute': datetime.now(),
            'hour': datetime.now(),
            'day': datetime.now()
        }

    def can_make_request(self, endpoint_type: str) -> bool:
        """Check if request can be made within rate limits."""
        self._reset_counters()
        
        limits = {
            'create_video': {'minute': 60, 'hour': 300, 'day': 1000},
            'update_video': {'minute': 60, 'hour': 300, 'day': 1000},
            'retrieve_video': {'minute': 60, 'day': 40000},
            'list_videos': {'minute': 60, 'day': 40000}
        }
        
        for period, limit in limits[endpoint_type].items():
            if self.request_counts[endpoint_type][period] >= limit:
                return False
        return True

    def wait_if_needed(self, endpoint_type: str) -> None:
        """Wait until request can be made."""
        while not self.can_make_request(endpoint_type):
            time.sleep(1)  # Wait 1 second
            self._reset_counters()

    def record_request(self, endpoint_type: str) -> None:
        """Record a request being made."""
        for period in self.request_counts[endpoint_type].keys():
            self.request_counts[endpoint_type][period] += 1

    def _reset_counters(self) -> None:
        """Reset counters based on time periods."""
        now = datetime.now()
        
        # Reset minute counters
        if now - self.last_reset['minute'] >= timedelta(minutes=1):
            for endpoint in self.request_counts.keys():
                self.request_counts[endpoint]['minute'] = 0
            self.last_reset['minute'] = now
            
        # Reset hour counters
        if now - self.last_reset['hour'] >= timedelta(hours=1):
            for endpoint in self.request_counts.keys():
                if 'hour' in self.request_counts[endpoint]:
                    self.request_counts[endpoint]['hour'] = 0
            self.last_reset['hour'] = now
            
        # Reset day counters
        if now - self.last_reset['day'] >= timedelta(days=1):
            for endpoint in self.request_counts.keys():
                self.request_counts[endpoint]['day'] = 0
            self.last_reset['day'] = now

class SynthesiaAPIHandler:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.rate_limiter = SynthesiaRateLimiter()
        
    def create_video(self, template_id: str, data: Dict) -> Dict:
        """Create a video with rate limit awareness."""
        self.rate_limiter.wait_if_needed('create_video')
        # Make API call here
        self.rate_limiter.record_request('create_video')
        
    def update_video(self, video_id: str, data: Dict) -> Dict:
        """Update a video with rate limit awareness."""
        self.rate_limiter.wait_if_needed('update_video')
        # Make API call here
        self.rate_limiter.record_request('update_video')
        
    def retrieve_video(self, video_id: str) -> Dict:
        """Retrieve a video with rate limit awareness."""
        self.rate_limiter.wait_if_needed('retrieve_video')
        # Make API call here
        self.rate_limiter.record_request('retrieve_video')
        
    def list_videos(self) -> Dict:
        """List videos with rate limit awareness."""
        self.rate_limiter.wait_if_needed('list_videos')
        # Make API call here
        self.rate_limiter.record_request('list_videos')

    def handle_rate_limit_response(self, response_headers: Dict) -> None:
        """Handle 429 Too Many Requests response."""
        if 'RateLimit-Reset' in response_headers:
            wait_time = int(response_headers['RateLimit-Reset'])
            time.sleep(wait_time)