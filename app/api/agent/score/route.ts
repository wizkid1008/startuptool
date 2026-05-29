import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { buildScoringPrompt } from "@/lib/smeat/prompts";
import { agentScoreResponseSchema, computeOpportunityScore } from "@/lib/smeat/scoring";
import { createServiceClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  assessment_id: z.string().uuid()
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
  const parsed = requestSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createServiceClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*, companies(*)")
    .eq("id", parsed.assessment_id)
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json(
      { error: assessmentError?.message ?? "Assessment not found" },
      { status: 404 }
    );
  }

  const company = assessment.companies as {
    name: string;
    website?: string | null;
    industry?: string | null;
    stage?: string | null;
    geography?: string | null;
    employee_count_range?: string | null;
    description?: string | null;
  };

  const { data: documents } = await supabase
    .from("company_documents")
    .select("file_name,document_type,parsed_text")
    .eq("company_id", assessment.company_id);

  const modelName = "claude-sonnet-4-20250514";

  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      assessment_id: parsed.assessment_id,
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
    .eq("id", parsed.assessment_id);

  try {
    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({
      model: modelName,
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content: buildScoringPrompt(company, documents ?? [])
        }
      ]
    });

    const text = response.content.map((block) => ("text" in block ? block.text : "")).join("");
    const validated = agentScoreResponseSchema.parse(JSON.parse(extractJson(text)));

    await supabase.from("assessment_scores").delete().eq("assessment_id", parsed.assessment_id);
    await supabase.from("assessment_evidence").delete().eq("assessment_id", parsed.assessment_id);

    for (const score of validated.scores) {
      const opportunityScore = computeOpportunityScore(score.maturity_score, score.impact_score);
      const { data: insertedScore, error: scoreError } = await supabase
        .from("assessment_scores")
        .insert({
          assessment_id: parsed.assessment_id,
          dimension_key: score.dimension_key,
          subdimension_key: score.subdimension_key,
          maturity_score: score.maturity_score,
          impact_score: score.impact_score,
          opportunity_score: opportunityScore,
          confidence: score.confidence ?? null,
          source: "ai",
          rationale: score.rationale
        })
        .select("id")
        .single();

      if (scoreError) {
        throw new Error(scoreError.message);
      }

      if (score.evidence.length > 0) {
        await supabase.from("assessment_evidence").insert(
          score.evidence.map((evidence) => ({
            assessment_id: parsed.assessment_id,
            assessment_score_id: insertedScore.id,
            evidence_type: evidence.evidence_type,
            title: evidence.title ?? null,
            url: evidence.url ?? null,
            excerpt: evidence.excerpt ?? null,
            confidence: evidence.confidence ?? null
          }))
        );
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
      .eq("id", parsed.assessment_id);

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
    await supabase.from("assessments").update({ status: "failed" }).eq("id", parsed.assessment_id);
    if (run) {
      await supabase
        .from("agent_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", run.id);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  redirect(`/assessments/${parsed.assessment_id}`);
}
