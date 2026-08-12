import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The public marketing site is served ONLY on the familygriefsupport.org
// domain. Every other host (Natalia's private site, Vercel preview URLs, etc.)
// is left completely untouched.
const MARKETING_HOSTS = new Set([
  "familygriefsupport.org",
  "www.familygriefsupport.org",
]);

const NOINDEX = "noindex, nofollow, noarchive, nosnippet";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const path = req.nextUrl.pathname;
  const isMarketing = MARKETING_HOSTS.has(host);

  // Public marketing landing page: serve it on the marketing domain root, and
  // let search engines index THIS page only.
  if (isMarketing && (path === "/" || path === "/welcome.html")) {
    const res =
      path === "/"
        ? NextResponse.rewrite(new URL("/welcome.html", req.url))
        : NextResponse.next();
    res.headers.set("X-Robots-Tag", "index, follow");
    return res;
  }

  // "Create a page" now lives on its own page, reached by clicking a button.
  // Serve the clean /create URL from the static create.html, and let it be found.
  if (isMarketing && (path === "/create" || path === "/create.html")) {
    const res =
      path === "/create"
        ? NextResponse.rewrite(new URL("/create.html", req.url))
        : NextResponse.next();
    res.headers.set("X-Robots-Tag", "index, follow");
    return res;
  }

  // Everything else — Natalia's private site, the admin, app routes, and any
  // non-landing path even on the marketing domain — stays out of search.
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", NOINDEX);
  return res;
}

export const config = {
  // Run on every route except Next.js internals, so the robots header is
  // applied consistently across the app.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
