import "server-only";

/**
 * The public base URL (scheme + host only) for building links in emails.
 *
 * Prefers SITE_URL / NEXT_PUBLIC_SITE_URL, but ALWAYS reduces it to its bare
 * origin — so even a misconfigured value that accidentally includes a path or
 * query string (e.g. someone pasting a full test URL into the env var) can
 * never corrupt the links we generate. Falls back to the forwarded host, then
 * the request's own origin.
 */
export function resolveBaseUrl(req: Request): string {
  const env = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) {
    const withProto = /^https?:\/\//i.test(env) ? env : `https://${env}`;
    try {
      return new URL(withProto).origin;
    } catch {
      // fall through to host-based resolution
    }
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}
