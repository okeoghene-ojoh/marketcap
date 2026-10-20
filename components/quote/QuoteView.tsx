"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "../dashboard/Header";
import { AddHoldingDialog } from "../dashboard/AddHoldingDialog";
import { TickerLogo } from "../dashboard/TickerLogo";
import { Icon } from "../Icon";
import { PriceChart } from "./PriceChart";
import { SetAlertDialog } from "../alerts/SetAlertDialog";
import { useAlerts } from "../AlertsProvider";
import { useAuth } from "../AuthProvider";
import { describeAlert } from "@/lib/alerts/describe";
import { getJSON, usePoll, useQuotes } from "@/lib/useMarketData";
import { usePortfolio } from "@/lib/usePortfolio";
import { money, pct, timeAgo, tone } from "@/lib/format";
import { CURRENCY_SYMBOLS } from "@/lib/sample-data";
import type { Currency, NewsResponse, Overview } from "@/lib/types";

const compact = (v: number) => v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });

export function QuoteView({ overview }: { overview: Overview }) {
  const { symbol, currency } = overview;
  const { quotes, flash } = useQuotes([symbol]);
  const quote = quotes[symbol] ?? overview.quote;
  const change = quote.price - quote.prev;
  const fmt = useCallback((v: number) => money(v, currency, { native: true }), [currency]);

  const { positions, isWatched, addToWatchlist, removeFromWatchlist, addHolding } = usePortfolio();
  const watched = isWatched(symbol);
  const position = positions.find((p) => p.sym === symbol);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const alertRef = useRef<HTMLDialogElement>(null);
  const { enabled: authEnabled } = useAuth();
  const alertsCtx = useAlerts();
  const myAlerts = alertsCtx.alerts.filter((a) => a.symbol === symbol);

  // Company news for stocks; general market news for crypto and NGX
  const [news, setNews] = useState<NewsResponse | null>(null);
  const newsPath = overview.kind === "stock" ? `/api/news?symbol=${symbol}` : "/api/news";
  const loadNews = useCallback(async () => setNews(await getJSON<NewsResponse>(newsPath)), [newsPath]);
  usePoll(loadNews, 5 * 60_000);

  const stats = useMemo(() => buildStats(overview, quote.price, currency), [overview, quote.price, currency]);

  return (
    <div className="app">
      <Header />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Overview</Link> <span>/</span> <span>{symbol}</span>
      </nav>

      <section className="row row-quote">
        <article className="card quote-main">
          <div className="quote-id">
            {overview.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logos come from the data provider's CDN
              <img className="logo quote-logo" src={overview.logo} alt="" />
            ) : (
              <TickerLogo sym={symbol} cur={currency} />
            )}
            <div>
              <h2 className="quote-name">{overview.name}</h2>
              <div className="row-sub">
                {symbol}{overview.exchange ? ` · ${overview.exchange}` : ""}
                {quote.source === "sample" ? " · sample data" : overview.kind === "crypto" ? " · live" : " · real-time"}
              </div>
            </div>
          </div>

          <div className="quote-price-row">
            <div className={`quote-price ${flash[symbol] ? `flash-${flash[symbol]}` : ""}`} key={quote.price}>
              {fmt(quote.price)}
            </div>
            <div className={`quote-change ${tone(change)}`}>
              {money(change, currency, { native: true, sign: true })} ({pct(quote.changePct)})
              <span className="row-sub"> {overview.kind === "crypto" ? "24h" : "today"}</span>
            </div>
          </div>
          {overview.kind !== "crypto" && quote.source !== "sample" && (
            <div className="row-sub">Last trade {timeAgo(quote.time)}</div>
          )}

          <div className="btns quote-actions">
            <button
              className={`btn ${watched ? "primary" : "outline"}`}
              onClick={() => (watched ? removeFromWatchlist(symbol) : addToWatchlist(symbol, overview.name, overview.exchange))}
              aria-pressed={watched}
            >
              <Icon name={watched ? "check" : "star"} size="sm" />
              {watched ? "In Watchlist" : "Add to Watchlist"}
            </button>
            <button className="btn outline" onClick={() => dialogRef.current?.showModal()}>
              <Icon name="plus" size="sm" />Add Holding
            </button>
            {/* Compare against the S&P 500 ETF (or SPY against the NASDAQ ETF) */}
            <Link href={`/compare?s=${symbol},${symbol === "SPY" ? "QQQ" : "SPY"}`} className="btn outline">
              <Icon name="trend" size="sm" />Compare
            </Link>
            {overview.kind !== "ngx" && (
              <Link href={`/practice?symbol=${symbol}`} className="btn outline" title="Trade with pretend money">
                <Icon name="target" size="sm" />Practice trade
              </Link>
            )}
            {alertsCtx.enabled ? (
              <button className="btn outline" onClick={() => alertRef.current?.showModal()}>
                <Icon name="bell" size="sm" />Set alert
              </button>
            ) : authEnabled ? (
              <Link href="/login" className="btn outline" title="Sign in to set price alerts">
                <Icon name="bell" size="sm" />Set alert
              </Link>
            ) : null}
          </div>

          {myAlerts.length > 0 && (
            <ul className="alert-chips" aria-label="Your alerts for this symbol">
              {myAlerts.map((a) => (
                <li key={a.id} className={a.active ? "" : "off"}>
                  <Icon name="bell" size="sm" />
                  {describeAlert(a)}
                  <span className="row-sub">{a.active ? "active" : "triggered"}</span>
                  <button className="chip-x" aria-label="Delete alert" onClick={() => alertsCtx.deleteAlert(a.id)}>
                    <Icon name="x" size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <PriceChart symbol={symbol} formatPrice={fmt} />
        </article>

        <div className="quote-side">
          <article className="card">
            <div className="card-head"><div className="title">Key stats</div></div>
            <dl className="stats">
              {stats.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </article>

          {position && (
            <PositionCard qty={position.qty} cost={position.cost} price={quote.price} currency={currency} fmt={fmt} />
          )}

          <AboutCard overview={overview} />
        </div>
      </section>

      <section className="row">
        <article className="card">
          <div className="card-head">
            <div className="title">
              <span className="title-ic"><Icon name="news" /></span>
              {overview.kind === "stock" ? `${symbol} news` : "Market news"}
            </div>
            {news?.source === "sample" && <span className="pill">Sample headlines</span>}
          </div>
          <ul className="news">
            {!news && <li><div className="row-sub">Loading headlines…</div></li>}
            {news && news.articles.length === 0 && <li><div className="row-sub">No recent news for {symbol}.</div></li>}
            {news?.articles.slice(0, 6).map((n) => (
              <li key={n.id}>
                {n.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- images come from many news domains
                  <img className="thumb" src={n.image} alt="" loading="lazy" />
                )}
                <div className="meta">
                  {n.url === "#" ? (
                    <div className="row-title">{n.headline}</div>
                  ) : (
                    <a className="row-title news-link" href={n.url} target="_blank" rel="noopener noreferrer">{n.headline}</a>
                  )}
                  <div className="row-sub">{n.source} · {timeAgo(n.time)}</div>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <footer className="foot">Data may be delayed. Not financial advice.</footer>

      <SetAlertDialog
        ref={alertRef}
        symbol={symbol}
        currency={currency}
        price={quote.price}
        onCreate={async (condition, target) =>
          Boolean(await alertsCtx.createAlert({ symbol, name: overview.name, currency, condition, target }))
        }
      />
      <AddHoldingDialog
        ref={dialogRef}
        symbol={symbol}
        currency={currency}
        suggestedPrice={quote.price}
        onSave={(sym, qty, cost) => addHolding(sym, qty, cost, overview.name, overview.exchange)}
      />
    </div>
  );
}

function buildStats(o: Overview, price: number, currency: Currency): [string, string][] {
  const s = o.stats;
  const m = (v?: number) => (v === undefined ? undefined : money(v, currency, { native: true }));
  const rows: [string, string | undefined][] = [
    ["Open", m(s.open)],
    [o.kind === "crypto" ? "24h high" : "Day high", m(s.high)],
    [o.kind === "crypto" ? "24h low" : "Day low", m(s.low)],
    [o.kind === "crypto" ? "Price 24h ago" : "Previous close", m(s.prevClose)],
    ["Market cap", s.marketCap ? `${CURRENCY_SYMBOLS[currency]}${compact(s.marketCap)}` : undefined],
    ["P/E ratio", s.pe?.toFixed(2)],
    [o.kind === "crypto" ? "All-time high" : "52-week high", m(s.high52)],
    ["52-week low", m(s.low52)],
    ["Dividend yield", s.dividendYield ? `${s.dividendYield.toFixed(2)}%` : undefined],
    [o.kind === "crypto" ? "24h volume" : "Avg. volume (10d)", s.avgVolume ? compact(s.avgVolume) : undefined],
    ["Beta", s.beta?.toFixed(2)],
  ];
  // Where the price sits in its 52-week range is handy context
  if (s.high52 && s.low52 && s.high52 > s.low52) {
    rows.push(["52-week position", `${Math.round(((price - s.low52) / (s.high52 - s.low52)) * 100)}%`]);
  }
  return rows.filter((r): r is [string, string] => r[1] !== undefined);
}

function PositionCard({ qty, cost, price, currency, fmt }: {
  qty: number; cost: number; price: number; currency: Currency; fmt: (v: number) => string;
}) {
  const value = qty * price;
  const gain = (price - cost) * qty;
  const gainPct = ((price - cost) / cost) * 100;
  return (
    <article className="card">
      <div className="card-head"><div className="title">Your position</div></div>
      <dl className="stats">
        <div><dt>Shares</dt><dd>{qty.toLocaleString("en-US", { maximumFractionDigits: 6 })}</dd></div>
        <div><dt>Avg. cost</dt><dd>{fmt(cost)}</dd></div>
        <div><dt>Market value</dt><dd>{fmt(value)}</dd></div>
        <div>
          <dt>Total gain</dt>
          <dd className={tone(gain)}>{money(gain, currency, { native: true, sign: true })} ({pct(gainPct)})</dd>
        </div>
      </dl>
    </article>
  );
}

function AboutCard({ overview: o }: { overview: Overview }) {
  const rows: [string, React.ReactNode][] = [];
  if (o.industry) rows.push(["Industry", o.industry]);
  if (o.country) rows.push(["Country", o.country]);
  if (o.ipo) rows.push(["Listed since", new Date(o.ipo).getFullYear()]);
  if (o.website) {
    rows.push(["Website", (
      <a href={o.website} target="_blank" rel="noopener noreferrer" className="news-link">
        {o.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
      </a>
    )]);
  }
  if (o.kind === "ngx") rows.push(["Data", "NGX prices are sample data until an NGX feed is connected."]);
  if (!rows.length) return null;
  return (
    <article className="card">
      <div className="card-head"><div className="title">About</div></div>
      <dl className="stats">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </article>
  );
}
