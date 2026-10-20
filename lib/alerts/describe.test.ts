import { describe, expect, it } from "vitest";
import { describeAlert, isTriggered } from "./describe";

describe("isTriggered", () => {
  it("fires 'above' at or over the target", () => {
    expect(isTriggered("above", 100, 99.99, 0)).toBe(false);
    expect(isTriggered("above", 100, 100, 0)).toBe(true);
    expect(isTriggered("above", 100, 101, 0)).toBe(true);
  });

  it("fires 'below' at or under the target", () => {
    expect(isTriggered("below", 100, 100.01, 0)).toBe(false);
    expect(isTriggered("below", 100, 100, 0)).toBe(true);
  });

  it("fires 'up' on a daily rise of at least the target %", () => {
    expect(isTriggered("up", 5, 0, 4.99)).toBe(false);
    expect(isTriggered("up", 5, 0, 5)).toBe(true);
    expect(isTriggered("up", 5, 0, -6)).toBe(false);
  });

  it("fires 'down' on a daily fall of at least the target %", () => {
    expect(isTriggered("down", 1, 0, -0.99)).toBe(false);
    expect(isTriggered("down", 1, 0, -1.24)).toBe(true);
    expect(isTriggered("down", 1, 0, 3)).toBe(false);
  });
});

describe("describeAlert", () => {
  it("reads naturally", () => {
    expect(describeAlert({ symbol: "AAPL", condition: "above", target: 250, currency: "USD" })).toBe("AAPL above $250.00");
    expect(describeAlert({ symbol: "DANGCEM", condition: "below", target: 400, currency: "NGN" })).toBe("DANGCEM below ₦400.00");
    expect(describeAlert({ symbol: "BTC", condition: "down", target: 1, currency: "USD" })).toBe("BTC down 1% today");
  });
});
