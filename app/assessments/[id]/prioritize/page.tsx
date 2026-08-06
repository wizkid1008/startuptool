import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/PageHead";
import { PriorityBoard } from "@/components/PriorityBoard";
import { Stepper } from "@/components/Stepper";
import { PLANNED_ONLY } from "@/lib/smeat/actions";
import { computeStages, nextStage } from "@/lib/smeat/stages";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PrioritizePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSessionClient();

  const [{ data: assessment }, { data: scores }, { data: answers }, { count: actionCount }] =
    await Promise.all([
      supabase.from("assessments").select("*").eq("id", id).single(),
      supabase.from("assessment_scores").select("*").eq("assessment_id", id),
      supabase.from("assessment_answers").select("status").eq("assessment_id", id),
      supabase
        .from("assessment_actions")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", id)
        .or(PLANNED_ONLY)
    ]);

  if (!assessment) {
    notFound();
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,description")
    .eq("id", assessment.company_id)
    .single();

  const { count: documentCount } = await supabase
    .from("company_documents")
    .select("id", { count: "exact", head: true })
    .eq("company_id", assessment.company_id);

  const rows = scores ?? [];
  const estimated = rows.filter((row) => row.effort_score !== null).length;

  const stages = computeStages({
    assessmentId: assessment.id,
    companyId: assessment.company_id,
    hasDescription: Boolean(company?.description),
    documentCount: documentCount ?? 0,
    answeredCount: (answers ?? []).filter((a) => a.status === "answered").length,
    needsInputCount: (answers ?? []).filter((a) => a.status === "needs_input").length,
    scoreCount: rows.length,
    editedCount: rows.filter((row) => row.source === "manual").length,
    estimatedCount: estimated,
    actionCount: actionCount ?? 0,
    status: assessment.status
  });

  const upcoming = nextStage(stages);

  return (
    <>
      <PageHead
        eyebrow={
          company ? `SMEAT / ${company.name} / Prioritize` : "SMEAT / Prioritize"
        }
        title="Prioritize"
        lede="What matters most, and what it will take. Criticality says how big the gap is; effort says how hard it is to close."
        actions={
          <>
            <Link className="btn secondary" href={`/assessments/${assessment.id}`}>
              Back to assessment
            </Link>
            <Link className="btn" href={`/assessments/${assessment.id}/plan`}>
              On to the plan
            </Link>
          </>
        }
      />

      <Stepper stages={stages} current="prioritize" />

      {rows.length === 0 ? (
        <div className="empty">
          <strong>Nothing to prioritise yet.</strong>
          <span>Score the assessment first — priority is built from those scores.</span>
        </div>
      ) : (
        <>
          {estimated === 0 ? (
            <div className="notice" style={{ marginBottom: 16 }}>
              <strong>Set effort to get a ranking.</strong>
              <span className="small">
                Criticality alone cannot order the work — a critical gap that takes a week and
                one that takes a year are not the same call. Estimate the rows below and they
                sort themselves.
              </span>
            </div>
          ) : null}

          <section className="section">
            <div className="card-head">
              <h2>Priority</h2>
              <span className="microlabel">Criticality × (5 − effort)</span>
            </div>
            <PriorityBoard scores={rows} />
          </section>

          {upcoming?.key === "plan" ? (
            <p className="hint">
              Estimates are in. <Link href={`/assessments/${assessment.id}/plan`}>Plan</Link> turns
              this order into dated work.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
