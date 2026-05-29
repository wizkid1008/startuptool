import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";

export default function HomePage() {
  return (
    <main className="shell">
      <AppHeader />

      <section className="section">
        <div className="grid two">
          <div className="panel">
            <div className="eyebrow">Production Rebuild</div>
            <h1>Formal SMEAT Opportunity Scoring Agent</h1>
            <p className="muted" style={{ marginTop: 16 }}>
              Create companies, run evidence-backed AI scoring, review each SMEAT
              subdimension, and export decision-ready opportunity reports.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              <Link className="button" href="/companies/new">
                Add Company
              </Link>
              <Link className="button secondary" href="/companies">
                View Pipeline
              </Link>
            </div>
          </div>

          <div className="panel">
            <h2>Agent Workflow</h2>
            <div className="section">
              {[
                "Company profile and source capture",
                "Document and public research intake",
                "Canonical SMEAT subdimension scoring",
                "Evidence, confidence, and rationale storage",
                "Human review and override",
                "Excel import/export for operating workflows"
              ].map((item, index) => (
                <p key={item}>
                  <span className="score">{index + 1}</span> {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>SMEAT Dimensions</h2>
        <div className="grid three">
          {SMEAT_DIMENSIONS.map((dimension) => (
            <article className="panel" key={dimension.key}>
              <h3>{dimension.label}</h3>
              <p className="muted" style={{ marginTop: 8 }}>
                {dimension.description}
              </p>
              <p className="muted" style={{ marginTop: 12 }}>
                {dimension.subdimensions.length} subdimensions
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
