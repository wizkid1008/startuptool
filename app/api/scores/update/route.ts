import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { computeCriticalityScore } from "@/lib/smeat/scoring";
import { createSessionClient } from "@/lib/supabase/server";

const schema = z.object({
  score_id: z.string().uuid("A valid score is required"),
  maturity_score: z.coerce.number().int().min(1).max(4),
  impact_score: z.coerce.number().int().min(1).max(4),
  reviewer_note: z.string().trim().max(4000).optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That score could not be saved.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const supabase = await createSessionClient();

  // No ownership check needed here: row-level security scopes the update to
  // the caller's organization, so a row outside it simply will not match.
  const { data, error } = await supabase
    .from("assessment_scores")
    .update({
      maturity_score: parsed.data.maturity_score,
      impact_score: parsed.data.impact_score,
      criticality_score: computeCriticalityScore(
        parsed.data.maturity_score,
        parsed.data.impact_score
      ),
      reviewer_note: parsed.data.reviewer_note || null,
      // Records that a human has touched this row. The agent's rationale is
      // deliberately left intact so the original reasoning stays auditable.
      source: "manual"
    })
    .eq("id", parsed.data.score_id)
    .select("assessment_id")
    .single();

  if (error || !data) {
    return failurePage({
      title: "That score could not be saved.",
      detail: error?.message ?? "The score was not found, or you do not have access to it.",
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status: error ? 500 : 404
    });
  }

  return seeOther(`/assessments/${data.assessment_id}`, request);
}
