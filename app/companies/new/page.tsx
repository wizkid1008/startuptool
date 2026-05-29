import { AppHeader } from "@/components/AppHeader";

export default function NewCompanyPage() {
  return (
    <main className="shell">
      <AppHeader />
      <section className="section">
        <div>
          <h1>New Company</h1>
          <p className="muted">Create a company profile to start a SMEAT assessment.</p>
        </div>

        <form className="panel form" method="post" action="/api/companies">
          <div className="grid two">
            <div className="field">
              <label htmlFor="name">Company name</label>
              <input id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="url" />
            </div>
            <div className="field">
              <label htmlFor="linkedin_url">LinkedIn URL</label>
              <input id="linkedin_url" name="linkedin_url" type="url" />
            </div>
            <div className="field">
              <label htmlFor="crunchbase_url">Crunchbase URL</label>
              <input id="crunchbase_url" name="crunchbase_url" type="url" />
            </div>
            <div className="field">
              <label htmlFor="industry">Industry</label>
              <input id="industry" name="industry" />
            </div>
            <div className="field">
              <label htmlFor="stage">Stage</label>
              <select id="stage" name="stage">
                <option value="">Select stage</option>
                <option>Pre-Seed / Ideation</option>
                <option>Seed / MVP</option>
                <option>Early Growth</option>
                <option>Growth / Scale-Up</option>
                <option>Mature / Established</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="geography">Geography</label>
              <input id="geography" name="geography" />
            </div>
            <div className="field">
              <label htmlFor="employee_count_range">Company size</label>
              <select id="employee_count_range" name="employee_count_range">
                <option value="">Select size</option>
                <option>1-10 employees</option>
                <option>11-50 employees</option>
                <option>51-200 employees</option>
                <option>201-1000 employees</option>
                <option>1000+ employees</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Business description</label>
            <textarea id="description" name="description" />
          </div>
          <button type="submit">Create Company</button>
        </form>
      </section>
    </main>
  );
}
