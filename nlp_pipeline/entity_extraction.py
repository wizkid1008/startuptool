"""
Entity Extraction Module

Extracts named entities and business metrics from text
"""

import re
from typing import List, Optional, Tuple
from datetime import datetime

from .nlp_models import Entity, EntityType, Metric


class EntityExtractor:
    """Extracts named entities from text"""

    # Regex patterns
    PERSON_PATTERNS = [
        r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # First Last
        r'\b[A-Z][a-z]+ [A-Z](?:\.[A-Z])? [A-Z][a-z]+\b',  # First M. Last
    ]

    ORG_PATTERNS = [
        r'\b[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)*(?:\s+(?:Inc|Ltd|LLC|Corp|Corp\.|Co\.|Co))\b',
        r'\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Inc|Ltd|LLC|Corp|Corporation|Company|Group)\b',
    ]

    MONEY_PATTERNS = [
        r'\$\s?\d+(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:million|billion|trillion|M|B|T))?',
        r'\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:million|billion|trillion|M|B|T)?\s*(?:USD|dollars)',
    ]

    PERCENT_PATTERNS = [
        r'\d+(?:\.\d+)?\s*%',
    ]

    DATE_PATTERNS = [
        r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b',
        r'\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b',
        r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b',
        r'\b[Qq](?:[1-4])\s+\d{4}\b',  # Q1 2023
        r'\b(?:FY|fiscal year)\s+\d{4}\b',
    ]

    def extract_entities(self, text: str) -> List[Entity]:
        """Extract all entities from text"""
        entities = []

        # Extract persons
        entities.extend(self._extract_by_pattern(text, self.PERSON_PATTERNS, EntityType.PERSON))

        # Extract organizations
        entities.extend(self._extract_by_pattern(text, self.ORG_PATTERNS, EntityType.ORG))

        # Extract money
        entities.extend(self._extract_by_pattern(text, self.MONEY_PATTERNS, EntityType.MONEY))

        # Extract percentages
        entities.extend(self._extract_by_pattern(text, self.PERCENT_PATTERNS, EntityType.PERCENT))

        # Extract dates
        entities.extend(self._extract_by_pattern(text, self.DATE_PATTERNS, EntityType.DATE))

        # Remove duplicates
        entities = self._deduplicate_entities(entities)

        return sorted(entities, key=lambda e: e.start_char)

    def _extract_by_pattern(
        self,
        text: str,
        patterns: List[str],
        entity_type: EntityType,
        confidence: float = 0.8
    ) -> List[Entity]:
        """Extract entities matching regex patterns"""
        entities = []

        for pattern in patterns:
            for match in re.finditer(pattern, text):
                entity = Entity(
                    text=match.group(0),
                    entity_type=entity_type,
                    start_char=match.start(),
                    end_char=match.end(),
                    confidence=confidence
                )
                entities.append(entity)

        return entities

    def _deduplicate_entities(self, entities: List[Entity]) -> List[Entity]:
        """Remove overlapping entities, keeping higher confidence"""
        if not entities:
            return []

        # Sort by confidence descending, then by position
        sorted_entities = sorted(
            entities,
            key=lambda e: (-e.confidence, e.start_char)
        )

        unique = []
        used_ranges = []

        for entity in sorted_entities:
            # Check if overlaps with already used range
            overlaps = False
            for start, end in used_ranges:
                if not (entity.end_char <= start or entity.start_char >= end):
                    overlaps = True
                    break

            if not overlaps:
                unique.append(entity)
                used_ranges.append((entity.start_char, entity.end_char))

        return unique


class MetricExtractor:
    """Extracts business metrics from text"""

    # Revenue patterns
    REVENUE_PATTERNS = [
        (r'(?:annual\s+)?revenue[:\s]+\$?([\d.]+)[:\s]+([KMB])?', 'revenue'),
        (r'generates?\s+\$?([\d.]+)[:\s]+([KMB])?\s+in\s+revenue', 'revenue'),
        (r'\$?([\d.]+)[:\s]+([KMB])?\s+(?:annual\s+)?revenue', 'revenue'),
    ]

    # Funding patterns
    FUNDING_PATTERNS = [
        (r'raised\s+\$?([\d.]+)\s+([KMB]?)(?:\s+in\s+)?(?:funding|Series\s+[A-Z])', 'funding'),
        (r'Series\s+[A-Z]\s+(?:funding|round):\s+\$?([\d.]+)\s+([KMB]?)', 'funding'),
        (r'total\s+funding:\s+\$?([\d.]+)\s+([KMB]?)', 'funding'),
    ]

    # Valuation patterns
    VALUATION_PATTERNS = [
        (r'valued\s+at\s+\$?([\d.]+)\s+([BMT]?)(?:\s+dollars)?', 'valuation'),
        (r'(\$?([\d.]+)\s+([BMT]?))\s+valuation', 'valuation'),
    ]

    # Employee count patterns
    EMPLOYEE_PATTERNS = [
        (r'([\d,]+)\s+employees?', 'employees'),
        (r'team\s+(?:of\s+)?([\d,]+)\s+people?', 'employees'),
        (r'headcount[:\s]+([\d,]+)', 'employees'),
    ]

    def extract_metrics(self, text: str) -> List[Metric]:
        """Extract business metrics from text"""
        metrics = []

        # Extract revenue
        metrics.extend(self._extract_metric(text, self.REVENUE_PATTERNS))

        # Extract funding
        metrics.extend(self._extract_metric(text, self.FUNDING_PATTERNS))

        # Extract valuation
        metrics.extend(self._extract_metric(text, self.VALUATION_PATTERNS))

        # Extract employees
        metrics.extend(self._extract_employee_count(text))

        # Remove duplicates
        metrics = self._deduplicate_metrics(metrics)

        return metrics

    def _extract_metric(self, text: str, patterns: List[Tuple[str, str]]) -> List[Metric]:
        """Extract metrics from patterns"""
        metrics = []

        for pattern, metric_name in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                try:
                    value_str = match.group(1).replace(',', '')
                    value = float(value_str)

                    # Get unit multiplier if present
                    unit = 'USD' if metric_name in ['revenue', 'funding', 'valuation'] else ''
                    if len(match.groups()) > 1 and match.group(2):
                        multiplier_map = {'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12}
                        multiplier = multiplier_map.get(match.group(2).upper(), 1)
                        value *= multiplier

                    metric = Metric(
                        name=metric_name,
                        value=value,
                        unit=unit,
                        confidence=0.85,
                        source_text=match.group(0)
                    )
                    metrics.append(metric)
                except (ValueError, IndexError):
                    continue

        return metrics

    def _extract_employee_count(self, text: str) -> List[Metric]:
        """Extract employee count specifically"""
        metrics = []

        for pattern, metric_name in self.EMPLOYEE_PATTERNS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                try:
                    value_str = match.group(1).replace(',', '')
                    value = float(value_str)

                    metric = Metric(
                        name='employees',
                        value=value,
                        unit='people',
                        confidence=0.85,
                        source_text=match.group(0)
                    )
                    metrics.append(metric)
                except (ValueError, IndexError):
                    continue

        return metrics

    def _deduplicate_metrics(self, metrics: List[Metric]) -> List[Metric]:
        """Remove duplicate metrics, keeping highest confidence"""
        if not metrics:
            return []

        # Group by metric name
        by_name = {}
        for metric in metrics:
            if metric.name not in by_name:
                by_name[metric.name] = []
            by_name[metric.name].append(metric)

        # Keep highest confidence for each metric
        unique = []
        for name, name_metrics in by_name.items():
            best = max(name_metrics, key=lambda m: m.confidence)
            unique.append(best)

        return unique


class RelationshipExtractor:
    """Extracts relationships between entities"""

    # Partnership patterns
    PARTNERSHIP_PATTERNS = [
        r'partnered?\s+with\s+([A-Z][a-zA-Z\s&]+)',
        r'partners?\s+(?:including|with|:)\s+([A-Z][a-zA-Z\s&]+)',
        r'partnership\s+(?:with|between):\s+([A-Z][a-zA-Z\s&]+)',
    ]

    # Acquisition patterns
    ACQUISITION_PATTERNS = [
        r'acquired\s+by\s+([A-Z][a-zA-Z\s&]+)',
        r'acquisition\s+by:\s+([A-Z][a-zA-Z\s&]+)',
        r'was\s+acquired\s+by\s+([A-Z][a-zA-Z\s&]+)',
    ]

    # Funding patterns
    FUNDING_SOURCE_PATTERNS = [
        r'(?:funded|backed|financed)\s+by\s+([A-Z][a-zA-Z\s&]+)',
        r'lead\s+(?:investor|partner):\s+([A-Z][a-zA-Z\s&]+)',
    ]

    def extract_relationships(self, text: str) -> dict:
        """Extract relationships between entities"""
        relationships = {
            'partnerships': self._extract_by_pattern(text, self.PARTNERSHIP_PATTERNS),
            'acquisitions': self._extract_by_pattern(text, self.ACQUISITION_PATTERNS),
            'funding_sources': self._extract_by_pattern(text, self.FUNDING_SOURCE_PATTERNS),
        }
        return relationships

    def _extract_by_pattern(self, text: str, patterns: List[str]) -> List[str]:
        """Extract entities by pattern"""
        entities = []
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entity = match.group(1).strip()
                if entity and entity not in entities:
                    entities.append(entity)
        return entities
