# Web Scraper Module

Automated web scraping for collecting comprehensive company information from multiple public sources. Integrates with the SMEAT Scoring Engine to provide data-driven assessments.

## Features

✅ **Multi-Source Data Collection**
- Company websites
- Crunchbase profiles
- LinkedIn company pages
- News articles and press releases
- GitHub organizations
- RSS feeds

✅ **Parallel Scraping** - Efficiently scrape multiple sources concurrently

✅ **Intelligent Caching** - Avoid redundant requests with 24-hour cache TTL

✅ **Rate Limiting** - Respectful request rates to avoid blocking

✅ **Structured Data Models** - Type-safe data classes for all information types

✅ **Data Quality Scoring** - Automatic assessment of scraped data completeness

✅ **Error Handling & Recovery** - Automatic retries with exponential backoff

✅ **JSON Export** - Machine-readable output for integration

## Installation

```bash
pip install requests beautifulsoup4 feedparser selenium
```

## Quick Start

### Basic Website Scraping

```python
from web_scraper import WebScraper

scraper = WebScraper(use_cache=True)

# Scrape a single website
company = scraper.scrape_company(
    company_name="TechStartup Inc.",
    website="techstartup.com"
)

print(f"Quality Score: {company.data_quality_score:.0%}")
print(f"Sources Used: {[s.value for s in company.sources_used]}")
```

### Multi-Source Comprehensive Scraping

```python
# Scrape from all available sources
company = scraper.scrape_company(
    company_name="TechCorp",
    website="techcorp.com",
    use_all_sources=True  # Scrape Crunchbase, LinkedIn, News, GitHub
)

# Access collected data
print(f"Description: {company.description}")
print(f"Team Size: {len(company.team_members)}")
print(f"Funding: ${company.total_funding:,.0f}")
print(f"News Articles: {len(company.news_articles)}")

scraper.close()
```

### Batch Scraping Multiple Websites

```python
websites = [
    "company1.com",
    "company2.com",
    "company3.com"
]

companies = scraper.scrape_websites(websites)
```

## Data Models

### CompanyData (Main Model)

```python
CompanyData(
    name: str                          # Company name
    domain: Optional[str]              # Website domain
    description: Optional[str]         # Company description
    founded_year: Optional[int]
    headquarters: Optional[str]
    country: Optional[str]
    industry: Optional[str]
    employees_count: Optional[int]
    
    team_members: List[Person]         # Full team
    key_executives: List[Person]       # Leadership
    
    financial_metrics: Dict[str, FinancialMetric]
    funding_rounds: List[FundingRound]
    total_funding: Optional[float]
    valuation: Optional[float]
    
    website_data: Optional[WebsiteData]
    linkedin_profile: Optional[LinkedInProfile]
    crunchbase_profile: Optional[CrunchbaseProfile]
    social_profiles: Dict[str, str]
    technologies: List[str]
    
    news_articles: List[NewsArticle]
    
    sources_used: List[DataSource]     # Which scrapers were used
    data_quality_score: float          # 0.0-1.0
    last_updated: datetime
)
```

### Data Quality Score

Score from 0.0 to 1.0 based on:
- **15%** - Has website data
- **15%** - Has description
- **20%** - Has team information
- **20%** - Has financial metrics
- **15%** - Has news articles
- **15%** - Source diversity (max 5 sources)

### Person Model

```python
Person(
    name: str
    title: str                    # Job title
    role: Optional[str]          # Role type (CEO, CTO, etc.)
    bio: Optional[str]
    image_url: Optional[str]
    social_profiles: Dict[str, str]
    source: Optional[DataSource]
)
```

### WebsiteData Model

```python
WebsiteData(
    url: str
    title: str
    description: Optional[str]
    tagline: Optional[str]
    keywords: List[str]
    contact_email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    founded_year: Optional[int]
    employees_count: Optional[int]
    social_links: Dict[str, str]
    technologies: List[str]
)
```

### NewsArticle Model

```python
NewsArticle(
    title: str
    url: str
    source: str                  # Publication name
    published_date: Optional[str]
    summary: Optional[str]
    content: Optional[str]
    sentiment: Optional[str]    # positive, negative, neutral
    topics: List[str]
)
```

## Data Sources

### 1. Company Websites

Extracts:
- Company name and description
- Contact information (email, phone)
- Team members
- Social media links
- Technology stack
- Certifications

### 2. Crunchbase

Extracts:
- Company description
- Founding date
- Funding rounds and amounts
- Total funding and valuation
- Operating status
- Leadership team
- Industry categories

**Note**: Crunchbase has strict anti-scraping policies. Consider using their official API.

### 3. LinkedIn

Extracts:
- Company overview
- Employee count
- Industries
- Specialties
- Founded year
- Headquarters location

**Note**: LinkedIn prohibits scraping. Use official LinkedIn API only.

### 4. News Articles

Scrapes from:
- HackerNews (via Algolia API - no scraping needed)
- Tech news RSS feeds
- Google News (limited access)

Extracts:
- Article titles and URLs
- Publication and dates
- Summaries
- Topics and mentions

### 5. GitHub

Extracts:
- Organization information
- Public repository data
- Team members
- Technologies used
- Activity levels

**Requires**: GitHub API token (optional, better rate limits)

## Architecture

### Class Hierarchy

```
BaseScraper (Abstract)
├── WebsiteScraper
├── CrunchbaseScraper
├── LinkedInScraper
├── NewsScraper
└── GitHubScraper

WebScraper (Orchestrator)
├── WebsiteScraper
├── CrunchbaseScraper
├── LinkedInScraper
├── NewsScraper
└── GitHubScraper

ScraperCache (Utility)
RateLimiter (Utility)
```

### Data Flow

```
Input: company_name, website
    ↓
[Parallel Scraping Tasks]
├─→ WebsiteScraper.scrape()
├─→ CrunchbaseScraper.scrape()
├─→ LinkedInScraper.scrape()
├─→ NewsScraper.scrape()
└─→ GitHubScraper.scrape()
    ↓
[Aggregate Results]
├─ Merge team members
├─ Merge financial data
├─ Combine news articles
├─ Deduplicate sources
    ↓
[Calculate Data Quality]
├─ Data completeness (%)
├─ Source diversity
├─ Confidence levels
    ↓
Output: CompanyData (structured)
```

## Caching

### How It Works

- Results cached locally for 24 hours
- Cache key: MD5 hash of URL
- Cache directory: `.cache/scraper/`
- Automatic TTL-based expiration

### Managing Cache

```python
scraper = WebScraper(use_cache=True)

# Clear all cached data
scraper.cache.clear()

# Disable caching for a request
scraper_no_cache = WebScraper(use_cache=False)
```

## Rate Limiting

### Default Behavior

- 1 request per second (configurable)
- Automatic wait between requests
- Per-scraper configuration

### Configuration

```python
# 2 requests per second
scraper = WebScraper(rate_limit=2.0)

# 0.5 requests per second (one every 2 seconds)
scraper = WebScraper(rate_limit=0.5)
```

## Usage Examples

### Example 1: Prepare Data for Scoring Engine

```python
from web_scraper import WebScraper
from scoring_engine import ScoringEngine

# Scrape company data
web_scraper = WebScraper(use_cache=True)
company = web_scraper.scrape_company("TechCorp", website="techcorp.com")

# Prepare for scoring engine
scoring_data = {
    'name': company.name,
    'description': company.description,
    'team': [{'role': p.title, 'name': p.name} for p in company.team_members],
    'financials': {k: v.value for k, v in company.financial_metrics.items()},
    'news': [a.title for a in company.news_articles],
    'web_data': {
        'founded': company.founded_year,
        'employees': company.employees_count,
        'technologies': company.technologies
    }
}

# Score the company
scoring_engine = ScoringEngine()
scores = scoring_engine.score_company(scoring_data)
```

### Example 2: Batch Processing

```python
companies_to_scrape = [
    ("TechCorp", "techcorp.com"),
    ("StartupXYZ", "startupxyz.com"),
    ("CloudCompany", "cloudcompany.com"),
]

scraper = WebScraper(max_workers=5)  # 5 parallel workers

for name, website in companies_to_scrape:
    company = scraper.scrape_company(name, website)
    quality = company.data_quality_score
    sources = len(company.sources_used)
    print(f"{name}: {quality:.0%} quality, {sources} sources")
```

### Example 3: Data Validation

```python
company = scraper.scrape_company("CompanyName")

validations = scraper.validate_company_data(company)

if not validations['has_multiple_sources']:
    print("Warning: Limited data sources used")

if validations['good_quality_score']:
    print("Data quality is good - ready for analysis")
```

### Example 4: Export to JSON

```python
company = scraper.scrape_company("CompanyName", "company.com")
data_dict = company.to_dict()

import json
with open('company_data.json', 'w') as f:
    json.dump(data_dict, f, indent=2)
```

## Error Handling

### Automatic Retries

HTTP requests automatically retry on:
- 429 (Too Many Requests)
- 500 (Server Error)
- 502 (Bad Gateway)
- 503 (Service Unavailable)
- 504 (Gateway Timeout)

### Graceful Degradation

- Missing data doesn't fail the scrape
- Partial results are still returned
- Data quality score reflects completeness
- Errors are logged but don't stop execution

### Exception Handling

```python
try:
    company = scraper.scrape_company("CompanyName")
    if company.data_quality_score < 0.5:
        print("Warning: Low confidence data")
except Exception as e:
    print(f"Scraping failed: {e}")
    # Fall back to manual data entry
```

## API Reference

### WebScraper Class

```python
WebScraper(
    use_cache=True,           # Enable caching
    rate_limit=1.0,           # Requests per second
    github_token=None,        # GitHub API token
    max_workers=3             # Parallel tasks
)

# Main methods
.scrape_company(company_name, website, use_all_sources)
.scrape_websites(websites: List[str])
.validate_company_data(company: CompanyData) -> Dict[str, bool]
.close()  # Close all sessions
```

### Individual Scrapers

```python
WebsiteScraper(use_cache, rate_limit).scrape(domain)
CrunchbaseScraper(use_cache, rate_limit).scrape(company_name)
LinkedInScraper(use_cache, rate_limit).scrape(company_name)
NewsScraper(use_cache, rate_limit).scrape(company_name, days_back=30)
GitHubScraper(use_cache, rate_limit, github_token).scrape(company_name)
```

## Terms of Service Compliance

**Important**: Always respect websites' Terms of Service and robots.txt

### Compliant Practices

✅ Use official APIs where available
✅ Respect rate limits
✅ Honor robots.txt
✅ Cache results to minimize requests
✅ Identify your scraper with User-Agent
✅ Scrape only what you need

### Non-Compliant Practices

❌ Ignore rate limits
❌ Bypass authentication
❌ Violate robots.txt
❌ Overload servers
❌ Scrape entire websites unnecessarily

## Performance

- **Website Scrape**: 0.5-2 seconds per site
- **Multi-source Scrape**: 3-10 seconds per company
- **Batch Scraping**: ~0.5s per site with 5 workers
- **Caching**: 1-2ms for cached results
- **Memory Usage**: ~5-10MB per 100 companies

## Limitations

- LinkedIn and Crunchbase have strict anti-scraping measures
- News scraping limited to public RSS feeds and APIs
- Some websites use JavaScript (would need Selenium)
- Rate limiting prevents very fast scraping
- Some data may require authentication

## Future Enhancements

- [ ] JavaScript rendering with Selenium/Playwright
- [ ] OCR for PDF documents
- [ ] SEC EDGAR filings scraper
- [ ] Twitter/X API integration
- [ ] Patent and trademark databases
- [ ] Machine learning for data quality prediction
- [ ] Automatic data reconciliation
- [ ] Email finder integration

## Testing

Run tests:

```bash
python3 -m unittest test_web_scraper.py -v
```

Coverage: 35+ unit tests

## Troubleshooting

### "Connection Refused"
- Check internet connection
- Verify website is accessible
- Check firewall/proxy settings

### "429 Too Many Requests"
- Reduce rate_limit (e.g., 0.5)
- Wait before retrying
- Check cache is working

### "Timeout"
- Increase timeout parameter
- Check network speed
- Try again later

### "HTML parsing failed"
- Website structure may have changed
- Try with cache cleared
- Report issue with specific website

## Contributing

To add a new data source:

1. Create scraper class extending `BaseScraper`
2. Implement `scrape(query: str) -> CompanyData`
3. Add unit tests
4. Update documentation
5. Add to `WebScraper.scrape_company()`

## License

Private project - Modify and use as needed
