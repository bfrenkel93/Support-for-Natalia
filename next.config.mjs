/** @type {import('next').NextConfig} */
// Search-engine visibility is controlled per-host in src/middleware.ts:
// the public marketing page (familygriefsupport.org) is indexable, while
// every private family site stays out of search engines.
const nextConfig = {
  // Ensure the bundled brand serif (used by the social-share OG image) is
  // traced into the serverless function on Vercel — otherwise the card would
  // silently fall back to the default sans font.
  experimental: {
    outputFileTracingIncludes: {
      "/[slug]/opengraph-image": ["./assets/lora-500.woff", "./assets/lora-600.woff"],
    },
  },
};

export default nextConfig;
