"""
Base scraper class and utilities

Provides common functionality for all scrapers:
- HTTP requests with retry logic
- Caching
- Rate limiting
- Error handling
- User-agent rotation
"""

import time
import hashlib
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from pathlib import Path


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScraperCache:
    """Simple file-based cache for scraper results"""

    def __init__(self, cache_dir: str = '.cache/scraper'):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl_hours = 24  # Cache validity period

    def _get_cache_key(self, url: str) -> str:
        """Generate cache key from URL"""
        return hashlib.md5(url.encode()).hexdigest()

    def _get_cache_file(self, key: str) -> Path:
        """Get cache file path"""
        return self.cache_dir / f"{key}.json"

    def get(self, url: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached data if valid"""
        key = self._get_cache_key(url)
        file = self._get_cache_file(key)

        if not file.exists():
            return None

        try:
            with open(file, 'r') as f:
                data = json.load(f)

            # Check if cache is still valid
            cached_at = datetime.fromisoformat(data.get('cached_at', ''))
            if datetime.now() - cached_at > timedelta(hours=self.ttl_hours):
                logger.info(f"Cache expired for {url}")
                return None

            logger.info(f"Cache hit for {url}")
            return data.get('content')
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
            return None

    def set(self, url: str, content: Dict[str, Any]) -> bool:
        """Cache data"""
        key = self._get_cache_key(url)
        file = self._get_cache_file(key)

        try:
            data = {
                'url': url,
                'content': content,
                'cached_at': datetime.now().isoformat()
            }
            with open(file, 'w') as f:
                json.dump(data, f)
            return True
        except Exception as e:
            logger.warning(f"Cache write error: {e}")
            return False

    def clear(self):
        """Clear all cached data"""
        for file in self.cache_dir.glob('*.json'):
            file.unlink()
        logger.info("Cache cleared")


class RateLimiter:
    """Simple rate limiter"""

    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request_time = 0

    def wait(self):
        """Wait if necessary to respect rate limit"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()


class BaseScraper(ABC):
    """Abstract base class for all scrapers"""

    # User agents to rotate through
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    ]

    def __init__(self, use_cache: bool = True, rate_limit: float = 1.0):
        """
        Initialize scraper

        Args:
            use_cache: Enable caching of results
            rate_limit: Requests per second
        """
        self.use_cache = use_cache
        self.cache = ScraperCache() if use_cache else None
        self.rate_limiter = RateLimiter(rate_limit)
        self.session = self._create_session()
        self.ua_index = 0

    def _create_session(self) -> requests.Session:
        """Create session with retry strategy"""
        session = requests.Session()

        # Retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=['GET', 'POST']
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount('http://', adapter)
        session.mount('https://', adapter)

        return session

    def _get_user_agent(self) -> str:
        """Get next user agent"""
        ua = self.USER_AGENTS[self.ua_index % len(self.USER_AGENTS)]
        self.ua_index += 1
        return ua

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        return {
            'User-Agent': self._get_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def get(self, url: str, timeout: int = 10) -> Optional[str]:
        """
        Fetch URL with caching and rate limiting

        Args:
            url: URL to fetch
            timeout: Request timeout in seconds

        Returns:
            HTML content or None if failed
        """
        # Check cache
        if self.use_cache:
            cached = self.cache.get(url)
            if cached:
                return cached.get('html')

        # Rate limit
        self.rate_limiter.wait()

        try:
            logger.info(f"Fetching {url}")
            response = self.session.get(
                url,
                headers=self._get_headers(),
                timeout=timeout
            )
            response.raise_for_status()
            html = response.text

            # Cache result
            if self.use_cache:
                self.cache.set(url, {'html': html})

            return html
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None

    @abstractmethod
    def scrape(self, query: str) -> Dict[str, Any]:
        """
        Scrape company information

        Args:
            query: Company name or identifier

        Returns:
            Structured company data
        """
        pass

    def close(self):
        """Close session"""
        self.session.close()
