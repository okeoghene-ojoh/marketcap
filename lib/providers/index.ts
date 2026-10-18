// The one interface the app uses for market data (server-side only).
// Each function picks a provider per symbol and falls back to sample data,
// labelled `source: "sample"`, so the dashboard keeps working when a key is
// missing or a provider is down. Swapping providers only touches this folder.
import { finnhubCompanyNews, finnhubMarketNews, finnhubQuote, finnhubSearch, hasFinnhub } from "./finnhub";
import { hasTwelveData, twelveDataHistory } from "./twelvedata";
import { coingeckoQuotes, CRYPTO_SYMBOLS, isCrypto } from "./coingecko";
import { fxRates } from "./fx";
import {
  NGX_SYMBOLS, SAMPLE_RATES, SYMBOL_NAMES, sampleArticles, sampleMovers, sampleQuote,
} from "../sample-data";
import type {
  Candle, DataSource, HistoryRange, Mover, MoversResponse, NewsResponse, Quote, Rates, SearchResult,
} from "../types";

const warn = (what: string, err: unknown) =>
  console.warn(`[market] ${what} failed, using sample data:`, err instanceof Error ? err.message : err);

const isNGX = (symbol: string) => NGX_SYMBOLS.includes(symbol);

export async function getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const out: Record<string, Quote> = {};
  const crypto = symbols.filter(isCrypto);
  const stocks = symbols.filter((s) => !isCrypto(s) && !isNGX(s));

  const tasks: Promise<void>[] = [];

  if (crypto.length) {
    tasks.push(
      coingeckoQuotes(crypto)
        .then((q) => { Object.assign(out, q); })
        .catch((e) => warn("crypto quotes", e))
    );
  }

  if (stocks.length && hasFinnhub()) {
    for (const s of stocks) {
      tasks.push(
        finnhubQuote(s)
          .then((q) => { if (q) out[s] = q; })
          .catch((e) => warn(`quote ${s}`, e))
      );
    }
  }

  await Promise.all(tasks);

  // Anything still missing (NGX, no key, provider error) falls back to sample data
  for (const s of symbols) {
    if (!out[s]) {
      const q = sampleQuote(s);
      if (q) out[s] = q;
    }
  }
  return out;
}

export async function getNews(symbol?: string): Promise<NewsResponse> {
  if (hasFinnhub()) {
    try {
      const articles = symbol ? await finnhubCompanyNews(symbol) : await finnhubMarketNews();
      return { articles, source: "live" };
    } catch (e) {
      warn("news", e);
    }
  }
  return { articles: sampleArticles(), source: "sample" };
}

export async function searchSymbols(q: string): Promise<SearchResult[]> {
  const needle = q.trim().toUpperCase();
  if (!needle) return [];

  // Crypto and NGX aren't in Finnhub's US search, so match them locally
  const local: SearchResult[] = [...CRYPTO_SYMBOLS, ...NGX_SYMBOLS]
    .filter((s) => SYMBOL_NAMES[s] && (s.includes(needle) || SYMBOL_NAMES[s].toUpperCase().includes(needle)))
    .map((s) => ({ symbol: s, name: SYMBOL_NAMES[s], type: isCrypto(s) ? "Crypto" : "NGX" }));

  let remote: SearchResult[] = [];
  if (hasFinnhub()) {
    try {
      remote = await finnhubSearch(q);
    } catch (e) {
      warn("search", e);
    }
  } else {
    remote = Object.entries(SYMBOL_NAMES)
      .filter(([s, n]) => !isCrypto(s) && !isNGX(s) && (s.includes(needle) || n.toUpperCase().includes(needle)))
      .map(([symbol, name]) => ({ symbol, name, type: "Stock" }));
  }
  return [...local, ...remote].slice(0, 10);
}

export async function getHistory(symbol: string, range: HistoryRange): Promise<{ candles: Candle[]; source: DataSource }> {
  if (hasTwelveData() && !isNGX(symbol)) {
    try {
      const candles = await twelveDataHistory(isCrypto(symbol) ? `${symbol}/USD` : symbol, range);
      return { candles, source: "live" };
    } catch (e) {
      warn(`history ${symbol}`, e);
    }
  }
  return { candles: sampleHistory(symbol, range), source: "sample" };
}

export async function getRates(): Promise<{ rates: Rates; source: DataSource }> {
  try {
    return { rates: await fxRates(), source: "live" };
  } catch (e) {
    warn("fx rates", e);
    return { rates: SAMPLE_RATES, source: "sample" };
  }
}

const MOVER_UNIVERSE = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "NFLX", "INTC", "BA", "DIS", "PLTR", "JPM", "KO",
  "BTC", "ETH", "SOL", "DOGE",
];

/** Free plans have no "top movers" endpoint, so rank a fixed list of popular symbols. */
export async function getMovers(): Promise<MoversResponse> {
  const usable = hasFinnhub() ? MOVER_UNIVERSE : MOVER_UNIVERSE.filter(isCrypto);
  const quotes = Object.values(await getQuotes(usable)).filter((q) => q.source === "live");
  if (quotes.length < 4) return { ...sampleMovers, source: "sample" };

  const toMover = (q: Quote): Mover => ({ sym: q.symbol, name: SYMBOL_NAMES[q.symbol] ?? q.symbol, price: q.price, pct: q.changePct });
  const sorted = [...quotes].sort((a, b) => b.changePct - a.changePct);
  return {
    gainers: sorted.filter((q) => q.changePct > 0).slice(0, 5).map(toMover),
    losers: sorted.filter((q) => q.changePct < 0).reverse().slice(0, 5).map(toMover),
    source: "live",
  };
}

/** A gentle random walk ending at the sample price, so charts have something to draw. */
function sampleHistory(symbol: string, range: HistoryRange): Candle[] {
  const end = sampleQuote(symbol)?.price ?? 100;
  const points = range === "1D" ? 78 : range === "5D" ? 65 : 60;
  let seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const closes = [end];
  for (let i = 1; i < points; i++) closes.unshift(closes[0] * (1 + (rand() - 0.5) * 0.02));
  const now = Date.now();
  return closes.map((close, i) => ({
    time: new Date(now - (points - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    open: close, high: close, low: close, close,
  }));
}
