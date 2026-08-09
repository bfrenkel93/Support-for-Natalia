/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Keep the whole site out of search engines / crawlers.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        ],
      },
    ];
  },
};

export default nextConfig;
