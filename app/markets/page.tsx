import type { Metadata } from "next";
import { MarketsView } from "@/components/markets/MarketsView";

export const metadata: Metadata = {
  title: "Markets – Marketcap",
  description: "US indexes, sectors, crypto, naira exchange rates and today's biggest movers.",
};

export default function MarketsPage() {
  return <MarketsView />;
}
