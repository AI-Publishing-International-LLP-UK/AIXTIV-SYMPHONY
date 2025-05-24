# Soho Intelligence Integration

from scripts.soho.search_engine import SohoSearchEngine
from scripts.core.ai_processor import AIContentProcessor

class SohoIntelligence:
    def __init__(self):
        self.search = SohoSearchEngine()
        self.ai = AIContentProcessor()
        self.analytics = ContentAnalytics()

    async def enhanced_search(self, query, context=None):
        """Enhanced search with AI capabilities"""
        try:
            # Base search
            base_results = await self.search.execute_search(query)

            # AI enhancement
            enhanced_results = await self.ai.enhance_results(base_results, context)

            # Analytics
            self.analytics.track_search(query, enhanced_results)

            return enhanced_results

        except Exception as e:
            self.logger.error(f'Search error: {e}')
            return None

    async def discover_content(self, topics, preferences):
        """Proactive content discovery"""
        try:
            # Generate search queries
            queries = await self.ai.generate_queries(topics, preferences)

            # Execute searches
            all_results = []
            for query in queries:
                results = await self.enhanced_search(query)
                all_results.extend(results)

            # Analyze and organize
            organized = await self.ai.organize_content(all_results)

            return organized

        except Exception as e:
            self.logger.error(f'Discovery error: {e}')
            return None

    async def learn_preferences(self, user_id, interactions):
        """Learn from user interactions"""
        try:
            # Analyze patterns
            patterns = await self.analytics.analyze_patterns(user_id, interactions)

            # Update preferences
            preferences = await self.ai.update_preferences(patterns)

            # Optimize search
            await self.search.optimize(preferences)

            return preferences

        except Exception as e:
            self.logger.error(f'Learning error: {e}')
            return None