import type { Metadata } from "next";
import { PortfolioView } from "@/components/portfolio/PortfolioView";

export const metadata: Metadata = { title: "Portfolio – Marketcap" };

export default function PortfolioPage() {
  return <PortfolioView />;
}
