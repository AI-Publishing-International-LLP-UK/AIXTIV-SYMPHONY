"""
Crawl4AI Integration for LLM-Optimized Web Crawling
"""
import asyncio
import crawl4ai
from typing import List, Dict

class Crawl4AIProcessor:
    def __init__(self):
        self.crawler = None
        
    async def setup_crawler(self):
        """Initialize crawler with optimal settings."""
        self.crawler = crawl4ai.AsyncWebCrawler()
        
    async def crawl_urls(self, urls: List[str]) -> List[Dict]:
        """Crawl multiple URLs and get RAG-optimized content."""
        if not self.crawler:
            await self.setup_crawler()
            
        results = []
        for url in urls:
            try:
                result = await self.crawler.arun(
                    url=url,
                )
                results.append({
                    'url': url,
                    'content': result.markdown,  # Crawl4AI provides markdown-formatted content
                    'metadata': result.metadata if hasattr(result, 'metadata') else {}
                })
            except Exception as e:
                print(f"Error crawling {url}: {str(e)}")
                
        return results

async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--urls-file', required=True, help='File containing URLs to crawl')
    parser.add_argument('--output-dir', required=True, help='Directory to save results')
    args = parser.parse_args()
    
    # Read URLs from file
    with open(args.urls_file, 'r') as f:
        urls = [line.strip() for line in f if line.strip()]
    
    # Initialize and run crawler
    processor = Crawl4AIProcessor()
    results = await processor.crawl_urls(urls)
    
    # Save results
    import os
    import json
    os.makedirs(args.output_dir, exist_ok=True)
    
    with open(os.path.join(args.output_dir, 'crawl_results.json'), 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == '__main__':
    asyncio.run(main())