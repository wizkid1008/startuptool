import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { buildScoringPrompt } from "@/lib/smeat/prompts";
import {
  canonicalAgentScoreResponseSchema,
  computeCriticalityScore
} from "@/lib/smeat/scoring";
import { createSessionClient } from "@/lib/supabase/server";

// Scoring 30 subdimensions is a long call. Without this the platform default
// (as low as 10s) kills the request mid-flight.
export const maxDuration = 300;

const requestSchema = z.object({
  assessment_id: z.string().uuid("A valid assessment is required")
});

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsedRequest = requestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsedRequest.success) {
    return failurePage({
      title: "That scoring run could not be started.",
      detail: formatIssues(parsedRequest.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const assessmentId = parsedRequest.data.assessment_id;
  const back = `/assessments/${assessmentId}`;
  const supabase = await createSessionClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id,company_id")
    .eq("id", assessmentId)
    .single();

  if (assessmentError || !assessment) {
    return failurePage({
      title: "That assessment was not found.",
      detail: assessmentError?.message,
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status: 404
    });
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("name,website,industry,stage,geography,employee_count_range,description")
    .eq("id", assessment.company_id)
    .single();

  if (companyError || !company) {
    return failurePage({
      title: "The company for that assessment was not found.",
      detail: companyError?.message,
      backHref: back,
      backLabel: "Back to assessment",
      status: 404
    });
  }

  const { data: documents } = await supabase
    .from("company_documents")
    .select("file_name,document_type,parsed_text")
    .eq("company_id", assessment.company_id);

  const modelName = "claude-sonnet-5";

  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      assessment_id: assessmentId,
      run_type: "scoring",
      status: "running",
      input_payload: company,
      model_provider: "anthropic",
      model_name: modelName
    })
    .select("id")
    .single();

  await supabase
    .from("assessments")
    .update({ status: "researching", model_provider: "anthropic", model_name: modelName })
    .eq("id", assessmentId);

  try {
    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({
      model: modelName,
      // 30 subdimensions, each with a rationale and evidence, plus the
      // executive summary. 6000 truncated regularly, which surfaced as a JSON
      // parse failure after the call had already been billed.
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: buildScoringPrompt(company, documents ?? [])
        }
      ]
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "The model hit its output limit before finishing. Raise max_tokens or switch to streaming."
      );
    }

    const text = response.content.map((block) => ("text" in block ? block.text : "")).join("");
    const validated = canonicalAgentScoreResponseSchema.parse(JSON.parse(extractJson(text)));

    // Build every row first, then write in two statements. The previous
    // per-row loop could fail partway and leave the assessment with the old
    // scores already deleted and only some of the new ones written.
    const scoreRows = validated.scores.map((score) => ({
      assessment_id: assessmentId,
      dimension_key: score.dimension_key,
      subdimension_key: score.subdimension_key,
      maturity_score: score.maturity_score,
      impact_score: score.impact_score,
      criticality_score: computeCriticalityScore(score.maturity_score, score.impact_score),
      confidence: score.confidence ?? null,
      source: "ai",
      rationale: score.rationale
    }));

    await supabase.from("assessment_evidence").delete().eq("assessment_id", assessmentId);
    await supabase.from("assessment_scores").delete().eq("assessment_id", assessmentId);

    const { data: insertedScores, error: scoresError } = await supabase
      .from("assessment_scores")
      .insert(scoreRows)
      .select("id,dimension_key,subdimension_key");

    if (scoresError || !insertedScores) {
      throw new Error(scoresError?.message ?? "Scores could not be saved");
    }

    const scoreIdByKey = new Map(
      insertedScores.map((score) => [
        `${score.dimension_key}:${score.subdimension_key}`,
        score.id
      ])
    );

    const evidenceRows = validated.scores.flatMap((score) =>
      score.evidence.map((evidence) => ({
        assessment_id: assessmentId,
        assessment_score_id:
          scoreIdByKey.get(`${score.dimension_key}:${score.subdimension_key}`) ?? null,
        evidence_type: evidence.evidence_type,
        title: evidence.title ?? null,
        url: evidence.url ?? null,
        excerpt: evidence.excerpt ?? null,
        confidence: evidence.confidence ?? null
      }))
    );

    if (evidenceRows.length > 0) {
      const { error: evidenceError } = await supabase
        .from("assessment_evidence")
        .insert(evidenceRows);

      if (evidenceError) {
        throw new Error(evidenceError.message);
      }
    }

    await supabase
      .from("assessments")
      .update({
        status: "scored",
        executive_summary: validated.executive_summary,
        model_provider: "anthropic",
        model_name: modelName
      })
      .eq("id", assessmentId);

    if (run) {
      await supabase
        .from("agent_runs")
        .update({
          status: "succeeded",
          output_payload: validated,
          completed_at: new Date().toISOString()
        })
        .eq("id", run.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scoring error";

    await supabase.from("assessments").update({ status: "failed" }).eq("id", assessmentId);

    if (run) {
      await supabase
        .from("agent_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", run.id);
    }

    return failurePage({
      title: "The scoring run failed.",
      detail: message,
      backHref: back,
      backLabel: "Back to assessment",
      status: 500
    });
  }

  return seeOther(back, request);
}
