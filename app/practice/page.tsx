import type { Metadata } from "next";
import { PracticeView } from "@/components/practice/PracticeView";

export const metadata: Metadata = {
  title: "Practice trading – Marketcap",
  description: "Trade stocks and crypto at live prices with $100,000 of pretend money.",
};

const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;

// /practice?symbol=AAPL opens the trade ticket on that symbol
export default async function PracticePage({ searchParams }: { searchParams: Promise<{ symbol?: string }> }) {
  const raw = ((await searchParams).symbol ?? "").toUpperCase();
  return <PracticeView initialSymbol={SYMBOL_RE.test(raw) ? raw : undefined} />;
}
