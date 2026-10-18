import { CURRENCY_SYMBOLS, RATES } from "./sample-data";
import type { Currency } from "./types";

export const toUSD = (amount: number, cur: Currency) => amount / RATES[cur];

interface MoneyOpts {
  /** the amount is already in `cur`, so don't convert from USD */
  native?: boolean;
  sign?: boolean;
  digits?: number;
}

/** Format a USD amount in the given display currency. */
export function money(amount: number, cur: Currency, opts: MoneyOpts = {}) {
  const v = opts.native ? amount : amount * RATES[cur];
  const abs = Math.abs(v);
  const digits = opts.digits ?? (abs < 1 ? 4 : 2);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const sign = opts.sign ? (v >= 0 ? "+" : "−") : v < 0 ? "−" : "";
  return `${sign}${CURRENCY_SYMBOLS[cur]}${s}`;
}

export const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;
export const num = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const tone = (v: number) => (v >= 0 ? "pos" : "neg");
export const changePct = (price: number, prev: number) => ((price - prev) / prev) * 100;
