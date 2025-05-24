"""
Batch Video Creation with Synthesia API
"""
import os
import time
from typing import List, Dict
from synthesia_rate_limiter import SynthesiaAPIHandler

class BatchVideoCreator:
    def __init__(self, api_key: str):
        self.api_handler = SynthesiaAPIHandler(api_key)
        self.max_batch_size = 50
        self.delay_between_batches = 60  # seconds

    def create_video_batch(self, template_id: str, data_list: List[Dict]) -> List[str]:
        """Create multiple videos in batches respecting rate limits."""
        video_ids = []
        
        # Split into batches
        for i in range(0, len(data_list), self.max_batch_size):
            batch = data_list[i:i + self.max_batch_size]
            
            # Process batch
            for data in batch:
                try:
                    response = self.api_handler.create_video(template_id, data)
                    video_ids.append(response['id'])
                except Exception as e:
                    print(f"Error creating video: {str(e)}")
            
            # Wait between batches
            if i + self.max_batch_size < len(data_list):
                time.sleep(self.delay_between_batches)
        
        return video_ids

    def monitor_batch_progress(self, video_ids: List[str]) -> Dict:
        """Monitor the progress of a batch of videos."""
        status = {
            'completed': [],
            'in_progress': [],
            'failed': []
        }
        
        for video_id in video_ids:
            try:
                response = self.api_handler.retrieve_video(video_id)
                if response['status'] == 'complete':
                    status['completed'].append(video_id)
                elif response['status'] == 'failed':
                    status['failed'].append(video_id)
                else:
                    status['in_progress'].append(video_id)
            except Exception as e:
                print(f"Error checking video {video_id}: {str(e)}")
        
        return status

def main():
    api_key = os.environ.get('SYNTHESIA_API_KEY')
    template_id = "your_template_id"
    
    # Example batch data
    data_list = [
        {
            "title": "Video 1",
            "script": "Welcome to video 1"
        },
        {
            "title": "Video 2",
            "script": "Welcome to video 2"
        }
        # Add more video data as needed
    ]
    
    creator = BatchVideoCreator(api_key)
    
    # Create videos
    video_ids = creator.create_video_batch(template_id, data_list)
    
    # Monitor progress
    while True:
        status = creator.monitor_batch_progress(video_ids)
        
        if not status['in_progress']:
            print("All videos processed!")
            print(f"Completed: {len(status['completed'])}")
            print(f"Failed: {len(status['failed'])}")
            break
            
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()