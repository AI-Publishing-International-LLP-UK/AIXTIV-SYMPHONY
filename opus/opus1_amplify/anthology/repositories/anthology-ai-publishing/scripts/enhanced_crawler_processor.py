import asyncio
import crawl4ai
from typing import List, Dict

class CategoryCrawler:
    def __init__(self, config_path: str):
        self.config = self.load_config(config_path)
        self.crawler = None