import type { NextRequest } from "next/server";
import { badRequest, cachedJson, parseSymbols, ttlFor } from "@/lib/api";
import { getNews } from "@/lib/providers";
import { NEWS_CATEGORIES, type NewsCategory } from "@/lib/types";

// GET /api/news                       → general market news
// GET /api/news?category=crypto       → crypto | forex | merger | general
// GET /api/news?symbol=AAPL&limit=5   → news for one company
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const raw = sp.get("symbol");
  const symbol = raw ? parseSymbols(raw, 1)?.[0] : undefined;
  if (raw && !symbol) return badRequest("Invalid symbol");
  const category = (sp.get("category") ?? "general") as NewsCategory;
  if (!NEWS_CATEGORIES.includes(category)) return badRequest(`category must be one of ${NEWS_CATEGORIES.join(", ")}`);
  const limit = Math.min(Math.max(parseInt(sp.get("limit") ?? "12", 10) || 12, 1), 30);
  const data = await getNews(symbol, category, limit);
  return cachedJson(data, ttlFor(data.source, 300));
}
