// Sample data for the dashboard prototype.
// Later this is replaced by the provider adapters + /api routes from the build plan.
import type { AssetClass, Currency, Holding, IndexKey, IndexQuote, Mover, NewsItem } from "./types";

export const RATES: Record<Currency, number> = { USD: 1, NGN: 1535, EUR: 0.92 }; // per 1 USD
export const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", NGN: "₦", EUR: "€" };
export const RETURN_GOAL_USD = 25000;

export const CLASSES: Record<AssetClass, { name: string; color: string }> = {
  us: { name: "US Stocks", color: "var(--lime)" },
  crypto: { name: "Crypto", color: "var(--forest)" },
  ngx: { name: "NGX", color: "#9fc7f5" },
  cash: { name: "Cash", color: "#cfcfcf" },
};

export const initialHoldings: Holding[] = [
  { sym: "AAPL", name: "Apple Inc.", ex: "NASDAQ", cls: "us", cur: "USD", qty: 120, cost: 182, price: 231.4, prev: 228.65 },
  { sym: "NVDA", name: "NVIDIA Corp.", ex: "NASDAQ", cls: "us", cur: "USD", qty: 150, cost: 96, price: 138.2, prev: 134.1 },
  { sym: "MSFT", name: "Microsoft", ex: "NASDAQ", cls: "us", cur: "USD", qty: 40, cost: 360, price: 428.1, prev: 429.9 },
  { sym: "DANGCEM", name: "Dangote Cement", ex: "NGX", cls: "ngx", cur: "NGN", qty: 20000, cost: 410, price: 480, prev: 478 },
  { sym: "MTNN", name: "MTN Nigeria", ex: "NGX", cls: "ngx", cur: "NGN", qty: 15000, cost: 230, price: 210, prev: 212 },
  { sym: "BTC", name: "Bitcoin", ex: "Crypto", cls: "crypto", cur: "USD", qty: 0.15, cost: 42000, price: 67250, prev: 65900 },
  { sym: "ETH", name: "Ethereum", ex: "Crypto", cls: "crypto", cur: "USD", qty: 2, cost: 2100, price: 2610, prev: 2580 },
  { sym: "CASH", name: "Cash", ex: "", cls: "cash", cur: "USD", qty: 3000, cost: 1, price: 1, prev: 1 },
];

export const watchSyms = ["AAPL", "BTC", "DANGCEM", "MSFT"];

export const initialIndices: Record<IndexKey, IndexQuote> = {
  spx: { price: 5812.4, prev: 5763.9 },
  ndx: { price: 18342.1, prev: 18210.5 },
  ngx: { price: 98410.3, prev: 98710.2 },
};

export const movers: Mover[] = [
  { sym: "PLTR", name: "Palantir", price: 41.2, pct: 6.8 },
  { sym: "ZENITH", name: "Zenith Bank", price: 38.5, pct: 4.9, cur: "NGN" },
  { sym: "SOL", name: "Solana", price: 152.3, pct: 4.1 },
  { sym: "NVDA", name: "NVIDIA Corp.", price: 138.2, pct: 3.1 },
  { sym: "INTC", name: "Intel", price: 21.4, pct: -5.2 },
  { sym: "OANDO", name: "Oando", price: 61.0, pct: -4.4, cur: "NGN" },
  { sym: "BA", name: "Boeing", price: 154.8, pct: -2.9 },
  { sym: "DOGE", name: "Dogecoin", price: 0.112, pct: -2.1 },
];

export const news: NewsItem[] = [
  { tag: "US", src: "Sample Wire", time: "12 min ago", title: "Chipmakers lead tech gains as AI hardware demand stays strong", color: "var(--lime)" },
  { tag: "NGX", src: "Sample Wire", time: "40 min ago", title: "NGX All-Share index eases on profit-taking in banking stocks", color: "#9fc7f5" },
  { tag: "Crypto", src: "Sample Wire", time: "1 hr ago", title: "Bitcoin holds near recent highs as ETF inflows continue", color: "#f5c99f" },
  { tag: "FX", src: "Sample Wire", time: "2 hr ago", title: "Naira steadies against the dollar in the official window", color: "#d8c4f5" },
];
