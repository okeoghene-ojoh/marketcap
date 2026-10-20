// EODHD (https://eodhd.com/financial-apis/): Nigerian Exchange (NGX) prices, exchange code XNSA.
// "Real-time" here means delayed (EODHD doesn't stream NGX), so quotes are labelled "delayed".
import { getJSON } from "./http";
import type { Candle, HistoryRange, Quote } from "../types";

const BASE = "https://eodhd.com/api";
const EXCHANGE = "XNSA";
/** EODHD's code for the NGX All-Share Index. Unset = we don't know it yet, so the index stays sample. */
export const NGX_INDEX_CODE = process.env.EODHD_NGX_INDEX;
// NGX trades 10:00–14:20 Lagos time and prices are delayed anyway, so a few minutes of caching
// costs nothing in freshness and saves the daily call allowance.
const QUOTE_TTL = 300;

const key = () => process.env.EODHD_API_KEY;
export const hasEodhd = () => !!key();

const url = (path: string, params: Record<string, string> = {}) =>
  `${BASE}${path}?${new URLSearchParams({ ...params, api_token: key() ?? "", fmt: "json" })}`;

/** Our NGX ticker ("DANGCEM", or "NEM.NG" for a clash) → EODHD's code ("DANGCEM.XNSA"); the index has its own code. */
// A ".NG" ending marks an NGX ticker that clashes with a US one (see scripts/fetch-ngx-symbols.mjs).
export const toEodhd = (symbol: string) =>
  symbol === "NGXASI" ? NGX_INDEX_CODE ?? "" : `${symbol.replace(/\.NG$/, "")}.${EXCHANGE}`;

interface RealTime {
  code: string; timestamp: number | "NA"; open: number | "NA"; high: number | "NA"; low: number | "NA";
  close: number | "NA"; previousClose: number | "NA"; change_p: number | "NA";
}

const n = (v: number | "NA" | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Delayed quotes for many NGX symbols in one request. */
export async function eodhdQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  symbols = symbols.filter((s) => toEodhd(s));
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
    if (!symbol || !price || !prev) continue; // "NA" = no intraday data (e.g. the free plan); see below
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
  // No intraday price: use the last two daily closes instead (one call per symbol, cached an hour)
  const missing = symbols.filter((s) => !out[s]);
  await Promise.all(missing.map(async (symbol) => {
    const bars = await eodhdHistory(symbol, "5D").catch(() => []);
    const last = bars.at(-1), before = bars.at(-2);
    if (!last || !before) return;
    out[symbol] = {
      symbol,
      price: last.close,
      prev: before.close,
      changePct: ((last.close - before.close) / before.close) * 100,
      open: last.open,
      high: last.high,
      low: last.low,
      time: Date.parse(`${last.time}T14:30:00+01:00`), // NGX closes 14:30 Lagos time
      source: "delayed",
    };
  }));
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
  if (!toEodhd(symbol)) throw new Error(`no EODHD code for ${symbol}`);
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
