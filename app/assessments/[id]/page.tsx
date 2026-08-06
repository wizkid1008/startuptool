import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PageHead } from "@/components/PageHead";
import { MovementSince } from "@/components/MovementSince";
import { PriorityBoard } from "@/components/PriorityBoard";
import { SegmentExplorer } from "@/components/SegmentExplorer";
import { isStaleRun, STALE_RUN_MINUTES } from "@/lib/smeat/run-scoring";
import {
  assessmentStatusTone,
  formatRelative,
  criticalityBand,
  criticalityTone,
  readinessScore,
  readinessTone,
  pillClass
} from "@/lib/smeat/presentation";
import { createSessionClient } from "@/lib/supabase/server";
import { displayUrl, safeExternalUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSessionClient();

  const [
    { data: assessment },
    { data: scores },
    { data: evidence },
    { data: actions },
    { data: latestRun }
  ] =
    await Promise.all([
      supabase.from("assessments").select("*").eq("id", id).single(),
      supabase
        .from("assessment_scores")
        .select("*")
        .eq("assessment_id", id)
        .order("criticality_score", { ascending: false }),
      supabase
        .from("assessment_evidence")
        .select("*")
        .eq("assessment_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_actions")
        .select("id,assessment_score_id,dimension_key,subdimension_key,title,owner,due_date,status")
        .eq("assessment_id", id)
        .order("created_at", { ascending: true }),

      supabase
        .from("agent_runs")
        .select("id,status,error,created_at,completed_at")
        .eq("assessment_id", id)
        .eq("run_type", "scoring")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

  if (!assessment) {
    notFound();
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id,name")
    .eq("id", assessment.company_id)
    .single();

  // The schema has always supported multiple assessments per company; nothing
  // has ever surfaced the movement between them.
  const { data: priorAssessment } = await supabase
    .from("assessments")
    .select("id,updated_at")
    .eq("company_id", assessment.company_id)
    .neq("id", assessment.id)
    .in("status", ["scored", "reviewed", "finalized"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: priorScores } = priorAssessment
    ? await supabase
        .from("assessment_scores")
        .select("dimension_key,subdimension_key,maturity_score,criticality_score")
        .eq("assessment_id", priorAssessment.id)
    : { data: null };

  const rows = scores ?? [];
  const hasScores = rows.length > 0;

  // A run left "running" well past its expected duration died with the
  // process. Distinguish that from one genuinely still working, so the page
  // offers a retry instead of spinning forever.
  const stalled = latestRun?.status === "running" && isStaleRun(latestRun.created_at);
  const isRunning = assessment.status === "researching" && !stalled;
  const isStalled = assessment.status === "researching" && Boolean(stalled);

  const averageCriticality =
    rows.length > 0
      ? rows.reduce((total, score) => total + Number(score.criticality_score), 0) / rows.length
      : null;
  const readiness = readinessScore(averageCriticality);
  const tone = readinessTone(readiness);

  return (
    <>
      <PageHead
        eyebrow={
          company ? `SMEAT / ${company.name} / Assessment` : "SMEAT / Assessment"
        }
        title={company?.name ?? "Assessment"}
        actions={
          <>
            {isRunning ? (
              <span className="pill info">Scoring in progress</span>
            ) : (
              <ActionForm
                action="/api/agent/score"
                label={hasScores ? "Re-run agent score" : "Run agent score"}
                pendingLabel="Starting…"
              >
                <input type="hidden" name="assessment_id" value={assessment.id} />
              </ActionForm>
            )}
            <Link className="btn secondary" href={`/assessments/${assessment.id}/discovery`}>
              Discovery
            </Link>
            <form method="post" action="/api/excel/export">
              <input type="hidden" name="assessment_id" value={assessment.id} />
              <button className="secondary" type="submit">
                Export Excel
              </button>
            </form>
          </>
        }
      />

      <div className="row" style={{ marginTop: -12, marginBottom: 24 }}>
        <span className={pillClass(assessmentStatusTone(assessment.status))}>
          {assessment.status}
        </span>
        <span className="hint">Updated {formatRelative(assessment.updated_at)}</span>
        {company ? (
          <Link className="btn quiet small" href={`/companies/${company.id}`}>
            Back to company
          </Link>
        ) : null}
      </div>

      {isRunning ? (
        <div className="notice" style={{ marginBottom: 20 }}>
          <strong>Scoring in progress.</strong>
          <span className="small">
            The agent is scoring all 30 subdimensions. This usually takes two to four minutes —
            you can leave this page and come back.{" "}
            <AutoRefresh startedAt={latestRun?.created_at} />
          </span>
        </div>
      ) : null}

      {isStalled ? (
        <div className="notice warn" style={{ marginBottom: 20 }}>
          <strong>That run appears to have stopped.</strong>
          <span className="small">
            It has been marked as running for over {STALE_RUN_MINUTES} minutes, which usually
            means the server restarted mid-run. Start a new run to try again.
          </span>
          <form method="post" action="/api/agent/score" style={{ marginTop: 8 }}>
            <input type="hidden" name="assessment_id" value={assessment.id} />
            <button className="secondary small" type="submit">
              Start a new run
            </button>
          </form>
        </div>
      ) : null}

      {assessment.status === "failed" ? (
        <div className="notice bad" style={{ marginBottom: 20 }}>
          <strong>The last scoring run failed.</strong>
          {latestRun?.error ? <span className="small">{latestRun.error}</span> : null}
          <span className="small">
            Any previous scores were cleared before the run. Re-run the agent to rebuild them.
          </span>
        </div>
      ) : null}

      {/* Headline numbers on the left, the narrative beside them rather than
          stacked below — they are read together. */}
      <div className="grid summaryrow">
        <div className="stack">
          <div className="stat">
            <div className="microlabel">Readiness</div>
            <div className="num">
              {readiness === null ? (
                <span className="muted">—</span>
              ) : (
                <>
                  {readiness}
                  <span className="num-unit"> /100</span>
                </>
              )}
            </div>
            <div className={`meter ${tone}`}>
              <span style={{ width: `${readiness ?? 0}%` }} />
            </div>
            <div className="stat-note">{rows.length} of 30 subdimensions scored</div>
          </div>

          <div className="stat">
            <div className="microlabel">Average criticality</div>
            <div className="num">
              {averageCriticality === null ? (
                <span className="muted">—</span>
              ) : (
                averageCriticality.toFixed(1)
              )}
            </div>
            <div>
              {averageCriticality === null ? (
                <span className="pill ghost">Not scored</span>
              ) : (
                <span className={pillClass(criticalityTone(averageCriticality))}>
                  {criticalityBand(averageCriticality)}
                </span>
              )}
            </div>
          </div>
        </div>

        {assessment.executive_summary ? (
          <article className="card">
            <div className="card-head">
              <h2>Executive summary</h2>
            </div>
            <p className="lede">{assessment.executive_summary}</p>
          </article>
        ) : (
          <article className="card">
            <div className="card-head">
              <h2>Executive summary</h2>
            </div>
            <p className="muted small">
              Written by the agent when scoring completes.
            </p>
          </article>
        )}
      </div>

      {/* Segments first: the reviewer's entry point into the detail. Priority
          is a derived read of the same data and belongs after it. */}
      <section className="section">
        <div className="card-head">
          <h2>Segments</h2>
          <span className="microlabel">Select a segment · criticality 1–16</span>
        </div>
        <SegmentExplorer
          assessmentId={assessment.id}
          scores={rows}
          evidence={evidence ?? []}
          actions={actions ?? []}
        />
      </section>

      <section className="section">
        <div className="card-head">
          <h2>Priority</h2>
          <span className="microlabel">Criticality x (5 - effort) · 1-64</span>
        </div>
        <PriorityBoard scores={rows} />
      </section>

      {priorAssessment && priorScores && priorScores.length > 0 && hasScores ? (
        <section className="section">
          <div className="card-head">
            <h2>Change since last assessment</h2>
            <span className="microlabel">Maturity movement</span>
          </div>
          <article className="card">
            <MovementSince
              current={rows}
              previous={priorScores}
              previousLabel={formatRelative(priorAssessment.updated_at)}
            />
          </article>
        </section>
      ) : null}

    </>
  );
}
