import type { Metadata } from "next";
import { NewsView } from "@/components/news/NewsView";

export const metadata: Metadata = {
  title: "News – Marketcap",
  description: "Market headlines, crypto and forex news, and stories about the stocks you follow.",
};

export default function NewsPage() {
  return <NewsView />;
}
