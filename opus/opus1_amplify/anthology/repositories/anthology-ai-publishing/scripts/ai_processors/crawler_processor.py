"""
AI-Powered Web Crawling and Content Integration
Integrates with Claude 3.5, Vertex AI, and adds web crawling capabilities
"""
import os
import json
import asyncio
import aiohttp
from typing import Dict, List, Set
from bs4 import BeautifulSoup
from google.cloud import aiplatform
from anthropic import Anthropic

class AICrawlerProcessor:
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.visited_urls = set()
        self.content_cache = {}
        self.setup_ai_clients()

    async def crawl_and_analyze(self, start_urls: List[str], depth: int = 2):
        """Crawl websites and analyze content with multiple AI models."""
        async with aiohttp.ClientSession() as session:
            tasks = [self.crawl_site(session, url, depth) for url in start_urls]
            results = await asyncio.gather(*tasks)
            return self.combine_crawl_results(results)

    async def crawl_site(self, session: aiohttp.ClientSession, url: str, depth: int):
        """Crawl single site with depth limit."""
        if depth <= 0 or url in self.visited_urls:
            return {}

        self.visited_urls.add(url)
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract relevant content
                    content = self.extract_content(soup)
                    
                    # Process with AI models
                    analysis = await self.analyze_content(content, url)
                    
                    # Find linked pages
                    if depth > 1:
                        links = self.extract_links(soup, url)
                        tasks = [self.crawl_site(session, link, depth - 1) 
                                for link in links if link not in self.visited_urls]
                        child_results = await asyncio.gather(*tasks)
                        
                        # Combine results
                        analysis['linked_pages'] = child_results
                    
                    return {url: analysis}
                    
        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
            return {}

    def extract_content(self, soup: BeautifulSoup) -> Dict:
        """Extract structured content from webpage."""
        content = {
            'title': soup.title.string if soup.title else '',
            'meta_description': '',
            'main_content': '',
            'headings': [],
            'links': []
        }

        # Get meta description
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            content['meta_description'] = meta_desc.get('content', '')

        # Get main content (customize based on site structure)
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_='content')
        if main_content:
            content['main_content'] = main_content.get_text(strip=True)

        # Get headings
        content['headings'] = [h.get_text(strip=True) 
                             for h in soup.find_all(['h1', 'h2', 'h3'])]

        # Get links
        content['links'] = [a.get('href') for a in soup.find_all('a', href=True)]

        return content

    async def analyze_content(self, content: Dict, url: str) -> Dict:
        """Analyze content using multiple AI models."""
        analysis = {
            'url': url,
            'ai_analysis': {}
        }

        # Claude 3.5 Analysis
        claude_analysis = await self.get_claude_analysis(content)
        analysis['ai_analysis']['claude'] = claude_analysis

        # Vertex AI Analysis
        vertex_analysis = await self.get_vertex_analysis(content)
        analysis['ai_analysis']['vertex'] = vertex_analysis

        # Combine insights
        analysis['combined_insights'] = self.combine_ai_insights(
            claude_analysis,
            vertex_analysis
        )

        return analysis

    async def get_claude_analysis(self, content: Dict) -> Dict:
        """Get content analysis from Claude 3.5."""
        prompt = f"""Analyze this web content and provide insights:
        Title: {content['title']}
        Description: {content['meta_description']}
        Main Content: {content['main_content'][:2000]}...

        Please provide:
        1. Key topics and themes
        2. Content quality assessment
        3. Relevance to target audience
        4. Actionable insights
        5. Suggested content improvements
        """

        response = self.claude_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        return self.parse_claude_response(response.content[0].text)

    async def get_vertex_analysis(self, content: Dict) -> Dict:
        """Get content analysis from Vertex AI."""
        prompt = f"""Analyze this web content:
        {json.dumps(content, indent=2)}

        Provide structured analysis with:
        - Main themes
        - Content quality
        - Target audience
        - Key insights
        - Improvement suggestions
        """

        response = self.vertex_model.predict(prompt=prompt)
        return self.parse_vertex_response(response.text)

    def combine_ai_insights(self, claude_analysis: Dict, vertex_analysis: Dict) -> Dict:
        """Combine and reconcile insights from multiple AI models."""
        combined = {
            'themes': set(),
            'quality_assessment': {},
            'audience': set(),
            'insights': set(),
            'improvements': set()
        }

        # Combine themes
        combined['themes'].update(claude_analysis.get('themes', []))
        combined['themes'].update(vertex_analysis.get('themes', []))

        # Merge quality assessments
        for key in ['content_quality', 'relevance', 'clarity']:
            claude_score = claude_analysis.get('quality', {}).get(key, 0)
            vertex_score = vertex_analysis.get('quality', {}).get(key, 0)
            combined['quality_assessment'][key] = (claude_score + vertex_score) / 2

        # Combine audience insights
        combined['audience'].update(claude_analysis.get('audience', []))
        combined['audience'].update(vertex_analysis.get('audience', []))

        # Merge insights and improvements
        combined['insights'].update(claude_analysis.get('insights', []))
        combined['insights'].update(vertex_analysis.get('insights', []))
        combined['improvements'].update(claude_analysis.get('improvements', []))
        combined['improvements'].update(vertex_analysis.get('improvements', []))

        return {k: list(v) if isinstance(v, set) else v 
                for k, v in combined.items()}

    def generate_content_suggestions(self, analysis: Dict) -> Dict:
        """Generate content suggestions based on combined analysis."""
        suggestions = {
            'new_topics': [],
            'content_improvements': [],
            'audience_targeting': [],
            'seo_recommendations': []
        }

        # Process themes and insights for new topic ideas
        themes = analysis['combined_insights']['themes']
        for theme in themes:
            suggestions['new_topics'].append({
                'theme': theme,
                'content_ideas': self.generate_topic_ideas(theme)
            })

        # Generate content improvement recommendations
        quality = analysis['combined_insights']['quality_assessment']
        if quality['content_quality'] < 0.8:
            suggestions['content_improvements'].extend(
                self.generate_improvement_suggestions(analysis)
            )

        # Audience targeting suggestions
        audience = analysis['combined_insights']['audience']
        suggestions['audience_targeting'] = self.generate_audience_suggestions(audience)

        # SEO recommendations
        suggestions['seo_recommendations'] = self.generate_seo_suggestions(analysis)

        return suggestions

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--start-urls', nargs='+', required=True)
    parser.add_argument('--depth', type=int, default=2)
    parser.add_argument('--output-dir', required=True)
    args = parser.parse_args()

    processor = AICrawlerProcessor('api-for-warp-drive')
    
    # Run crawler and analysis
    results = asyncio.run(processor.crawl_and_analyze(
        args.start_urls, 
        args.depth
    ))
    
    # Save results
    os.makedirs(args.output_dir, exist_ok=True)
    with open(f"{args.output_dir}/crawl_analysis.json", 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == '__main__':
    main()