import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { z } from "zod";
import { computeOpportunityScore } from "@/lib/smeat/scoring";
import { createServiceClient } from "@/lib/supabase/server";

const rowSchema = z.object({
  dimension_key: z.string().min(1),
  subdimension_key: z.string().min(1),
  maturity_score: z.coerce.number().int().min(1).max(4),
  impact_score: z.coerce.number().int().min(1).max(4),
  confidence: z.coerce.number().min(0).max(1).optional(),
  rationale: z.string().optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const companyId = String(formData.get("company_id") ?? "");
  const file = formData.get("file");

  if (!companyId || !(file instanceof File)) {
    return NextResponse.json({ error: "company_id and file are required" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const parsedRows = rows.map((row) => rowSchema.parse(row));
  const supabase = createServiceClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({ company_id: companyId, status: "reviewed" })
    .select("id")
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json(
      { error: assessmentError?.message ?? "Could not create assessment" },
      { status: 500 }
    );
  }

  await supabase.from("assessment_scores").insert(
    parsedRows.map((row) => ({
      assessment_id: assessment.id,
      dimension_key: row.dimension_key,
      subdimension_key: row.subdimension_key,
      maturity_score: row.maturity_score,
      impact_score: row.impact_score,
      opportunity_score: computeOpportunityScore(row.maturity_score, row.impact_score),
      confidence: row.confidence ?? null,
      source: "import",
      rationale: row.rationale ?? null
    }))
  );

  await supabase.from("agent_runs").insert({
    assessment_id: assessment.id,
    run_type: "import",
    status: "succeeded",
    input_payload: { file_name: file.name, row_count: parsedRows.length },
    completed_at: new Date().toISOString()
  });

  redirect(`/assessments/${assessment.id}`);
}
