import { describe, expect, it } from "vitest";
import { computeTotals, priceHoldings } from "./portfolio";
import type { Holding, Quote, Rates } from "./types";

const rates: Rates = { USD: 1, NGN: 1500, EUR: 0.9 };

const holding = (h: Partial<Holding>): Holding => ({
  sym: "X", name: "X", ex: "US", cls: "us", cur: "USD", qty: 1, cost: 1, price: 1, prev: 1, source: "live", ...h,
});

describe("computeTotals", () => {
  const holdings = [
    holding({ sym: "AAPL", qty: 10, cost: 100, price: 150, prev: 140 }), // $1,500 value, +$500 gain, +$100 today
    holding({ sym: "DANGCEM", cls: "ngx", cur: "NGN", qty: 1000, cost: 300, price: 450, prev: 450 }), // ₦450,000 = $300
    holding({ sym: "CASH", cls: "cash", qty: 200, cost: 1, price: 1, prev: 1 }), // $200
  ];
  const t = computeTotals(holdings, rates);

  it("adds up values in USD across currencies", () => {
    expect(t.value).toBeCloseTo(1500 + 300 + 200);
  });

  it("computes today's change", () => {
    expect(t.day).toBeCloseTo(100);
    expect(t.dayPct).toBeCloseTo((100 / 1900) * 100);
  });

  it("computes total gain against cost", () => {
    // AAPL +$500, DANGCEM (450 − 300) × 1000 = ₦150,000 = $100, cash 0
    expect(t.gain).toBeCloseTo(600);
    expect(t.gainPct).toBeCloseTo((600 / 1400) * 100);
  });

  it("groups by asset class", () => {
    expect(t.byClass.us).toBeCloseTo(1500);
    expect(t.byClass.ngx).toBeCloseTo(300);
    expect(t.byClass.cash).toBeCloseTo(200);
    expect(t.gainByClass.ngx).toBeCloseTo(100);
  });

  it("returns zeros, not NaN, for an empty portfolio", () => {
    expect(computeTotals([], rates)).toMatchObject({ value: 0, day: 0, dayPct: 0, gain: 0, gainPct: 0 });
  });
});

describe("priceHoldings", () => {
  const live: Record<string, Quote> = {
    AAPL: { symbol: "AAPL", price: 200, prev: 190, changePct: 5.26, time: 0, source: "live" },
  };

  it("uses live quotes when available", () => {
    const [h] = priceHoldings([{ sym: "AAPL", name: "Apple", ex: "NASDAQ", cls: "us", cur: "USD", qty: 1, cost: 150 }], live);
    expect(h).toMatchObject({ price: 200, prev: 190, source: "live" });
  });

  it("values cash at 1", () => {
    const [h] = priceHoldings([{ sym: "CASH", name: "Cash", ex: "", cls: "cash", cur: "USD", qty: 500, cost: 1 }], live);
    expect(h).toMatchObject({ price: 1, prev: 1 });
  });

  it("falls back to the buy price (labelled sample) for unknown symbols", () => {
    const [h] = priceHoldings([{ sym: "ZZZZ", name: "?", ex: "US", cls: "us", cur: "USD", qty: 1, cost: 42 }], {});
    expect(h).toMatchObject({ price: 42, prev: 42, source: "sample" });
  });
});
