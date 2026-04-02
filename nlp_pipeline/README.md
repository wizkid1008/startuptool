# NLP Pipeline Module

Advanced natural language processing for company data analysis. Enhances web scraper output with sentiment analysis, entity extraction, and business intelligence.

## Features

✅ **Entity Extraction** - Names, organizations, locations, dates, metrics
✅ **Metric Extraction** - Revenue, funding, employees, valuation
✅ **Sentiment Analysis** - Positive/negative/neutral with confidence scores
✅ **Trend Detection** - Sentiment improvement/decline over time
✅ **Industry Classification** - FinTech, HealthTech, SaaS, etc. (10 industries)
✅ **Topic Classification** - Product, Business, Team, Finance, News, Risk
✅ **Relationship Extraction** - Partnerships, acquisitions, funding sources
✅ **Quality Scoring** - Text quality and data enrichment metrics

## Quick Start

```python
from nlp_pipeline import NLPPipeline

pipeline = NLPPipeline()

# Analyze single text
result = pipeline.analyze_text("Founded in 2020, raised $10M Series A funding...")

print(f"Sentiment: {result.sentiment.sentiment.value}")
print(f"Entities: {len(result.entities)}")
print(f"Metrics: {len(result.metrics)}")

# Analyze company data
company_data = {
    'name': 'TechCorp',
    'description': '...',
    'news': [...]
}
enhanced = pipeline.analyze_company(company_data)
print(f"Industry: {enhanced.detected_industries}")
```

## Components

### 1. Entity Extraction
- **Persons**: Named individuals with patterns
- **Organizations**: Company names and entities
- **Locations**: Countries, cities, geopolitical entities
- **Money**: Currency amounts with multipliers (M, B, T)
- **Dates**: Various date formats and quarters
- **Percentages**: Numeric percentages

```python
entities = pipeline.entity_extractor.extract_entities(text)
for entity in entities:
    print(f"{entity.text} ({entity.entity_type.value})")
```

### 2. Metric Extraction
- **Revenue**: Annual revenue amounts
- **Funding**: Round amounts and total funding
- **Valuation**: Company valuation
- **Employees**: Employee count

```python
metrics = pipeline.metric_extractor.extract_metrics(text)
for metric in metrics:
    print(f"{metric.name}: {metric.value} {metric.unit}")
```

### 3. Sentiment Analysis
- **5-level sentiment**: Very Positive → Very Negative
- **Confidence scoring**: 0.0-1.0 confidence
- **Intensity modifiers**: very, extremely, quite, etc.
- **Negation handling**: not, never, no, etc.
- **Entity mention tracking**: Entities in sentiment text

```python
sentiment = pipeline.sentiment_analyzer.analyze(text)
print(f"Sentiment: {sentiment.sentiment.value}")
print(f"Confidence: {sentiment.confidence:.0%}")
print(f"Compound Score: {sentiment.scores['compound']}")
```

### 4. Trend Analysis
- **Trend detection**: Improving, declining, stable
- **Average sentiment**: Numeric sentiment value
- **Temporal comparison**: First half vs. second half

```python
sentiments = [pipeline.sentiment_analyzer.analyze(text) for text in news]
trend = pipeline.trend_analyzer.analyze_trend(sentiments)
avg = pipeline.trend_analyzer.get_average_sentiment(sentiments)
```

### 5. Industry Classification
Supports 10 industries:
- FinTech
- HealthTech
- EdTech
- AgriTech
- SaaS
- E-Commerce
- Transportation
- Real Estate
- AI/ML
- IoT

```python
industry = pipeline.industry_classifier.classify(text)
print(f"Primary: {industry.primary_industry}")
print(f"Confidence: {industry.confidence:.0%}")
```

### 6. Topic Classification
Classifies content into 6 topics:
- Product & Technology
- Business & Growth
- Team & Culture
- Funding & Finance
- News & Events
- Challenges & Risk

```python
topic = pipeline.topic_classifier.classify(text)
print(f"Primary Topic: {topic.primary_topic}")
print(f"Confidence: {topic.confidence:.0%}")
```

## Data Models

### TextAnalysisResult
```python
result.original_text          # Original text
result.text_length            # Character count
result.entities              # Extracted entities
result.metrics               # Extracted metrics
result.sentiment             # SentimentScore
result.topics                # TopicClassification
result.industry              # IndustryClassification
result.text_quality_score    # 0.0-1.0
result.extraction_confidence # 0.0-1.0
result.processing_time_ms    # Milliseconds
```

### EnhancedCompanyData
```python
enhanced.company_name              # Company name
enhanced.description_analysis      # TextAnalysisResult
enhanced.news_sentiments          # List[SentimentScore]
enhanced.news_topics              # List[TopicClassification]
enhanced.extracted_entities       # List[Entity]
enhanced.extracted_metrics        # List[Metric]
enhanced.overall_sentiment        # SentimentType
enhanced.sentiment_trend          # "improving" / "declining" / "stable"
enhanced.detected_industries      # Dict[industry, score]
enhanced.detected_business_areas  # List[str]
enhanced.nlp_quality_score        # 0.0-1.0
enhanced.data_enrichment_score    # 0.0-1.0
```

## Integration with Scoring Engine

The NLP pipeline enhances data before scoring:

```python
from web_scraper import WebScraper
from nlp_pipeline import NLPPipeline
from scoring_engine import ScoringEngine

# Step 1: Scrape company
scraper = WebScraper()
company = scraper.scrape_company("TechCorp", "techcorp.com")

# Step 2: Enhance with NLP
pipeline = NLPPipeline()
enhanced = pipeline.analyze_company(company.to_dict())

# Step 3: Score with enriched data
engine = ScoringEngine()
scores = engine.score_company({
    'name': enhanced.company_name,
    'description': enhanced.original_data.get('description'),
    'team': enhanced.original_data.get('team'),
    'financials': enhanced.original_data.get('financials'),
    'news': enhanced.original_data.get('news'),
    'web_data': enhanced.original_data.get('web_data'),
    # NLP enhancements:
    'sentiment': enhanced.overall_sentiment.value if enhanced.overall_sentiment else None,
    'industries': list(enhanced.detected_industries.keys()),
    'metrics': [{
        'type': m.name,
        'value': m.value,
        'unit': m.unit
    } for m in enhanced.extracted_metrics]
})
```

## Quality Scoring

### Text Quality (0.0-1.0)
- **Length**: Texts >100 chars worth more
- **Entities**: 3+ entities = 0.3 points
- **Metrics**: 2+ metrics = 0.25 points
- **Structure**: Presence of multiple sentences

### Data Enrichment (0.0-1.0)
- **Entities**: 0-25% (if extracted)
- **Metrics**: 0-25% (if extracted)
- **Industry**: 0-25% (if detected)
- **Sentiment**: 0-25% (if analyzed)

### NLP Quality (0.0-1.0)
- **Description**: 30% weight
- **Sentiment**: 30% weight
- **Entities**: 20% weight
- **Metrics**: 20% weight

## Performance

- **Single text**: 1-5ms
- **Company analysis**: 10-50ms (depending on news count)
- **Entity extraction**: <1ms for 500-char text
- **Sentiment analysis**: <1ms per text
- **Classification**: <2ms per text

## Supported Languages

Currently optimized for **English**. Can work with other languages but accuracy may vary.

## Limitations

- No dependency parsing
- Limited semantic understanding
- Pattern-based extraction (not ML-based)
- English optimized
- No custom entity types
- No word embeddings

## Future Enhancements

- [ ] spaCy integration for better NER
- [ ] BERT-based sentiment analysis
- [ ] Multi-language support
- [ ] Custom entity type configuration
- [ ] Semantic similarity scoring
- [ ] Knowledge graph extraction
- [ ] Stance detection
- [ ] Aspect-based sentiment

## API Reference

### NLPPipeline

```python
pipeline = NLPPipeline()

# Analyze single text
result = pipeline.analyze_text(text: str) -> TextAnalysisResult

# Analyze company data
enhanced = pipeline.analyze_company(
    company_data: Dict[str, Any]
) -> EnhancedCompanyData
```

### EntityExtractor

```python
entities = pipeline.entity_extractor.extract_entities(
    text: str
) -> List[Entity]
```

### SentimentAnalyzer

```python
sentiment = pipeline.sentiment_analyzer.analyze(
    text: str
) -> SentimentScore
```

### IndustryClassifier

```python
industry = pipeline.industry_classifier.classify(
    text: str
) -> IndustryClassification
```

### TopicClassifier

```python
topic = pipeline.topic_classifier.classify(
    text: str
) -> TopicClassification
```

## Examples

See `example_usage.py` for 4 complete working examples:
1. Text analysis with entity and metric extraction
2. Complete company analysis with news sentiment
3. Sentiment trend detection
4. JSON export of results

## Testing

```bash
python3 -m unittest test_nlp_pipeline -v
```

## Architecture

```
NLPPipeline (Orchestrator)
├── EntityExtractor
│   ├── Named entity recognition
│   ├── Metric extraction
│   └── Relationship extraction
├── SentimentAnalyzer
│   └── TrendAnalyzer
├── IndustryClassifier
│   └── 10 industry keywords
└── TopicClassifier
    └── 6 topic categories
```

## Data Flow

```
Input Text / Company Data
        ↓
[Entity Extraction] → Entities, Metrics, Relationships
        ↓
[Sentiment Analysis] → Sentiment scores, Trends
        ↓
[Classification] → Industries, Topics
        ↓
[Quality Scoring] → Quality metrics
        ↓
Enriched Data (TextAnalysisResult / EnhancedCompanyData)
```

## License

Private project
