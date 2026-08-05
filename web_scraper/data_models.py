"""
Data models for web scraper

Defines structured data formats for company information
extracted from various web sources.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DataSource(Enum):
    """Supported data sources"""
    WEBSITE = "website"
    CRUNCHBASE = "crunchbase"
    LINKEDIN = "linkedin"
    NEWS = "news"
    SEC_FILINGS = "sec_filings"
    TWITTER = "twitter"
    GITHUB = "github"


class ConfidenceLevel(Enum):
    """Data confidence/reliability levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNVERIFIED = "unverified"


@dataclass
class Person:
    """Team member or company contact"""
    name: str
    title: str
    role: Optional[str] = None  # CEO, CTO, etc.
    bio: Optional[str] = None
    image_url: Optional[str] = None
    social_profiles: Dict[str, str] = field(default_factory=dict)  # linkedin, twitter, etc.
    source: Optional[DataSource] = None
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class FinancialMetric:
    """Financial information"""
    metric_type: str  # 'revenue', 'funding', 'valuation', 'burn_rate', etc.
    value: float
    currency: str = "USD"
    period: Optional[str] = None  # For time-series data
    source: Optional[DataSource] = None
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class FundingRound:
    """Funding event"""
    date: Optional[str] = None  # YYYY-MM-DD
    round_type: str = ""  # Seed, Series A, Series B, etc.
    amount: Optional[float] = None
    currency: str = "USD"
    lead_investors: List[str] = field(default_factory=list)
    participants: List[str] = field(default_factory=list)
    valuation: Optional[float] = None
    source: Optional[DataSource] = None
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class NewsArticle:
    """News mention or press article"""
    title: str
    url: str
    source: str  # Publication name
    published_date: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    sentiment: Optional[str] = None  # positive, negative, neutral
    topics: List[str] = field(default_factory=list)
    data_source: Optional[DataSource] = None
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class WebsiteData:
    """Information extracted from company website"""
    url: str
    title: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    keywords: List[str] = field(default_factory=list)
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    founded_year: Optional[int] = None
    employees_count: Optional[int] = None
    social_links: Dict[str, str] = field(default_factory=dict)
    blog_url: Optional[str] = None
    careers_url: Optional[str] = None
    certifications: List[str] = field(default_factory=list)
    technologies: List[str] = field(default_factory=list)  # Tech stack
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class LinkedInProfile:
    """LinkedIn company profile data"""
    profile_url: str
    linkedin_id: Optional[str] = None
    company_name: str = ""
    headline: Optional[str] = None
    description: Optional[str] = None
    followers: Optional[int] = None
    employees: Optional[int] = None
    locations: List[str] = field(default_factory=list)
    industries: List[str] = field(default_factory=list)
    specialties: List[str] = field(default_factory=list)
    website: Optional[str] = None
    founded_year: Optional[int] = None
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class CrunchbaseProfile:
    """Crunchbase company profile data"""
    cb_url: str
    cb_id: Optional[str] = None
    company_name: str = ""
    short_description: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    founded_year: Optional[int] = None
    employees_count: Optional[int] = None
    operating_status: Optional[str] = None  # active, ipo, acquired, closed
    headquarters: Optional[str] = None
    industries: List[str] = field(default_factory=list)
    categories: List[str] = field(default_factory=list)
    country_code: Optional[str] = None
    extraction_failed: bool = False
    extracted_at: datetime = field(default_factory=datetime.now)


@dataclass
class CompanyData:
    """Aggregated company information from all sources"""
    name: str
    domain: Optional[str] = None  # Company website domain

    # Basic info
    description: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    categories: List[str] = field(default_factory=list)

    # Team
    employees_count: Optional[int] = None
    team_members: List[Person] = field(default_factory=list)
    key_executives: List[Person] = field(default_factory=list)

    # Finance
    financial_metrics: Dict[str, FinancialMetric] = field(default_factory=dict)
    funding_rounds: List[FundingRound] = field(default_factory=list)
    total_funding: Optional[float] = None
    valuation: Optional[float] = None
    status: Optional[str] = None  # active, ipo, acquired, closed

    # Online presence
    website_data: Optional[WebsiteData] = None
    linkedin_profile: Optional[LinkedInProfile] = None
    crunchbase_profile: Optional[CrunchbaseProfile] = None
    social_profiles: Dict[str, str] = field(default_factory=dict)
    technologies: List[str] = field(default_factory=list)

    # News and media
    news_articles: List[NewsArticle] = field(default_factory=list)

    # Metadata
    sources_used: List[DataSource] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.now)
    data_quality_score: float = 0.0  # 0.0-1.0
    confidence_scores: Dict[str, ConfidenceLevel] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'name': self.name,
            'domain': self.domain,
            'description': self.description,
            'founded_year': self.founded_year,
            'headquarters': self.headquarters,
            'country': self.country,
            'industry': self.industry,
            'categories': self.categories,
            'employees_count': self.employees_count,
            'team_members': [
                {
                    'name': p.name,
                    'title': p.title,
                    'role': p.role,
                    'source': p.source.value if p.source else None
                }
                for p in self.team_members
            ],
            'key_executives': [
                {
                    'name': p.name,
                    'title': p.title,
                    'role': p.role,
                    'source': p.source.value if p.source else None
                }
                for p in self.key_executives
            ],
            'financial_metrics': {
                k: {
                    'metric_type': v.metric_type,
                    'value': v.value,
                    'currency': v.currency,
                    'period': v.period,
                    'confidence': v.confidence.value
                }
                for k, v in self.financial_metrics.items()
            },
            'funding_rounds': [
                {
                    'date': fr.date,
                    'round_type': fr.round_type,
                    'amount': fr.amount,
                    'currency': fr.currency,
                    'lead_investors': fr.lead_investors,
                    'valuation': fr.valuation
                }
                for fr in self.funding_rounds
            ],
            'total_funding': self.total_funding,
            'valuation': self.valuation,
            'status': self.status,
            'website': self.website_data.url if self.website_data else None,
            'social_profiles': self.social_profiles,
            'technologies': self.technologies,
            'news_count': len(self.news_articles),
            'sources_used': [s.value for s in self.sources_used],
            'last_updated': self.last_updated.isoformat(),
            'data_quality_score': self.data_quality_score,
        }

    def get_summary(self) -> str:
        """Generate human-readable summary"""
        lines = [
            f"Company: {self.name}",
            f"Founded: {self.founded_year or 'Unknown'}",
            f"Headquarters: {self.headquarters or 'Unknown'}",
            f"Industry: {self.industry or 'Unknown'}",
            f"Employees: {self.employees_count or 'Unknown'}",
            f"Total Funding: ${self.total_funding:,.0f}" if self.total_funding else "Funding: Unknown",
            f"Team Members: {len(self.team_members)}",
            f"News Articles: {len(self.news_articles)}",
            f"Data Quality: {self.data_quality_score:.0%}",
            f"Sources: {', '.join(s.value for s in self.sources_used)}",
        ]
        return "\n".join(lines)
