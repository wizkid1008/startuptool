"""
FastAPI backend for Enterprise Viability Assessment tool
Securely handles Claude API calls for AI Research and Analysis
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
import base64
import re
from typing import Optional, List
from anthropic import Anthropic

app = FastAPI(title="Enterprise Assessment Backend")

# CORS configuration - allow frontend origin
origins = [
    "http://localhost:8000",
    "http://localhost:3000",
    "https://wizkid1008.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
import os
api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY environment variable not set")
client = Anthropic(api_key=api_key)

# Models
class CompanyProfile(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    geography: Optional[str] = None
    description: Optional[str] = None


class AutoScoreRequest(BaseModel):
    profile: CompanyProfile
    documents: Optional[List[dict]] = []


def build_auto_score_prompt(profile: CompanyProfile) -> str:
    """Build the prompt for Claude to score SMEAT dimensions"""

    segs = [
        {"label": "Customer", "subs": ["Products, Markets & Channels", "Marketing and Branding", "Sales and Pricing", "Customer Experience"]},
        {"label": "People", "subs": ["Capability", "Performance Management", "Innovation", "Leadership", "Rewards"]},
        {"label": "Operations", "subs": ["Sourcing & Supply Chain", "Internal Operations & Assets", "Distribution & Logistics", "Operations Strategy", "Operational Excellence"]},
        {"label": "Finance", "subs": ["Finance Process & Control", "Stakeholder Management", "People & Organization", "Data and Technology", "Funding Growth"]},
        {"label": "Analytics", "subs": ["Digital Enterprise", "Data and Analytics", "Security and Privacy"]},
        {"label": "Risk", "subs": ["Governance", "Risk Management", "Policy & Compliance", "Stakeholder Management"]},
        {"label": "Impact", "subs": ["Impact Metrics", "Technology", "Data and Analytics", "Design"]},
    ]

    seg_str = " | ".join([f"{s['label']}({', '.join(s['subs'])})" for s in segs])

    return f"""You are an expert business analyst. Research "{profile.company_name}"{f", in {profile.industry}" if profile.industry else ""}{f" at {profile.stage}" if profile.stage else ""}{f" in {profile.geography}" if profile.geography else ""} using web search if needed.

{f"Context: {profile.description}" if profile.description else ""}

SMEAT segments: {seg_str}

Maturity: 1=Advanced, 2=Developing, 3=Emerging, 4=Nascent
Impact:   1=Critical, 2=Neutral, 3=Low, 4=Not needed

Return ONLY valid JSON in ```json...``` format with complete scores for all segments and sub-criteria. Include maturity, impact, and reasoning for each.

Example structure:
```json
{{
  "company_name": "...",
  "industry": "...",
  "stage": "...",
  "geography": "...",
  "summary": "2-3 sentences",
  "overall_confidence": 0.8,
  "segments": {{
    "customer": {{
      "subs": [
        {{"name": "Products, Markets & Channels", "maturity": 2, "impact": 1, "reasoning": "..."}},
        {{"name": "Marketing and Branding", "maturity": 2, "impact": 1, "reasoning": "..."}}
      ],
      "confidence": 0.8,
      "data_sources": "..."
    }},
    "people": {{}},
    "operations": {{}},
    "finance": {{}},
    "analytics": {{}},
    "risk": {{}},
    "impact": {{}}
  }}
}}
```"""


async def stream_auto_score(profile: CompanyProfile, documents: List[dict]):
    """Stream auto-score results from Claude"""

    prompt = build_auto_score_prompt(profile)

    # Build content blocks
    content = [{"type": "text", "text": prompt}]

    # Add documents if provided
    for doc in documents:
        if doc.get("mediaType") == "application/pdf" and doc.get("data"):
            content.append({
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": doc["data"]
                }
            })
        elif doc.get("mediaType", "").startswith("image/") and doc.get("data"):
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": doc["mediaType"],
                    "data": doc["data"]
                }
            })

    # Stream from Claude
    try:
        with client.messages.stream(
            model="claude-opus-4-6",
            max_tokens=4000,
            messages=[
                {"role": "user", "content": content}
            ]
        ) as stream:
            json_buffer = ""
            in_json = False
            json_started = False

            for text in stream.text_stream:
                # Accumulate text until we find JSON
                if not json_started:
                    if "```json" in text:
                        json_started = True
                        # Extract part after ```json
                        parts = text.split("```json", 1)
                        if len(parts) > 1:
                            json_buffer = parts[1]
                        continue

                if json_started:
                    # Stop at closing ```
                    if "```" in text:
                        parts = text.split("```", 1)
                        json_buffer += parts[0]
                        in_json = False
                        break
                    else:
                        json_buffer += text
                        # Try to parse and yield chunks
                        try:
                            parsed = json.loads(json_buffer)
                            yield f"data: {json.dumps({'type': 'chunk', 'data': parsed})}\n\n"
                            json_buffer = ""
                        except json.JSONDecodeError:
                            # Keep accumulating
                            pass

            # Final parse of complete JSON
            if json_buffer:
                try:
                    parsed = json.loads(json_buffer)
                    yield f"data: {json.dumps({'type': 'complete', 'data': parsed})}\n\n"
                except json.JSONDecodeError as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': f'Failed to parse response: {str(e)}'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@app.post("/api/auto-score")
async def auto_score_endpoint(profile: CompanyProfile, documents: Optional[str] = Form(None)):
    """
    Auto-score endpoint that streams Claude responses

    POST /api/auto-score
    - profile: JSON company profile
    - documents: JSON array of documents (base64 encoded)
    """

    try:
        # Parse documents if provided
        docs = []
        if documents:
            docs = json.loads(documents)

        # Stream response
        return StreamingResponse(
            stream_auto_score(profile, docs),
            media_type="text/event-stream"
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_endpoint(
    company_name: str = Form(...),
    scores: str = Form(...),
    analysis_type: str = Form("full")
):
    """
    Generate strategic analysis based on SMEAT scores

    POST /api/analyze
    - company_name: Company name
    - scores: JSON string of SMEAT scores
    - analysis_type: full, strengths, market, roadmap, or risk
    """

    try:
        scores_data = json.loads(scores)
        scores_text = json.dumps(scores_data, indent=2)

        analysis_prompts = {
            "full": f"""Senior strategy consultant assessment for {company_name}.
1. **Executive Summary**
2. **Key Strengths** (top 2-3)
3. **Critical Gaps** (highest criticality + low maturity)
4. **Market Context** vs sector peers
5. **Strategic Priorities** (3-5 specific, actionable)
6. **Viability Rating** (High/Med-High/Med/Med-Low/Low + justification)
Be direct, specific, no generic advice.""",

            "strengths": """Strengths & gaps analysis:
1. **Top Strengths** (2-4) — strong maturity + high impact, WHY competitive
2. **Critical Gaps** (2-4) — weak maturity + high impact, quantify risk
3. **Hidden Risks** — low-rated but actually dangerous given stage/sector
4. **Quick Wins** — 2-3 fixable in 30-90 days""",

            "market": f"""Market benchmarking for {company_name}:
1. **Sector Benchmarks** — typical maturity for similar stage companies
2. **Competitive Positioning**
3. **Industry Insights** — what leaders excel at
4. **Market Opportunity** from these scores
5. **Competitive Threats** from these gaps""",

            "roadmap": """Growth roadmap:
**Phase 1 (0-3 months): Stabilize** — urgent gaps, specific actions, metrics
**Phase 2 (3-9 months): Strengthen** — priority investments, expected outcomes
**Phase 3 (9-18 months): Scale** — capabilities needed, milestones
**Key Enablers & Blockers**""",

            "risk": """Risk profile:
1. **Top 3 Operational Risks**
2. **Financial Risk**
3. **People & Capability Risk**
4. **Market & Customer Risk**
5. **Compliance & Governance Risk**
6. **Overall Risk Rating** (Critical/High/Medium/Low)
7. **Top 3 Mitigation Quick Wins**"""
        }

        prompt = analysis_prompts.get(analysis_type, analysis_prompts["full"])
        full_prompt = f"""{prompt}

---
COMPANY: {company_name}
SMEAT SCORES:
{scores_text}

---
Format with **bold headers**. Be specific and actionable."""

        async def stream_analysis():
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": full_prompt}
                ]
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"

        return StreamingResponse(
            stream_analysis(),
            media_type="text/event-stream"
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
