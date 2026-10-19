export type Currency = "USD" | "NGN" | "EUR";
export type AssetClass = "us" | "crypto" | "ngx" | "cash";

/** Where a number came from, so the UI can label it honestly. */
export type DataSource = "live" | "delayed" | "sample";

/** Units of each currency per 1 USD. */
export type Rates = Record<Currency, number>;

export interface Holding {
  sym: string;
  name: string;
  ex: string;
  cls: AssetClass;
  cur: Currency;
  qty: number;
  // price / prev / cost are in the asset's own currency
  cost: number;
  price: number;
  prev: number;
  source: DataSource;
}

export interface Quote {
  symbol: string;
  price: number;
  /** previous close (or price 24h ago for crypto) */
  prev: number;
  changePct: number;
  high?: number;
  low?: number;
  open?: number;
  /** epoch ms */
  time: number;
  source: DataSource;
}

export type IndexKey = "spx" | "ndx" | "ngx";

export interface Mover {
  sym: string;
  name: string;
  price: number;
  pct: number;
  cur?: Currency;
}

export interface MoversResponse {
  gainers: Mover[];
  losers: Mover[];
  source: DataSource;
}

export interface Article {
  id: string;
  headline: string;
  source: string;
  url: string;
  image?: string;
  /** epoch ms */
  time: number;
}

export interface NewsResponse {
  articles: Article[];
  source: DataSource;
}

/** Everything the quote page shows that isn't the live price or chart. */
export interface Overview {
  symbol: string;
  name: string;
  kind: "stock" | "crypto" | "ngx";
  exchange?: string;
  currency: Currency;
  logo?: string;
  website?: string;
  industry?: string;
  country?: string;
  ipo?: string;
  /** price when the page was generated; the page then polls for updates */
  quote: Quote;
  stats: {
    open?: number;
    high?: number;
    low?: number;
    prevClose?: number;
    marketCap?: number; // in `currency`, full units
    pe?: number;
    high52?: number;
    low52?: number;
    dividendYield?: number; // percent
    avgVolume?: number; // shares (or USD volume for crypto)
    beta?: number;
  };
  source: DataSource;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export interface Candle {
  /** ISO date or datetime */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export const HISTORY_RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

/** Most lines the compare page will draw at once. */
export const MAX_COMPARE = 5;

export type Flash = Record<string, "up" | "down">;

export type AlertCondition = "above" | "below" | "up" | "down";

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  currency: Currency;
  condition: AlertCondition;
  /** a price for above/below, a percent for up/down */
  target: number;
  active: boolean;
  lastTriggeredAt: string | null;
  lastPrice: number | null;
}

export interface AppNotification {
  id: string;
  symbol: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
