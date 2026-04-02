"""
NLP Pipeline Orchestrator

Main orchestrator for the complete NLP processing pipeline
"""

import time
import logging
from typing import Dict, Optional, List, Any

from .nlp_models import (
    TextAnalysisResult,
    EnhancedCompanyData,
    SentimentType,
    Entity,
)
from .entity_extraction import EntityExtractor, MetricExtractor, RelationshipExtractor
from .sentiment_analysis import SentimentAnalyzer, TrendAnalyzer
from .text_classification import IndustryClassifier, TopicClassifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NLPPipeline:
    """Main NLP processing pipeline"""

    def __init__(self):
        """Initialize all NLP components"""
        self.entity_extractor = EntityExtractor()
        self.metric_extractor = MetricExtractor()
        self.relationship_extractor = RelationshipExtractor()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.trend_analyzer = TrendAnalyzer()
        self.industry_classifier = IndustryClassifier()
        self.topic_classifier = TopicClassifier()
        logger.info("NLP Pipeline initialized")

    def analyze_text(self, text: str) -> TextAnalysisResult:
        """
        Complete NLP analysis of a single text

        Args:
            text: Text to analyze

        Returns:
            Comprehensive analysis result
        """
        start_time = time.time()

        if not text or len(text.strip()) < 3:
            return TextAnalysisResult(
                original_text=text,
                text_length=len(text),
                text_quality_score=0.0,
                processing_time_ms=0.0
            )

        # Extract entities
        entities = self.entity_extractor.extract_entities(text)

        # Extract metrics
        metrics = self.metric_extractor.extract_metrics(text)

        # Analyze sentiment
        sentiment = self.sentiment_analyzer.analyze(text)

        # Classify topics
        topics = self.topic_classifier.classify(text)

        # Classify industry
        industry = self.industry_classifier.classify(text)

        # Calculate text quality score
        text_quality = self._calculate_text_quality(text, entities, metrics)

        # Calculate extraction confidence
        extraction_confidence = self._calculate_extraction_confidence(entities, metrics)

        processing_time = (time.time() - start_time) * 1000  # Convert to ms

        return TextAnalysisResult(
            original_text=text,
            text_length=len(text),
            entities=entities,
            metrics=metrics,
            sentiment=sentiment,
            topics=topics,
            industry=industry,
            text_quality_score=text_quality,
            extraction_confidence=extraction_confidence,
            processing_time_ms=processing_time
        )

    def analyze_company(
        self,
        company_data: Dict[str, Any]
    ) -> EnhancedCompanyData:
        """
        Complete NLP analysis of company data from web scraper

        Args:
            company_data: Company data dict from web scraper

        Returns:
            Enhanced company data with NLP analysis
        """
        start_time = time.time()
        company_name = company_data.get('name', 'Unknown')
        logger.info(f"Analyzing company: {company_name}")

        enhanced = EnhancedCompanyData(
            company_name=company_name,
            original_data=company_data
        )

        # Analyze description
        description = company_data.get('description', '')
        if description:
            enhanced.description_analysis = self.analyze_text(description)

        # Analyze news articles
        news_articles = company_data.get('news', [])
        sentiments = []
        topics_list = []

        for article in news_articles[:20]:  # Limit to 20 articles
            article_text = f"{article.get('title', '')} {article.get('summary', '')}"
            if article_text.strip():
                sentiment = self.sentiment_analyzer.analyze(article_text)
                sentiments.append(sentiment)

                topic = self.topic_classifier.classify(article_text)
                topics_list.append(topic)

        enhanced.news_sentiments = sentiments

        # Analyze sentiment trend
        if sentiments:
            enhanced.sentiment_trend = self.trend_analyzer.analyze_trend(sentiments)
            avg_sentiment_score = self.trend_analyzer.get_average_sentiment(sentiments)
            enhanced.overall_sentiment = self._score_to_sentiment(avg_sentiment_score)

        # Extract entities from all text
        all_text = self._combine_text(company_data)
        entities = self.entity_extractor.extract_entities(all_text)
        enhanced.extracted_entities = entities[:50]  # Limit to 50

        # Extract metrics
        metrics = self.metric_extractor.extract_metrics(all_text)
        enhanced.extracted_metrics = metrics

        # Classify industry from description
        if description:
            industry_result = self.industry_classifier.classify(description)
            enhanced.detected_industries = industry_result.industries
            if industry_result.categories:
                enhanced.detected_business_areas = industry_result.categories

        # Calculate quality scores
        enhanced.nlp_quality_score = self._calculate_nlp_quality(enhanced)
        enhanced.data_enrichment_score = self._calculate_enrichment_score(enhanced)

        processing_time = (time.time() - start_time) * 1000
        enhanced.total_processing_time_ms = processing_time

        logger.info(
            f"Analysis complete for {company_name}: "
            f"quality={enhanced.nlp_quality_score:.0%}, "
            f"enrichment={enhanced.data_enrichment_score:.0%}"
        )

        return enhanced

    def _combine_text(self, company_data: Dict[str, Any]) -> str:
        """Combine all text fields for analysis"""
        texts = []

        if company_data.get('description'):
            texts.append(company_data['description'])

        if company_data.get('news'):
            for article in company_data['news']:
                if isinstance(article, dict):
                    texts.append(article.get('title', ''))
                    texts.append(article.get('summary', ''))
                else:
                    texts.append(str(article))

        return ' '.join(texts)

    def _calculate_text_quality(
        self,
        text: str,
        entities: List[Entity],
        metrics: List
    ) -> float:
        """Calculate text quality score"""
        score = 0.0

        # Length quality
        text_len = len(text)
        if text_len > 100:
            score += 0.2
        elif text_len > 50:
            score += 0.1

        # Entity presence
        if len(entities) > 3:
            score += 0.3
        elif len(entities) > 0:
            score += 0.15

        # Metric presence
        if len(metrics) > 2:
            score += 0.25
        elif len(metrics) > 0:
            score += 0.1

        # Sentence structure
        sentences = text.count('.') + text.count('!') + text.count('?')
        if sentences > 2:
            score += 0.15

        return min(score, 1.0)

    def _calculate_extraction_confidence(
        self,
        entities: List[Entity],
        metrics: List
    ) -> float:
        """Calculate confidence in extractions"""
        if not entities and not metrics:
            return 0.0

        entity_conf = sum(e.confidence for e in entities) / max(len(entities), 1)
        metric_conf = sum(m.confidence for m in metrics) / max(len(metrics), 1)

        combined = (entity_conf + metric_conf) / 2
        return combined

    def _calculate_nlp_quality(self, enhanced: EnhancedCompanyData) -> float:
        """Calculate overall NLP quality"""
        score = 0.0

        # Description analysis quality
        if enhanced.description_analysis:
            score += enhanced.description_analysis.text_quality_score * 0.3

        # Sentiment analysis
        if enhanced.news_sentiments:
            score += 0.3

        # Entity extraction
        if enhanced.extracted_entities:
            score += min(len(enhanced.extracted_entities) / 10, 1.0) * 0.2

        # Metric extraction
        if enhanced.extracted_metrics:
            score += min(len(enhanced.extracted_metrics) / 5, 1.0) * 0.2

        return min(score, 1.0)

    def _calculate_enrichment_score(self, enhanced: EnhancedCompanyData) -> float:
        """Calculate how much NLP enriched the data"""
        score = 0.0

        # Entities extracted
        if enhanced.extracted_entities:
            score += 0.25

        # Metrics extracted
        if enhanced.extracted_metrics:
            score += 0.25

        # Industry detected
        if enhanced.detected_industries:
            score += 0.25

        # Sentiment analyzed
        if enhanced.news_sentiments:
            score += 0.25

        return min(score, 1.0)

    def _score_to_sentiment(self, score: float) -> SentimentType:
        """Convert numeric score to sentiment type"""
        if score >= 0.5:
            return SentimentType.VERY_POSITIVE
        elif score >= 0.1:
            return SentimentType.POSITIVE
        elif score > -0.1:
            return SentimentType.NEUTRAL
        elif score >= -0.5:
            return SentimentType.NEGATIVE
        else:
            return SentimentType.VERY_NEGATIVE
