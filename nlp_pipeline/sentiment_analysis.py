"""
Sentiment Analysis Module

Analyzes sentiment of text with multiple methods
"""

from typing import Dict, List, Tuple
import re

from .nlp_models import SentimentScore, SentimentType


class SentimentAnalyzer:
    """Analyzes sentiment using VADER-like scoring and custom rules"""

    # Positive words
    POSITIVE_WORDS = {
        'excellent': 2.0,
        'great': 1.5,
        'good': 1.0,
        'amazing': 2.0,
        'wonderful': 2.0,
        'fantastic': 2.0,
        'awesome': 2.0,
        'outstanding': 2.0,
        'impressive': 1.5,
        'growth': 1.0,
        'success': 1.5,
        'strong': 1.0,
        'leader': 1.0,
        'innovative': 1.0,
        'award': 1.5,
        'partnership': 0.5,
        'funding': 0.5,
        'raise': 0.5,
        'expand': 0.5,
        'improve': 0.5,
    }

    # Negative words
    NEGATIVE_WORDS = {
        'bad': -1.0,
        'terrible': -2.0,
        'awful': -2.0,
        'horrible': -2.0,
        'worst': -2.0,
        'fail': -1.5,
        'failure': -2.0,
        'decline': -1.0,
        'loss': -1.0,
        'bankrupt': -2.0,
        'lawsuit': -1.5,
        'scandal': -2.0,
        'controversy': -1.5,
        'risk': -0.5,
        'challenge': -0.5,
        'problem': -1.0,
        'issue': -0.5,
        'concern': -0.5,
        'layoff': -2.0,
        'closure': -2.0,
        'acquisition': -0.5,  # Can be negative context
        'struggle': -1.5,
        'difficult': -1.0,
    }

    # Intensifiers (boost adjacent sentiment)
    INTENSIFIERS = {
        'very': 1.5,
        'extremely': 1.5,
        'incredibly': 1.5,
        'absolutely': 1.5,
        'really': 1.3,
        'quite': 1.2,
        'so': 1.3,
        'remarkably': 1.5,
    }

    # Negations (flip sentiment)
    NEGATIONS = {
        'not', "n't", 'no', 'never', 'neither', 'nobody', 'nothing'
    }

    def analyze(self, text: str) -> SentimentScore:
        """Analyze sentiment of text"""
        if not text or len(text.strip()) < 3:
            return SentimentScore(
                text=text,
                sentiment=SentimentType.NEUTRAL,
                confidence=0.0,
                scores={'pos': 0.0, 'neg': 0.0, 'neu': 1.0, 'compound': 0.0}
            )

        # Calculate scores
        pos_score, neg_score, neu_score, compound = self._calculate_scores(text)

        # Determine sentiment type
        sentiment = self._classify_sentiment(compound)

        # Normalize scores
        total = abs(pos_score) + abs(neg_score) + neu_score
        if total > 0:
            pos_score /= total
            neg_score /= total
            neu_score /= total

        # Calculate confidence
        confidence = max(abs(compound), 0.0)

        # Extract entities mentioned
        entities = self._extract_mentioned_entities(text)

        return SentimentScore(
            text=text,
            sentiment=sentiment,
            confidence=min(confidence, 1.0),
            scores={
                'pos': max(pos_score, 0.0),
                'neg': max(neg_score, 0.0),
                'neu': max(neu_score, 0.0),
                'compound': compound
            },
            entities_mentioned=entities
        )

    def _calculate_scores(self, text: str) -> Tuple[float, float, float, float]:
        """Calculate positive, negative, neutral, and compound scores"""
        words = self._tokenize(text)
        pos_score = 0.0
        neg_score = 0.0

        for i, word in enumerate(words):
            word_lower = word.lower().strip('.,!?;:"')

            # Check for intensifiers
            intensifier = 1.0
            if i > 0:
                prev_word = words[i - 1].lower().strip('.,!?;:"')
                if prev_word in self.INTENSIFIERS:
                    intensifier = self.INTENSIFIERS[prev_word]

            # Check for negations
            negate = 1.0
            if i > 0:
                prev_word = words[i - 1].lower().strip('.,!?;:"')
                if prev_word in self.NEGATIONS:
                    negate = -1.0

            # Score positive words
            if word_lower in self.POSITIVE_WORDS:
                pos_score += self.POSITIVE_WORDS[word_lower] * intensifier * negate

            # Score negative words
            elif word_lower in self.NEGATIVE_WORDS:
                neg_score += self.NEGATIVE_WORDS[word_lower] * intensifier * negate

        # Neutral score (presence of neutral content)
        neu_score = len(words) * 0.1

        # Compound score (normalized)
        total_score = pos_score + neg_score
        compound = total_score / max(len(words), 1)
        compound = max(-1.0, min(compound, 1.0))  # Clamp to [-1, 1]

        return pos_score, neg_score, neu_score, compound

    def _classify_sentiment(self, compound: float) -> SentimentType:
        """Classify sentiment based on compound score"""
        if compound >= 0.5:
            return SentimentType.VERY_POSITIVE
        elif compound >= 0.1:
            return SentimentType.POSITIVE
        elif compound > -0.1:
            return SentimentType.NEUTRAL
        elif compound >= -0.5:
            return SentimentType.NEGATIVE
        else:
            return SentimentType.VERY_NEGATIVE

    def _tokenize(self, text: str) -> List[str]:
        """Simple word tokenization"""
        # Remove extra whitespace and split
        words = re.findall(r"\b\w+(?:'[a-z]+)?\b", text, re.IGNORECASE)
        return words

    def _extract_mentioned_entities(self, text: str) -> List[str]:
        """Extract proper nouns (capitalized words)"""
        entities = []
        words = text.split()

        for word in words:
            # Check if word starts with capital letter
            if word and word[0].isupper() and word.lower() not in ['the', 'a', 'an']:
                entity = word.strip('.,!?;:"')
                if len(entity) > 1 and entity not in entities:
                    entities.append(entity)

        return entities[:10]  # Limit to 10 entities


class TrendAnalyzer:
    """Analyzes sentiment trends over time"""

    def analyze_trend(self, sentiments: List[SentimentScore]) -> str:
        """Determine sentiment trend"""
        if not sentiments:
            return "neutral"

        if len(sentiments) < 2:
            return "neutral"

        # Get compound scores
        compounds = [s.scores.get('compound', 0.0) for s in sentiments]

        # Calculate trend
        first_half_avg = sum(compounds[:len(compounds)//2]) / max(1, len(compounds)//2)
        second_half_avg = sum(compounds[len(compounds)//2:]) / max(1, len(compounds) - len(compounds)//2)

        diff = second_half_avg - first_half_avg

        if diff > 0.2:
            return "improving"
        elif diff < -0.2:
            return "declining"
        else:
            return "stable"

    def get_average_sentiment(self, sentiments: List[SentimentScore]) -> float:
        """Get average sentiment score"""
        if not sentiments:
            return 0.0

        compounds = [s.scores.get('compound', 0.0) for s in sentiments]
        return sum(compounds) / len(compounds)
