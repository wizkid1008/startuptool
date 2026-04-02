"""
Example usage of the SMEAT Scoring Engine

Demonstrates how to:
1. Initialize the engine
2. Prepare company data
3. Score a company
4. View results and confidence scores
5. Export results
"""

from smeat_engine import ScoringEngine
import json


def example_1_simple_scoring():
    """Example 1: Basic company scoring"""
    print("=" * 60)
    print("Example 1: Simple Company Scoring")
    print("=" * 60)

    engine = ScoringEngine()

    # Prepare company data
    company_data = {
        'name': 'TechStartup Inc.',
        'description': '''
            Cloud-based SaaS platform for supply chain management.
            We use advanced analytics and machine learning to optimize inventory
            across retail networks. Founded in 2019, now at Series A with $5M funding.
            Team of 15 engineers and 5 business folks. Strong product-market fit with
            major retailers. Revenue growing 20% MoM.
        ''',
        'team': [
            {'role': 'CEO', 'name': 'Jane Doe'},
            {'role': 'CTO', 'name': 'John Smith'},
            {'role': 'VP Sales', 'name': 'Alice Johnson'},
        ] + [{'role': 'Engineer', 'name': f'Engineer {i}'} for i in range(12)],
        'financials': {
            'revenue': 500000,
            'funding': 5000000,
            'stage': 'Series A',
            'burn_rate': 250000,
            'runway_months': 20
        },
        'news': [
            'TechStartup raises $5M Series A funding',
            'TechStartup wins Best Supply Chain Tech award',
            'TechStartup expands to EMEA market',
        ],
        'web_data': {
            'founded': 2019,
            'employees': 20,
            'website': 'techstartup.com',
            'certifications': 'ISO 27001',
            'customers': 150
        }
    }

    # Score the company
    print("\nScoring company...")
    scores = engine.score_company(company_data)

    # Display segment scores
    print("\nSegment Scores:")
    print("-" * 60)
    for segment_id, score in scores.items():
        print(f"\n{score.segment_name.upper()}")
        mat = score.avg_maturity if score.avg_maturity is not None else 'N/A'
        imp = score.avg_impact if score.avg_impact is not None else 'N/A'
        crit = score.criticality if score.criticality is not None else 'N/A'
        print(f"  Avg Maturity:     {mat if isinstance(mat, str) else f'{mat:.1f}'}/4 (lower is better)")
        print(f"  Avg Impact:       {imp if isinstance(imp, str) else f'{imp:.1f}'}/4")
        print(f"  Criticality:      {crit if isinstance(crit, str) else f'{crit:.1f}'}/16 (lower is better)")
        print(f"  Confidence:       {score.confidence:.0%}")
        print(f"  Data Complete:    {score.data_completeness:.0%}")

    # Display summary
    print("\n" + "=" * 60)
    print("OVERALL ASSESSMENT")
    print("=" * 60)
    summary = engine.get_summary()
    print(f"Overall Maturity:     {summary['overall_maturity']:.1f}/4")
    print(f"Overall Impact:       {summary['overall_impact']:.1f}/4")
    print(f"Overall Confidence:   {summary['overall_confidence']:.0%}")
    print(f"Highest Criticality:  {summary['highest_criticality'][0]} ({summary['highest_criticality'][1]:.1f})")
    print(f"Lowest Maturity:      {summary['lowest_maturity'][0]} ({summary['lowest_maturity'][1]:.1f})")


def example_2_detailed_criteria():
    """Example 2: View detailed sub-criteria scores"""
    print("\n" + "=" * 60)
    print("Example 2: Detailed Criteria Scores")
    print("=" * 60)

    engine = ScoringEngine()

    company_data = {
        'name': 'FinTech Africa',
        'description': '''
            Digital payments platform serving East Africa.
            Mobile-first, supporting P2P transfers, bill payments, and merchant payments.
            Launched 2021, now in 3 countries with 100k active users.
            Team: 25 people (engineers, ops, customer success)
            Monthly transaction volume growing 50% YoY.
        ''',
        'team': [{'role': 'Staff'} for _ in range(25)],
        'financials': {
            'revenue': 250000,
            'funding': 2000000,
            'monthly_growth': 0.15
        },
        'web_data': {
            'countries': 3,
            'active_users': 100000,
            'mcc_license': True
        }
    }

    scores = engine.score_company(company_data)

    # Show detailed customer segment
    customer_score = scores['customer']
    print(f"\nCUSTOMER SEGMENT - Confidence: {customer_score.confidence:.0%}")
    print("-" * 60)

    for criteria_name, score in customer_score.sub_scores.items():
        status = "✓" if score.maturity else "✗"
        print(f"\n{status} {criteria_name}")
        if score.maturity:
            maturity_text = ['Advanced', 'Developing', 'Emerging', 'Nascent'][score.maturity - 1]
            impact_text = ['Critical', 'Neutral', 'Low', 'Not Needed'][score.impact - 1]
            print(f"    Maturity: {maturity_text} (Level {score.maturity})")
            print(f"    Impact: {impact_text} (Level {score.impact})")
            print(f"    Confidence: {score.confidence:.0%}")
            print(f"    Sources: {', '.join(score.data_sources)}")
            print(f"    Reasoning: {score.reasoning}")
        else:
            print(f"    Status: No data to assess")


def example_3_limited_data():
    """Example 3: Scoring with limited data (lower confidence)"""
    print("\n" + "=" * 60)
    print("Example 3: Limited Data Scenario")
    print("=" * 60)

    engine = ScoringEngine()

    # Minimal data - would result in lower confidence
    company_data = {
        'name': 'EarlyStage Corp',
        'description': 'Early-stage startup, no additional details available'
    }

    scores = engine.score_company(company_data)

    print("\nSegment Confidence Levels:")
    print("-" * 60)
    for segment_id, score in sorted(scores.items(), key=lambda x: x[1].confidence):
        print(f"{score.segment_name:20} Confidence: {score.confidence:.0%}")

    print("\nNote: Low confidence indicates insufficient data for reliable assessment.")
    print("Recommendations: Collect more company information:")
    print("  - Team composition and backgrounds")
    print("  - Financial data (revenue, funding)")
    print("  - News articles and press")
    print("  - Website content and documentation")
    print("  - Uploaded pitch decks or reports")


def example_4_json_export():
    """Example 4: Export scores as JSON"""
    print("\n" + "=" * 60)
    print("Example 4: JSON Export")
    print("=" * 60)

    engine = ScoringEngine()

    company_data = {
        'name': 'DataCo',
        'description': 'Advanced analytics platform with machine learning',
        'team': [{'role': 'Role'} for _ in range(10)],
        'financials': {'funding': 1000000},
        'web_data': {'founded': 2022}
    }

    scores = engine.score_company(company_data)
    json_output = engine.export_json()

    print("\nJSON Export (first 500 chars):")
    print("-" * 60)
    print(json_output[:500] + "...")

    # Save to file
    with open('example_scores.json', 'w') as f:
        f.write(json_output)
    print(f"\nFull JSON saved to example_scores.json")


def example_5_interpretation_guide():
    """Example 5: How to interpret scores"""
    print("\n" + "=" * 60)
    print("Example 5: Score Interpretation Guide")
    print("=" * 60)

    print("""
MATURITY LEVELS (1-4, lower is better)
--------------------------------------
1 = Advanced
    - Best-in-class capabilities
    - Fully developed and documented
    - Clear evidence of excellence
    - Example: Company has ISO certifications, awards, documented processes

2 = Developing
    - Functional but with room for improvement
    - Some processes in place but not fully mature
    - Adequate for current stage
    - Example: Team exists and performs, but no formal performance reviews

3 = Emerging
    - Early stage, basic capabilities
    - Ad-hoc or informal processes
    - Minimal documentation
    - Example: Company describes innovation but no formal R&D process

4 = Nascent
    - Minimal or non-existent
    - Not yet addressed
    - No evidence available
    - Example: No data on security practices, or company doesn't address this


IMPACT LEVELS (1-4, depends on industry)
-----------------------------------------
1 = Critical
    - Essential to business success
    - High importance for competitive advantage
    - Example: For FinTech, compliance is critical (1)

2 = Neutral
    - Important but not make-or-break
    - Standard for industry
    - Example: For SaaS, customer support is neutral (2)

3 = Low
    - Nice to have
    - Not essential
    - Example: For B2B software, design is lower impact (3)

4 = Not Needed
    - Not applicable to this business
    - Example: Manufacturing efficiency not critical for digital agency (4)


CRITICALITY SCORE (maturity × impact, lower is worse)
-----------------------------------------------------
4-6:   CRITICAL - Urgent attention needed
6-9:   HIGH     - Important to address
9-12:  MEDIUM   - Should be improved
12+:   LOW      - Acceptable for stage


CONFIDENCE SCORE (0%-100%)
---------------------------
90%+:  Very High
    - Multiple data sources
    - Comprehensive information
    - Reliable assessment

70-89%: High
    - Good data coverage
    - Some gaps but manageable
    - Reasonably confident

50-69%: Medium
    - Limited data
    - Recommend additional research
    - May change with new info

<50%:  Low
    - Insufficient data
    - Do not rely solely on this assessment
    - Need more information before major decisions
    """)


if __name__ == '__main__':
    example_1_simple_scoring()
    example_2_detailed_criteria()
    example_3_limited_data()
    example_4_json_export()
    example_5_interpretation_guide()

    print("\n" + "=" * 60)
    print("Examples complete!")
    print("=" * 60)
