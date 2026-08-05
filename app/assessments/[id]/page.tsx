import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { PageHead } from "@/components/PageHead";
import { ScoreMatrix } from "@/components/ScoreMatrix";
import { findSubdimension } from "@/lib/smeat/model";
import {
  assessmentStatusTone,
  formatRelative,
  opportunityBand,
  opportunityTone,
  pillClass
} from "@/lib/smeat/presentation";
import { createServiceClient } from "@/lib/supabase/server";
import { displayUrl, safeExternalUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

const MAX_OPPORTUNITY = 12;

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: assessment }, { data: scores }, { data: evidence }] = await Promise.all([
    supabase.from("assessments").select("*").eq("id", id).single(),
    supabase
      .from("assessment_scores")
      .select("*")
      .eq("assessment_id", id)
      .order("opportunity_score", { ascending: false }),
    supabase
      .from("assessment_evidence")
      .select("*")
      .eq("assessment_id", id)
      .order("created_at", { ascending: false })
      .limit(12)
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
  const averageOpportunity =
    rows.length > 0
      ? rows.reduce((total, score) => total + Number(score.opportunity_score), 0) / rows.length
      : 0;
  const readiness =
    rows.length > 0 ? Math.round(100 - (averageOpportunity / MAX_OPPORTUNITY) * 100) : 0;
  const readinessTone = readiness >= 70 ? "" : readiness >= 45 ? "warn" : "bad";

  // The query already ranks by opportunity — surface it instead of discarding it.
  const topOpportunities = rows.slice(0, 8);

  return (
    <>
      <PageHead
        eyebrow={
          company ? `SMEAT / ${company.name} / Assessment` : "SMEAT / Assessment"
        }
        title={company?.name ?? "Assessment"}
        actions={
          <>
            <ActionForm
              action="/api/agent/score"
              label="Run agent score"
              pendingLabel="Scoring…"
              hint="This can take several minutes."
            >
              <input type="hidden" name="assessment_id" value={assessment.id} />
            </ActionForm>
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

      {assessment.status === "failed" ? (
        <div className="notice bad" style={{ marginBottom: 20 }}>
          <strong>The last scoring run failed.</strong>
          <span className="small">
            Any previous scores were cleared before the run. Re-run the agent to rebuild them.
          </span>
        </div>
      ) : null}

      <div className="grid four">
        <div className="stat">
          <div className="microlabel">Readiness</div>
          <div className="num">
            {readiness}
            <span className="num-unit"> /100</span>
          </div>
          <div className={`meter ${readinessTone}`}>
            <span style={{ width: `${Math.max(0, Math.min(100, readiness))}%` }} />
          </div>
        </div>

        <div className="stat">
          <div className="microlabel">Average opportunity</div>
          <div className="num">{averageOpportunity.toFixed(1)}</div>
          <div>
            <span className={pillClass(opportunityTone(averageOpportunity))}>
              {opportunityBand(averageOpportunity)}
            </span>
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
            <h2>Top opportunities</h2>
            <span className="microlabel">Ranked 0–12</span>
          </div>
          <div className="card-body">
            {topOpportunities.length === 0 ? (
              <p className="muted small">No scores yet. Run the agent to populate this view.</p>
            ) : (
              <div>
                {topOpportunities.map((score) => {
                  const subdimension = findSubdimension(
                    score.dimension_key,
                    score.subdimension_key
                  );
                  const value = Number(score.opportunity_score);

                  return (
                    <div className="between" key={score.id} style={{ padding: "9px 0" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>
                          {subdimension?.label ?? score.subdimension_key}
                        </div>
                        <div className="hint">{score.dimension_key}</div>
                      </div>
                      <span className={pillClass(opportunityTone(value))}>
                        {value.toFixed(0)} {opportunityBand(value)}
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
          <span className="microlabel">All 30 subdimensions</span>
        </div>
        <ScoreMatrix scores={rows} />
      </section>
    </>
  );
}
