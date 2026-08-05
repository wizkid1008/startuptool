"""
SMEAT Scoring Engine - Core Scoring Logic

Evaluates companies across 7 dimensions:
- Customer (C)
- People (P)
- Operations (O)
- Finance (F)
- Analytics (A)
- Risk (R)
- Impact (I)

Each dimension has multiple sub-categories with maturity and impact scores.
Maturity: 1=Advanced, 2=Developing, 3=Emerging, 4=Nascent
Impact: 1=Critical, 2=Neutral, 3=Low, 4=Not Needed
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum
import json


class MaturityLevel(Enum):
    """Maturity assessment scale"""
    ADVANCED = 1    # Fully developed, best-in-class
    DEVELOPING = 2  # Functional but room for improvement
    EMERGING = 3    # Early stage, basic capabilities
    NASCENT = 4     # Non-existent or minimal


class ImpactLevel(Enum):
    """Impact/criticality scale"""
    CRITICAL = 1    # Essential to business success
    NEUTRAL = 2     # Important but not critical
    LOW = 3         # Nice to have
    NOT_NEEDED = 4  # Not applicable to business


@dataclass
class SubCriteria:
    """Individual scoring criteria within a segment"""
    name: str
    description: str
    keywords: List[str]  # Terms to look for in data
    weight: float = 1.0  # Relative importance


@dataclass
class Score:
    """Score for a single criteria"""
    maturity: int  # 1-4
    impact: int    # 1-4
    confidence: float  # 0.0-1.0
    data_sources: List[str] = None
    reasoning: str = ""


@dataclass
class SegmentScore:
    """Aggregated score for a SMEAT segment"""
    segment_id: str
    segment_name: str
    avg_maturity: float
    avg_impact: float
    criticality: float  # maturity * impact (lower is better)
    confidence: float  # 0.0-1.0
    sub_scores: Dict[str, Score] = None
    data_completeness: float = 0.0  # % of criteria with data


class SMEATRubric:
    """Defines the SMEAT assessment rubric"""

    SEGMENTS = {
        'customer': {
            'name': 'Customer',
            'icon': '🎯',
            'color': '#6ee7b7',
            'description': 'Market positioning, channels, and customer experience',
            'sub_criteria': [
                SubCriteria(
                    'Products, Markets & Channels',
                    'Product-market fit, market size, channel diversity',
                    ['product-market fit', 'market size', 'channels', 'distribution', 'TAM']
                ),
                SubCriteria(
                    'Marketing and Branding',
                    'Brand awareness, marketing effectiveness, positioning',
                    ['brand awareness', 'marketing', 'campaigns', 'positioning', 'NPS']
                ),
                SubCriteria(
                    'Sales and Pricing',
                    'Sales process maturity, pricing strategy, conversion rates',
                    ['sales pipeline', 'pricing', 'conversion rate', 'CAC', 'LTV']
                ),
                SubCriteria(
                    'Customer Experience',
                    'Customer satisfaction, retention, support quality',
                    ['customer satisfaction', 'churn', 'retention', 'support', 'CSAT']
                ),
            ]
        },
        'people': {
            'name': 'People',
            'icon': '👥',
            'color': '#818cf8',
            'description': 'Talent, culture, and organizational capability',
            'sub_criteria': [
                SubCriteria(
                    'Capability',
                    'Skills, expertise, and talent level',
                    ['skills', 'expertise', 'talent', 'training', 'development']
                ),
                SubCriteria(
                    'Performance Management',
                    'Goal setting, reviews, accountability systems',
                    ['performance reviews', 'KPIs', 'goals', 'accountability', 'metrics']
                ),
                SubCriteria(
                    'Innovation',
                    'R&D, experimentation, continuous improvement',
                    ['R&D', 'innovation', 'experimentation', 'patents', 'improvement']
                ),
                SubCriteria(
                    'Leadership',
                    'Executive team quality, vision, execution',
                    ['leadership', 'CEO', 'executives', 'vision', 'strategy']
                ),
                SubCriteria(
                    'Rewards',
                    'Compensation, equity, benefits, retention',
                    ['compensation', 'equity', 'benefits', 'retention', 'turnover']
                ),
            ]
        },
        'operations': {
            'name': 'Operations',
            'icon': '⚙️',
            'color': '#f472b6',
            'description': 'Supply chain, production, and operational efficiency',
            'sub_criteria': [
                SubCriteria(
                    'Sourcing & Supply Chain',
                    'Supplier relationships, inventory, procurement',
                    ['supply chain', 'suppliers', 'inventory', 'procurement', 'logistics']
                ),
                SubCriteria(
                    'Internal Operations & Assets',
                    'Production, equipment, facilities, quality',
                    ['production', 'quality control', 'facilities', 'equipment', 'efficiency']
                ),
                SubCriteria(
                    'Distribution & Logistics',
                    'Fulfillment, last-mile delivery, logistics',
                    ['distribution', 'fulfillment', 'delivery', 'last-mile', 'warehousing']
                ),
                SubCriteria(
                    'Operations Strategy',
                    'Process optimization, cost management, scalability',
                    ['optimization', 'efficiency', 'cost', 'scale', 'capacity']
                ),
                SubCriteria(
                    'Operational Excellence',
                    'Automation, lean processes, continuous improvement',
                    ['automation', 'lean', 'Six Sigma', 'continuous improvement', 'process']
                ),
            ]
        },
        'finance': {
            'name': 'Finance',
            'icon': '💰',
            'color': '#fbbf24',
            'description': 'Financial health, funding, and capital management',
            'sub_criteria': [
                SubCriteria(
                    'Finance Process & Control',
                    'Accounting, internal controls, financial reporting',
                    ['accounting', 'controls', 'audit', 'compliance', 'reporting']
                ),
                SubCriteria(
                    'Stakeholder Management',
                    'Investor relations, board governance, transparency',
                    ['investors', 'board', 'governance', 'transparency', 'disclosure']
                ),
                SubCriteria(
                    'People & Organization',
                    'Finance team capability, structure, budget management',
                    ['finance team', 'CFO', 'budget', 'planning', 'resources']
                ),
                SubCriteria(
                    'Data and Technology',
                    'Financial systems, analytics, forecasting',
                    ['financial systems', 'analytics', 'forecasting', 'ERP', 'dashboards']
                ),
                SubCriteria(
                    'Funding Growth',
                    'Capital raising, debt management, investment',
                    ['funding', 'capital', 'debt', 'investment', 'valuation']
                ),
            ]
        },
        'analytics': {
            'name': 'Analytics',
            'icon': '📈',
            'color': '#34d399',
            'description': 'Digital infrastructure, data, and cybersecurity',
            'sub_criteria': [
                SubCriteria(
                    'Digital Enterprise',
                    'Digital infrastructure, cloud, modernization',
                    ['cloud', 'digital', 'infrastructure', 'SaaS', 'modernization']
                ),
                SubCriteria(
                    'Data and Analytics',
                    'Data collection, warehousing, business intelligence',
                    ['data', 'analytics', 'BI', 'data warehouse', 'dashboards']
                ),
                SubCriteria(
                    'Security and Privacy',
                    'Cybersecurity, data privacy, compliance',
                    ['security', 'privacy', 'encryption', 'GDPR', 'compliance']
                ),
            ]
        },
        'risk': {
            'name': 'Risk',
            'icon': '🛡️',
            'color': '#f87171',
            'description': 'Governance, compliance, and risk management',
            'sub_criteria': [
                SubCriteria(
                    'Governance',
                    'Board structure, policies, decision-making',
                    ['governance', 'board', 'policies', 'board oversight', 'committees']
                ),
                SubCriteria(
                    'Risk Management',
                    'Risk identification, mitigation, monitoring',
                    ['risk management', 'risk assessment', 'mitigation', 'monitoring']
                ),
                SubCriteria(
                    'Policy & Compliance',
                    'Regulatory compliance, policies, documentation',
                    ['compliance', 'regulations', 'policies', 'legal', 'documentation']
                ),
                SubCriteria(
                    'Stakeholder Management',
                    'Regulatory relations, stakeholder communication',
                    ['stakeholders', 'regulators', 'communication', 'relations']
                ),
            ]
        },
        'impact': {
            'name': 'Impact',
            'icon': '🌍',
            'color': '#a78bfa',
            'description': 'Social and environmental impact, sustainability',
            'sub_criteria': [
                SubCriteria(
                    'Impact Metrics',
                    'Measurement, reporting, SDG alignment',
                    ['impact metrics', 'SDG', 'measurement', 'reporting', 'ESG']
                ),
                SubCriteria(
                    'Technology',
                    'Tech for impact, innovation, scalability',
                    ['technology', 'innovation', 'scale', 'impact tech', 'solutions']
                ),
                SubCriteria(
                    'Data and Analytics',
                    'Impact measurement systems, M&E',
                    ['M&E', 'measurement', 'evaluation', 'data', 'monitoring']
                ),
                SubCriteria(
                    'Design',
                    'User-centered design, accessibility, inclusion',
                    ['design', 'UX', 'accessibility', 'inclusion', 'user-centered']
                ),
            ]
        }
    }


class ScoringEngine:
    """
    Core SMEAT scoring engine

    Evaluates company data against the SMEAT rubric and generates
    segment scores with confidence levels.
    """

    def __init__(self):
        self.rubric = SMEATRubric()
        self.scores: Dict[str, SegmentScore] = {}

    def score_company(self, company_data: Dict) -> Dict[str, SegmentScore]:
        """
        Score a company across all SMEAT dimensions.

        Args:
            company_data: Dict with keys:
                - name (str)
                - description (str)
                - financials (Dict)
                - team (List[Dict])
                - news (List[str]) - news articles/mentions
                - web_data (Dict) - scraped website info
                - documents (List[str]) - uploaded docs text

        Returns:
            Dict[segment_id] -> SegmentScore
        """
        self.scores = {}

        for segment_id, segment_info in self.rubric.SEGMENTS.items():
            segment_score = self._score_segment(
                segment_id, segment_info, company_data
            )
            self.scores[segment_id] = segment_score

        return self.scores

    def _score_segment(self, segment_id: str, segment_info: Dict, company_data: Dict) -> SegmentScore:
        """Score a single SMEAT segment"""
        sub_scores = {}
        maturity_scores = []
        impact_scores = []
        data_count = 0

        for criteria in segment_info['sub_criteria']:
            score = self._score_criteria(criteria, company_data)
            sub_scores[criteria.name] = score

            if score.maturity:
                maturity_scores.append(score.maturity)
                impact_scores.append(score.impact)
                data_count += 1

        # Calculate aggregates
        avg_maturity = sum(maturity_scores) / len(maturity_scores) if maturity_scores else None
        avg_impact = sum(impact_scores) / len(impact_scores) if impact_scores else None
        criticality = (avg_maturity * avg_impact) if avg_maturity and avg_impact else None
        data_completeness = data_count / len(segment_info['sub_criteria'])
        confidence = self._calculate_confidence(data_count, len(segment_info['sub_criteria']), company_data)

        return SegmentScore(
            segment_id=segment_id,
            segment_name=segment_info['name'],
            avg_maturity=avg_maturity,
            avg_impact=avg_impact,
            criticality=criticality,
            confidence=confidence,
            sub_scores=sub_scores,
            data_completeness=data_completeness
        )

    def _score_criteria(self, criteria: SubCriteria, company_data: Dict) -> Score:
        """
        Score a single criteria based on available data.

        Returns Score with maturity, impact, confidence, and reasoning.
        """
        # Collect evidence from all data sources
        evidence = self._extract_evidence(criteria, company_data)

        if not evidence['found']:
            # No data available - cannot score
            return Score(
                maturity=None,
                impact=None,
                confidence=0.0,
                data_sources=[],
                reasoning="No data available for assessment"
            )

        # Evaluate maturity based on evidence
        maturity = self._evaluate_maturity(criteria.name, evidence)
        impact = self._evaluate_impact(criteria.name, evidence, company_data)
        confidence = self._calculate_criteria_confidence(evidence)

        return Score(
            maturity=maturity,
            impact=impact,
            confidence=confidence,
            data_sources=evidence['sources'],
            reasoning=evidence['reasoning']
        )

    def _extract_evidence(self, criteria: SubCriteria, company_data: Dict) -> Dict:
        """Extract evidence from company data for a criteria"""
        evidence = {
            'found': False,
            'indicators': [],
            'sources': [],
            'reasoning': '',
            'data': {}
        }

        # Check description
        if company_data.get('description'):
            for keyword in criteria.keywords:
                if keyword.lower() in company_data['description'].lower():
                    evidence['found'] = True
                    evidence['sources'].append('description')
                    evidence['indicators'].append(keyword)
                    break

        # Check team data
        if company_data.get('team') and criteria.name == 'Leadership':
            team_size = len(company_data['team'])
            if team_size > 0:
                evidence['found'] = True
                evidence['data']['team_size'] = team_size
                evidence['sources'].append('team_data')
                evidence['indicators'].append(f"{team_size} team members")

        # Check financials
        if company_data.get('financials'):
            financials = company_data['financials']
            if any(k in criteria.name.lower() for k in ['finance', 'funding', 'capital']):
                if financials.get('revenue') or financials.get('funding'):
                    evidence['found'] = True
                    evidence['sources'].append('financials')
                    if financials.get('revenue'):
                        evidence['indicators'].append(f"Revenue: ${financials['revenue']}")
                    if financials.get('funding'):
                        evidence['indicators'].append(f"Funding: ${financials['funding']}")

        # Check news/web data
        if company_data.get('news'):
            for article in company_data['news']:
                for keyword in criteria.keywords:
                    if keyword.lower() in article.lower():
                        evidence['found'] = True
                        evidence['sources'].append('news')
                        break

        if company_data.get('web_data'):
            web = company_data['web_data']
            for keyword in criteria.keywords:
                for key, value in web.items():
                    if keyword.lower() in str(value).lower():
                        evidence['found'] = True
                        evidence['sources'].append('website')
                        break

        # Generate reasoning
        if evidence['found']:
            indicators_str = ', '.join(evidence['indicators'][:3])
            sources_str = ', '.join(set(evidence['sources']))
            evidence['reasoning'] = f"Based on {sources_str}: {indicators_str}"
        else:
            evidence['reasoning'] = f"Insufficient data to assess {criteria.name}"

        return evidence

    def _evaluate_maturity(self, criteria_name: str, evidence: Dict) -> int:
        """
        Evaluate maturity level (1-4) based on evidence.

        1 = Advanced (best-in-class, well-documented)
        2 = Developing (functional, some gaps)
        3 = Emerging (basic capabilities)
        4 = Nascent (minimal/non-existent)
        """
        if not evidence['found']:
            return 4  # Nascent

        # Default to emerging if minimal evidence
        maturity = 3

        # Upgrade if multiple sources
        if len(set(evidence['sources'])) >= 2:
            maturity = 2

        # Upgrade if strong indicators
        reasoning = evidence.get('reasoning', '')
        if any(keyword in reasoning.lower()
               for keyword in ['best', 'advanced', 'award', 'leading', 'certified']):
            maturity = 1

        return maturity

    def _evaluate_impact(self, criteria_name: str, evidence: Dict, company_data: Dict) -> int:
        """
        Evaluate impact/criticality (1-4) based on criteria importance.

        1 = Critical
        2 = Neutral
        3 = Low
        4 = Not needed
        """
        # Default to neutral
        impact = 2

        # Critical for certain criteria
        critical_criteria = [
            'leadership', 'capability', 'finance', 'customer experience',
            'sales', 'product-market', 'security', 'compliance'
        ]
        if any(c.lower() in criteria_name.lower() for c in critical_criteria):
            impact = 1

        # Low impact for secondary criteria
        low_impact = ['design', 'branding', 'social media', 'awards']
        if any(c.lower() in criteria_name.lower() for c in low_impact):
            impact = 3

        return impact

    def _calculate_confidence(self, data_count: int, total_criteria: int, company_data: Dict) -> float:
        """
        Calculate overall segment confidence (0.0-1.0).

        Based on:
        - Data completeness (% of criteria scored)
        - Number of data sources
        - Data recency
        """
        completeness = data_count / total_criteria if total_criteria > 0 else 0

        # Count data sources
        sources = set()
        if company_data.get('description'):
            sources.add('description')
        if company_data.get('team'):
            sources.add('team')
        if company_data.get('financials'):
            sources.add('financials')
        if company_data.get('news'):
            sources.add('news')
        if company_data.get('web_data'):
            sources.add('web')
        if company_data.get('documents'):
            sources.add('documents')

        source_diversity = len(sources) / 6  # 6 possible sources

        # Combined confidence
        confidence = (completeness * 0.6) + (source_diversity * 0.4)
        return min(confidence, 1.0)

    def _calculate_criteria_confidence(self, evidence: Dict) -> float:
        """Calculate confidence for individual criteria"""
        if not evidence['found']:
            return 0.0

        # More sources = higher confidence
        source_count = len(set(evidence['sources']))
        indicator_count = len(evidence['indicators'])

        base_confidence = 0.3
        source_bonus = source_count * 0.25  # +0.25 per source
        indicator_bonus = min(indicator_count * 0.1, 0.2)  # +0.1 per indicator, max 0.2

        confidence = base_confidence + source_bonus + indicator_bonus
        return min(confidence, 1.0)

    def get_summary(self) -> Dict:
        """Get overall assessment summary"""
        if not self.scores:
            return {}

        overall_maturity = []
        overall_impact = []
        overall_confidence = []

        for score in self.scores.values():
            if score.avg_maturity:
                overall_maturity.append(score.avg_maturity)
                overall_impact.append(score.avg_impact)
                overall_confidence.append(score.confidence)

        return {
            'overall_maturity': sum(overall_maturity) / len(overall_maturity) if overall_maturity else None,
            'overall_impact': sum(overall_impact) / len(overall_impact) if overall_impact else None,
            'overall_confidence': sum(overall_confidence) / len(overall_confidence) if overall_confidence else None,
            'highest_criticality': max(
                [(s.segment_name, s.criticality) for s in self.scores.values()
                 if s.criticality is not None],
                key=lambda x: x[1],
                default=(None, None)
            ),
            'lowest_maturity': min(
                [(s.segment_name, s.avg_maturity) for s in self.scores.values()
                 if s.avg_maturity is not None],
                key=lambda x: x[1],
                default=(None, None)
            ),
        }

    def export_json(self) -> str:
        """Export scores as JSON"""
        data = {
            'segments': {},
            'summary': self.get_summary()
        }

        for segment_id, segment_score in self.scores.items():
            data['segments'][segment_id] = {
                'name': segment_score.segment_name,
                'avg_maturity': segment_score.avg_maturity,
                'avg_impact': segment_score.avg_impact,
                'criticality': segment_score.criticality,
                'confidence': segment_score.confidence,
                'data_completeness': segment_score.data_completeness,
                'sub_scores': {
                    name: {
                        'maturity': score.maturity,
                        'impact': score.impact,
                        'confidence': score.confidence,
                        'sources': score.data_sources,
                        'reasoning': score.reasoning
                    }
                    for name, score in segment_score.sub_scores.items()
                }
            }

        return json.dumps(data, indent=2)
