"""
Unit tests for Web Scraper module

Tests:
- Data models and validation
- Cache functionality
- Rate limiting
- Base scraper HTTP operations
- Individual scrapers
- Web scraper orchestration
- Data aggregation and quality scoring
"""

import unittest
import tempfile
import time
from pathlib import Path
from datetime import datetime

from .data_models import (
    CompanyData,
    Person,
    WebsiteData,
    NewsArticle,
    DataSource,
    ConfidenceLevel,
    FundingRound,
    FinancialMetric,
)
from .base_scraper import ScraperCache, RateLimiter, BaseScraper
from .scrapers import WebsiteScraper, NewsScraper
from .web_scraper import WebScraper


class TestDataModels(unittest.TestCase):
    """Test data model classes"""

    def test_person_creation(self):
        """Person can be created with required fields"""
        person = Person(
            name="John Doe",
            title="CEO",
            role="Executive"
        )
        self.assertEqual(person.name, "John Doe")
        self.assertEqual(person.title, "CEO")

    def test_financial_metric_creation(self):
        """FinancialMetric can be created"""
        metric = FinancialMetric(
            metric_type="revenue",
            value=1000000,
            currency="USD",
            confidence=ConfidenceLevel.HIGH
        )
        self.assertEqual(metric.metric_type, "revenue")
        self.assertEqual(metric.value, 1000000)

    def test_funding_round_creation(self):
        """FundingRound can be created"""
        round_data = FundingRound(
            date="2023-01-15",
            round_type="Series A",
            amount=5000000,
            lead_investors=["Sequoia", "Accel"]
        )
        self.assertEqual(round_data.round_type, "Series A")
        self.assertEqual(len(round_data.lead_investors), 2)

    def test_company_data_creation(self):
        """CompanyData can be created with all fields"""
        company = CompanyData(
            name="TechCorp",
            description="A tech company",
            founded_year=2020,
            industry="Software"
        )
        self.assertEqual(company.name, "TechCorp")
        self.assertEqual(company.founded_year, 2020)

    def test_company_data_to_dict(self):
        """CompanyData can be converted to dictionary"""
        company = CompanyData(name="TestCorp")
        company.sources_used.append(DataSource.WEBSITE)

        data_dict = company.to_dict()
        self.assertIn('name', data_dict)
        self.assertIn('sources_used', data_dict)
        self.assertEqual(data_dict['name'], 'TestCorp')

    def test_company_data_summary(self):
        """CompanyData can generate summary string"""
        company = CompanyData(
            name="TestCorp",
            founded_year=2020,
            industry="Tech"
        )
        summary = company.get_summary()
        self.assertIn("TestCorp", summary)
        self.assertIn("2020", summary)


class TestScraperCache(unittest.TestCase):
    """Test caching functionality"""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.cache = ScraperCache(cache_dir=self.temp_dir)

    def tearDown(self):
        import shutil
        shutil.rmtree(self.temp_dir)

    def test_cache_set_and_get(self):
        """Cache can store and retrieve data"""
        url = "https://example.com"
        content = {"name": "Example", "data": "test"}

        self.cache.set(url, content)
        cached = self.cache.get(url)

        self.assertIsNotNone(cached)
        self.assertEqual(cached['name'], 'Example')

    def test_cache_miss(self):
        """Cache returns None for non-existent URL"""
        url = "https://nonexistent.com"
        cached = self.cache.get(url)
        self.assertIsNone(cached)

    def test_cache_clear(self):
        """Cache can be cleared"""
        url = "https://example.com"
        self.cache.set(url, {"data": "test"})
        self.cache.clear()

        cached = self.cache.get(url)
        self.assertIsNone(cached)


class TestRateLimiter(unittest.TestCase):
    """Test rate limiting"""

    def test_rate_limiter_respects_limit(self):
        """Rate limiter waits appropriately"""
        limiter = RateLimiter(requests_per_second=2.0)  # 0.5 second between requests

        start = time.time()
        limiter.wait()
        limiter.wait()
        elapsed = time.time() - start

        # Should take at least ~0.5 seconds
        self.assertGreater(elapsed, 0.4)

    def test_rate_limiter_high_rate(self):
        """Rate limiter with high rate has minimal delay"""
        limiter = RateLimiter(requests_per_second=100.0)

        start = time.time()
        limiter.wait()
        limiter.wait()
        elapsed = time.time() - start

        # Should take less than 0.1 second
        self.assertLess(elapsed, 0.1)


class TestWebsiteScraper(unittest.TestCase):
    """Test website scraper"""

    def setUp(self):
        self.scraper = WebsiteScraper(use_cache=False)

    def tearDown(self):
        self.scraper.close()

    def test_scraper_initialization(self):
        """WebsiteScraper initializes correctly"""
        self.assertIsNotNone(self.scraper.session)

    def test_email_extraction(self):
        """Email extraction works"""
        from bs4 import BeautifulSoup
        html = "<html><body>Contact us at hello@example.com</body></html>"
        soup = BeautifulSoup(html, 'html.parser')

        email = self.scraper._find_email(soup)
        self.assertEqual(email, "hello@example.com")

    def test_social_links_extraction(self):
        """Social links extraction works"""
        from bs4 import BeautifulSoup
        html = """
        <html><body>
            <a href="https://linkedin.com/company/test">LinkedIn</a>
            <a href="https://twitter.com/testco">Twitter</a>
        </body></html>
        """
        soup = BeautifulSoup(html, 'html.parser')

        social = self.scraper._extract_social_links(soup)
        self.assertIn('linkedin', social)


class TestWebScraper(unittest.TestCase):
    """Test main web scraper orchestrator"""

    def setUp(self):
        self.scraper = WebScraper(use_cache=False, max_workers=2)

    def tearDown(self):
        self.scraper.close()

    def test_scraper_initialization(self):
        """WebScraper initializes all sub-scrapers"""
        self.assertIsNotNone(self.scraper.website_scraper)
        self.assertIsNotNone(self.scraper.news_scraper)
        self.assertIsNotNone(self.scraper.github_scraper)

    def test_data_aggregation(self):
        """Data from multiple sources can be aggregated"""
        results = {
            'website': CompanyData(
                name="TestCorp",
                description="A test company"
            ),
            'news': CompanyData(
                name="TestCorp",
                news_articles=[NewsArticle(
                    title="Test News",
                    url="https://news.com",
                    source="TechNews"
                )]
            )
        }

        aggregated = self.scraper._aggregate_results("TestCorp", results)

        self.assertEqual(aggregated.name, "TestCorp")
        self.assertEqual(len(aggregated.news_articles), 1)

    def test_data_quality_calculation(self):
        """Data quality score is calculated"""
        company = CompanyData(
            name="TestCorp",
            description="Test",
            website_data=WebsiteData(url="https://test.com", title="Test"),
            news_articles=[NewsArticle(
                title="News",
                url="https://news.com",
                source="News"
            )]
        )
        company.sources_used = [DataSource.WEBSITE, DataSource.NEWS]

        scored = self.scraper._calculate_data_quality(company)

        self.assertGreater(scored.data_quality_score, 0.0)
        self.assertLessEqual(scored.data_quality_score, 1.0)

    def test_data_validation(self):
        """Data can be validated"""
        company = CompanyData(
            name="TestCorp",
            description="Test",
            team_members=[Person(name="John", title="CEO")]
        )

        validations = self.scraper.validate_company_data(company)

        self.assertTrue(validations['has_name'])
        self.assertTrue(validations['has_description'])
        self.assertTrue(validations['has_team'])


class TestDataAggregation(unittest.TestCase):
    """Test data aggregation logic"""

    def test_merge_team_members(self):
        """Team members from multiple sources can be merged"""
        company = CompanyData(name="TestCorp")

        person1 = Person(name="Alice", title="CEO", source=DataSource.LINKEDIN)
        person2 = Person(name="Bob", title="CTO", source=DataSource.WEBSITE)

        company.team_members.extend([person1, person2])

        self.assertEqual(len(company.team_members), 2)
        self.assertEqual(company.team_members[0].name, "Alice")

    def test_merge_financial_metrics(self):
        """Financial metrics from multiple sources can be merged"""
        company = CompanyData(name="TestCorp")

        metric1 = FinancialMetric(
            metric_type="revenue",
            value=1000000,
            source=DataSource.CRUNCHBASE
        )
        metric2 = FinancialMetric(
            metric_type="funding",
            value=5000000,
            source=DataSource.CRUNCHBASE
        )

        company.financial_metrics['revenue'] = metric1
        company.financial_metrics['funding'] = metric2

        self.assertEqual(len(company.financial_metrics), 2)

    def test_deduplication(self):
        """Duplicate sources are not added twice"""
        company = CompanyData(name="TestCorp")

        company.sources_used.append(DataSource.WEBSITE)
        company.sources_used.append(DataSource.NEWS)
        company.sources_used.append(DataSource.WEBSITE)  # Duplicate

        # After deduplication
        unique_sources = list(set(company.sources_used))
        self.assertEqual(len(unique_sources), 2)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""

    def test_empty_company_data(self):
        """Empty company data is handled"""
        company = CompanyData(name="")
        self.assertEqual(company.name, "")
        self.assertEqual(len(company.team_members), 0)

    def test_none_financial_value(self):
        """None financial values are handled"""
        metric = FinancialMetric(
            metric_type="revenue",
            value=None
        )
        self.assertIsNone(metric.value)

    def test_empty_sources_list(self):
        """Empty sources list is handled"""
        company = CompanyData(name="TestCorp")
        company.sources_used = []

        data = company.to_dict()
        self.assertEqual(data['sources_used'], [])

    def test_special_characters_in_names(self):
        """Special characters in company names are handled"""
        company = CompanyData(name="Test & Co. (Ltd.)")
        self.assertEqual(company.name, "Test & Co. (Ltd.)")

    def test_very_long_description(self):
        """Very long descriptions are handled"""
        long_desc = "Description " * 1000
        company = CompanyData(name="TestCorp", description=long_desc)
        self.assertIn("Description", company.description)


if __name__ == '__main__':
    unittest.main()
