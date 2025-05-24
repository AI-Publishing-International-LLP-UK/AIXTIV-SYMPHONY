"""Training Content Generation Examples"""
from typing import Dict
from scripts.content_generator import ContentGenerator
from scripts.agent_manager import AgentManager

class TrainingGenerator:
    def __init__(self):
        self.content_gen = ContentGenerator()
        self.agent_mgr = AgentManager()
        
    def create_hr_training(
        self,
        level: str,
        focus: str,
        duration: str
    ) -> Dict:
        """Create HR-focused training content"""
        # Setup profile
        profile = {
            'job_cluster': 'human_resources',
            'level': level,
            'focus_area': focus,
            'duration': duration
        }
        
        # Generate base content
        content = self.content_gen.generate_training_content(profile)
        
        # Get agent insights
        insights = self.agent_mgr.get_agent_insights(
            agent='dr-grant',  # Leadership expert
            content=content
        )
        
        # Combine and structure
        training = self.content_gen.structure_training(
            content=content,
            insights=insights,
            format='course'
        )
        
        return training