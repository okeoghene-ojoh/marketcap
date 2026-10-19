// Twelve Data (free plan: 8 calls/min, 800/day): price history for charts.
// Docs: https://twelvedata.com/docs#time-series
import { getJSON } from "./http";
import type { Candle, HistoryRange } from "../types";

const BASE = "https://api.twelvedata.com";

const key = () => process.env.TWELVEDATA_API_KEY;
export const hasTwelveData = () => !!key();

function rangeParams(range: HistoryRange): { interval: string; outputsize: number; ttl: number } {
  switch (range) {
    case "1D": return { interval: "5min", outputsize: 78, ttl: 300 };
    case "5D": return { interval: "30min", outputsize: 65, ttl: 900 };
    case "1M": return { interval: "1day", outputsize: 22, ttl: 3600 };
    case "6M": return { interval: "1day", outputsize: 126, ttl: 3600 };
    case "YTD": {
      const days = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86_400_000);
      return { interval: "1day", outputsize: Math.max(5, Math.round((days * 5) / 7)), ttl: 3600 };
    }
    case "1Y": return { interval: "1day", outputsize: 252, ttl: 3600 };
    case "5Y": return { interval: "1week", outputsize: 260, ttl: 86400 };
    case "MAX": return { interval: "1month", outputsize: 360, ttl: 86400 };
  }
}

interface TDSeries {
  status: "ok" | "error";
  message?: string;
  values?: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[];
}

/** `symbol` uses Twelve Data's format: "AAPL", or "BTC/USD" for crypto. */
export async function twelveDataHistory(symbol: string, range: HistoryRange): Promise<Candle[]> {
  const { interval, outputsize: tradingDays, ttl } = rangeParams(range);
  // Sizes above count stock trading days (5 a week). Crypto trades 7 days a week, so it
  // needs 7/5 as many daily bars to cover the same calendar period.
  const outputsize = symbol.includes("/") && interval === "1day" ? Math.round((tradingDays * 7) / 5) : tradingDays;
  const params = new URLSearchParams({ symbol, interval, outputsize: String(outputsize), apikey: key() ?? "" });
  const d = await getJSON<TDSeries>(`${BASE}/time_series?${params}`, ttl);
  if (d.status !== "ok" || !d.values) throw new Error(d.message ?? "Twelve Data returned no values");
  return d.values
    .map((v) => ({
      time: v.datetime,
      open: +v.open,
      high: +v.high,
      low: +v.low,
      close: +v.close,
      volume: v.volume ? +v.volume : undefined,
    }))
    .reverse(); // API returns newest first
}
