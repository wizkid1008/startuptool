import Link from "next/link";

export function Masthead() {
  return (
    <header className="masthead">
      <Link className="wordmark" href="/">
        <span className="mark" aria-hidden="true">
          SM
        </span>
        <span>SMEAT</span>
      </Link>

      <button className="iconbtn" type="button" aria-label="Notifications">
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
    </header>
  );
}
