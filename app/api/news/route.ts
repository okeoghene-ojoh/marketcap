import type { NextRequest } from "next/server";
import { badRequest, cachedJson, parseSymbols } from "@/lib/api";
import { getNews } from "@/lib/providers";

// GET /api/news            → general market news
// GET /api/news?symbol=AAPL → news for one company
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbol");
  const symbol = raw ? parseSymbols(raw, 1)?.[0] : undefined;
  if (raw && !symbol) return badRequest("Invalid symbol");
  return cachedJson(await getNews(symbol), 300);
}
