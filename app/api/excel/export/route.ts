import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { createServiceClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  assessment_id: z.string().uuid()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createServiceClient();

  const [{ data: assessment }, { data: scores }, { data: evidence }] = await Promise.all([
    supabase.from("assessments").select("*, companies(*)").eq("id", parsed.assessment_id).single(),
    supabase.from("assessment_scores").select("*").eq("assessment_id", parsed.assessment_id),
    supabase.from("assessment_evidence").select("*").eq("assessment_id", parsed.assessment_id)
  ]);

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const company = assessment.companies as { name: string } | null;
  const scoreRows = (scores ?? []).map((score) => ({
    dimension_key: score.dimension_key,
    dimension: SMEAT_DIMENSIONS.find((dimension) => dimension.key === score.dimension_key)?.label,
    subdimension_key: score.subdimension_key,
    maturity_score: score.maturity_score,
    impact_score: score.impact_score,
    opportunity_score: Number(score.opportunity_score),
    confidence: score.confidence,
    source: score.source,
    rationale: score.rationale
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        company_name: company?.name,
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

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  await supabase.from("agent_runs").insert({
    assessment_id: parsed.assessment_id,
    run_type: "export",
    status: "succeeded",
    input_payload: { assessment_id: parsed.assessment_id },
    completed_at: new Date().toISOString()
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${company?.name ?? "smeat"}-assessment.xlsx"`
    }
  });
}
