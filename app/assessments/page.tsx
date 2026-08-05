import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import {
  assessmentStatusTone,
  formatRelative,
  pillClass
} from "@/lib/smeat/presentation";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const supabase = createServiceClient();

  const [assessmentsResult, companiesResult] = await Promise.all([
    supabase
      .from("assessments")
      .select("id,company_id,status,model_name,updated_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("companies").select("id,name")
  ]);

  const error = assessmentsResult.error ?? companiesResult.error;
  const assessments = assessmentsResult.data ?? [];
  const companyNameById = new Map(
    (companiesResult.data ?? []).map((company) => [company.id, company.name])
  );

  return (
    <>
      <PageHead
        eyebrow="SMEAT / Assessments"
        title="Assessments"
        lede="Every scoring event across the portfolio, newest first."
        actions={
          <Link className="btn secondary" href="/companies">
            Browse companies
          </Link>
        }
      />

      {error ? (
        <div className="notice bad">
          <strong>Could not load assessments.</strong>
          <span>{error.message}</span>
        </div>
      ) : (
        <div className="tablewrap">
          <div className="tablescroll">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Model</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>
                      <Link href={`/assessments/${assessment.id}`}>
                        {companyNameById.get(assessment.company_id) ?? "Untitled company"}
                      </Link>
                    </td>
                    <td>
                      <span className={pillClass(assessmentStatusTone(assessment.status))}>
                        {assessment.status}
                      </span>
                    </td>
                    <td className="muted small">{assessment.model_name ?? "—"}</td>
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

                {assessments.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        <strong>No assessments yet.</strong>
                        <span>Open a company and start an assessment to see it here.</span>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
