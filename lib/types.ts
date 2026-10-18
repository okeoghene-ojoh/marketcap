export type Currency = "USD" | "NGN" | "EUR";
export type AssetClass = "us" | "crypto" | "ngx" | "cash";

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
}

export interface IndexQuote {
  price: number;
  prev: number;
}

export type IndexKey = "spx" | "ndx" | "ngx";

export interface Mover {
  sym: string;
  name: string;
  price: number;
  pct: number;
  cur?: Currency;
}

export interface NewsItem {
  tag: string;
  src: string;
  time: string;
  title: string;
  color: string;
}

export type Flash = Record<string, "up" | "down">;
