import type { MetadataRoute } from "next";

// Belt-and-suspenders: also tell crawlers to stay away via robots.txt.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
