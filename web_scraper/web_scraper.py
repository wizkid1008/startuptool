"""
Web Scraper Orchestrator

Coordinates multiple scrapers to collect comprehensive company data
from various public sources.
"""

import logging
from typing import Optional, List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse

from .data_models import CompanyData, DataSource, ConfidenceLevel
from .scrapers import (
    WebsiteScraper,
    CrunchbaseScraper,
    LinkedInScraper,
    NewsScraper,
    GitHubScraper
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebScraper:
    """Orchestrates multiple scrapers to collect company data"""

    def __init__(
        self,
        use_cache: bool = True,
        rate_limit: float = 1.0,
        github_token: Optional[str] = None,
        max_workers: int = 3
    ):
        """
        Initialize web scraper

        Args:
            use_cache: Enable result caching
            rate_limit: Requests per second
            github_token: GitHub API token for scraping
            max_workers: Max concurrent scraping tasks
        """
        self.use_cache = use_cache
        self.rate_limit = rate_limit
        self.github_token = github_token
        self.max_workers = max_workers

        # Initialize individual scrapers
        self.website_scraper = WebsiteScraper(use_cache=use_cache, rate_limit=rate_limit)
        self.crunchbase_scraper = CrunchbaseScraper(use_cache=use_cache, rate_limit=rate_limit)
        self.linkedin_scraper = LinkedInScraper(use_cache=use_cache, rate_limit=rate_limit)
        self.news_scraper = NewsScraper(use_cache=use_cache, rate_limit=rate_limit)
        self.github_scraper = GitHubScraper(
            use_cache=use_cache,
            rate_limit=rate_limit,
            github_token=github_token
        )

    def scrape_company(
        self,
        company_name: str,
        website: Optional[str] = None,
        use_all_sources: bool = True
    ) -> CompanyData:
        """
        Scrape comprehensive company information

        Args:
            company_name: Company name
            website: Optional company website domain
            use_all_sources: Scrape all available sources

        Returns:
            Aggregated CompanyData from all sources
        """
        logger.info(f"Starting comprehensive scrape for {company_name}")

        company = CompanyData(name=company_name)

        # List of scraping tasks
        tasks = []

        if website:
            tasks.append(('website', lambda: self.website_scraper.scrape(website)))

        if use_all_sources:
            tasks.append(('crunchbase', lambda: self.crunchbase_scraper.scrape(company_name)))
            tasks.append(('linkedin', lambda: self.linkedin_scraper.scrape(company_name)))
            tasks.append(('news', lambda: self.news_scraper.scrape(company_name)))
            tasks.append(('github', lambda: self.github_scraper.scrape(company_name)))

        # Execute scraping tasks in parallel
        results = {}
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_source = {
                executor.submit(task_func): source
                for source, task_func in tasks
            }

            for future in as_completed(future_to_source):
                source = future_to_source[future]
                try:
                    result = future.result()
                    results[source] = result
                    logger.info(f"Completed {source} scraping")
                except Exception as e:
                    logger.error(f"Error scraping {source}: {e}")

        # Aggregate results
        company = self._aggregate_results(company_name, results)
        company = self._calculate_data_quality(company)

        logger.info(f"Scraping complete for {company_name}: {company.data_quality_score:.0%} quality")

        return company

    def scrape_websites(self, websites: List[str]) -> List[CompanyData]:
        """
        Scrape multiple websites

        Args:
            websites: List of website URLs or domains

        Returns:
            List of CompanyData objects
        """
        companies = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self.website_scraper.scrape, website): website
                for website in websites
            }

            for future in as_completed(futures):
                website = futures[future]
                try:
                    company = future.result()
                    if company:
                        companies.append(company)
                except Exception as e:
                    logger.error(f"Error scraping {website}: {e}")

        return companies

    def _aggregate_results(self, company_name: str, results: dict) -> CompanyData:
        """Merge results from multiple scrapers"""
        company = CompanyData(name=company_name)

        for source, data in results.items():
            if not data:
                continue

            # Merge website data
            if source == 'website' and data.website_data:
                company.website_data = data.website_data
                if data.description:
                    company.description = data.description
                company.social_profiles.update(data.social_profiles)
                company.technologies.extend(data.technologies)

            # Merge news articles
            if source == 'news' and data.news_articles:
                company.news_articles.extend(data.news_articles)

            # Merge team members
            if data.team_members:
                company.team_members.extend(data.team_members)

            # Merge financial data
            if data.financial_metrics:
                company.financial_metrics.update(data.financial_metrics)

            # Add source
            if data.sources_used:
                for src in data.sources_used:
                    if src not in company.sources_used:
                        company.sources_used.append(src)

        return company

    def _calculate_data_quality(self, company: CompanyData) -> CompanyData:
        """Calculate overall data quality score (0.0 - 1.0)"""
        quality_factors = {
            'has_website': 0.15 if company.website_data else 0.0,
            'has_description': 0.15 if company.description else 0.0,
            'has_team': 0.20 if company.team_members else 0.0,
            'has_financials': 0.20 if company.financial_metrics else 0.0,
            'has_news': 0.15 if company.news_articles else 0.0,
            'source_diversity': 0.15 * (len(company.sources_used) / 5),  # Max 5 sources
        }

        company.data_quality_score = min(sum(quality_factors.values()), 1.0)

        # Set confidence levels for each data type
        if company.website_data:
            company.confidence_scores['website'] = ConfidenceLevel.HIGH
        if company.team_members:
            company.confidence_scores['team'] = ConfidenceLevel.MEDIUM
        if company.financial_metrics:
            company.confidence_scores['financials'] = ConfidenceLevel.MEDIUM
        if company.news_articles:
            company.confidence_scores['news'] = ConfidenceLevel.HIGH

        return company

    def validate_company_data(self, company: CompanyData) -> Dict[str, bool]:
        """
        Validate scraped data quality

        Returns:
            Dict of validation results
        """
        validations = {
            'has_name': bool(company.name),
            'has_description': bool(company.description),
            'has_website': bool(company.website_data or company.social_profiles.get('website')),
            'has_team': len(company.team_members) > 0,
            'has_financial_data': len(company.financial_metrics) > 0,
            'has_news': len(company.news_articles) > 0,
            'has_multiple_sources': len(company.sources_used) > 2,
            'good_quality_score': company.data_quality_score > 0.5,
        }

        return validations

    def close(self):
        """Close all scraper sessions"""
        self.website_scraper.close()
        self.crunchbase_scraper.close()
        self.linkedin_scraper.close()
        self.news_scraper.close()
        self.github_scraper.close()
        logger.info("All scraper sessions closed")
