import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuoteView } from "@/components/quote/QuoteView";
import { getOverview } from "@/lib/providers";

type Params = { params: Promise<{ symbol: string }> };

const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;

// Shared by the page and its <title>, so the data is fetched once per request
const load = cache(async (raw: string) => {
  const symbol = decodeURIComponent(raw).toUpperCase();
  return SYMBOL_RE.test(symbol) ? getOverview(symbol) : null;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const o = await load((await params).symbol);
  return { title: o ? `${o.name} (${o.symbol}) – Marketcap` : "Not found – Marketcap" };
}

export default async function QuotePage({ params }: Params) {
  const overview = await load((await params).symbol);
  if (!overview) notFound();
  return <QuoteView overview={overview} />;
}
