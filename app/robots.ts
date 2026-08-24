import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private app areas shouldn't be indexed.
      disallow: [
        "/dashboard",
        "/markets",
        "/scanner",
        "/watchlist",
        "/ai",
        "/scenarios",
        "/portfolio",
        "/journal",
        "/alerts",
        "/settings",
        "/onboarding",
        "/api",
      ],
    },
    sitemap: "https://visitrade.app/sitemap.xml",
  };
}
