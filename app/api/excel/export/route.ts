import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import { failurePage, formatIssues } from "@/lib/http";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { createSessionClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  assessment_id: z.string().uuid("A valid assessment is required")
});

/**
 * A raw company name in Content-Disposition allows header injection via a
 * quote or newline. Emit a sanitised ASCII fallback plus an RFC 5987 form.
 */
function contentDisposition(name: string) {
  const base = name.trim() || "smeat";
  const ascii = base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80) || "smeat";
  const encoded = encodeURIComponent(`${base}-assessment.xlsx`);
  return `attachment; filename="${ascii}-assessment.xlsx"; filename*=UTF-8''${encoded}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That export could not be produced.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const assessmentId = parsed.data.assessment_id;
  const back = `/assessments/${assessmentId}`;
  const supabase = await createSessionClient();

  const [
    { data: assessment, error: assessmentError },
    { data: scores },
    { data: evidence },
    { data: actions }
  ] = await Promise.all([
    supabase.from("assessments").select("*").eq("id", assessmentId).single(),
    supabase.from("assessment_scores").select("*").eq("assessment_id", assessmentId),
    supabase.from("assessment_evidence").select("*").eq("assessment_id", assessmentId),
    supabase.from("assessment_actions").select("*").eq("assessment_id", assessmentId)
  ]);

  if (assessmentError || !assessment) {
    return failurePage({
      title: "That assessment was not found.",
      detail: assessmentError?.message,
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status: 404
    });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", assessment.company_id)
    .single();

  const scoreRows = (scores ?? []).map((score) => ({
    dimension_key: score.dimension_key,
    dimension: SMEAT_DIMENSIONS.find((dimension) => dimension.key === score.dimension_key)?.label,
    subdimension_key: score.subdimension_key,
    maturity_score: score.maturity_score,
    impact_score: score.impact_score,
    criticality_score: Number(score.criticality_score),
    effort_score: score.effort_score,
    time_score: score.time_score,
    cost_score: score.cost_score,
    estimate_confidence: score.estimate_confidence,
    priority_score: score.priority_score,
    confidence: score.confidence,
    source: score.source,
    rationale: score.rationale,
    reviewer_note: score.reviewer_note
  }));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        company_name: company?.name ?? "",
        assessment_id: assessment.id,
        status: assessment.status,
        executive_summary: assessment.executive_summary
      }
    ]),
    "Profile"
  );

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(scoreRows), "Scores");

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      (evidence ?? []).map((item) => ({
        evidence_type: item.evidence_type,
        title: item.title,
        url: item.url,
        excerpt: item.excerpt,
        confidence: item.confidence
      }))
    ),
    "Evidence"
  );

  // Actions round-trip too, so an exported workbook is a complete record of
  // the engagement rather than just its scores.
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      (actions ?? []).map((action) => ({
        dimension_key: action.dimension_key,
        subdimension_key: action.subdimension_key,
        title: action.title,
        owner: action.owner,
        due_date: action.due_date,
        status: action.status,
        detail: action.detail
      }))
    ),
    "Actions"
  );

  let buffer: Buffer;
  try {
    buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  } catch (error) {
    return failurePage({
      title: "The workbook could not be generated.",
      detail: error instanceof Error ? error.message : undefined,
      backHref: back,
      backLabel: "Back to assessment",
      status: 500
    });
  }

  await supabase.from("agent_runs").insert({
    assessment_id: assessmentId,
    run_type: "export",
    status: "succeeded",
    input_payload: { assessment_id: assessmentId },
    completed_at: new Date().toISOString()
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(company?.name ?? "smeat")
    }
  });
}
