"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="eyebrow" style={{ color: "var(--bad)" }}>
            Something went wrong
          </div>
          <h1>This page could not be rendered.</h1>
          <p className="lede">
            The workspace hit an unexpected error. Retrying is usually enough; if it persists,
            check your Supabase environment variables and that the migration has run.
          </p>
        </div>
      </div>

      <div className="notice bad">
        <strong>{error.message || "Unknown error"}</strong>
        {error.digest ? <span className="small">Digest: {error.digest}</span> : null}
      </div>

      <div className="actions" style={{ marginTop: 24 }}>
        <button type="button" onClick={reset}>
          Try again
        </button>
        <a className="btn secondary" href="/">
          Back to overview
        </a>
      </div>
    </>
  );
}
