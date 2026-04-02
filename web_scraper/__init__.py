"""
Web Scraper Module

Automated web scraping for collecting company information from multiple sources:
- Company websites
- Crunchbase
- LinkedIn
- News articles
- GitHub repositories

Features:
- Multi-source data collection
- Caching to avoid redundant requests
- Rate limiting to be respectful
- Parallel scraping with ThreadPoolExecutor
- Structured data models
- Data quality scoring
- Error handling and recovery
"""

from .data_models import (
    CompanyData,
    Person,
    WebsiteData,
    NewsArticle,
    LinkedInProfile,
    CrunchbaseProfile,
    FundingRound,
    FinancialMetric,
    DataSource,
    ConfidenceLevel,
)

from .base_scraper import BaseScraper, ScraperCache, RateLimiter

from .scrapers import (
    WebsiteScraper,
    CrunchbaseScraper,
    LinkedInScraper,
    NewsScraper,
    GitHubScraper,
)

from .web_scraper import WebScraper

__version__ = '1.0.0'
__all__ = [
    'WebScraper',
    'CompanyData',
    'Person',
    'WebsiteData',
    'NewsArticle',
    'LinkedInProfile',
    'CrunchbaseProfile',
    'FundingRound',
    'FinancialMetric',
    'DataSource',
    'ConfidenceLevel',
    'BaseScraper',
    'ScraperCache',
    'RateLimiter',
    'WebsiteScraper',
    'CrunchbaseScraper',
    'LinkedInScraper',
    'NewsScraper',
    'GitHubScraper',
]
