import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const MARKETING_HOSTS = new Set([
  "familygriefsupport.org",
  "www.familygriefsupport.org",
]);

const BASE = "https://familygriefsupport.org";

/**
 * Host-aware sitemap: the public marketing site lists its handful of
 * indexable pages; private family sites expose nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const host = (headers().get("host") || "").toLowerCase().split(":")[0];
  if (!MARKETING_HOSTS.has(host)) return [];

  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/create`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/sample`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
