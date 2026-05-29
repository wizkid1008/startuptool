import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { createServiceClient } from "@/lib/supabase/server";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const [{ data: company }, { data: assessments }, { data: documents }] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase
      .from("assessments")
      .select("id,status,model_provider,model_name,created_at,updated_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_documents")
      .select("id,file_name,mime_type,size_bytes,created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
  ]);

  if (!company) {
    notFound();
  }

  return (
    <main className="shell">
      <AppHeader />
      <section className="section">
        <div className="topbar">
          <div>
            <h1>{company.name}</h1>
            <p className="muted">
              {[company.industry, company.stage, company.geography].filter(Boolean).join(" / ") ||
                "Company profile"}
            </p>
          </div>
          <form method="post" action="/api/assessments">
            <input type="hidden" name="company_id" value={company.id} />
            <button type="submit">Start Assessment</button>
          </form>
        </div>

        <div className="grid two">
          <article className="panel">
            <h2>Profile</h2>
            <div className="section">
              <p>
                <strong>Website:</strong>{" "}
                {company.website ? <a href={company.website}>{company.website}</a> : "-"}
              </p>
              <p>
                <strong>Size:</strong> {company.employee_count_range ?? "-"}
              </p>
              <p className="muted">{company.description ?? "No description provided."}</p>
            </div>
          </article>

          <article className="panel">
            <h2>Excel Operations</h2>
            <div className="section">
              <form method="post" action="/api/excel/import" encType="multipart/form-data">
                <input type="hidden" name="company_id" value={company.id} />
                <div className="field">
                  <label htmlFor="file">Import score workbook</label>
                  <input id="file" name="file" type="file" accept=".xlsx,.xls,.csv" required />
                </div>
                <button className="secondary" type="submit" style={{ marginTop: 10 }}>
                  Import Excel
                </button>
              </form>
            </div>
          </article>
        </div>

        <article className="panel">
          <h2>Source Documents</h2>
          <div className="section">
            <form method="post" action="/api/documents" encType="multipart/form-data">
              <input type="hidden" name="company_id" value={company.id} />
              <div className="field">
                <label htmlFor="document">Upload source document</label>
                <input
                  id="document"
                  name="document"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.csv"
                  required
                />
              </div>
              <button className="secondary" type="submit" style={{ marginTop: 10 }}>
                Upload Document
              </button>
            </form>

            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {(documents ?? []).map((document) => (
                  <tr key={document.id}>
                    <td>{document.file_name}</td>
                    <td>{document.mime_type}</td>
                    <td>{Math.round(document.size_bytes / 1024)} KB</td>
                    <td>{new Date(document.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {documents?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No documents uploaded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <div className="panel" style={{ overflowX: "auto" }}>
          <h2>Assessments</h2>
          <table style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Status</th>
                <th>Model</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(assessments ?? []).map((assessment) => (
                <tr key={assessment.id}>
                  <td>{assessment.status}</td>
                  <td>
                    {[assessment.model_provider, assessment.model_name].filter(Boolean).join(" / ") ||
                      "-"}
                  </td>
                  <td>{new Date(assessment.updated_at).toLocaleString()}</td>
                  <td>
                    <Link className="button secondary" href={`/assessments/${assessment.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {assessments?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    No assessments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
