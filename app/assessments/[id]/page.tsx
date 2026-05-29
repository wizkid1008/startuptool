import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ScoreMatrix } from "@/components/ScoreMatrix";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const [{ data: assessment }, { data: scores }, { data: evidence }] = await Promise.all([
    supabase.from("assessments").select("*, companies(*)").eq("id", id).single(),
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

  const company = assessment.companies as { name: string } | null;

  return (
    <main className="shell">
      <AppHeader />
      <section className="section">
        <div className="topbar">
          <div>
            <h1>{company?.name ?? "Assessment"}</h1>
            <p className="muted">
              Status: {assessment.status}
              {assessment.model_name ? ` / ${assessment.model_name}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <form method="post" action="/api/agent/score">
              <input type="hidden" name="assessment_id" value={assessment.id} />
              <button type="submit">Run Agent Score</button>
            </form>
            <form method="post" action="/api/excel/export">
              <input type="hidden" name="assessment_id" value={assessment.id} />
              <button className="secondary" type="submit">
                Export Excel
              </button>
            </form>
          </div>
        </div>

        {assessment.executive_summary ? (
          <article className="panel">
            <h2>Executive Summary</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              {assessment.executive_summary}
            </p>
          </article>
        ) : null}

        <ScoreMatrix scores={scores ?? []} />

        <article className="panel">
          <h2>Recent Evidence</h2>
          <div className="section">
            {(evidence ?? []).map((item) => (
              <div key={item.id}>
                <strong>{item.title ?? item.evidence_type}</strong>
                {item.url ? (
                  <>
                    {" "}
                    <a className="muted" href={item.url}>
                      {item.url}
                    </a>
                  </>
                ) : null}
                <p className="muted">{item.excerpt}</p>
              </div>
            ))}
            {evidence?.length === 0 ? <p className="muted">No evidence stored yet.</p> : null}
          </div>
        </article>
      </section>
    </main>
  );
}
