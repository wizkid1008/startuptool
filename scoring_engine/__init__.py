"""
SMEAT Scoring Engine

A comprehensive Python module for evaluating companies across 7 strategic dimensions:
- Customer (C)
- People (P)
- Operations (O)
- Finance (F)
- Analytics (A)
- Risk (R)
- Impact (I)

Features:
- Structured rubric with sub-criteria for each dimension
- Evidence-based scoring from multiple data sources
- Confidence scoring (0-1.0) based on data quality and completeness
- Flexible aggregation and weighting
- JSON export for integration with other systems

Usage:
    from scoring_engine import ScoringEngine

    engine = ScoringEngine()
    scores = engine.score_company(company_data)
    summary = engine.get_summary()
"""

from .smeat_engine import (
    ScoringEngine,
    SMEATRubric,
    SubCriteria,
    Score,
    SegmentScore,
    MaturityLevel,
    ImpactLevel,
)

__version__ = '1.0.0'
__all__ = [
    'ScoringEngine',
    'SMEATRubric',
    'SubCriteria',
    'Score',
    'SegmentScore',
    'MaturityLevel',
    'ImpactLevel',
]
