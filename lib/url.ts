const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Returns the URL only if it is a plain http(s) link.
 *
 * Zod's `.url()` is not sufficient on its own: it validates with `new URL()`,
 * which happily accepts `javascript:alert(1)`. Anything rendered into an
 * `href` has to be protocol-checked here first.
 */
export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    return SAFE_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Strips scheme and trailing slash so links read cleanly in tables. */
export function displayUrl(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
