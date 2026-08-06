import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";
import { buildScoringPrompt } from "@/lib/smeat/prompts";
import {
  canonicalAgentScoreResponseSchema,
  computeCriticalityScore
} from "@/lib/smeat/scoring";
import { createServiceClient } from "@/lib/supabase/server";

export const SCORING_MODEL = "claude-sonnet-5";

/** A run older than this is treated as abandoned — see isStaleRun. */
export const STALE_RUN_MINUTES = 20;

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

/**
 * Runs the scoring pass and persists the result.
 *
 * Deliberately not awaited by the route handler: the Anthropic call takes
 * minutes, and holding the POST open that long means the browser sits on a
 * blank request with no way to show progress. The route authorizes the caller
 * against the assessment first, then dispatches this.
 *
 * It uses the service-role client because there is no request context left by
 * the time it runs — the response has already been sent and the session
 * cookies are gone. Authorization happened before dispatch.
 */
export async function runScoring(assessmentId: string, runId: string | null) {
  const supabase = createServiceClient();

  try {
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id,company_id")
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(assessmentError?.message ?? "Assessment not found");
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name,website,industry,stage,geography,employee_count_range,description")
      .eq("id", assessment.company_id)
      .single();

    if (companyError || !company) {
      throw new Error(companyError?.message ?? "Company not found");
    }

    const { data: documents } = await supabase
      .from("company_documents")
      .select("file_name,document_type,parsed_text")
      .eq("company_id", assessment.company_id);

    // Discovery answers are the richest evidence available. Without them the
    // agent is scoring 30 subdimensions from a profile and some file contents.
    const { data: answers } = await supabase
      .from("assessment_answers")
      .select("dimension_key,subdimension_key,question_id,answer,selected_level,status")
      .eq("assessment_id", assessmentId);

    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({
      model: SCORING_MODEL,
      // 30 subdimensions, each with a rationale and evidence, plus the
      // executive summary. 6000 truncated regularly, which surfaced as a JSON
      // parse failure after the call had already been billed.
      max_tokens: 16000,
      messages: [
        { role: "user", content: buildScoringPrompt(company, documents ?? [], answers ?? []) }
      ]
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "The model hit its output limit before finishing. Raise max_tokens or switch to streaming."
      );
    }

    const text = response.content.map((block) => ("text" in block ? block.text : "")).join("");
    const validated = canonicalAgentScoreResponseSchema.parse(JSON.parse(extractJson(text)));

    // Build every row first, then write. A per-row loop could fail partway and
    // leave the assessment with the old scores deleted and only some new ones.
    const scoreRows = validated.scores.map((score) => ({
      assessment_id: assessmentId,
      dimension_key: score.dimension_key,
      subdimension_key: score.subdimension_key,
      maturity_score: score.maturity_score,
      impact_score: score.impact_score,
      criticality_score: computeCriticalityScore(score.maturity_score, score.impact_score),
      effort_score: score.effort_score ?? null,
      time_score: score.time_score ?? null,
      cost_score: score.cost_score ?? null,
      estimate_confidence: score.estimate_confidence ?? null,
      confidence: score.confidence ?? null,
      source: "ai",
      rationale: score.rationale
    }));

    // A person's judgment outranks a re-run. Rows they edited are kept as they
    // are — previously every manual maturity, impact, effort and reviewer note
    // was deleted before the new scores were written, with no warning first.
    const { data: edited } = await supabase
      .from("assessment_scores")
      .select("dimension_key,subdimension_key")
      .eq("assessment_id", assessmentId)
      .eq("source", "manual");

    const preserved = new Set(
      (edited ?? []).map((row) => `${row.dimension_key}:${row.subdimension_key}`)
    );

    const writableRows = scoreRows.filter(
      (row) => !preserved.has(`${row.dimension_key}:${row.subdimension_key}`)
    );

    await supabase.from("assessment_evidence").delete().eq("assessment_id", assessmentId);
    await supabase
      .from("assessment_scores")
      .delete()
      .eq("assessment_id", assessmentId)
      .neq("source", "manual");

    const { data: insertedScores, error: scoresError } = await supabase
      .from("assessment_scores")
      .insert(writableRows)
      .select("id,dimension_key,subdimension_key");

    if (scoresError) {
      throw new Error(scoresError.message);
    }

    // Evidence has to attach to preserved rows too, so look up every current
    // row rather than only the ones just inserted.
    const { data: allScores } = await supabase
      .from("assessment_scores")
      .select("id,dimension_key,subdimension_key")
      .eq("assessment_id", assessmentId);

    const scoreIdByKey = new Map(
      (allScores ?? insertedScores ?? []).map((score) => [
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
        model_name: SCORING_MODEL
      })
      .eq("id", assessmentId);

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "succeeded",
          output_payload: validated,
          completed_at: new Date().toISOString()
        })
        .eq("id", runId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown scoring error";

    await supabase.from("assessments").update({ status: "failed" }).eq("id", assessmentId);

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", runId);
    }
  }
}

/**
 * A run still marked "running" long after it started almost certainly died
 * with the process — a redeploy or a restart. Without this the assessment sits
 * on "researching" forever with no way to retry.
 */
export function isStaleRun(startedAt: string | null | undefined) {
  if (!startedAt) return false;
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return false;
  return Date.now() - started > STALE_RUN_MINUTES * 60 * 1000;
}
