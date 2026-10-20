import { describe, expect, it } from "vitest";
import { computeValueSeries } from "./portfolioHistory";
import type { Candle, Rates } from "./types";

const rates: Rates = { USD: 1, NGN: 1500, EUR: 0.9 };
const c = (time: string, close: number): Candle => ({ time, open: close, high: close, low: close, close });

describe("computeValueSeries", () => {
  it("adds up shares × close per day, plus cash", () => {
    const r = computeValueSeries(
      [{ sym: "AAPL", qty: 2, cur: "USD", price: 120 }],
      { AAPL: { source: "live", candles: [c("2026-10-01", 100), c("2026-10-02", 110), c("2026-10-05", 120)] } },
      rates,
      50
    );
    expect(r.points).toEqual([
      { time: "2026-10-01", value: 250 },
      { time: "2026-10-02", value: 270 },
      { time: "2026-10-05", value: 290 },
    ]);
    expect(r.estimated).toEqual([]);
  });

  it("starts where every holding has data and carries closes over non-trading days", () => {
    const r = computeValueSeries(
      [
        { sym: "AAPL", qty: 1, cur: "USD", price: 12 },
        { sym: "BTC", qty: 1, cur: "USD", price: 102 },
      ],
      {
        AAPL: { source: "live", candles: [c("2026-09-30", 9), c("2026-10-02", 10), c("2026-10-05", 12)] }, // no weekend bars
        BTC: { source: "live", candles: [c("2026-10-02", 100), c("2026-10-03", 101), c("2026-10-04", 99), c("2026-10-05", 102)] },
      },
      rates
    );
    expect(r.points.map((p) => p.time)).toEqual(["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"]);
    expect(r.points.map((p) => p.value)).toEqual([110, 111, 109, 114]); // AAPL held at 10 over the weekend
  });

  it("holds holdings without live history at today's value and names them", () => {
    const r = computeValueSeries(
      [
        { sym: "AAPL", qty: 1, cur: "USD", price: 110 },
        { sym: "DANGCEM", qty: 1500, cur: "NGN", price: 480 }, // ₦720,000 = $480
      ],
      {
        AAPL: { source: "live", candles: [c("2026-10-01", 100), c("2026-10-02", 110)] },
        DANGCEM: { source: "sample", candles: [c("2026-10-01", 1), c("2026-10-02", 2)] },
      },
      rates
    );
    expect(r.estimated).toEqual(["DANGCEM"]);
    expect(r.points.map((p) => p.value)).toEqual([580, 590]);
  });

  it("returns no points when nothing has live history", () => {
    expect(computeValueSeries([{ sym: "X", qty: 1, cur: "USD", price: 1 }], {}, rates).points).toEqual([]);
  });
});
