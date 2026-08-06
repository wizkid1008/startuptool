import Link from "next/link";
import { PageHead } from "@/components/PageHead";

export const dynamic = "force-dynamic";

export default function NewCompanyPage() {
  return (
    <>
      <PageHead
        eyebrow="SMEAT / Companies / New"
        title="New company"
        lede="Create a company profile to start a SMEAT assessment."
        actions={
          <Link className="btn secondary" href="/companies">
            Cancel
          </Link>
        }
      />

      <form className="card form" method="post" action="/api/companies">
        <div className="grid two">
          <div className="field">
            <label htmlFor="name">Company name</label>
            <input id="name" name="name" required autoComplete="organization" />
          </div>
          <div className="field">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="url" placeholder="https://" />
          </div>
          <div className="field">
            <label htmlFor="linkedin_url">LinkedIn URL</label>
            <input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://" />
          </div>
          <div className="field">
            <label htmlFor="crunchbase_url">Crunchbase URL</label>
            <input id="crunchbase_url" name="crunchbase_url" type="url" placeholder="https://" />
          </div>
          <div className="field">
            <label htmlFor="industry">Industry</label>
            <input id="industry" name="industry" />
          </div>
          <div className="field">
            <label htmlFor="stage">Stage</label>
            <select id="stage" name="stage" defaultValue="">
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
            <select id="employee_count_range" name="employee_count_range" defaultValue="">
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
          <span className="hint">
            The scoring agent reads this directly — the more specific, the better the rationale.
          </span>
        </div>

        <hr className="rule" />

        <div className="actions">
          <button type="submit">Create company</button>
          <Link className="btn secondary" href="/companies">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
