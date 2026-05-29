import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { createServiceClient } from "@/lib/supabase/server";

export default async function CompaniesPage() {
  const supabase = createServiceClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id,name,industry,stage,geography,status,created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="shell">
      <AppHeader />
      <section className="section">
        <div className="topbar">
          <div>
            <h1>Companies</h1>
            <p className="muted">Pipeline for SMEAT opportunity scoring.</p>
          </div>
          <Link className="button" href="/companies/new">
            Add Company
          </Link>
        </div>

        {error ? (
          <div className="panel">
            <p style={{ color: "var(--danger)" }}>{error.message}</p>
            <p className="muted" style={{ marginTop: 8 }}>
              Check your Supabase environment variables and run the migration.
            </p>
          </div>
        ) : (
          <div className="panel" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Industry</th>
                  <th>Stage</th>
                  <th>Geography</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(companies ?? []).map((company) => (
                  <tr key={company.id}>
                    <td>
                      <Link href={`/companies/${company.id}`}>{company.name}</Link>
                    </td>
                    <td>{company.industry ?? "-"}</td>
                    <td>{company.stage ?? "-"}</td>
                    <td>{company.geography ?? "-"}</td>
                    <td>{company.status}</td>
                  </tr>
                ))}
                {companies?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No companies yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
