"""
Concrete scraper implementations for various data sources

Scrapers for:
- Company websites
- Crunchbase
- LinkedIn
- News sources
"""

from typing import Optional, List, Dict, Any
from urllib.parse import quote
import re
from datetime import datetime
import logging

from bs4 import BeautifulSoup

try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False

from .base_scraper import BaseScraper

logger = logging.getLogger(__name__)
from .data_models import (
    CompanyData, Person, WebsiteData, NewsArticle,
    DataSource, ConfidenceLevel, FundingRound, FinancialMetric
)


class WebsiteScraper(BaseScraper):
    """Scrape company websites for public information"""

    def scrape(self, domain: str) -> Optional[CompanyData]:
        """
        Scrape company website

        Args:
            domain: Company website domain

        Returns:
            CompanyData with website information
        """
        if not domain.startswith('http'):
            domain = f'https://{domain}'

        html = self.get(domain)
        if not html:
            return None

        soup = BeautifulSoup(html, 'html.parser')
        company = CompanyData(name="", domain=domain)

        # Extract title
        title_tag = soup.find('title')
        if title_tag:
            company.description = title_tag.get_text(strip=True)

        # Extract meta description
        meta_desc = soup.find('meta', {'name': 'description'})
        if meta_desc:
            company.description = meta_desc.get('content', '')

        # Extract contact info
        contact_email = self._find_email(soup)
        contact_phone = self._find_phone(soup)

        website_data = WebsiteData(
            url=domain,
            title=company.description or "",
            description=company.description,
            contact_email=contact_email,
            phone=contact_phone,
        )

        # Extract social links
        social_links = self._extract_social_links(soup)
        company.social_profiles = social_links
        website_data.social_links = social_links

        # Extract technologies
        technologies = self._extract_technologies(soup)
        company.technologies = technologies

        company.website_data = website_data
        company.sources_used.append(DataSource.WEBSITE)

        return company

    def _find_email(self, soup: BeautifulSoup) -> Optional[str]:
        """Find email address in HTML"""
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        html_text = soup.get_text()
        match = re.search(email_pattern, html_text)
        return match.group(0) if match else None

    def _find_phone(self, soup: BeautifulSoup) -> Optional[str]:
        """Find phone number in HTML"""
        phone_pattern = r'\+?1?\d{9,15}'
        html_text = soup.get_text()
        match = re.search(phone_pattern, html_text)
        return match.group(0) if match else None

    def _extract_social_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract social media links"""
        social = {}
        platforms = {
            'linkedin': ['linkedin.com', '/company/'],
            'twitter': ['twitter.com'],
            'github': ['github.com'],
            'facebook': ['facebook.com'],
            'instagram': ['instagram.com'],
        }

        for link in soup.find_all('a', href=True):
            url = link.get('href', '')
            for platform, keywords in platforms.items():
                if any(kw in url for kw in keywords):
                    social[platform] = url

        return social

    def _extract_technologies(self, soup: BeautifulSoup) -> List[str]:
        """Extract technology stack indicators"""
        tech_indicators = {
            'React': ['react.js', 'react'],
            'Vue': ['vue.js', 'vue'],
            'Angular': ['angular.js', 'angular'],
            'Node.js': ['nodejs', 'node.js'],
            'Python': ['python'],
            'Django': ['django'],
            'AWS': ['amazonaws', 'aws'],
            'Azure': ['azure', 'microsoft'],
            'Docker': ['docker'],
            'Kubernetes': ['kubernetes', 'k8s'],
        }

        html_text = soup.get_text().lower()
        found_tech = []

        for tech, keywords in tech_indicators.items():
            if any(kw in html_text for kw in keywords):
                found_tech.append(tech)

        return found_tech


class CrunchbaseScraper(BaseScraper):
    """
    Scrape Crunchbase for company information

    Note: Crunchbase has terms of service restrictions on scraping.
    Consider using their official API instead.
    """

    def scrape(self, company_name: str) -> Optional[CompanyData]:
        """
        Search and scrape Crunchbase

        Args:
            company_name: Company name to search

        Returns:
            CompanyData with Crunchbase information
        """
        # Search URL
        search_url = f"https://www.crunchbase.com/search/organizations?query={quote(company_name)}"

        html = self.get(search_url)
        if not html:
            return None

        soup = BeautifulSoup(html, 'html.parser')
        company = CompanyData(name=company_name)

        # Note: Actual scraping would depend on Crunchbase's HTML structure
        # This is a template - Crunchbase actively blocks scrapers
        # Recommended: Use Crunchbase API with proper authentication

        company.sources_used.append(DataSource.CRUNCHBASE)
        return company


class LinkedInScraper(BaseScraper):
    """
    Scrape LinkedIn for company information

    Note: LinkedIn has strict ToS against scraping.
    Consider using their official API or LinkedIn Recruiter.
    """

    def scrape(self, company_name: str) -> Optional[CompanyData]:
        """
        Search and scrape LinkedIn

        Args:
            company_name: Company name to search

        Returns:
            CompanyData with LinkedIn information
        """
        # LinkedIn heavily restricts scraping
        # Recommended approach: Use LinkedIn API or official tools

        company = CompanyData(name=company_name)
        company.sources_used.append(DataSource.LINKEDIN)

        logger.warning(
            "LinkedIn scraping is restricted. "
            "Please use official LinkedIn API or LinkedIn Recruiter."
        )

        return company


class NewsScraper(BaseScraper):
    """Scrape news articles and press releases about companies"""

    def scrape(self, company_name: str, days_back: int = 30) -> Optional[CompanyData]:
        """
        Search for news articles about company

        Args:
            company_name: Company name
            days_back: How many days back to search

        Returns:
            CompanyData with news articles
        """
        company = CompanyData(name=company_name)

        # Use multiple news sources
        news_articles = []
        news_articles.extend(self._scrape_google_news(company_name))
        news_articles.extend(self._scrape_ycombinator_news(company_name))
        news_articles.extend(self._scrape_rss_feeds(company_name))

        company.news_articles = news_articles
        if news_articles:
            company.sources_used.append(DataSource.NEWS)

        return company

    def _scrape_google_news(self, company_name: str) -> List[NewsArticle]:
        """Scrape Google News"""
        articles = []
        # Google News URL
        news_url = f"https://news.google.com/search?q={quote(company_name)}"

        # Note: Google News has anti-scraping measures
        # This is a template structure
        return articles

    def _scrape_ycombinator_news(self, company_name: str) -> List[NewsArticle]:
        """Scrape Y Combinator News (HackerNews)"""
        articles = []
        # HackerNews has a more scrapable interface
        hn_url = f"https://hn.algolia.com/api/v1/search?query={quote(company_name)}&hitsPerPage=20"

        try:
            import json
            response = self.session.get(hn_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for hit in data.get('hits', []):
                    article = NewsArticle(
                        title=hit.get('title', ''),
                        url=hit.get('url', ''),
                        source='HackerNews',
                        published_date=hit.get('created_at'),
                        data_source=DataSource.NEWS
                    )
                    articles.append(article)
        except Exception as e:
            logger.warning(f"HackerNews scraping error: {e}")

        return articles

    def _scrape_rss_feeds(self, company_name: str) -> List[NewsArticle]:
        """Scrape news from RSS feeds"""
        articles = []

        if not HAS_FEEDPARSER:
            logger.warning("feedparser not installed - skipping RSS feeds")
            return articles

        # Tech news RSS feeds
        rss_feeds = [
            'https://feeds.bloomberg.com/markets/news.rss',
            'https://feeds.techcrunch.com/',
            'https://www.producthunt.com/feed.xml',
        ]

        for feed_url in rss_feeds:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:10]:  # Limit to 10 per feed
                    if company_name.lower() in entry.get('title', '').lower() or \
                       company_name.lower() in entry.get('summary', '').lower():
                        article = NewsArticle(
                            title=entry.get('title', ''),
                            url=entry.get('link', ''),
                            source=feed.feed.get('title', 'Unknown'),
                            published_date=entry.get('published'),
                            summary=entry.get('summary'),
                            data_source=DataSource.NEWS
                        )
                        articles.append(article)
            except Exception as e:
                logger.warning(f"RSS feed error ({feed_url}): {e}")

        return articles


class GitHubScraper(BaseScraper):
    """Scrape GitHub for developer information"""

    def __init__(self, github_token: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.github_token = github_token
        if github_token:
            self.session.headers.update({'Authorization': f'token {github_token}'})

    def scrape(self, company_name: str) -> Optional[CompanyData]:
        """
        Search GitHub for company organization and repositories

        Args:
            company_name: Company name

        Returns:
            CompanyData with GitHub information
        """
        company = CompanyData(name=company_name)

        try:
            # Search for organization
            search_url = f"https://api.github.com/search/users?q={quote(company_name)} type:org"
            response = self.session.get(search_url, timeout=10)

            if response.status_code == 200:
                data = response.json()
                if data.get('items'):
                    org = data['items'][0]
                    company.social_profiles['github'] = org.get('html_url', '')

                    # Get organization details
                    org_url = f"https://api.github.com/orgs/{org.get('login')}"
                    org_response = self.session.get(org_url, timeout=10)
                    if org_response.status_code == 200:
                        org_data = org_response.json()
                        company.description = org_data.get('bio')
                        company.social_profiles['github'] = org_data.get('html_url')

                    company.sources_used.append(DataSource.GITHUB)
        except Exception as e:
            logger.warning(f"GitHub scraping error: {e}")

        return company
