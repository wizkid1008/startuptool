import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";

export function buildScoringPrompt(
  company: {
    name: string;
    website?: string | null;
    industry?: string | null;
    stage?: string | null;
    geography?: string | null;
    employee_count_range?: string | null;
    description?: string | null;
  },
  documents: Array<{ file_name: string; document_type?: string | null; parsed_text?: string | null }> = []
) {
  const dimensions = SMEAT_DIMENSIONS.map((dimension) => ({
    dimension_key: dimension.key,
    label: dimension.label,
    subdimensions: dimension.subdimensions
  }));

  return `You are a rigorous SMEAT Opportunity Scoring Agent.

Score the company across every canonical SMEAT subdimension.

Company:
${JSON.stringify(company, null, 2)}

Uploaded source documents:
${JSON.stringify(
  documents.map((document) => ({
    file_name: document.file_name,
    document_type: document.document_type,
    parsed_text_excerpt: document.parsed_text?.slice(0, 6000) ?? null
  })),
  null,
  2
)}

Canonical SMEAT scoring surface:
${JSON.stringify(dimensions, null, 2)}

Scales:
- maturity_score: 1=Advanced, 2=Developing, 3=Emerging, 4=Nascent
- impact_score: 1=Critical, 2=Important, 3=Low, 4=Not Needed
- confidence: 0 to 1

Return only valid JSON with this exact shape:
{
  "company_name": "string",
  "executive_summary": "string",
  "scores": [
    {
      "dimension_key": "customer",
      "subdimension_key": "products_markets_channels",
      "maturity_score": 1,
      "impact_score": 1,
      "confidence": 0.85,
      "rationale": "brief evidence-backed explanation",
      "evidence": [
        {
          "evidence_type": "web",
          "title": "source title",
          "url": "https://example.com",
          "excerpt": "short supporting excerpt",
          "confidence": 0.8
        }
      ]
    }
  ]
}

Rules:
- Include one score for every subdimension listed above.
- If evidence is not available, use evidence_type "model_inference" and explain the assumption.
- Do not invent URLs.
- Keep rationale concise and decision-useful.`;
}
