import { NextResponse } from "next/server";

/**
 * Redirect after a form POST.
 *
 * `redirect()` from next/navigation emits a 307 in route handlers, which
 * preserves the method — the browser then re-POSTs to a page route and gets a
 * 405. 303 is the correct status for POST → GET.
 */
export function seeOther(path: string, request: Request) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Form posts are plain navigations, so a JSON body renders as raw text in the
 * browser. Return a styled document instead. Self-contained because a route
 * handler response is outside the React tree and cannot use globals.css.
 */
export function failurePage({
  title,
  detail,
  backHref = "/",
  backLabel = "Go back",
  status = 400
}: {
  title: string;
  detail?: string;
  backHref?: string;
  backLabel?: string;
  status?: number;
}) {
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; background: #fff; color: #111;
    font-family: "Helvetica Neue", Helvetica, Inter, ui-sans-serif, system-ui, Arial, sans-serif;
  }
  header { background: #000; color: #fff; height: 64px; display: flex; align-items: center; padding: 0 24px;
           font-size: 15px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
  main { width: min(720px, calc(100% - 48px)); margin: 64px auto; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #b91c1c; }
  h1 { margin: 12px 0 0; font-size: 34px; line-height: 1.05; letter-spacing: -.03em; }
  pre { margin: 20px 0 0; padding: 16px; background: #fafaf8; border: 1px solid #e4e4e0;
        border-left: 3px solid #b91c1c; border-radius: 6px; font-size: 13px; line-height: 1.5;
        white-space: pre-wrap; word-break: break-word; color: #3d3d3d; }
  a.btn { display: inline-block; margin-top: 28px; padding: 9px 16px; background: #000; color: #fff;
          border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
</style>
</head>
<body>
  <header>SMEAT</header>
  <main>
    <div class="eyebrow">Request failed</div>
    <h1>${escapeHtml(title)}</h1>
    ${detail ? `<pre>${escapeHtml(detail)}</pre>` : ""}
    <a class="btn" href="${escapeHtml(backHref)}">${escapeHtml(backLabel)}</a>
  </main>
</body>
</html>`;

  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/** Flattens a Zod error into a readable "field: message" list. */
export function formatIssues(error: {
  issues: Array<{ path: (string | number)[]; message: string }>;
}) {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("\n");
}
