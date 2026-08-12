import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const MARKETING_HOSTS = new Set([
  "familygriefsupport.org",
  "www.familygriefsupport.org",
]);

// Host-aware robots.txt: the public marketing site invites crawlers; every
// private family site tells them to stay away.
export default function robots(): MetadataRoute.Robots {
  const host = (headers().get("host") || "").toLowerCase().split(":")[0];

  if (MARKETING_HOSTS.has(host)) {
    return {
      rules: { userAgent: "*", allow: "/" },
    };
  }

  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
