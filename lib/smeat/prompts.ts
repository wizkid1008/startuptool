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
  documents: Array<{ file_name: string; document_type?: string | null; parsed_text?: string | null }> = [],
  answers: Array<{
    dimension_key: string;
    subdimension_key: string;
    question_id: string;
    answer: string | null;
    status: string;
  }> = []
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

Discovery answers:
${
  answers.length === 0
    ? "None gathered. Score from the profile and documents alone, and keep confidence low."
    : JSON.stringify(
        answers
          .filter((answer) => answer.status === "answered" && answer.answer)
          .map((answer) => ({
            subdimension: `${answer.dimension_key}/${answer.subdimension_key}`,
            question_id: answer.question_id,
            answer: answer.answer
          })),
        null,
        2
      )
}

${
  answers.filter((answer) => answer.status === "needs_input").length > 0
    ? `The following remain unanswered, so evidence for them is genuinely absent. Reflect that in confidence rather than inferring:
${JSON.stringify(
  answers
    .filter((answer) => answer.status === "needs_input")
    .map((answer) => answer.question_id),
  null,
  2
)}`
    : ""
}

Canonical SMEAT scoring surface:
${JSON.stringify(dimensions, null, 2)}

Scales (note that they run in opposite directions):
- maturity_score: how developed the capability is.
  1=Advanced, 2=Developing, 3=Emerging, 4=Nascent (least developed)
- impact_score: how much this matters to the business.
  4=Critical to the success of the business
  3=Of neutral importance to the success of the business
  2=Not critical to the success of the business
  1=Not needed at this stage of the company
- confidence: 0 to 1

Criticality is computed as maturity_score x impact_score (range 1-16), so the
highest-priority findings are undeveloped capabilities the business critically
needs. Do not compute it yourself; return only the two ratings.

Also estimate what it would take to move each subdimension up one maturity
level. These run 1 to 4, low to high — 1 is cheap and fast:

- effort_score: 1=Minimal, days to a few weeks with the existing team and no
  budget approval. 2=Moderate, one to three months reallocating existing
  people. 3=Substantial, a quarter or two, a hire or vendor and a budget line.
  4=Major, six months or more, structural change.
- time_score: elapsed time before the benefit shows, separately from effort —
  some things are cheap but slow. 1=weeks, 2=one to three months,
  3=three to nine months, 4=nine months or more.
- cost_score: relative to this company's means, not an absolute figure.
  1=negligible, absorbed in current budget. 2=modest line item.
  3=significant, needs approval and trades against something else.
  4=major capital or headcount commitment.
- estimate_confidence: how well founded your estimate is. 1=speculative,
  2=indicative, 3=reasoned from evidence, 4=validated.

Be honest with estimate_confidence. Without discovery answers or documents
covering a subdimension, an effort estimate is speculative — say so with a 1
rather than presenting a guess as reasoned.

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
