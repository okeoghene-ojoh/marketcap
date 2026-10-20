import { describe, expect, it } from "vitest";
import { changePct, money, pct, timeAgo, toUSD } from "./format";
import type { Rates } from "./types";

const rates: Rates = { USD: 1, NGN: 1500, EUR: 0.9 };

describe("money", () => {
  it("converts USD to the display currency", () => {
    expect(money(100, "USD", { rates })).toBe("$100.00");
    expect(money(100, "NGN", { rates })).toBe("₦150,000.00");
    expect(money(100, "EUR", { rates })).toBe("€90.00");
  });

  it("formats amounts already in a currency without converting", () => {
    expect(money(480, "NGN", { native: true })).toBe("₦480.00");
  });

  it("adds a sign when asked, using a true minus", () => {
    expect(money(12.5, "USD", { rates, sign: true })).toBe("+$12.50");
    expect(money(-12.5, "USD", { rates, sign: true })).toBe("−$12.50");
    expect(money(-12.5, "USD", { rates })).toBe("−$12.50");
  });

  it("shows 4 decimals for prices under $1, but plain 0.00 for zero", () => {
    expect(money(0.1123, "USD", { native: true })).toBe("$0.1123");
    expect(money(0, "USD", { rates })).toBe("$0.00");
  });

  it("respects a fixed number of digits", () => {
    expect(money(65622.4, "USD", { rates, digits: 0 })).toBe("$65,622");
  });
});

describe("pct / changePct / toUSD", () => {
  it("formats percentages with a sign", () => {
    expect(pct(1.234)).toBe("+1.23%");
    expect(pct(-0.5)).toBe("−0.50%");
    expect(pct(0)).toBe("+0.00%");
  });

  it("computes % change from the previous price", () => {
    expect(changePct(110, 100)).toBeCloseTo(10);
    expect(changePct(90, 100)).toBeCloseTo(-10);
  });

  it("converts local amounts to USD", () => {
    expect(toUSD(1500, "NGN", rates)).toBe(1);
    expect(toUSD(90, "EUR", rates)).toBeCloseTo(100);
  });
});

describe("timeAgo", () => {
  const now = Date.UTC(2026, 9, 20, 12, 0, 0);
  it("describes elapsed time", () => {
    expect(timeAgo(now - 20_000, now)).toBe("just now");
    expect(timeAgo(now - 12 * 60_000, now)).toBe("12 min ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3 hr ago");
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe("2d ago");
  });
});
