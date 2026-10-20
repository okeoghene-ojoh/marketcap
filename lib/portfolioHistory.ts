// What a set of holdings was worth on each day, from each holding's daily closes.
// Assumes today's share counts were held throughout ("value of your current holdings")
// and converts with today's exchange rates.
import { toUSD } from "./format";
import type { Candle, Currency, DataSource, Rates } from "./types";

export interface HistoryInput {
  sym: string;
  qty: number;
  cur: Currency;
  /** today's price, used when there's no usable history */
  price: number;
}

export interface ValuePoint {
  /** YYYY-MM-DD */
  time: string;
  /** USD */
  value: number;
}

export interface ValueSeries {
  points: ValuePoint[];
  /** holdings with no live history, held at today's value */
  estimated: string[];
}

const day = (t: string) => t.slice(0, 10);

export function computeValueSeries(
  holdings: HistoryInput[],
  histories: Record<string, { candles: Candle[]; source: DataSource } | undefined>,
  rates: Rates,
  cashUSD = 0
): ValueSeries {
  const usable: { h: HistoryInput; closes: Map<string, number>; days: string[] }[] = [];
  const estimated: string[] = [];

  for (const h of holdings) {
    const hist = histories[h.sym];
    if (!hist || hist.source === "sample" || hist.candles.length < 2) {
      estimated.push(h.sym);
      continue;
    }
    const closes = new Map<string, number>();
    for (const c of hist.candles) closes.set(day(c.time), c.close);
    usable.push({ h, closes, days: [...closes.keys()].sort() });
  }

  // Flat part: holdings without history, plus cash, at today's value
  const flat = cashUSD + holdings
    .filter((h) => estimated.includes(h.sym))
    .reduce((s, h) => s + toUSD(h.price * h.qty, h.cur, rates), 0);

  if (!usable.length) return { points: [], estimated };

  // Start where every series has data, so no holding pops in part-way
  const start = usable.reduce((max, u) => (u.days[0] > max ? u.days[0] : max), "");
  const allDays = [...new Set(usable.flatMap((u) => u.days))].filter((d) => d >= start).sort();

  // Walk forward, carrying each holding's last close over days it didn't trade (weekends for stocks)
  const last = new Map<string, number>();
  const points: ValuePoint[] = [];
  for (const d of allDays) {
    let value = flat;
    for (const u of usable) {
      const close = u.closes.get(d);
      if (close !== undefined) last.set(u.h.sym, close);
      const px = last.get(u.h.sym);
      if (px !== undefined) value += toUSD(px * u.h.qty, u.h.cur, rates);
    }
    points.push({ time: d, value });
  }
  return { points, estimated };
}
