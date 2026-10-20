// Display constants, the demo portfolio, and sample fallback data.
// The fallback is used when an API key is missing, a provider fails,
// or there's no free feed (NGX), and is always labelled "sample" in the UI.
import type { AssetClass, Currency, Holding, IndexKey, Mover, Quote, Rates } from "./types";
import { NGX_LIST } from "./ngx-symbols";

export const SAMPLE_RATES: Rates = { USD: 1, NGN: 1535, EUR: 0.92 };
export const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", NGN: "₦", EUR: "€" };
export const RETURN_GOAL_USD = 25000;

export const CLASSES: Record<AssetClass, { name: string; color: string }> = {
  us: { name: "US Stocks", color: "var(--lime)" },
  crypto: { name: "Crypto", color: "var(--forest)" },
  ngx: { name: "NGX", color: "#9fc7f5" },
  cash: { name: "Cash", color: "#cfcfcf" },
};

/** Free data plans don't include index values, so ETFs that track them stand in. */
export const INDEX_SYMBOLS: Record<IndexKey, { sym: string; label: string }> = {
  spx: { sym: "SPY", label: "S&P 500 · SPY" },
  ndx: { sym: "QQQ", label: "NASDAQ · QQQ" },
  ngx: { sym: "NGXASI", label: "NGX ASI" },
};

/** US market overview (funds that track each index, since free plans don't carry index values). */
export const MARKET_INDEXES = [
  { sym: "SPY", label: "S&P 500" },
  { sym: "QQQ", label: "NASDAQ-100" },
  { sym: "DIA", label: "Dow Jones" },
  { sym: "IWM", label: "Russell 2000" },
  { sym: "NGXASI", label: "NGX All-Share" },
];

/** The 11 S&P 500 sector funds (SPDR "XL" ETFs). */
export const SECTOR_ETFS = ["XLK", "XLF", "XLV", "XLE", "XLY", "XLP", "XLI", "XLB", "XLU", "XLRE", "XLC"];

/** Demo portfolio until accounts (phase 5) store real ones. Prices get replaced by live quotes. */
export const initialHoldings: Holding[] = [
  { sym: "AAPL", name: "Apple Inc.", ex: "NASDAQ", cls: "us", cur: "USD", qty: 120, cost: 182, price: 231.4, prev: 228.65, source: "sample" },
  { sym: "NVDA", name: "NVIDIA Corp.", ex: "NASDAQ", cls: "us", cur: "USD", qty: 150, cost: 96, price: 138.2, prev: 134.1, source: "sample" },
  { sym: "MSFT", name: "Microsoft", ex: "NASDAQ", cls: "us", cur: "USD", qty: 40, cost: 360, price: 428.1, prev: 429.9, source: "sample" },
  { sym: "DANGCEM", name: "Dangote Cement", ex: "NGX", cls: "ngx", cur: "NGN", qty: 20000, cost: 410, price: 480, prev: 478, source: "sample" },
  { sym: "MTNN", name: "MTN Nigeria", ex: "NGX", cls: "ngx", cur: "NGN", qty: 15000, cost: 230, price: 210, prev: 212, source: "sample" },
  { sym: "BTC", name: "Bitcoin", ex: "Crypto", cls: "crypto", cur: "USD", qty: 0.15, cost: 42000, price: 67250, prev: 65900, source: "sample" },
  { sym: "ETH", name: "Ethereum", ex: "Crypto", cls: "crypto", cur: "USD", qty: 2, cost: 2100, price: 2610, prev: 2580, source: "sample" },
  { sym: "CASH", name: "Cash", ex: "", cls: "cash", cur: "USD", qty: 3000, cost: 1, price: 1, prev: 1, source: "live" },
];

export const watchSyms = ["AAPL", "BTC", "DANGCEM", "MSFT"];

/** Crypto tickers → CoinGecko ids. */
export const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", DOGE: "dogecoin", XRP: "ripple", BNB: "binancecoin",
};

/** NGX has no free live feed yet; these always come from sample data. */
export const NGX_SYMBOLS = [...NGX_LIST.map((s) => s.code), "NGXASI"];

// [price, previous close]
const SAMPLE_PRICES: Record<string, [number, number]> = {
  AAPL: [231.4, 228.65], NVDA: [138.2, 134.1], MSFT: [428.1, 429.9], AMZN: [186.5, 184.2],
  GOOGL: [165.3, 166.1], META: [575.2, 568.9], TSLA: [251.4, 255.8], AMD: [155.6, 151.2],
  NFLX: [702.1, 695.4], INTC: [21.4, 22.6], BA: [154.8, 159.4], DIS: [94.2, 93.8],
  PLTR: [41.2, 38.6], JPM: [212.5, 210.9], KO: [69.8, 70.1],
  SPY: [580.1, 575.3], QQQ: [495.2, 491.6],
  BTC: [67250, 65900], ETH: [2610, 2580], SOL: [152.3, 146.3], DOGE: [0.112, 0.1144],
  DANGCEM: [480, 478], MTNN: [210, 212], ZENITHBANK: [38.5, 36.7], OANDO: [61, 63.8], GTCO: [52.4, 51.9],
  NGXASI: [245278.3, 246010.1],
};

export function sampleQuote(symbol: string): Quote | null {
  const p = SAMPLE_PRICES[symbol];
  if (!p) return null;
  const [price, prev] = p;
  return { symbol, price, prev, changePct: ((price - prev) / prev) * 100, time: Date.now(), source: "sample" };
}

/** Names for the movers universe (quote APIs return prices only). */
export const SYMBOL_NAMES: Record<string, string> = {
  ...Object.fromEntries(NGX_LIST.map((s) => [s.code, s.name])),
  AAPL: "Apple Inc.", NVDA: "NVIDIA Corp.", MSFT: "Microsoft", AMZN: "Amazon", GOOGL: "Alphabet",
  META: "Meta Platforms", TSLA: "Tesla", AMD: "AMD", NFLX: "Netflix", INTC: "Intel", BA: "Boeing",
  DIS: "Disney", PLTR: "Palantir", JPM: "JPMorgan Chase", KO: "Coca-Cola",
  SPY: "S&P 500 ETF (SPY)", QQQ: "NASDAQ-100 ETF (QQQ)", DIA: "Dow Jones ETF (DIA)", IWM: "Russell 2000 ETF (IWM)",
  XLK: "Technology", XLF: "Financials", XLV: "Health care", XLE: "Energy", XLY: "Consumer discretionary",
  XLP: "Consumer staples", XLI: "Industrials", XLB: "Materials", XLU: "Utilities", XLRE: "Real estate", XLC: "Communication",
  NGXASI: "NGX All-Share Index",
  BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", DOGE: "Dogecoin",
  DANGCEM: "Dangote Cement", MTNN: "MTN Nigeria", ZENITHBANK: "Zenith Bank", OANDO: "Oando", GTCO: "GTCO",
};

export const sampleMovers: { gainers: Mover[]; losers: Mover[] } = {
  gainers: [
    { sym: "PLTR", name: "Palantir", price: 41.2, pct: 6.8 },
    { sym: "ZENITHBANK", name: "Zenith Bank", price: 38.5, pct: 4.9, cur: "NGN" },
    { sym: "SOL", name: "Solana", price: 152.3, pct: 4.1 },
    { sym: "NVDA", name: "NVIDIA Corp.", price: 138.2, pct: 3.1 },
  ],
  losers: [
    { sym: "INTC", name: "Intel", price: 21.4, pct: -5.2 },
    { sym: "OANDO", name: "Oando", price: 61.0, pct: -4.4, cur: "NGN" },
    { sym: "BA", name: "Boeing", price: 154.8, pct: -2.9 },
    { sym: "DOGE", name: "Dogecoin", price: 0.112, pct: -2.1 },
  ],
};

// [headline, minutes ago]
const SAMPLE_HEADLINES: [string, number][] = [
  ["Chipmakers lead tech gains as AI hardware demand stays strong", 12],
  ["NGX All-Share index eases on profit-taking in banking stocks", 40],
  ["Bitcoin holds near recent highs as ETF inflows continue", 60],
  ["Naira steadies against the dollar in the official window", 120],
];

export const sampleArticles = () =>
  SAMPLE_HEADLINES.map(([headline, mins], i) => ({
    id: `sample-${i}`,
    headline,
    source: "Sample Wire",
    url: "#",
    time: Date.now() - mins * 60_000,
  }));
