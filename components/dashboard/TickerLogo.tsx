import type { Currency } from "@/lib/types";

const CRYPTO = ["BTC", "ETH", "SOL", "DOGE"];

/** Letter badge used instead of company logos. */
export function TickerLogo({ sym, cur }: { sym: string; cur?: Currency }) {
  const bg = cur === "NGN" ? "#9fc7f5" : CRYPTO.includes(sym) ? "#f5c99f" : "var(--soft)";
  return (
    <span className="logo" style={{ background: bg, color: "#142d0a" }}>
      {sym.slice(0, 4)}
    </span>
  );
}
