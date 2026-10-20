import { CURRENCY_SYMBOLS } from "./sample-data";
import type { Currency, Rates } from "./types";

export const toUSD = (amount: number, cur: Currency, rates: Rates) => amount / rates[cur];

type MoneyOpts = { sign?: boolean; digits?: number } & (
  /** amount is in USD and gets converted to `cur` */
  | { rates: Rates; native?: false }
  /** amount is already in `cur` */
  | { native: true; rates?: never }
);

export function money(amount: number, cur: Currency, opts: MoneyOpts) {
  const v = opts.native ? amount : amount * opts.rates[cur];
  const abs = Math.abs(v);
  // Extra decimals for sub-$1 prices (e.g. DOGE), but zero is plain "0.00"
  const digits = opts.digits ?? (abs > 0 && abs < 1 ? 4 : 2);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sign = opts.sign ? (v >= 0 ? "+" : "−") : v < 0 ? "−" : "";
  return `${sign}${CURRENCY_SYMBOLS[cur]}${s}`;
}

export const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
export const num = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const tone = (v: number) => (v >= 0 ? "pos" : "neg");
export const changePct = (price: number, prev: number) => ((price - prev) / prev) * 100;

/** " · sample" / " · delayed" after a symbol, so data is always labelled honestly ("" when live) */
export const sourceNote = (source?: "live" | "delayed" | "sample") =>
  source === "sample" ? " · sample" : source === "delayed" ? " · delayed" : "";

export function timeAgo(ms: number, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - ms) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
