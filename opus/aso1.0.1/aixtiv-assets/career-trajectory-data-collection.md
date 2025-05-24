# Career Trajectory Data Collection System

## Database Schema Design

### Professional Profiles Database
```sql
CREATE TABLE professional_profiles (
    profile_id UUID PRIMARY KEY,
    unique_identifier VARCHAR(255) NOT NULL,
    primary_industry VARCHAR(100),
    current_career_stage VARCHAR(50),
    total_career_years INT,
    current_role_start_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE career_positions (
    position_id UUID PRIMARY KEY,
    profile_id UUID REFERENCES professional_profiles(profile_id),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(100),
    start_date DATE,
    end_date DATE,
    duration_months INT,
    is_current_position BOOLEAN DEFAULT FALSE,
    role_level VARCHAR(50),
    employment_type VARCHAR(50),
    location VARCHAR(100),
    performance_metrics JSONB,
    career_progression_indicators JSONB
);

CREATE TABLE career_transitions (
    transition_id UUID PRIMARY KEY,
    profile_id UUID REFERENCES professional_profiles(profile_id),
    previous_position_id UUID REFERENCES career_positions(position_id),
    next_position_id UUID REFERENCES career_positions(position_id),
    transition_type VARCHAR(50),
    industry_change BOOLEAN,
    role_level_change VARCHAR(50),
    salary_change_percentage DECIMAL(10,2),
    transition_reason TEXT,
    transition_date DATE
);

CREATE TABLE professional_achievements (
    achievement_id UUID PRIMARY KEY,
    profile_id UUID REFERENCES professional_profiles(profile_id),
    position_id UUID REFERENCES career_positions(position_id),
    achievement_type VARCHAR(100),
    description TEXT,
    impact_level VARCHAR(50),
    quantitative_value DECIMAL(15,2),
    date_achieved DATE
);

CREATE TABLE skill_evolution (
    skill_id UUID PRIMARY KEY,
    profile_id UUID REFERENCES professional_profiles(profile_id),
    skill_name VARCHAR(100),
    first_observed_date DATE,
    last_observed_date DATE,
    proficiency_levels JSONB,
    skill_context JSONB
);
```

## RSS Feed Configuration and Crawler

```python
import asyncio
import aiohttp
import feedparser
import hashlib
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

class ProfessionalDataCrawler:
    def __init__(self, database_url, rss_sources):
        """
        Initialize the crawler with database connection and RSS sources
        
        Args:
            database_url (str): Async database connection string
            rss_sources (list): List of professional RSS feed sources
        """
        # Async database engine setup
        self.engine = create_async_engine(database_url, echo=True)
        self.AsyncSessionLocal = sessionmaker(
            self.engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
        
        # RSS sources configuration
        self.rss_sources = rss_sources
        
    async def register_rss_source(self, source_url, category, tags=None):
        """
        Register a new RSS source for professional data collection
        
        Args:
            source_url (str): URL of the RSS feed
            category (str): Professional domain (e.g., 'tech', 'finance')
            tags (list): Additional categorization tags
        
        Returns:
            str: Unique identifier for the registered source
        """
        # Generate a unique source identifier
        source_id = hashlib.md5(source_url.encode()).hexdigest()
        
        async with self.AsyncSessionLocal() as session:
            # Check if source already exists
            existing_source = await session.execute(
                sa.select(RSSSource).where(RSSSource.url == source_url)
            )
            
            if existing_source.scalar_one_or_none():
                return source_id
            
            # Create new RSS source entry
            new_source = RSSSource(
                id=source_id,
                url=source_url,
                category=category,
                tags=tags or [],
                last_crawled=None,
                active=True
            )
            
            session.add(new_source)
            await session.commit()
        
        return source_id
    
    async def crawl_professional_rss(self, source_id):
        """
        Crawl a specific RSS source and extract professional insights
        
        Args:
            source_id (str): Unique identifier of the RSS source
        
        Returns:
            dict: Crawling results and extracted professional insights
        """
        async with self.AsyncSessionLocal() as session:
            # Retrieve RSS source details
            source = await session.get(RSSSource, source_id)
            
            if not source or not source.active:
                return {"status": "inactive", "source_id": source_id}
            
            # Fetch and parse RSS feed
            async with aiohttp.ClientSession() as http_session:
                async with http_session.get(source.url) as response:
                    feed_content = await response.text()
            
            parsed_feed = feedparser.parse(feed_content)
            
            # Process each entry
            professional_insights = []
            for entry in parsed_feed.entries:
                # Extract professional metadata
                insight = {
                    "title": entry.get('title', ''),
                    "link": entry.get('link', ''),
                    "published": entry.get('published', datetime.now()),
                    "summary": entry.get('summary', ''),
                    "categories": entry.get('tags', []),
                    "source_category": source.category
                }
                
                # Analyze and extract professional context
                professional_context = self._extract_professional_context(insight)
                
                # Store insights
                professional_entry = ProfessionalInsight(
                    source_id=source_id,
                    title=insight['title'],
                    link=insight['link'],
                    published=insight['published'],
                    summary=insight['summary'],
                    professional_context=professional_context
                )
                
                session.add(professional_entry)
                professional_insights.append(professional_entry)
            
            # Update source last crawled timestamp
            source.last_crawled = datetime.now()
            await session.commit()
        
        return {
            "status": "success",
            "source_id": source_id,
            "insights_count": len(professional_insights)
        }
    
    def _extract_professional_context(self, insight):
        """
        Advanced context extraction from professional insights
        
        Args:
            insight (dict): Professional insight metadata
        
        Returns:
            dict: Extracted professional context and potential signals
        """
        # Implement advanced NLP and context extraction
        # This is a placeholder for sophisticated analysis
        context = {
            "potential_career_signals": [],
            "industry_keywords": [],
            "role_implications": None
        }
        
        # TODO: Implement advanced NLP context extraction
        # - Use spaCy or similar for named entity recognition
        # - Implement industry-specific keyword matching
        # - Extract potential career transition signals
        
        return context
    
    async def continuous_crawl(self):
        """
        Continuously crawl registered RSS sources
        Implements intelligent scheduling and error handling
        """
        while True:
            for source_id in self.rss_sources:
                try:
                    result = await self.crawl_professional_rss(source_id)
                    print(f"Crawled source {source_id}: {result}")
                except Exception as e:
                    print(f"Error crawling {source_id}: {e}")
                
                # Implement adaptive crawl intervals
                await asyncio.sleep(3600)  # 1-hour base interval

# Example usage
async def main():
    crawler = ProfessionalDataCrawler(
        database_url="postgresql+asyncpg://user:pass@localhost/careerdatabase",
        rss_sources=[
            "https://www.linkedin.com/feed/news/technology",
            "https://techcrunch.com/feed/",
            "https://hbr.org/feed"
        ]
    )
    
    # Register sources
    await crawler.register_rss_source(
        "https://techcrunch.com/feed/", 
        category="technology", 
        tags=["startup", "innovation"]
    )
    
    # Start continuous crawling
    await crawler.continuous_crawl()

if __name__ == "__main__":
    asyncio.run(main())
```

## Data Collection Strategy

### Key Objectives
1. Build comprehensive professional trajectory databases
2. Collect contextual professional insights
3. Enable dynamic career pattern analysis
4. Support Q4D-Lenz confidence-building mechanism

### Data Collection Approaches
- RSS Feed Crawling
- Professional Network Integration
- Industry News Analysis
- Career Transition Tracking

### Advanced Analysis Capabilities
- Career Progression Mapping
- Skill Evolution Tracking
- Professional Achievement Cataloging
- Contextual Career Transition Insights

## Implementation Roadmap
1. Database Schema Design (Complete)
2. RSS Crawler Development
3. Professional Context Extraction
4. Machine Learning Model Training
5. Continuous Data Enrichment

## Technical Considerations
- Asynchronous Architecture
- Scalable Database Design
- Privacy and Ethical Data Collection
- Adaptive Crawling Mechanisms

## Next Steps
1. Set up PostgreSQL database
2. Configure async SQLAlchemy connections
3. Implement advanced NLP context extraction
4. Develop machine learning models for career pattern recognition
