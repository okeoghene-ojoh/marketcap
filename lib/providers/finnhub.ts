// Finnhub (free plan: 60 calls/min): US quotes, news, symbol search.
// Docs: https://finnhub.io/docs/api
import { getJSON } from "./http";
import type { Article, Quote, SearchResult } from "../types";

const BASE = "https://finnhub.io/api/v1";
const QUOTE_TTL = 30; // seconds; shared by every route so quotes are reused

const key = () => process.env.FINNHUB_API_KEY;
export const hasFinnhub = () => !!key();

const url = (path: string, params: Record<string, string>) =>
  `${BASE}${path}?${new URLSearchParams({ ...params, token: key() ?? "" })}`;

interface FinnhubQuote { c: number; d: number | null; dp: number | null; h: number; l: number; o: number; pc: number; t: number }

export async function finnhubQuote(symbol: string): Promise<Quote | null> {
  const d = await getJSON<FinnhubQuote>(url("/quote", { symbol }), QUOTE_TTL);
  if (!d || !d.c) return null; // Finnhub returns zeros for unknown symbols
  return {
    symbol,
    price: d.c,
    prev: d.pc,
    changePct: d.dp ?? ((d.c - d.pc) / d.pc) * 100,
    high: d.h,
    low: d.l,
    open: d.o,
    time: d.t * 1000,
    source: "live",
  };
}

interface FinnhubNews { id: number; headline: string; source: string; url: string; image: string; datetime: number }

const toArticle = (n: FinnhubNews): Article => ({
  id: String(n.id),
  headline: n.headline,
  source: n.source,
  url: n.url,
  image: n.image || undefined,
  time: n.datetime * 1000,
});

export async function finnhubMarketNews(limit = 12): Promise<Article[]> {
  const list = await getJSON<FinnhubNews[]>(url("/news", { category: "general" }), 300);
  return list.filter((n) => n.headline && n.url).slice(0, limit).map(toArticle);
}

export async function finnhubCompanyNews(symbol: string, limit = 12): Promise<Article[]> {
  const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
  const list = await getJSON<FinnhubNews[]>(url("/company-news", { symbol, from: day(7), to: day(0) }), 600);
  return list.filter((n) => n.headline && n.url).slice(0, limit).map(toArticle);
}

export interface FinnhubProfile {
  name?: string; exchange?: string; ipo?: string; logo?: string; weburl?: string;
  finnhubIndustry?: string; country?: string; marketCapitalization?: number; // in millions
}

export async function finnhubProfile(symbol: string): Promise<FinnhubProfile | null> {
  const d = await getJSON<FinnhubProfile>(url("/stock/profile2", { symbol }), 86400);
  return d && d.name ? d : null; // empty object for unknown symbols / ETFs
}

/** Field names vary by company, so callers pick the first one present. */
export type FinnhubMetrics = Record<string, number | undefined>;

export async function finnhubMetrics(symbol: string): Promise<FinnhubMetrics> {
  const d = await getJSON<{ metric?: FinnhubMetrics }>(url("/stock/metric", { symbol, metric: "all" }), 3600);
  return d.metric ?? {};
}

interface FinnhubSearch { result: { symbol: string; description: string; type: string }[] }

export async function finnhubSearch(q: string): Promise<SearchResult[]> {
  const d = await getJSON<FinnhubSearch>(url("/search", { q, exchange: "US" }), 3600);
  return (d.result ?? [])
    .filter((r) => !r.symbol.includes(".")) // skip foreign listings like "AAPL.MX"
    .slice(0, 8)
    .map((r) => ({ symbol: r.symbol, name: r.description, type: r.type || "Stock" }));
}
