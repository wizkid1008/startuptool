/**
 * The externally visible origin of a request.
 *
 * Behind a reverse proxy — Render, Fly, most PaaS — `request.url` carries the
 * internal address the process is bound to (e.g. http://localhost:10000), not
 * the public hostname. Redirects built from it send the browser somewhere it
 * cannot reach. The real origin is in the forwarded headers.
 *
 * No imports, so this is safe in the edge runtime used by middleware.
 */
export function requestOrigin(request: Request): string {
  const headers = request.headers;

  const forwardedHost = headers.get("x-forwarded-host") ?? headers.get("host");
  if (forwardedHost) {
    const proto =
      headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      (forwardedHost.startsWith("localhost") || forwardedHost.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${forwardedHost.split(",")[0].trim()}`;
  }

  return new URL(request.url).origin;
}

/** Resolve a path against the externally visible origin. */
export function absoluteUrl(path: string, request: Request): URL {
  return new URL(path, requestOrigin(request));
}
