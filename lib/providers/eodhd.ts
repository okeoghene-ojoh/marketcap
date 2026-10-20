// EODHD (https://eodhd.com/financial-apis/): Nigerian Exchange (NGX) prices, exchange code XNSA.
// "Real-time" here means delayed (EODHD doesn't stream NGX), so quotes are labelled "delayed".
import { getJSON } from "./http";
import type { Candle, HistoryRange, Quote } from "../types";

const BASE = "https://eodhd.com/api";
const EXCHANGE = "XNSA";
/** EODHD's code for the NGX All-Share Index */
export const NGX_INDEX_CODE = process.env.EODHD_NGX_INDEX || "NGSEINDX.INDX";
// NGX trades 10:00–14:20 Lagos time and prices are delayed anyway, so a few minutes of caching
// costs nothing in freshness and saves the daily call allowance.
const QUOTE_TTL = 300;

const key = () => process.env.EODHD_API_KEY;
export const hasEodhd = () => !!key();

const url = (path: string, params: Record<string, string> = {}) =>
  `${BASE}${path}?${new URLSearchParams({ ...params, api_token: key() ?? "", fmt: "json" })}`;

/** Our bare NGX ticker ("DANGCEM") → EODHD's code ("DANGCEM.XNSA"); the index has its own code. */
export const toEodhd = (symbol: string) => (symbol === "NGXASI" ? NGX_INDEX_CODE : `${symbol}.${EXCHANGE}`);

interface RealTime {
  code: string; timestamp: number | "NA"; open: number | "NA"; high: number | "NA"; low: number | "NA";
  close: number | "NA"; previousClose: number | "NA"; change_p: number | "NA";
}

const n = (v: number | "NA" | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Delayed quotes for many NGX symbols in one request. */
export async function eodhdQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  if (!symbols.length) return {};
  const [first, ...rest] = symbols.map(toEodhd);
  const data = await getJSON<RealTime | RealTime[]>(
    url(`/real-time/${encodeURIComponent(first)}`, rest.length ? { s: rest.join(",") } : {}),
    QUOTE_TTL
  );
  const rows = Array.isArray(data) ? data : [data];
  const out: Record<string, Quote> = {};
  for (const r of rows) {
    const symbol = symbols.find((s) => toEodhd(s) === r.code);
    const price = n(r.close), prev = n(r.previousClose);
    if (!symbol || !price || !prev) continue; // "NA" = no trade data for that code
    out[symbol] = {
      symbol,
      price,
      prev,
      changePct: n(r.change_p) ?? ((price - prev) / prev) * 100,
      open: n(r.open),
      high: n(r.high),
      low: n(r.low),
      time: typeof r.timestamp === "number" ? r.timestamp * 1000 : Date.now(),
      source: "delayed",
    };
  }
  return out;
}

interface EodBar { date: string; open: number; high: number; low: number; close: number; volume?: number }

/** Daily (or weekly/monthly) closes. NGX has no intraday data here, so 1D/5D show recent days. */
export async function eodhdHistory(symbol: string, range: HistoryRange): Promise<Candle[]> {
  const today = new Date();
  const back = (days: number) => new Date(today.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const plan: Record<HistoryRange, { from: string; period: "d" | "w" | "m" }> = {
    "1D": { from: back(7), period: "d" },
    "5D": { from: back(10), period: "d" },
    "1M": { from: back(31), period: "d" },
    "6M": { from: back(183), period: "d" },
    YTD: { from: `${today.getFullYear()}-01-01`, period: "d" },
    "1Y": { from: back(365), period: "d" },
    "5Y": { from: back(5 * 365), period: "w" },
    MAX: { from: "1990-01-01", period: "m" },
  };
  const { from, period } = plan[range];
  const bars = await getJSON<EodBar[]>(url(`/eod/${encodeURIComponent(toEodhd(symbol))}`, { from, period }), 3600);
  if (!Array.isArray(bars)) throw new Error("EODHD returned no bars");
  return bars
    .filter((b) => typeof b.close === "number")
    .map((b) => ({ time: b.date, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume }));
}

export interface ExchangeSymbol { Code: string; Name: string; Type: string; Currency: string; Isin?: string }

/** Every listing on the NGX (used by scripts/fetch-ngx-symbols.mjs to refresh lib/ngx-symbols.ts). */
export async function eodhdNgxListings(): Promise<ExchangeSymbol[]> {
  return getJSON<ExchangeSymbol[]>(url(`/exchange-symbol-list/${EXCHANGE}`), 86400);
}
