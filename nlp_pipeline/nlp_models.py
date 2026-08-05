"""
NLP Data Models

Structured models for NLP analysis results
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class SentimentType(Enum):
    """Sentiment classification"""
    VERY_POSITIVE = "very_positive"
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    VERY_NEGATIVE = "very_negative"


class EntityType(Enum):
    """Named entity types"""
    PERSON = "PERSON"
    ORG = "ORG"
    GPE = "GPE"  # Geopolitical entity (country, city)
    PRODUCT = "PRODUCT"
    MONEY = "MONEY"
    DATE = "DATE"
    PERCENT = "PERCENT"


@dataclass
class Entity:
    """Extracted named entity"""
    text: str
    entity_type: EntityType
    start_char: int
    end_char: int
    confidence: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Metric:
    """Extracted financial or business metric"""
    name: str  # e.g., "revenue", "funding", "employees"
    value: Optional[float] = None
    unit: Optional[str] = None  # e.g., "USD", "millions"
    period: Optional[str] = None  # e.g., "2023", "Q4 2023"
    confidence: float = 0.0
    source_text: str = ""


@dataclass
class SentimentScore:
    """Sentiment analysis result"""
    text: str
    sentiment: SentimentType
    confidence: float  # 0.0-1.0
    scores: Dict[str, float] = field(default_factory=dict)  # pos, neg, neu, compound
    entities_mentioned: List[str] = field(default_factory=list)


@dataclass
class TopicClassification:
    """Text topic classification"""
    text: str
    topics: Dict[str, float] = field(default_factory=dict)  # topic -> confidence
    primary_topic: Optional[str] = None
    confidence: float = 0.0
    keywords: List[str] = field(default_factory=list)


@dataclass
class IndustryClassification:
    """Industry classification result"""
    industries: Dict[str, float] = field(default_factory=dict)  # industry -> confidence
    primary_industry: Optional[str] = None
    confidence: float = 0.0
    keywords: List[str] = field(default_factory=list)
    categories: List[str] = field(default_factory=list)


@dataclass
class TextAnalysisResult:
    """Complete NLP analysis result"""
    original_text: str
    text_length: int

    # Entities
    entities: List[Entity] = field(default_factory=list)
    metrics: List[Metric] = field(default_factory=list)

    # Sentiment
    sentiment: Optional[SentimentScore] = None

    # Classification
    topics: Optional[TopicClassification] = None
    industry: Optional[IndustryClassification] = None

    # Quality
    text_quality_score: float = 0.0  # 0.0-1.0 (coherence, length, etc.)
    extraction_confidence: float = 0.0  # Overall confidence in extractions

    # Metadata
    analyzed_at: datetime = field(default_factory=datetime.now)
    processing_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'text_length': self.text_length,
            'entities_count': len(self.entities),
            'metrics_count': len(self.metrics),
            'sentiment': {
                'type': self.sentiment.sentiment.value if self.sentiment else None,
                'confidence': self.sentiment.confidence if self.sentiment else 0.0
            } if self.sentiment else None,
            'primary_topic': self.topics.primary_topic if self.topics else None,
            'primary_industry': self.industry.primary_industry if self.industry else None,
            'text_quality_score': self.text_quality_score,
            'extraction_confidence': self.extraction_confidence,
            'processing_time_ms': self.processing_time_ms,
        }


@dataclass
class EnhancedCompanyData:
    """Company data enhanced with NLP analysis"""
    company_name: str
    original_data: Dict[str, Any]

    # Analysis of description
    description_analysis: Optional[TextAnalysisResult] = None

    # Analysis of news articles
    news_sentiments: List[SentimentScore] = field(default_factory=list)
    news_topics: List[TopicClassification] = field(default_factory=list)

    # Extracted information
    extracted_entities: List[Entity] = field(default_factory=list)
    extracted_metrics: List[Metric] = field(default_factory=list)

    # Overall assessment
    overall_sentiment: Optional[SentimentType] = None
    sentiment_trend: Optional[str] = None  # "positive", "negative", "neutral"

    # Industry and classification
    detected_industries: Dict[str, float] = field(default_factory=dict)
    detected_business_areas: List[str] = field(default_factory=list)

    # Quality metrics
    nlp_quality_score: float = 0.0  # 0.0-1.0
    data_enrichment_score: float = 0.0  # How much NLP enhanced the data

    # Metadata
    analyzed_at: datetime = field(default_factory=datetime.now)
    total_processing_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'company_name': self.company_name,
            'description_analysis': self.description_analysis.to_dict() if self.description_analysis else None,
            'news_sentiments_count': len(self.news_sentiments),
            'average_news_sentiment': self._avg_sentiment(),
            'extracted_entities_count': len(self.extracted_entities),
            'extracted_metrics_count': len(self.extracted_metrics),
            'overall_sentiment': self.overall_sentiment.value if self.overall_sentiment else None,
            'detected_industries': self.detected_industries,
            'nlp_quality_score': self.nlp_quality_score,
            'data_enrichment_score': self.data_enrichment_score,
        }

    def _avg_sentiment(self) -> Optional[float]:
        """Calculate average sentiment from news"""
        if not self.news_sentiments:
            return None

        # Map sentiment to numeric value
        sentiment_values = {
            SentimentType.VERY_POSITIVE: 1.0,
            SentimentType.POSITIVE: 0.5,
            SentimentType.NEUTRAL: 0.0,
            SentimentType.NEGATIVE: -0.5,
            SentimentType.VERY_NEGATIVE: -1.0,
        }

        avg = sum(
            sentiment_values.get(s.sentiment, 0.0)
            for s in self.news_sentiments
        ) / len(self.news_sentiments)

        return avg
