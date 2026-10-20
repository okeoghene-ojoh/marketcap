import { describe, expect, it } from "vitest";
import { parseSymbols, ttlFor } from "./api";

describe("parseSymbols", () => {
  it("uppercases, trims and de-duplicates", () => {
    expect(parseSymbols(" aapl, MSFT ,aapl", 5)).toEqual(["AAPL", "MSFT"]);
  });

  it("rejects bad input", () => {
    expect(parseSymbols(null, 5)).toBeNull();
    expect(parseSymbols("", 5)).toBeNull();
    expect(parseSymbols("<script>", 5)).toBeNull();
    expect(parseSymbols("A,B,C", 2)).toBeNull(); // too many
  });
});

describe("ttlFor", () => {
  it("caches live data normally but sample fallbacks briefly", () => {
    expect(ttlFor("live", 3600)).toBe(3600);
    expect(ttlFor("sample", 3600)).toBe(30);
  });
});
