import { money } from "../format";
import type { AlertCondition, Currency } from "../types";

export const CONDITION_LABELS: Record<AlertCondition, string> = {
  above: "Price rises above",
  below: "Price falls below",
  up: "Rises by at least (% today)",
  down: "Falls by at least (% today)",
};

/** "AAPL above $250.00", "BTC up 5% today" */
export function describeAlert(a: { symbol: string; condition: AlertCondition; target: number; currency: Currency }) {
  if (a.condition === "above") return `${a.symbol} above ${money(a.target, a.currency, { native: true })}`;
  if (a.condition === "below") return `${a.symbol} below ${money(a.target, a.currency, { native: true })}`;
  return `${a.symbol} ${a.condition === "up" ? "up" : "down"} ${a.target}% today`;
}

/** Has the alert's condition been met by this price / daily change? */
export function isTriggered(condition: AlertCondition, target: number, price: number, changePct: number) {
  switch (condition) {
    case "above": return price >= target;
    case "below": return price <= target;
    case "up": return changePct >= target;
    case "down": return changePct <= -target;
  }
}
