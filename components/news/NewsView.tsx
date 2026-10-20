"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Header } from "../dashboard/Header";
import { Icon } from "../Icon";
import { getJSON, usePoll } from "@/lib/useMarketData";
import { usePortfolio } from "@/lib/usePortfolio";
import { CRYPTO_IDS, NGX_SYMBOLS } from "@/lib/sample-data";
import { timeAgo } from "@/lib/format";
import type { Article, DataSource, NewsCategory, NewsResponse } from "@/lib/types";

type Tab = NewsCategory | "mine";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Top stories" },
  { id: "mine", label: "Your stocks" },
  { id: "crypto", label: "Crypto" },
  { id: "forex", label: "Forex" },
  { id: "merger", label: "Mergers" },
];

const MAX_MINE = 6; // company-news lookups per refresh (free plan: 60 calls/min shared with prices)

export function NewsView() {
  const [tab, setTab] = useState<Tab>("general");
  const { watchlist, positions } = usePortfolio();
  const [data, setData] = useState<Record<string, { articles: Article[]; source: DataSource }>>({});

  // Company news only exists for US stocks (not crypto or NGX)
  const mine = [...new Set([...watchlist.map((w) => w.sym), ...positions.map((p) => p.sym)])]
    .filter((s) => s !== "CASH" && !(s in CRYPTO_IDS) && !NGX_SYMBOLS.includes(s))
    .slice(0, MAX_MINE);
  const mineKey = mine.join(",");

  const load = useCallback(async () => {
    if (tab !== "mine") {
      const d = await getJSON<NewsResponse>(`/api/news?category=${tab}&limit=24`);
      if (d) setData((prev) => ({ ...prev, [tab]: d }));
      return;
    }
    const symbols = mineKey ? mineKey.split(",") : [];
    const results = await Promise.all(symbols.map((s) => getJSON<NewsResponse>(`/api/news?symbol=${s}&limit=6`)));
    const seen = new Set<string>();
    const articles = results
      .flatMap((r, i) => (r?.articles ?? []).map((a) => ({ ...a, related: a.related || symbols[i] })))
      .filter((a) => (seen.has(a.url) ? false : (seen.add(a.url), true)))
      .sort((a, b) => b.time - a.time);
    const source: DataSource = results.some((r) => r?.source === "live") ? "live" : "sample";
    setData((prev) => ({ ...prev, mine: { articles, source } }));
  }, [tab, mineKey]);

  usePoll(load, 5 * 60_000);

  const current = data[tab];
  const [lead, ...rest] = current?.articles ?? [];

  return (
    <div className="app">
      <Header />

      <section className="card">
        <div className="card-head">
          <div className="title"><span className="title-ic"><Icon name="news" /></span>News</div>
          {current?.source === "sample" && <span className="pill">Sample headlines</span>}
        </div>

        <div className="seg news-tabs" role="tablist" aria-label="News categories">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === tab} className={`seg-btn ${t.id === tab ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "mine" && mine.length === 0 && (
          <p className="row-sub empty-hint">
            Add US stocks to your <Link href="/portfolio#watchlists">watchlist</Link> or portfolio to see news about them here.
          </p>
        )}
        {tab === "mine" && mine.length > 0 && (
          <p className="row-sub news-for">News for {mine.join(", ")}</p>
        )}

        {!current && !(tab === "mine" && mine.length === 0) && <p className="row-sub">Loading headlines…</p>}
        {current && current.articles.length === 0 && <p className="row-sub">No recent stories here.</p>}

        {lead && <LeadStory a={lead} />}
        <ul className="news news-page">
          {rest.map((a) => <StoryRow key={a.id + a.url} a={a} />)}
        </ul>
      </section>

      <footer className="foot">Headlines from Finnhub. Stories open on the publisher&apos;s site. Not financial advice.</footer>
    </div>
  );
}

function StoryLink({ a, children, className }: { a: Article; children: React.ReactNode; className?: string }) {
  return a.url === "#" ? (
    <div className={className}>{children}</div>
  ) : (
    <a href={a.url} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  );
}

function LeadStory({ a }: { a: Article }) {
  return (
    <StoryLink a={a} className="lead-story">
      {a.image && (
        // eslint-disable-next-line @next/next/no-img-element -- images come from many news domains
        <img src={a.image} alt="" className="lead-img" />
      )}
      <div>
        <h2 className="lead-title">{a.headline}</h2>
        <div className="row-sub">{a.source} · {timeAgo(a.time)}{a.related ? ` · ${a.related.split(",")[0]}` : ""}</div>
      </div>
    </StoryLink>
  );
}

function StoryRow({ a }: { a: Article }) {
  const ticker = a.related?.split(",")[0];
  return (
    <li>
      {a.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- images come from many news domains
        <img className="thumb" src={a.image} alt="" loading="lazy" />
      ) : (
        <div className="thumb" style={{ background: "var(--soft)" }}>{a.source.slice(0, 6)}</div>
      )}
      <div className="meta">
        <StoryLink a={a} className="row-title news-link">{a.headline}</StoryLink>
        <div className="row-sub">{a.source} · {timeAgo(a.time)}</div>
      </div>
      {ticker && /^[A-Z.]{1,6}$/.test(ticker) && <Link href={`/quote/${ticker}`} className="tag">{ticker}</Link>}
    </li>
  );
}
