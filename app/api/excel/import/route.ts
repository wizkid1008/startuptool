import * as XLSX from "xlsx";
import { z } from "zod";
import { failurePage, seeOther } from "@/lib/http";
import { findSubdimension } from "@/lib/smeat/model";
import { computeOpportunityScore } from "@/lib/smeat/scoring";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 500;

const rowSchema = z.object({
  dimension_key: z.string().trim().min(1),
  subdimension_key: z.string().trim().min(1),
  maturity_score: z.coerce.number().int().min(1).max(4),
  impact_score: z.coerce.number().int().min(1).max(4),
  confidence: z.coerce.number().min(0).max(1).optional(),
  rationale: z.string().trim().optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const companyId = String(formData.get("company_id") ?? "");
  const file = formData.get("file");

  if (!z.string().uuid().safeParse(companyId).success) {
    return failurePage({
      title: "That import could not be accepted.",
      detail: "A valid company is required.",
      backHref: "/companies",
      backLabel: "Back to companies"
    });
  }

  const back = `/companies/${companyId}`;

  if (!(file instanceof File) || file.size === 0) {
    return failurePage({
      title: "No workbook was received.",
      detail: "Choose an .xlsx, .xls, or .csv file before importing.",
      backHref: back,
      backLabel: "Back to company"
    });
  }

  if (file.size > MAX_BYTES) {
    return failurePage({
      title: "That workbook is too large.",
      detail: `Limit is ${MAX_BYTES / (1024 * 1024)} MB.`,
      backHref: back,
      backLabel: "Back to company",
      status: 413
    });
  }

  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;

    if (!sheet) {
      return failurePage({
        title: "That workbook has no sheets.",
        backHref: back,
        backLabel: "Back to company"
      });
    }

    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } catch (error) {
    return failurePage({
      title: "That workbook could not be read.",
      detail: error instanceof Error ? error.message : undefined,
      backHref: back,
      backLabel: "Back to company"
    });
  }

  if (rows.length === 0) {
    return failurePage({
      title: "That workbook has no rows.",
      detail:
        "Expected columns: dimension_key, subdimension_key, maturity_score, impact_score, confidence, rationale.",
      backHref: back,
      backLabel: "Back to company"
    });
  }

  if (rows.length > MAX_ROWS) {
    return failurePage({
      title: "That workbook has too many rows.",
      detail: `Limit is ${MAX_ROWS} rows; this file has ${rows.length}.`,
      backHref: back,
      backLabel: "Back to company"
    });
  }

  // Validate every row before writing anything, and report all failures at once
  // with their sheet row numbers rather than aborting on the first bad cell.
  const problems: string[] = [];
  const validRows: z.infer<typeof rowSchema>[] = [];

  rows.forEach((row, index) => {
    const sheetRow = index + 2; // +1 for zero-index, +1 for the header row
    const parsed = rowSchema.safeParse(row);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        problems.push(`Row ${sheetRow} — ${issue.path.join(".") || "row"}: ${issue.message}`);
      });
      return;
    }

    if (!findSubdimension(parsed.data.dimension_key, parsed.data.subdimension_key)) {
      problems.push(
        `Row ${sheetRow} — unknown SMEAT key "${parsed.data.dimension_key}/${parsed.data.subdimension_key}"`
      );
      return;
    }

    validRows.push(parsed.data);
  });

  if (problems.length > 0) {
    return failurePage({
      title: `${problems.length} problem${problems.length === 1 ? "" : "s"} in that workbook.`,
      detail: problems.slice(0, 40).join("\n"),
      backHref: back,
      backLabel: "Back to company"
    });
  }

  const supabase = createServiceClient();
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({ company_id: companyId, status: "reviewed" })
    .select("id")
    .single();

  if (assessmentError || !assessment) {
    return failurePage({
      title: "The assessment could not be created.",
      detail: assessmentError?.message,
      backHref: back,
      backLabel: "Back to company",
      status: 500
    });
  }

  const { error: scoresError } = await supabase.from("assessment_scores").insert(
    validRows.map((row) => ({
      assessment_id: assessment.id,
      dimension_key: row.dimension_key,
      subdimension_key: row.subdimension_key,
      maturity_score: row.maturity_score,
      impact_score: row.impact_score,
      opportunity_score: computeOpportunityScore(row.maturity_score, row.impact_score),
      confidence: row.confidence ?? null,
      source: "import",
      rationale: row.rationale || null
    }))
  );

  if (scoresError) {
    await supabase
      .from("assessments")
      .update({ status: "failed" })
      .eq("id", assessment.id);

    return failurePage({
      title: "The scores could not be saved.",
      detail: scoresError.message,
      backHref: back,
      backLabel: "Back to company",
      status: 500
    });
  }

  await supabase.from("agent_runs").insert({
    assessment_id: assessment.id,
    run_type: "import",
    status: "succeeded",
    input_payload: { file_name: file.name, row_count: validRows.length },
    completed_at: new Date().toISOString()
  });

  return seeOther(`/assessments/${assessment.id}`, request);
}
