import Link from "next/link";

export function Masthead({ email }: { email?: string | null }) {
  return (
    <header className="masthead">
      <Link className="wordmark" href="/">
        <span className="mark" aria-hidden="true">
          SM
        </span>
        <span>SMEAT</span>
      </Link>

      <div className="row" style={{ gap: 14 }}>
        {email ? (
          <>
            <span className="masthead-meta">{email}</span>
            <form method="post" action="/auth/signout">
              <button className="iconbtn" type="submit" aria-label="Sign out" title="Sign out">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <span className="masthead-meta">Enterprise Viability Assessment</span>
        )}
      </div>
    </header>
  );
}
