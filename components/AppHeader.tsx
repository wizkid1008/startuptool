import Link from "next/link";

export function AppHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="eyebrow">SMEAT Framework</span>
        <strong>Opportunity Scoring Agent</strong>
      </Link>
      <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="button secondary" href="/companies">
          Companies
        </Link>
        <Link className="button secondary" href="/companies/new">
          New Company
        </Link>
      </nav>
    </header>
  );
}
