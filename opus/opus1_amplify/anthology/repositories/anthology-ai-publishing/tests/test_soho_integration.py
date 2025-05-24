# Soho Integration Tests

import pytest
from scripts.ai_processors.soho_intelligence import SohoIntelligence

class TestSohoIntegration:
    @pytest.fixture
    def soho(self):
        return SohoIntelligence()

    async def test_enhanced_search(self, soho):
        """Test enhanced search capabilities"""
        query = "innovation leadership"
        results = await soho.enhanced_search(query)
        
        assert results is not None
        assert len(results) > 0
        assert 'relevance_score' in results[0]

    async def test_content_discovery(self, soho):
        """Test proactive content discovery"""
        topics = ['AI', 'Leadership', 'Innovation']
        preferences = {
            'depth': 'comprehensive',
            'recency': 'high',
            'relevance': 'critical'
        }

        content = await soho.discover_content(topics, preferences)
        
        assert content is not None
        assert len(content) > 0
        assert 'topics' in content[0]

    async def test_learning(self, soho):
        """Test preference learning"""
        user_id = 'test_user'
        interactions = [
            {'query': 'AI leadership', 'clicked': True, 'time_spent': 300},
            {'query': 'innovation', 'clicked': True, 'time_spent': 450},
        ]

        preferences = await soho.learn_preferences(user_id, interactions)
        
        assert preferences is not None
        assert 'interests' in preferences
        assert 'patterns' in preferences