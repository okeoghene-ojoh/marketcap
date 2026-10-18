import type { NextRequest } from "next/server";
import { badRequest, cachedJson, parseSymbols } from "@/lib/api";
import { getQuotes } from "@/lib/providers";

// GET /api/quotes?symbols=AAPL,BTC,SPY
export async function GET(req: NextRequest) {
  const symbols = parseSymbols(req.nextUrl.searchParams.get("symbols"), 30);
  if (!symbols) return badRequest("Pass ?symbols=AAPL,MSFT (1–30 valid tickers)");
  return cachedJson({ quotes: await getQuotes(symbols) }, 15);
}
