"""
Text Classification Module

Classifies text by industry, topic, and business area
"""

from typing import Dict, List, Tuple
import re

from .nlp_models import IndustryClassification, TopicClassification


class IndustryClassifier:
    """Classifies companies by industry"""

    INDUSTRY_KEYWORDS = {
        'FinTech': [
            'payment', 'banking', 'cryptocurrency', 'blockchain', 'bitcoin',
            'ethereum', 'lending', 'insurance', 'wealth management', 'trading',
            'forex', 'stocks', 'bonds', 'transaction', 'settlement', 'crypto',
            'defi', 'digital wallet', 'nft', 'tokenization'
        ],
        'HealthTech': [
            'healthcare', 'medical', 'hospital', 'clinic', 'doctor', 'patient',
            'disease', 'treatment', 'therapy', 'pharmaceutical', 'diagnosis',
            'telemedicine', 'wellness', 'fitness', 'mental health', 'biotech',
            'genetics', 'dna', 'drug', 'vaccine'
        ],
        'EdTech': [
            'education', 'learning', 'student', 'course', 'training', 'skill',
            'university', 'school', 'classroom', 'teacher', 'lesson', 'tutorial',
            'online learning', 'elearning', 'certification', 'bootcamp'
        ],
        'AgriTech': [
            'agriculture', 'farming', 'crop', 'soil', 'harvest', 'cattle',
            'livestock', 'irrigation', 'precision farming', 'pesticide', 'fertilizer',
            'greenhouse', 'organic', 'sustainable agriculture'
        ],
        'SaaS': [
            'software', 'cloud', 'subscription', 'api', 'platform', 'application',
            'saas', 'infrastructure', 'database', 'analytics', 'crm', 'erp',
            'workflow', 'automation', 'integration'
        ],
        'E-Commerce': [
            'ecommerce', 'retail', 'shopping', 'marketplace', 'seller', 'buyer',
            'product', 'catalog', 'checkout', 'inventory', 'supplier', 'seller',
            'dropshipping', 'fulfillment'
        ],
        'Transportation': [
            'transportation', 'logistics', 'delivery', 'shipping', 'freight',
            'cargo', 'warehouse', 'distribution', 'supply chain', 'vehicle',
            'autonomous', 'ride share', 'rideshare', 'taxi', 'fleet'
        ],
        'Real Estate': [
            'real estate', 'property', 'real estate', 'real estaste', 'apartment',
            'house', 'building', 'construction', 'development', 'rent', 'lease',
            'commercial', 'residential', 'property management'
        ],
        'AI/ML': [
            'artificial intelligence', 'machine learning', 'deep learning', 'ai',
            'ml', 'neural network', 'algorithm', 'model', 'data science',
            'nlp', 'computer vision', 'prediction', 'classification'
        ],
        'IoT': [
            'internet of things', 'iot', 'sensor', 'connected', 'smart',
            'device', 'wearable', 'embedded', 'real-time', 'monitoring',
            'iot platform', 'edge computing'
        ]
    }

    def classify(self, text: str) -> IndustryClassification:
        """Classify text by industry"""
        if not text or len(text.strip()) < 10:
            return IndustryClassification()

        text_lower = text.lower()

        # Score each industry
        scores = {}
        for industry, keywords in self.INDUSTRY_KEYWORDS.items():
            score = self._calculate_industry_score(text_lower, keywords)
            if score > 0:
                scores[industry] = score

        # Normalize scores
        if scores:
            max_score = max(scores.values())
            scores = {ind: score / max_score for ind, score in scores.items()}

        # Get primary industry
        primary = max(scores.items(), key=lambda x: x[1])[0] if scores else None
        primary_confidence = scores.get(primary, 0.0) if primary else 0.0

        # Extract keywords
        keywords = self._extract_industry_keywords(text_lower, scores.keys())

        return IndustryClassification(
            industries=scores,
            primary_industry=primary,
            confidence=primary_confidence,
            keywords=keywords,
            categories=list(scores.keys())
        )

    def _calculate_industry_score(self, text: str, keywords: List[str]) -> float:
        """Calculate industry score based on keyword matches"""
        score = 0.0
        for keyword in keywords:
            # Count matches (case-insensitive, word boundaries)
            pattern = r'\b' + re.escape(keyword) + r'\b'
            matches = len(re.findall(pattern, text, re.IGNORECASE))
            score += matches

        return score

    def _extract_industry_keywords(self, text: str, industries: List[str]) -> List[str]:
        """Extract relevant keywords from text"""
        keywords = []
        for industry in industries:
            for keyword in self.INDUSTRY_KEYWORDS.get(industry, []):
                if keyword in text and keyword not in keywords:
                    keywords.append(keyword)

        return keywords[:10]  # Limit to 10


class TopicClassifier:
    """Classifies text by topic"""

    TOPIC_KEYWORDS = {
        'Product & Technology': [
            'product', 'feature', 'technology', 'tool', 'platform', 'application',
            'software', 'api', 'algorithm', 'development', 'engineering',
            'architecture', 'infrastructure'
        ],
        'Business & Growth': [
            'growth', 'revenue', 'scale', 'market', 'business', 'expansion',
            'strategy', 'opportunity', 'partnership', 'deal', 'sales',
            'acquisition', 'investment'
        ],
        'Team & Culture': [
            'team', 'employee', 'culture', 'talent', 'hiring', 'leadership',
            'management', 'people', 'diversity', 'workplace', 'company',
            'founder', 'executive'
        ],
        'Funding & Finance': [
            'funding', 'investment', 'venture', 'investor', 'valuation',
            'revenue', 'profit', 'ipo', 'acquisition', 'capital', 'series',
            'raise', 'finance'
        ],
        'News & Events': [
            'announcement', 'news', 'press', 'event', 'conference', 'award',
            'milestone', 'launch', 'release', 'opened', 'closed', 'shutdown',
            'expansion'
        ],
        'Challenges & Risk': [
            'challenge', 'risk', 'problem', 'issue', 'concern', 'difficulty',
            'lawsuit', 'scandal', 'controversy', 'decline', 'loss', 'failure'
        ]
    }

    def classify(self, text: str) -> TopicClassification:
        """Classify text by topic"""
        if not text or len(text.strip()) < 10:
            return TopicClassification()

        text_lower = text.lower()

        # Score each topic
        scores = {}
        for topic, keywords in self.TOPIC_KEYWORDS.items():
            score = self._calculate_topic_score(text_lower, keywords)
            if score > 0:
                scores[topic] = score

        # Normalize scores
        if scores:
            max_score = max(scores.values())
            scores = {topic: score / max_score for topic, score in scores.items()}

        # Get primary topic
        primary = max(scores.items(), key=lambda x: x[1])[0] if scores else None
        primary_confidence = scores.get(primary, 0.0) if primary else 0.0

        # Extract keywords
        keywords = self._extract_topic_keywords(text_lower, scores.keys())

        return TopicClassification(
            topics=scores,
            primary_topic=primary,
            confidence=primary_confidence,
            keywords=keywords
        )

    def _calculate_topic_score(self, text: str, keywords: List[str]) -> float:
        """Calculate topic score based on keyword matches"""
        score = 0.0
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            matches = len(re.findall(pattern, text, re.IGNORECASE))
            score += matches

        return score

    def _extract_topic_keywords(self, text: str, topics: List[str]) -> List[str]:
        """Extract relevant keywords from text"""
        keywords = []
        for topic in topics:
            for keyword in self.TOPIC_KEYWORDS.get(topic, []):
                if keyword in text and keyword not in keywords:
                    keywords.append(keyword)

        return keywords[:10]  # Limit to 10
