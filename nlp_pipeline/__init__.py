"""
NLP Pipeline Module

Advanced text analysis for company data:
- Entity extraction (persons, organizations, metrics)
- Sentiment analysis with trend detection
- Industry and topic classification
- Business metric extraction
- Relationship extraction (partnerships, funding)
"""

from .nlp_models import (
    TextAnalysisResult,
    EnhancedCompanyData,
    Entity,
    EntityType,
    Metric,
    SentimentScore,
    SentimentType,
    TopicClassification,
    IndustryClassification,
)

from .entity_extraction import (
    EntityExtractor,
    MetricExtractor,
    RelationshipExtractor,
)

from .sentiment_analysis import (
    SentimentAnalyzer,
    TrendAnalyzer,
)

from .text_classification import (
    IndustryClassifier,
    TopicClassifier,
)

from .nlp_pipeline import NLPPipeline

__version__ = '1.0.0'
__all__ = [
    'NLPPipeline',
    'TextAnalysisResult',
    'EnhancedCompanyData',
    'Entity',
    'EntityType',
    'Metric',
    'SentimentScore',
    'SentimentType',
    'TopicClassification',
    'IndustryClassification',
    'EntityExtractor',
    'MetricExtractor',
    'RelationshipExtractor',
    'SentimentAnalyzer',
    'TrendAnalyzer',
    'IndustryClassifier',
    'TopicClassifier',
]
