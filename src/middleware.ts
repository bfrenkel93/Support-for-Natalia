import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The public marketing site is served ONLY on the familygriefsupport.org
// domain. Every other host (Natalia's private site, Vercel preview URLs, etc.)
// is left completely untouched — the request falls straight through.
const MARKETING_HOSTS = new Set([
  "familygriefsupport.org",
  "www.familygriefsupport.org",
]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];

  if (MARKETING_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.pathname = "/welcome.html";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Only run on the site root, so nothing else in the app is affected.
export const config = {
  matcher: "/",
};
