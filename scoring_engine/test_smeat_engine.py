"""
Unit tests for SMEAT Scoring Engine

Tests:
- Score calculation logic
- Confidence scoring
- Evidence extraction
- Data validation
- Edge cases
"""

import unittest
from smeat_engine import (
    ScoringEngine,
    SMEATRubric,
    SubCriteria,
    Score,
    MaturityLevel,
    ImpactLevel,
)


class TestSMEATRubric(unittest.TestCase):
    """Test rubric structure and completeness"""

    def test_rubric_has_all_segments(self):
        """Verify all 7 SMEAT segments are defined"""
        expected = {'customer', 'people', 'operations', 'finance', 'analytics', 'risk', 'impact'}
        actual = set(SMEATRubric.SEGMENTS.keys())
        self.assertEqual(expected, actual)

    def test_each_segment_has_criteria(self):
        """Verify each segment has sub-criteria"""
        for segment_id, segment in SMEATRubric.SEGMENTS.items():
            self.assertIn('sub_criteria', segment)
            self.assertGreater(len(segment['sub_criteria']), 0)

    def test_criteria_have_keywords(self):
        """Verify each criteria has keywords for matching"""
        for segment_id, segment in SMEATRubric.SEGMENTS.items():
            for criteria in segment['sub_criteria']:
                self.assertIsInstance(criteria, SubCriteria)
                self.assertGreater(len(criteria.keywords), 0)

    def test_segment_icons_and_colors(self):
        """Verify segments have visual properties"""
        for segment_id, segment in SMEATRubric.SEGMENTS.items():
            self.assertIn('icon', segment)
            self.assertIn('color', segment)
            self.assertTrue(segment['color'].startswith('#'))


class TestScoringEngine(unittest.TestCase):
    """Test core scoring logic"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_engine_initialization(self):
        """Engine initializes correctly"""
        self.assertIsNotNone(self.engine.rubric)
        self.assertEqual(len(self.engine.scores), 0)

    def test_score_company_returns_all_segments(self):
        """Scoring returns all 7 segments"""
        company_data = {
            'name': 'TestCorp',
            'description': 'A test company'
        }
        scores = self.engine.score_company(company_data)
        self.assertEqual(len(scores), 7)
        self.assertIn('customer', scores)
        self.assertIn('people', scores)

    def test_company_with_rich_data(self):
        """Company with comprehensive data gets higher confidence"""
        company_data = {
            'name': 'RichDataCorp',
            'description': 'Company with product-market fit and strong leadership',
            'team': [{'role': 'CEO'}, {'role': 'CTO'}, {'role': 'Engineer'}],
            'financials': {'revenue': 1000000, 'funding': 5000000},
            'news': ['RichDataCorp raises Series A', 'Award winner'],
            'web_data': {'founded': 2020, 'employees': 50}
        }
        scores = self.engine.score_company(company_data)

        # Should have higher confidence with multiple sources
        for segment in scores.values():
            self.assertGreater(segment.confidence, 0.3)

    def test_company_with_minimal_data(self):
        """Company with minimal data gets lower confidence"""
        company_data = {
            'name': 'MinimalCorp',
            'description': ''
        }
        scores = self.engine.score_company(company_data)

        # Should have lower confidence with no data
        for segment in scores.values():
            self.assertLess(segment.confidence, 0.5)

    def test_no_scores_for_missing_data(self):
        """Criteria without evidence get None score"""
        company_data = {
            'name': 'EmptyCorp',
            'description': 'No details'
        }
        scores = self.engine.score_company(company_data)
        customer_score = scores['customer']

        # Should have sub-scores, but many may be None
        self.assertIsNotNone(customer_score.sub_scores)
        # At least some should have no maturity score
        has_none = any(s.maturity is None for s in customer_score.sub_scores.values())
        self.assertTrue(has_none)


class TestEvidenceExtraction(unittest.TestCase):
    """Test evidence extraction from company data"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_extract_from_description(self):
        """Keywords in description are found"""
        company_data = {
            'name': 'Test',
            'description': 'We have best-in-class product-market fit and strong leadership team'
        }
        rubric = SMEATRubric()
        criteria = rubric.SEGMENTS['customer']['sub_criteria'][0]  # Products/Markets/Channels

        evidence = self.engine._extract_evidence(criteria, company_data)
        self.assertTrue(evidence['found'])
        self.assertIn('description', evidence['sources'])

    def test_extract_from_team(self):
        """Team data is extracted"""
        company_data = {
            'name': 'Test',
            'team': [
                {'role': 'CEO', 'name': 'Jane'},
                {'role': 'CTO', 'name': 'John'}
            ]
        }
        rubric = SMEATRubric()
        criteria = SubCriteria('Leadership', 'Test', ['leadership'])

        evidence = self.engine._extract_evidence(criteria, company_data)
        self.assertTrue(evidence['found'])
        self.assertIn('team_data', evidence['sources'])

    def test_extract_from_financials(self):
        """Financial data is extracted"""
        company_data = {
            'name': 'Test',
            'financials': {
                'revenue': 1000000,
                'funding': 5000000
            }
        }
        rubric = SMEATRubric()
        criteria = rubric.SEGMENTS['finance']['sub_criteria'][0]

        evidence = self.engine._extract_evidence(criteria, company_data)
        # Should find financial data
        self.assertIn('financials', evidence['sources'])

    def test_no_evidence_found(self):
        """Returns proper structure when no evidence found"""
        company_data = {}
        rubric = SMEATRubric()
        criteria = rubric.SEGMENTS['customer']['sub_criteria'][0]

        evidence = self.engine._extract_evidence(criteria, company_data)
        self.assertFalse(evidence['found'])
        self.assertEqual(len(evidence['sources']), 0)


class TestMaturityEvaluation(unittest.TestCase):
    """Test maturity level evaluation"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_nascent_no_evidence(self):
        """No evidence results in Nascent (4)"""
        evidence = {'found': False, 'indicators': [], 'sources': []}
        maturity = self.engine._evaluate_maturity('Test', evidence)
        self.assertEqual(maturity, 4)

    def test_emerging_minimal_evidence(self):
        """Single source results in Emerging (3)"""
        evidence = {
            'found': True,
            'indicators': ['some indicator'],
            'sources': ['description']
        }
        maturity = self.engine._evaluate_maturity('Test', evidence)
        self.assertEqual(maturity, 3)

    def test_developing_multiple_sources(self):
        """Multiple sources result in Developing (2)"""
        evidence = {
            'found': True,
            'indicators': ['indicator1', 'indicator2'],
            'sources': ['description', 'news', 'web']
        }
        maturity = self.engine._evaluate_maturity('Test', evidence)
        self.assertEqual(maturity, 2)

    def test_advanced_strong_indicators(self):
        """Strong keywords result in Advanced (1)"""
        evidence = {
            'found': True,
            'indicators': ['best-in-class', 'award-winning'],
            'sources': ['description', 'news'],
            'reasoning': 'Award-winning best-in-class solution'
        }
        maturity = self.engine._evaluate_maturity('Test', evidence)
        self.assertEqual(maturity, 1)


class TestImpactEvaluation(unittest.TestCase):
    """Test impact/criticality evaluation"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_critical_impact(self):
        """Critical criteria get impact level 1"""
        criteria_names = ['Leadership', 'Finance', 'Security', 'Compliance']
        evidence = {'found': True, 'sources': ['test']}

        for name in criteria_names:
            impact = self.engine._evaluate_impact(name, evidence, {})
            self.assertEqual(impact, 1, f"{name} should be critical")

    def test_low_impact(self):
        """Non-critical criteria get appropriate impact"""
        criteria_names = ['Design', 'Branding']
        evidence = {'found': True, 'sources': ['test']}

        for name in criteria_names:
            impact = self.engine._evaluate_impact(name, evidence, {})
            self.assertGreater(impact, 1, f"{name} should not be critical")


class TestConfidenceScoring(unittest.TestCase):
    """Test confidence score calculation"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_confidence_zero_to_one(self):
        """Confidence is always between 0 and 1"""
        company_data = {
            'name': 'Test',
            'description': 'Some description',
            'team': [{'role': 'CEO'}],
            'financials': {},
            'news': [],
            'web_data': {},
        }
        scores = self.engine.score_company(company_data)

        for segment in scores.values():
            self.assertGreaterEqual(segment.confidence, 0.0)
            self.assertLessEqual(segment.confidence, 1.0)

    def test_more_sources_higher_confidence(self):
        """More data sources increase confidence"""
        # Minimal data
        minimal = {'name': 'Test'}
        scores_minimal = self.engine.score_company(minimal)

        # Rich data
        rich = {
            'name': 'Test',
            'description': 'Details',
            'team': [{'role': 'CEO'}],
            'financials': {'revenue': 1000},
            'news': ['Article'],
            'web_data': {'founded': 2020},
            'documents': ['doc1.pdf']
        }
        scores_rich = self.engine.score_company(rich)

        # Rich data should have higher confidence
        for segment_id in ['customer', 'people', 'operations']:
            min_conf = scores_minimal[segment_id].confidence
            rich_conf = scores_rich[segment_id].confidence
            self.assertLess(min_conf, rich_conf,
                          f"{segment_id} should have higher confidence with more data")

    def test_data_completeness_calculation(self):
        """Data completeness is calculated correctly"""
        company_data = {
            'name': 'Test',
            'description': 'Product-market fit company'  # Scores Customer segment
        }
        scores = self.engine.score_company(company_data)

        for segment in scores.values():
            self.assertGreaterEqual(segment.data_completeness, 0.0)
            self.assertLessEqual(segment.data_completeness, 1.0)


class TestAggregation(unittest.TestCase):
    """Test score aggregation and summarization"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_segment_averaging(self):
        """Scores are averaged correctly"""
        company_data = {
            'name': 'Test',
            'description': 'Product-market fit and strong leadership'
        }
        scores = self.engine.score_company(company_data)

        # Check that averages are calculated
        for segment in scores.values():
            if segment.avg_maturity is not None:
                self.assertGreaterEqual(segment.avg_maturity, 1)
                self.assertLessEqual(segment.avg_maturity, 4)

    def test_criticality_calculation(self):
        """Criticality is maturity × impact"""
        company_data = {
            'name': 'Test',
            'description': 'Details'
        }
        scores = self.engine.score_company(company_data)

        for segment in scores.values():
            if segment.criticality is not None:
                # Criticality should be between 1 and 16 (1×1 to 4×4)
                self.assertGreaterEqual(segment.criticality, 1)
                self.assertLessEqual(segment.criticality, 16)

    def test_summary_generation(self):
        """Summary correctly identifies key metrics"""
        company_data = {
            'name': 'Test',
            'description': 'Good description with details'
        }
        scores = self.engine.score_company(company_data)
        summary = self.engine.get_summary()

        self.assertIn('overall_maturity', summary)
        self.assertIn('overall_confidence', summary)
        self.assertIn('highest_criticality', summary)
        self.assertIn('lowest_maturity', summary)

    def test_json_export(self):
        """JSON export is valid and complete"""
        company_data = {
            'name': 'Test',
            'description': 'Details'
        }
        scores = self.engine.score_company(company_data)
        json_str = self.engine.export_json()

        import json
        data = json.loads(json_str)

        self.assertIn('segments', data)
        self.assertIn('summary', data)
        self.assertEqual(len(data['segments']), 7)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""

    def setUp(self):
        self.engine = ScoringEngine()

    def test_empty_company_data(self):
        """Handles empty company data gracefully"""
        company_data = {}
        scores = self.engine.score_company(company_data)
        self.assertEqual(len(scores), 7)

    def test_none_values(self):
        """Handles None values gracefully"""
        company_data = {
            'name': None,
            'description': None,
            'team': None,
            'financials': None
        }
        scores = self.engine.score_company(company_data)
        self.assertEqual(len(scores), 7)

    def test_empty_strings(self):
        """Handles empty strings gracefully"""
        company_data = {
            'name': '',
            'description': '',
            'team': [],
            'financials': {},
            'news': [],
            'web_data': {}
        }
        scores = self.engine.score_company(company_data)
        self.assertEqual(len(scores), 7)

    def test_special_characters(self):
        """Handles special characters in description"""
        company_data = {
            'description': 'Special chars: @#$%^&*()!?~`'
        }
        scores = self.engine.score_company(company_data)
        self.assertEqual(len(scores), 7)

    def test_very_long_description(self):
        """Handles very long descriptions"""
        company_data = {
            'description': 'Word ' * 10000  # 40,000 characters
        }
        scores = self.engine.score_company(company_data)
        self.assertEqual(len(scores), 7)


if __name__ == '__main__':
    unittest.main()
