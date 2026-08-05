"""
NLP Pipeline Usage Examples
"""

from nlp_pipeline import NLPPipeline
import json


def example_1_text_analysis():
    """Example 1: Analyze a single text"""
    print("=" * 70)
    print("Example 1: Single Text Analysis")
    print("=" * 70)

    pipeline = NLPPipeline()

    text = """
    TechCorp is a leading AI company that raised $50 million in Series B funding
    led by Sequoia Capital. Founded in 2019 by Jane Doe and John Smith, the company
    has grown to 150 employees and expanded operations to 5 countries.
    The company specializes in machine learning and computer vision solutions
    for enterprise customers.
    """

    result = pipeline.analyze_text(text)

    print(f"\nText Analysis Results:")
    print(f"  Text Length: {result.text_length} characters")
    print(f"  Entities Found: {len(result.entities)}")
    for entity in result.entities[:5]:
        print(f"    - {entity.text} ({entity.entity_type.value})")

    print(f"\n  Metrics Found: {len(result.metrics)}")
    for metric in result.metrics:
        print(f"    - {metric.name}: {metric.value} {metric.unit}")

    print(f"\n  Sentiment: {result.sentiment.sentiment.value}")
    print(f"  Sentiment Confidence: {result.sentiment.confidence:.0%}")

    if result.topics:
        print(f"\n  Primary Topic: {result.topics.primary_topic}")
        print(f"  Topic Confidence: {result.topics.confidence:.0%}")

    if result.industry:
        print(f"\n  Detected Industry: {result.industry.primary_industry}")
        print(f"  Industry Confidence: {result.industry.confidence:.0%}")

    print(f"\n  Text Quality: {result.text_quality_score:.0%}")
    print(f"  Extraction Confidence: {result.extraction_confidence:.0%}")
    print(f"  Processing Time: {result.processing_time_ms:.1f}ms")


def example_2_company_analysis():
    """Example 2: Analyze complete company data"""
    print("\n" + "=" * 70)
    print("Example 2: Complete Company Analysis")
    print("=" * 70)

    pipeline = NLPPipeline()

    # Simulated company data from web scraper
    company_data = {
        'name': 'FinTechStartup',
        'description': '''
            FinTechStartup provides innovative blockchain-based payment solutions
            for cross-border transactions. Founded in 2020, we have secured $5M
            in seed funding and partnered with major banks.
        ''',
        'news': [
            {
                'title': 'FinTechStartup Raises $5M Series A Funding',
                'summary': 'Excellent news! The company successfully raised Series A funding.'
            },
            {
                'title': 'FinTechStartup Expands to European Market',
                'summary': 'The company is expanding operations with impressive growth.'
            },
            {
                'title': 'FinTechStartup Wins Best Innovation Award',
                'summary': 'Outstanding achievement at international tech conference.'
            }
        ]
    }

    # Analyze company
    enhanced = pipeline.analyze_company(company_data)

    print(f"\nCompany Analysis: {enhanced.company_name}")
    print(f"  Description Analysis: {enhanced.description_analysis.text_quality_score:.0%}" if enhanced.description_analysis else "  No description")

    print(f"\n  News Articles Analyzed: {len(enhanced.news_sentiments)}")
    print(f"  Average News Sentiment: {enhanced.overall_sentiment.value if enhanced.overall_sentiment else 'N/A'}")
    print(f"  Sentiment Trend: {enhanced.sentiment_trend}")

    print(f"\n  Extracted Entities: {len(enhanced.extracted_entities)}")
    print(f"  Extracted Metrics: {len(enhanced.extracted_metrics)}")
    for metric in enhanced.extracted_metrics[:3]:
        print(f"    - {metric.name}: {metric.value} {metric.unit}")

    print(f"\n  Detected Industries: {list(enhanced.detected_industries.keys())}")
    print(f"  Business Areas: {enhanced.detected_business_areas}")

    print(f"\n  NLP Quality Score: {enhanced.nlp_quality_score:.0%}")
    print(f"  Data Enrichment Score: {enhanced.data_enrichment_score:.0%}")
    print(f"  Processing Time: {enhanced.total_processing_time_ms:.1f}ms")


def example_3_sentiment_trend():
    """Example 3: Analyze sentiment trend over time"""
    print("\n" + "=" * 70)
    print("Example 3: Sentiment Trend Analysis")
    print("=" * 70)

    pipeline = NLPPipeline()

    news_articles = [
        "Company launched successfully",
        "Facing challenges in market",
        "Major partnership announced",
        "Great results in latest quarter",
        "Outstanding growth trajectory"
    ]

    sentiments = [pipeline.sentiment_analyzer.analyze(text) for text in news_articles]

    print("\nNews Article Sentiments:")
    for i, (article, sentiment) in enumerate(zip(news_articles, sentiments), 1):
        print(f"  {i}. {sentiment.sentiment.value}: {article[:40]}...")

    trend = pipeline.trend_analyzer.analyze_trend(sentiments)
    avg_sentiment = pipeline.trend_analyzer.get_average_sentiment(sentiments)

    print(f"\nTrend Analysis:")
    print(f"  Overall Trend: {trend}")
    print(f"  Average Sentiment Score: {avg_sentiment:.2f}")


def example_4_export_json():
    """Example 4: Export analysis results"""
    print("\n" + "=" * 70)
    print("Example 4: Export Results to JSON")
    print("=" * 70)

    pipeline = NLPPipeline()

    text = "Founded in 2020, the company raised $10M and has 50 employees."
    result = pipeline.analyze_text(text)

    # Export to dictionary
    data = {
        'analysis': result.to_dict(),
        'entities': [
            {
                'text': e.text,
                'type': e.entity_type.value,
                'confidence': e.confidence
            }
            for e in result.entities
        ],
        'metrics': [
            {
                'name': m.name,
                'value': m.value,
                'unit': m.unit,
                'confidence': m.confidence
            }
            for m in result.metrics
        ]
    }

    print("\nJSON Export:")
    print(json.dumps(data, indent=2)[:500] + "...")


def main():
    """Run all examples"""
    try:
        example_1_text_analysis()
        example_2_company_analysis()
        example_3_sentiment_trend()
        example_4_export_json()
    except Exception as e:
        print(f"\nExample Error: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 70)
    print("Examples complete!")
    print("=" * 70)


if __name__ == '__main__':
    main()
