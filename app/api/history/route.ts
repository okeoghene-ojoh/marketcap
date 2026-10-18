import type { NextRequest } from "next/server";
import { badRequest, cachedJson, parseSymbols, ttlFor } from "@/lib/api";
import { getHistory } from "@/lib/providers";
import { HISTORY_RANGES, type HistoryRange } from "@/lib/types";

// GET /api/history?symbol=AAPL&range=1M
export async function GET(req: NextRequest) {
  const symbol = parseSymbols(req.nextUrl.searchParams.get("symbol"), 1)?.[0];
  const range = (req.nextUrl.searchParams.get("range") ?? "1M").toUpperCase() as HistoryRange;
  if (!symbol) return badRequest("Pass ?symbol=AAPL");
  if (!HISTORY_RANGES.includes(range)) return badRequest(`range must be one of ${HISTORY_RANGES.join(", ")}`);
  const data = await getHistory(symbol, range);
  return cachedJson(data, ttlFor(data.source, range === "1D" ? 300 : 3600));
}
