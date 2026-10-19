import { toUSD } from "./format";
import { sampleQuote } from "./sample-data";
import type { AssetClass, Holding, Quote, Rates } from "./types";

export interface PortfolioTotals {
  value: number;
  day: number;
  dayPct: number;
  gain: number;
  gainPct: number;
  byClass: Partial<Record<AssetClass, number>>;
  gainByClass: Partial<Record<AssetClass, number>>;
  dayPctByClass: Partial<Record<AssetClass, number>>;
}

/** All amounts in USD, converted at today's rates (cost included, for simplicity). */
export function computeTotals(holdings: Holding[], rates: Rates): PortfolioTotals {
  let value = 0, prev = 0, cost = 0;
  const byClass: PortfolioTotals["byClass"] = {};
  const prevByClass: PortfolioTotals["byClass"] = {};
  const gainByClass: PortfolioTotals["gainByClass"] = {};

  for (const h of holdings) {
    const v = toUSD(h.price * h.qty, h.cur, rates);
    const p = toUSD(h.prev * h.qty, h.cur, rates);
    value += v;
    prev += p;
    cost += toUSD(h.cost * h.qty, h.cur, rates);
    byClass[h.cls] = (byClass[h.cls] ?? 0) + v;
    prevByClass[h.cls] = (prevByClass[h.cls] ?? 0) + p;
    gainByClass[h.cls] = (gainByClass[h.cls] ?? 0) + toUSD((h.price - h.cost) * h.qty, h.cur, rates);
  }

  const dayPctByClass: PortfolioTotals["dayPctByClass"] = {};
  for (const k of Object.keys(byClass) as AssetClass[]) {
    const p = prevByClass[k] ?? 0;
    dayPctByClass[k] = p ? (((byClass[k] ?? 0) - p) / p) * 100 : 0;
  }

  return {
    value,
    day: value - prev,
    dayPct: prev ? ((value - prev) / prev) * 100 : 0,
    gain: value - cost,
    gainPct: cost ? ((value - cost) / cost) * 100 : 0,
    byClass,
    gainByClass,
    dayPctByClass,
  };
}

/** Live quote if we have one, else sample data, else the given fallback price. */
export function priceOf(sym: string, quotes: Record<string, Quote>, fallback: number) {
  const q = quotes[sym] ?? sampleQuote(sym);
  return q
    ? { price: q.price, prev: q.prev, source: q.source }
    : { price: fallback, prev: fallback, source: "sample" as const };
}

/** Positions priced with the latest quotes (cash is always worth 1). */
export function priceHoldings(positions: Omit<Holding, "price" | "prev" | "source">[], quotes: Record<string, Quote>): Holding[] {
  return positions.map((p) =>
    p.cls === "cash" ? { ...p, price: 1, prev: 1, source: "live" } : { ...p, ...priceOf(p.sym, quotes, p.cost) }
  );
}
