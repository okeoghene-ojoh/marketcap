import { describe, expect, it } from "vitest";
import { parseCsv, readHoldings, toCsv } from "./csv";

describe("parseCsv / toCsv", () => {
  it("handles quotes, embedded commas and line endings", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
  });

  it("detects semicolon-separated files (European Excel)", () => {
    expect(parseCsv("symbol;shares\nAAPL;10")).toEqual([["symbol", "shares"], ["AAPL", "10"]]);
  });

  it("round-trips what it writes", () => {
    const rows = [["symbol", "name"], ["BRK.B", 'Berkshire "B", Inc']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("readHoldings", () => {
  it("reads common header names and cleans numbers", () => {
    const r = readHoldings("Ticker,Company,Quantity,Average Cost\naapl,Apple,10,\"$1,234.50\"\nBTC,,0.5,42000\n");
    expect(r.errors).toEqual([]);
    expect(r.holdings).toEqual([
      { symbol: "AAPL", name: "Apple", qty: 10, cost: 1234.5 },
      { symbol: "BTC", name: undefined, qty: 0.5, cost: 42000 },
    ]);
  });

  it("explains missing columns and bad rows", () => {
    expect(readHoldings("symbol,price\nAAPL,1").errors[0]).toMatch(/shares/);
    const r = readHoldings("symbol,shares,cost\nAAPL,-1,5\n<x>,1,1\nMSFT,2,300");
    expect(r.holdings).toEqual([{ symbol: "MSFT", name: undefined, qty: 2, cost: 300 }]);
    expect(r.errors).toHaveLength(2);
  });
});
