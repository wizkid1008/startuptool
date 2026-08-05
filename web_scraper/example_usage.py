"""
Web Scraper Usage Examples

Demonstrates how to use the web scraper module to collect
company information from multiple sources.
"""

from .web_scraper import WebScraper
from .scrapers import WebsiteScraper, NewsScraper, GitHubScraper
import json


def example_1_basic_website_scraping():
    """Example 1: Scrape a single company website"""
    print("=" * 70)
    print("Example 1: Basic Website Scraping")
    print("=" * 70)

    scraper = WebsiteScraper(use_cache=True)

    # Scrape a website
    website = "techstartup.com"
    print(f"\nScraping {website}...")

    company = scraper.scrape(website)

    if company:
        print(f"\nExtracted Data:")
        print(f"  Description: {company.description[:100] if company.description else 'N/A'}...")
        print(f"  Contact Email: {company.website_data.contact_email if company.website_data else 'N/A'}")
        print(f"  Technologies: {', '.join(company.technologies)}")
        print(f"  Social Links: {len(company.social_profiles)} found")
        for platform, url in list(company.social_profiles.items())[:3]:
            print(f"    - {platform}: {url}")
    else:
        print("Failed to scrape website")

    scraper.close()


def example_2_multi_source_scraping():
    """Example 2: Scrape company from multiple sources"""
    print("\n" + "=" * 70)
    print("Example 2: Multi-Source Company Scraping")
    print("=" * 70)

    scraper = WebScraper(use_cache=True, max_workers=3)

    company_name = "TechCorp"
    website = "techcorp.com"

    print(f"\nScraping {company_name} from multiple sources...")
    print("  - Website")
    print("  - Crunchbase")
    print("  - News articles")
    print("  - GitHub")

    company = scraper.scrape_company(
        company_name=company_name,
        website=website,
        use_all_sources=True
    )

    print(f"\nScraping Complete:")
    print(f"  Data Quality Score: {company.data_quality_score:.0%}")
    print(f"  Sources Used: {len(company.sources_used)}")
    for source in company.sources_used:
        print(f"    - {source.value}")

    print(f"\nCollected Data:")
    print(f"  Description: {company.description[:50] if company.description else 'N/A'}...")
    print(f"  Team Members: {len(company.team_members)}")
    print(f"  Financial Metrics: {len(company.financial_metrics)}")
    print(f"  News Articles: {len(company.news_articles)}")

    if company.team_members:
        print(f"\n  Top Team Members:")
        for person in company.team_members[:3]:
            print(f"    - {person.name} ({person.title})")

    if company.news_articles:
        print(f"\n  Recent News:")
        for article in company.news_articles[:3]:
            print(f"    - {article.title[:50]}...")
            print(f"      Source: {article.source}")

    scraper.close()


def example_3_batch_website_scraping():
    """Example 3: Scrape multiple websites in parallel"""
    print("\n" + "=" * 70)
    print("Example 3: Batch Website Scraping")
    print("=" * 70)

    scraper = WebScraper(use_cache=True, max_workers=5)

    websites = [
        "techstartup.com",
        "company1.com",
        "company2.com",
        "company3.com",
    ]

    print(f"\nScraping {len(websites)} websites in parallel...")

    companies = scraper.scrape_websites(websites)

    print(f"\nScraped {len(companies)} companies successfully")

    for company in companies:
        print(f"\n  {company.name or 'Unknown'}")
        print(f"    Website: {company.website_data.url if company.website_data else 'N/A'}")
        print(f"    Technologies: {', '.join(company.technologies[:3]) if company.technologies else 'N/A'}")
        print(f"    Quality: {company.data_quality_score:.0%}")

    scraper.close()


def example_4_news_scraping():
    """Example 4: Scrape news articles about a company"""
    print("\n" + "=" * 70)
    print("Example 4: News Article Scraping")
    print("=" * 70)

    news_scraper = NewsScraper(use_cache=True)

    company_name = "TechCorp"
    print(f"\nSearching for news about {company_name}...")

    company = news_scraper.scrape(company_name, days_back=30)

    print(f"\nFound {len(company.news_articles)} relevant news articles")

    if company.news_articles:
        print(f"\nTop Articles:")
        for article in company.news_articles[:5]:
            print(f"\n  {article.title}")
            print(f"    Source: {article.source}")
            print(f"    URL: {article.url}")
            if article.published_date:
                print(f"    Date: {article.published_date}")

    news_scraper.close()


def example_5_github_scraping():
    """Example 5: Scrape GitHub organization information"""
    print("\n" + "=" * 70)
    print("Example 5: GitHub Organization Scraping")
    print("=" * 70)

    # Note: Requires GitHub token for better rate limits
    github_scraper = GitHubScraper(
        use_cache=True,
        github_token=None  # Set to your token for higher limits
    )

    company_name = "OpenAI"
    print(f"\nSearching GitHub for {company_name}...")

    company = github_scraper.scrape(company_name)

    print(f"\nGitHub Profile Information:")
    if 'github' in company.social_profiles:
        print(f"  GitHub: {company.social_profiles['github']}")
    else:
        print(f"  GitHub: Not found")

    github_scraper.close()


def example_6_data_validation():
    """Example 6: Validate scraped data quality"""
    print("\n" + "=" * 70)
    print("Example 6: Data Quality Validation")
    print("=" * 70)

    scraper = WebScraper(use_cache=True)

    company_name = "TechCorp"
    website = "techcorp.com"

    print(f"\nScraping {company_name}...")
    company = scraper.scrape_company(company_name, website)

    print(f"\nData Quality Validation:")
    validations = scraper.validate_company_data(company)

    checks = {
        'has_name': '✓' if validations['has_name'] else '✗',
        'has_description': '✓' if validations['has_description'] else '✗',
        'has_website': '✓' if validations['has_website'] else '✗',
        'has_team': '✓' if validations['has_team'] else '✗',
        'has_financial_data': '✓' if validations['has_financial_data'] else '✗',
        'has_news': '✓' if validations['has_news'] else '✗',
        'has_multiple_sources': '✓' if validations['has_multiple_sources'] else '✗',
        'good_quality_score': '✓' if validations['good_quality_score'] else '✗',
    }

    for check, symbol in checks.items():
        status = "PASS" if symbol == '✓' else "FAIL"
        print(f"  {symbol} {check:25} [{status}]")

    print(f"\nOverall Quality Score: {company.data_quality_score:.0%}")

    scraper.close()


def example_7_export_to_json():
    """Example 7: Export scraped data to JSON"""
    print("\n" + "=" * 70)
    print("Example 7: Export Scraped Data to JSON")
    print("=" * 70)

    scraper = WebScraper(use_cache=True)

    company_name = "TechCorp"
    print(f"\nScraping {company_name}...")
    company = scraper.scrape_company(company_name, website="techcorp.com")

    # Convert to dictionary
    company_dict = company.to_dict()

    print(f"\nJSON Export Preview:")
    json_str = json.dumps(company_dict, indent=2)
    print(json_str[:500] + "...")

    # Save to file
    output_file = f"{company_name}_scraped_data.json"
    with open(output_file, 'w') as f:
        json.dump(company_dict, f, indent=2)

    print(f"\nFull data saved to {output_file}")

    scraper.close()


def example_8_integration_with_scoring():
    """Example 8: Prepare scraped data for scoring engine"""
    print("\n" + "=" * 70)
    print("Example 8: Integration with Scoring Engine")
    print("=" * 70)

    scraper = WebScraper(use_cache=True)

    company_name = "TechCorp"
    print(f"\nScraping {company_name} for scoring engine...")

    company = scraper.scrape_company(company_name, website="techcorp.com")

    # Prepare data for scoring engine
    scoring_data = {
        'name': company.name,
        'description': company.description or '',
        'team': [
            {
                'role': person.title,
                'name': person.name
            }
            for person in company.team_members
        ],
        'financials': {
            'revenue': company.financial_metrics.get('revenue').value
                       if company.financial_metrics.get('revenue') else None,
            'funding': company.financial_metrics.get('funding').value
                       if company.financial_metrics.get('funding') else None,
        },
        'news': [
            article.title for article in company.news_articles
        ],
        'web_data': {
            'founded': company.founded_year,
            'employees': company.employees_count,
            'technologies': company.technologies,
        }
    }

    print(f"\nData formatted for scoring engine:")
    print(json.dumps(scoring_data, indent=2)[:400] + "...")

    print(f"\nReady to pass to ScoringEngine.score_company()")

    scraper.close()


def main():
    """Run all examples"""
    try:
        example_1_basic_website_scraping()
        example_2_multi_source_scraping()
        example_3_batch_website_scraping()
        example_4_news_scraping()
        example_5_github_scraping()
        example_6_data_validation()
        example_7_export_to_json()
        example_8_integration_with_scoring()
    except Exception as e:
        print(f"\nExample Error: {e}")
        print("Note: Some examples require working internet connections")

    print("\n" + "=" * 70)
    print("Examples complete!")
    print("=" * 70)


if __name__ == '__main__':
    main()
