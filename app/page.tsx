import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { SMEAT_DIMENSIONS, findSubdimension } from "@/lib/smeat/model";
import {
  formatRelative,
  criticalityBand,
  criticalityLevel,
  criticalityTone,
  readinessScore,
  readinessTone,
  pillClass
} from "@/lib/smeat/presentation";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const RUN_LABEL: Record<string, string> = {
  scoring: "Agent scoring run",
  research: "Research run",
  analysis: "Analysis run",
  import: "Workbook imported",
  export: "Workbook exported"
};

export default async function OverviewPage() {
  const supabase = await createSessionClient();

  const [companiesResult, assessmentsResult, scoresResult, documentsResult, runsResult] =
    await Promise.all([
      supabase.from("companies").select("id,name").order("created_at", { ascending: false }),
      supabase.from("assessments").select("id,company_id,status,updated_at"),
      supabase
        .from("assessment_scores")
        .select("assessment_id,dimension_key,subdimension_key,criticality_score")
        .order("criticality_score", { ascending: false })
        .limit(4000),
      supabase.from("company_documents").select("id", { count: "exact", head: true }),
      supabase
        .from("agent_runs")
        .select("id,assessment_id,run_type,status,created_at,error")
        .order("created_at", { ascending: false })
        .limit(6)
    ]);

  const loadError =
    companiesResult.error ?? assessmentsResult.error ?? scoresResult.error ?? runsResult.error;

  if (loadError) {
    return (
      <>
        <PageHead eyebrow="SMEAT / Overview" title="Overview" />
        <div className="notice bad">
          <strong>Could not load the workspace.</strong>
          <span>{loadError.message}</span>
          <span className="small">
            Check your Supabase environment variables and confirm the migration has run.
          </span>
        </div>
      </>
    );
  }

  const companies = companiesResult.data ?? [];
  const assessments = assessmentsResult.data ?? [];
  const scores = scoresResult.data ?? [];
  const runs = runsResult.data ?? [];
  const documentCount = documentsResult.count ?? 0;

  const companyNameById = new Map(companies.map((company) => [company.id, company.name]));
  const companyIdByAssessment = new Map(
    assessments.map((assessment) => [assessment.id, assessment.company_id])
  );

  const companyNameForAssessment = (assessmentId: string | null) => {
    if (!assessmentId) return null;
    const companyId = companyIdByAssessment.get(assessmentId);
    return companyId ? (companyNameById.get(companyId) ?? null) : null;
  };

  // Readiness inverts average criticality across the 1–16 range.
  const averageCriticality =
    scores.length > 0
      ? scores.reduce((total, score) => total + Number(score.criticality_score), 0) / scores.length
      : null;
  const readiness = readinessScore(averageCriticality);
  const tone = readinessTone(readiness);

  const scoredAssessments = assessments.filter((assessment) =>
    ["scored", "reviewed", "finalized"].includes(assessment.status)
  ).length;

  const dimensionSummary = SMEAT_DIMENSIONS.map((dimension) => {
    const rows = scores.filter((score) => score.dimension_key === dimension.key);
    const average =
      rows.length > 0
        ? rows.reduce((total, score) => total + Number(score.criticality_score), 0) / rows.length
        : null;

    return { dimension, average, count: rows.length };
  });

  const topGaps = scores.slice(0, 6);

  return (
    <>
      <PageHead
        eyebrow="SMEAT / Assessment Agent"
        title="Overview"
        lede="Portfolio readiness, dimension exposure, and the highest-value gaps across every assessed company."
        actions={
          <>
            <Link className="btn secondary" href="/companies">
              View pipeline
            </Link>
            <Link className="btn" href="/companies/new">
              Add company
            </Link>
          </>
        }
      />

      <div className="grid four">
        <div className="stat">
          <div className="microlabel">Portfolio readiness</div>
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
          <div className="stat-note">
            {scores.length > 0 ? `Across ${scores.length} scored subdimensions` : "No scores yet"}
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
          <div className="stat-note">Scale 1–16 per subdimension</div>
        </div>

        <div className="stat">
          <div className="microlabel">Companies</div>
          <div className="num">{companies.length}</div>
          <div className="stat-note">
            {scoredAssessments} of {assessments.length} assessments scored
          </div>
        </div>

        <div className="stat">
          <div className="microlabel">Documents</div>
          <div className="num">{documentCount}</div>
          <div className="stat-note">Source evidence uploaded</div>
        </div>
      </div>

      <div className="section grid split">
        <article className="card">
          <div className="card-head">
            <h2>Dimension criticality summary</h2>
            <span className="microlabel">Avg 1–16</span>
          </div>
          <div className="card-body">
            {dimensionSummary.map(({ dimension, average, count }) => (
              <div className="between" key={dimension.key}>
                <div>
                  <div style={{ fontWeight: 600 }}>{dimension.label}</div>
                  <div className="hint">
                    {count > 0
                      ? `${count} scored subdimension${count === 1 ? "" : "s"}`
                      : "Not yet scored"}
                  </div>
                </div>
                {average === null ? (
                  <span className="pill ghost">No data</span>
                ) : (
                  <span className={pillClass(criticalityTone(average))}>
                    {criticalityLevel(average)} {criticalityBand(average)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <h2>Top gaps</h2>
            <span className="microlabel">Highest criticality</span>
          </div>
          <div className="card-body">
            {topGaps.length === 0 ? (
              <p className="muted small">
                Run an agent scoring pass to surface the highest-value gaps.
              </p>
            ) : (
              <div>
                {topGaps.map((gap, index) => {
                  const subdimension = findSubdimension(gap.dimension_key, gap.subdimension_key);
                  const company = companyNameForAssessment(gap.assessment_id);

                  return (
                    <div className="gapitem" key={`${gap.assessment_id}-${index}`}>
                      <span className="gapdot" aria-hidden="true">
                        !
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {subdimension?.label ?? gap.subdimension_key}
                        </div>
                        <div className="hint">
                          {company ?? "Unknown company"} · Criticality{" "}
                          {criticalityLevel(Number(gap.criticality_score))} of 4
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="section">
        <article className="card plain">
          <div className="card-head">
            <h2>Recent activity</h2>
            <Link className="btn quiet small" href="/assessments">
              All assessments
            </Link>
          </div>

          {runs.length === 0 ? (
            <div className="empty">
              <strong>No agent activity yet.</strong>
              <span>Imports, exports, and scoring runs will appear here.</span>
            </div>
          ) : (
            <div className="feed">
              {runs.map((run) => {
                const company = companyNameForAssessment(run.assessment_id);

                return (
                  <div className="feeditem" key={run.id}>
                    <span className="feedicon" aria-hidden="true">
                      {run.status === "failed" ? "!" : run.status === "running" ? "…" : "✓"}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {RUN_LABEL[run.run_type] ?? run.run_type}
                      </div>
                      <div className="hint">
                        {company ?? "Unlinked"} ·{" "}
                        {run.status === "failed" && run.error ? run.error : run.status}
                      </div>
                    </div>
                    <span className="feedtime">{formatRelative(run.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </>
  );
}
