import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Error 404</div>
          <h1>That record does not exist.</h1>
          <p className="lede">
            It may have been deleted, or the link may be out of date.
          </p>
        </div>
      </div>

      <div className="actions">
        <Link className="btn" href="/">
          Back to overview
        </Link>
        <Link className="btn secondary" href="/companies">
          Browse companies
        </Link>
      </div>
    </>
  );
}
