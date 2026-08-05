import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { formatRelative } from "@/lib/smeat/presentation";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const supabase = createServiceClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id,name,industry,stage,geography,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <PageHead
        eyebrow="SMEAT / Companies"
        title="Companies"
        lede="The assessment pipeline. Open a company to upload evidence and run a scoring pass."
        actions={
          <Link className="btn" href="/companies/new">
            Add company
          </Link>
        }
      />

      {error ? (
        <div className="notice bad">
          <strong>Could not load companies.</strong>
          <span>{error.message}</span>
          <span className="small">
            Check your Supabase environment variables and confirm the migration has run.
          </span>
        </div>
      ) : (
        <div className="tablewrap">
          <div className="tablescroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Industry</th>
                  <th>Stage</th>
                  <th>Geography</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {(companies ?? []).map((company) => (
                  <tr key={company.id}>
                    <td>
                      <Link href={`/companies/${company.id}`}>{company.name}</Link>
                    </td>
                    <td className="muted">{company.industry ?? "—"}</td>
                    <td className="muted">{company.stage ?? "—"}</td>
                    <td className="muted">{company.geography ?? "—"}</td>
                    <td>
                      <span
                        className={
                          company.status === "archived" ? "pill ghost" : "pill good"
                        }
                      >
                        {company.status}
                      </span>
                    </td>
                    <td className="muted small nowrap">{formatRelative(company.created_at)}</td>
                  </tr>
                ))}

                {companies?.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <strong>No companies yet.</strong>
                        <span>Add your first company to begin a SMEAT assessment.</span>
                        <Link className="btn small" href="/companies/new" style={{ marginTop: 8 }}>
                          Add company
                        </Link>
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
