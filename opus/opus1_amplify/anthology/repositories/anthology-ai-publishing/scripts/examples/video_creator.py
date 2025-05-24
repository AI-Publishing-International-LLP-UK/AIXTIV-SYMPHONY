"""Video Creation Examples"""
from typing import Dict, List
from scripts.video_processor import VideoProcessor
from scripts.content_generator import ContentGenerator

class VideoCreator:
    def __init__(self):
        self.video_proc = VideoProcessor()
        self.content_gen = ContentGenerator()
        
    def create_series(
        self,
        topic: str,
        episodes: int,
        duration: str
    ) -> Dict:
        """Create a video series"""
        # Generate content for series
        content = self.content_gen.generate_video_content(
            topic=topic,
            num_episodes=episodes,
            duration=duration
        )
        
        # Process each episode
        series = []
        for episode in content['episodes']:
            video = self.video_proc.create_video(
                content=episode,
                template='leadership_series',
                duration=duration
            )
            series.append(video)
            
        return {
            'series_id': content['series_id'],
            'episodes': series,
            'metadata': content['metadata']
        }