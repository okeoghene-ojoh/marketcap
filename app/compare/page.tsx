import type { Metadata } from "next";
import { CompareView } from "@/components/compare/CompareView";
import { HISTORY_RANGES, MAX_COMPARE, type HistoryRange } from "@/lib/types";

export const metadata: Metadata = { title: "Compare – Marketcap" };

const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;
const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "SPY"];

// /compare?s=AAPL,MSFT,BTC&range=1Y
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ s?: string; range?: string }> }) {
  const { s, range } = await searchParams;
  const symbols = s === undefined
    ? DEFAULT_SYMBOLS
    : [...new Set(s.split(",").map((x) => x.trim().toUpperCase()).filter((x) => SYMBOL_RE.test(x)))].slice(0, MAX_COMPARE);
  const r = (range ?? "").toUpperCase() as HistoryRange;
  return <CompareView initialSymbols={symbols} initialRange={HISTORY_RANGES.includes(r) ? r : "1Y"} />;
}
