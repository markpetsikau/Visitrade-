import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://visitrade.app";
  const routes = [
    "",
    "/features",
    "/pricing",
    "/how-it-works",
    "/faq",
    "/login",
    "/signup",
    "/legal/risques",
    "/legal/cgu",
    "/legal/confidentialite",
    "/legal/mentions",
  ];
  const now = new Date();
  return routes.map((r) => ({
    url: `${base}${r}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
