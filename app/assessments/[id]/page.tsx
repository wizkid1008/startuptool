import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PageHead } from "@/components/PageHead";
import { ScoreReview } from "@/components/ScoreReview";
import { SegmentHeatMap } from "@/components/SegmentHeatMap";
import { findSubdimension } from "@/lib/smeat/model";
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
        .order("created_at", { ascending: false })
        .limit(12),
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

  // The query already ranks by criticality — surface it instead of discarding it.
  const topCriticality = rows.slice(0, 8);

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
        {assessment.model_name ? (
          <span className="pill ghost">{assessment.model_name}</span>
        ) : null}
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

      <section style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h2>Segments</h2>
          <span className="microlabel">Criticality · 1–16</span>
        </div>
        <SegmentHeatMap scores={rows} />
      </section>

      <div className="grid four">
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

        <div className="stat">
          <div className="microlabel">Subdimensions scored</div>
          <div className="num">{rows.length}</div>
          <div className="stat-note">of 30 canonical</div>
        </div>

        <div className="stat">
          <div className="microlabel">Evidence items</div>
          <div className="num">{evidence?.length ?? 0}</div>
          <div className="stat-note">Most recent 12 shown</div>
        </div>
      </div>

      {assessment.executive_summary ? (
        <section className="section">
          <article className="card">
            <div className="card-head">
              <h2>Executive summary</h2>
            </div>
            <p className="lede">{assessment.executive_summary}</p>
          </article>
        </section>
      ) : null}

      <section className="section grid split">
        <article className="card">
          <div className="card-head">
            <h2>Top criticality</h2>
            <span className="microlabel">Ranked 1–16</span>
          </div>
          <div className="card-body">
            {topCriticality.length === 0 ? (
              <p className="muted small">No scores yet. Run the agent to populate this view.</p>
            ) : (
              <div>
                {topCriticality.map((score) => {
                  const subdimension = findSubdimension(
                    score.dimension_key,
                    score.subdimension_key
                  );
                  const value = Number(score.criticality_score);

                  return (
                    <div className="between" key={score.id} style={{ padding: "9px 0" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>
                          {subdimension?.label ?? score.subdimension_key}
                        </div>
                        <div className="hint">{score.dimension_key}</div>
                      </div>
                      <span className={pillClass(criticalityTone(value))}>
                        {value.toFixed(0)} {criticalityBand(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <h2>Recent evidence</h2>
          </div>
          <div className="card-body">
            {(evidence ?? []).length === 0 ? (
              <p className="muted small">No evidence stored yet.</p>
            ) : (
              (evidence ?? []).map((item) => {
                const url = safeExternalUrl(item.url);

                return (
                  <div key={item.id} className="stack tight">
                    <div className="row">
                      <span className="pill ghost">{item.evidence_type}</span>
                      <strong className="small">{item.title ?? "Untitled source"}</strong>
                    </div>
                    {url ? (
                      <a
                        className="small muted"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {displayUrl(url)}
                      </a>
                    ) : null}
                    {item.excerpt ? <p className="small muted">{item.excerpt}</p> : null}
                    <hr className="rule" />
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

      <section className="section">
        <div className="card-head">
          <h2>Score matrix</h2>
          <span className="microlabel">Click a row to edit</span>
        </div>
        <ScoreReview assessmentId={assessment.id} scores={rows} actions={actions ?? []} />
      </section>
    </>
  );
}
