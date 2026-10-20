import { describe, expect, it } from "vitest";
import { isUSMarketOpen } from "./marketHours";

// October is daylight time in New York (UTC−4)
describe("isUSMarketOpen", () => {
  it("is open on a weekday between 9:30 and 16:00 New York time", () => {
    expect(isUSMarketOpen(new Date("2026-10-20T14:00:00Z"))).toBe(true); // Tue 10:00
    expect(isUSMarketOpen(new Date("2026-10-20T13:30:00Z"))).toBe(true); // Tue 9:30
  });

  it("is closed before the open, at the close, and at weekends", () => {
    expect(isUSMarketOpen(new Date("2026-10-20T13:29:00Z"))).toBe(false); // 9:29
    expect(isUSMarketOpen(new Date("2026-10-20T20:00:00Z"))).toBe(false); // 16:00
    expect(isUSMarketOpen(new Date("2026-10-24T15:00:00Z"))).toBe(false); // Saturday
  });
});
