import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { SYMBOL_NAMES } from "@/lib/sample-data";

// Public pages plus the quote pages for well-known symbols
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ["", "/markets", "/news", "/compare", "/portfolio", "/terms", "/privacy", "/disclaimer"];
  return [
    ...pages.map((p) => ({ url: `${SITE.url}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: p ? 0.7 : 1 })),
    ...Object.keys(SYMBOL_NAMES).map((s) => ({ url: `${SITE.url}/quote/${s}`, lastModified: now, changeFrequency: "hourly" as const, priority: 0.5 })),
  ];
}
