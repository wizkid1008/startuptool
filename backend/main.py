"""
FastAPI backend for Enterprise Viability Assessment tool
Securely handles Claude API calls for AI Research and Analysis
"""

from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Optional, List
from anthropic import Anthropic

app = FastAPI(title="Enterprise Assessment Backend v2")

# CORS configuration - allow all origins
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy client initialization
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        _client = Anthropic(api_key=api_key)
    return _client


# Models
class CompanyProfile(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None
    geography: Optional[str] = None
    description: Optional[str] = None


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

    return f"""You are an expert business analyst. Research "{profile.company_name}"{f", in {profile.industry}" if profile.industry else ""}{f" at {profile.stage}" if profile.stage else ""}{f" in {profile.geography}" if profile.geography else ""}.

{f"Context: {profile.description}" if profile.description else ""}

SMEAT segments: {seg_str}

Score each segment on maturity (1=Advanced to 4=Nascent) and impact (1=Critical to 4=Not needed).

Return ONLY valid JSON with scores for all segments."""


async def stream_auto_score(profile: CompanyProfile, documents: Optional[str] = None):
    """Stream auto-score response from Claude"""
    try:
        client = get_client()
        prompt = build_auto_score_prompt(profile)

        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            json_buffer = ""
            for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'chunk', 'data': text})}\n\n"
                json_buffer += text

                if "```json" in json_buffer and "```" in json_buffer.split("```json")[1]:
                    try:
                        json_str = json_buffer.split("```json")[1].split("```")[0].strip()
                        parsed = json.loads(json_str)
                        yield f"data: {json.dumps({'type': 'complete', 'data': parsed})}\n\n"
                        return
                    except json.JSONDecodeError:
                        pass

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "Enterprise Assessment Backend"}


@app.post("/api/auto-score")
async def auto_score_endpoint(
    company_name: str = Form(...),
    website: Optional[str] = Form(None),
    industry: Optional[str] = Form(None),
    stage: Optional[str] = Form(None),
    geography: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    documents: Optional[str] = Form(None),
):
    """Auto-score endpoint - streams Claude responses"""
    try:
        profile = CompanyProfile(
            company_name=company_name,
            website=website,
            industry=industry,
            stage=stage,
            geography=geography,
            description=description,
        )

        return StreamingResponse(
            stream_auto_score(profile, documents),
            media_type="text/event-stream",
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_endpoint(
    company_name: str = Form(...),
    scores: str = Form(...),
    analysis_type: Optional[str] = Form("full"),
):
    """Analysis endpoint - generates detailed analysis based on scores"""
    try:
        client = get_client()
        scores_data = json.loads(scores)

        prompt = f"""Analyze the following SMEAT assessment for {company_name}:

Scores: {json.dumps(scores_data, indent=2)}

Provide a comprehensive strategic analysis and recommendations."""

        async def stream_analysis():
            with client.messages.stream(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"

        return StreamingResponse(
            stream_analysis(),
            media_type="text/event-stream",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
