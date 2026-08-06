import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/PageHead";
import { Stepper } from "@/components/Stepper";
import { PLANNED_ONLY } from "@/lib/smeat/actions";
import {
  assessmentStatusTone,
  formatRelative,
  pillClass
} from "@/lib/smeat/presentation";
import { computeStages } from "@/lib/smeat/stages";
import { createSessionClient } from "@/lib/supabase/server";
import { displayUrl, safeExternalUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function CompanyPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assessment?: string }>;
}) {
  const { id } = await params;
  const { assessment: fromAssessment } = await searchParams;
  const supabase = await createSessionClient();

  const [{ data: company }, { data: assessments }, { data: documents }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase
      .from("assessments")
      .select("id,status,model_provider,model_name,created_at,updated_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_documents")
      .select("id,file_name,mime_type,size_bytes,parsed_text,created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
  ]);

  if (!company) {
    notFound();
  }

  const website = safeExternalUrl(company.website);
  const meta = [company.industry, company.stage, company.geography].filter(Boolean).join(" · ");

  // Arriving from an assessment's Profile step: keep the flow visible rather
  // than dropping the user out of it with no way back.
  const inFlow = (assessments ?? []).some((row) => row.id === fromAssessment);

  const stages = inFlow
    ? await (async () => {
        const [{ data: answers }, { count: scoreCount }, { count: actionCount }] =
          await Promise.all([
            supabase
              .from("assessment_answers")
              .select("status")
              .eq("assessment_id", fromAssessment!),
            supabase
              .from("assessment_scores")
              .select("id", { count: "exact", head: true })
              .eq("assessment_id", fromAssessment!),
            supabase
              .from("assessment_actions")
              .select("id", { count: "exact", head: true })
              .eq("assessment_id", fromAssessment!)
              .or(PLANNED_ONLY)
          ]);

        return computeStages({
          assessmentId: fromAssessment!,
          companyId: company.id,
          hasDescription: Boolean(company.description),
          documentCount: (documents ?? []).length,
          answeredCount: (answers ?? []).filter((a) => a.status === "answered").length,
          needsInputCount: (answers ?? []).filter((a) => a.status === "needs_input").length,
          scoreCount: scoreCount ?? 0,
          editedCount: 0,
          estimatedCount: 0,
          actionCount: actionCount ?? 0,
          status: ""
        });
      })()
    : null;

  return (
    <>
      <PageHead
        eyebrow={inFlow ? "SMEAT / Companies / Profile" : "SMEAT / Companies"}
        title={company.name}
        lede={meta || "Company profile"}
        actions={
          inFlow ? (
            <Link className="btn" href={`/assessments/${fromAssessment}/discovery`}>
              Back to discovery
            </Link>
          ) : (
            <form method="post" action="/api/assessments">
              <input type="hidden" name="company_id" value={company.id} />
              <button type="submit">Start assessment</button>
            </form>
          )
        }
      />

      {stages ? <Stepper stages={stages} current="profile" /> : null}

      <div className="grid split">
        <article className="card">
          <div className="card-head">
            <h2>Profile</h2>
            <span className={company.status === "archived" ? "pill ghost" : "pill good"}>
              {company.status}
            </span>
          </div>
          <div className="card-body">
            <div className="between">
              <span className="microlabel">Website</span>
              {website ? (
                <a href={website} target="_blank" rel="noopener noreferrer">
                  {displayUrl(website)}
                </a>
              ) : (
                <span className="muted">—</span>
              )}
            </div>
            <div className="between">
              <span className="microlabel">Size</span>
              <span>{company.employee_count_range ?? "—"}</span>
            </div>
            <div className="between">
              <span className="microlabel">Added</span>
              <span>{formatRelative(company.created_at)}</span>
            </div>

            <hr className="rule" />

            <p className="small muted">
              {company.description ?? "No description provided."}
            </p>
          </div>
        </article>

        <article className="card">
          <div className="card-head">
            <h2>Workbook import</h2>
            <span className="microlabel">xlsx · csv</span>
          </div>
          <form method="post" action="/api/excel/import" encType="multipart/form-data">
            <input type="hidden" name="company_id" value={company.id} />
            <div className="field">
              <label htmlFor="file">Score workbook</label>
              <input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />
              <span className="hint">
                Columns: dimension_key, subdimension_key, maturity_score, impact_score,
                confidence, rationale.
              </span>
            </div>
            <button className="secondary" type="submit" style={{ marginTop: 14 }}>
              Import workbook
            </button>
          </form>
        </article>
      </div>

      <section className="section">
        <article className="card plain">
          <div className="card-head">
            <h2>Source documents</h2>
            <span className="microlabel">
              {documents?.length ?? 0} uploaded
            </span>
          </div>

          <form
            method="post"
            action="/api/documents"
            encType="multipart/form-data"
            style={{ marginBottom: 18 }}
          >
            <input type="hidden" name="company_id" value={company.id} />
            <div className="field">
              <label htmlFor="document">Upload evidence</label>
              <input
                id="document"
                name="document"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.csv"
                required
              />
              <span className="hint">
                Only text, Markdown, and CSV files are parsed into agent context today. PDFs and
                images are stored but not yet read.
              </span>
            </div>
            <button className="secondary" type="submit" style={{ marginTop: 14 }}>
              Upload document
            </button>
          </form>

          <div className="tablewrap">
            <div className="tablescroll">
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Parsed</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {(documents ?? []).map((document) => (
                    <tr key={document.id}>
                      <td>{document.file_name}</td>
                      <td className="muted small">{document.mime_type}</td>
                      <td className="muted tnum nowrap">
                        {Math.max(1, Math.round(document.size_bytes / 1024))} KB
                      </td>
                      <td>
                        {document.parsed_text ? (
                          <span className="pill good">Readable</span>
                        ) : (
                          <span className="pill ghost">Stored only</span>
                        )}
                      </td>
                      <td className="muted small nowrap">
                        {formatRelative(document.created_at)}
                      </td>
                    </tr>
                  ))}

                  {documents?.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty">
                          <strong>No documents uploaded yet.</strong>
                          <span>Evidence uploaded here is passed to the scoring agent.</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>

      <section className="section">
        <article className="card plain">
          <div className="card-head">
            <h2>Assessments</h2>
            <Link className="btn quiet small" href="/assessments">
              All assessments
            </Link>
          </div>

          <div className="tablewrap">
            <div className="tablescroll">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Model</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(assessments ?? []).map((assessment) => (
                    <tr key={assessment.id}>
                      <td>
                        <span className={pillClass(assessmentStatusTone(assessment.status))}>
                          {assessment.status}
                        </span>
                      </td>
                      <td className="muted small">
                        {[assessment.model_provider, assessment.model_name]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </td>
                      <td className="muted small nowrap">
                        {formatRelative(assessment.updated_at)}
                      </td>
                      <td className="nowrap">
                        <Link
                          className="btn secondary small"
                          href={`/assessments/${assessment.id}`}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {assessments?.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty">
                          <strong>No assessments yet.</strong>
                          <span>Start one to run the SMEAT scoring agent against this company.</span>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
