"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "../dashboard/Header";
import { TickerLogo } from "../dashboard/TickerLogo";
import { Icon } from "../Icon";
import { getJSON, usePoll, useQuotes, useRates } from "@/lib/useMarketData";
import { isUSMarketOpen } from "@/lib/marketHours";
import { CRYPTO_IDS, MARKET_INDEXES, SECTOR_ETFS, SYMBOL_NAMES } from "@/lib/sample-data";
import { money, num, pct, tone , sourceNote } from "@/lib/format";
import type { Mover, MoversResponse, Quote } from "@/lib/types";

const CRYPTO = Object.keys(CRYPTO_IDS).slice(0, 6);
const ALL = [...MARKET_INDEXES.map((i) => i.sym), ...SECTOR_ETFS, ...CRYPTO];

/** Green or red tint whose strength follows the size of the move (full at ±3%). */
function heat(changePct: number) {
  const strength = Math.min(Math.abs(changePct) / 3, 1) * 55 + 8;
  return `color-mix(in srgb, var(${changePct >= 0 ? "--pos" : "--neg"}) ${strength.toFixed(0)}%, var(--card))`;
}

export function MarketsView() {
  const { quotes } = useQuotes(ALL);
  const { rates, ratesSource } = useRates();
  const [movers, setMovers] = useState<MoversResponse | null>(null);
  const [open, setOpen] = useState<boolean | null>(null);

  const loadMovers = useCallback(async () => setMovers(await getJSON<MoversResponse>("/api/movers")), []);
  usePoll(loadMovers, 60_000);
  useEffect(() => {
    setOpen(isUSMarketOpen());
    const id = setInterval(() => setOpen(isUSMarketOpen()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sectors = SECTOR_ETFS
    .map((sym) => ({ sym, q: quotes[sym] }))
    .sort((a, b) => (b.q?.changePct ?? -99) - (a.q?.changePct ?? -99));

  return (
    <div className="app">
      <Header />

      <div className="market-status">
        <span className={`status-dot ${open ? "on" : ""}`} />
        {open === null ? "Checking market hours…" : open ? "US markets are open" : "US markets are closed. Prices are from the last close."}
        <span className="row-sub"> · Crypto trades 24/7</span>
      </div>

      <section className="index-grid">
        {MARKET_INDEXES.map(({ sym, label }) => (
          <IndexTile key={sym} sym={sym} label={label} q={quotes[sym]} />
        ))}
      </section>

      <section className="card">
        <div className="card-head">
          <div className="title"><span className="title-ic"><Icon name="pie" /></span>Sectors today</div>
          <span className="pill">S&amp;P 500 sector funds</span>
        </div>
        <div className="sector-grid">
          {sectors.map(({ sym, q }) => (
            <Link key={sym} href={`/quote/${sym}`} className="sector-tile" style={q ? { background: heat(q.changePct) } : undefined}>
              <span className="sector-name">{SYMBOL_NAMES[sym] ?? sym}</span>
              <span className="sector-pct">{q ? pct(q.changePct) : "—"}</span>
              <span className="row-sub">{sym}{sourceNote(q?.source)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="row row-mid markets-row">
        <article className="card">
          <div className="card-head"><div className="title"><span className="title-ic"><Icon name="bolt" /></span>Crypto</div></div>
          <ul className="watch">
            {CRYPTO.map((sym) => <QuoteRow key={sym} sym={sym} q={quotes[sym]} />)}
          </ul>
        </article>

        <article className="card">
          <div className="card-head">
            <div className="title"><span className="title-ic"><Icon name="trend" /></span>Currencies</div>
            {ratesSource === "sample" && <span className="tag">sample</span>}
          </div>
          <ul className="watch">
            <FxRow pair="USD / NGN" label="US dollar to naira" value={`₦${num(rates.NGN)}`} />
            <FxRow pair="NGN / USD" label="₦1,000 in dollars" value={`$${num(1000 / rates.NGN)}`} />
            <FxRow pair="EUR / USD" label="Euro to US dollar" value={`$${(1 / rates.EUR).toFixed(4)}`} />
            <FxRow pair="EUR / NGN" label="Euro to naira" value={`₦${num(rates.NGN / rates.EUR)}`} />
          </ul>
          <p className="row-sub fx-note">Rates update daily.</p>
        </article>

        <MoversList title="Top gainers" items={movers?.gainers} loading={!movers} />
      </section>

      <section className="row row-bottom">
        <MoversList title="Top losers" items={movers?.losers} loading={!movers} />
        <article className="card">
          <div className="card-head"><div className="title">About this data</div></div>
          <p className="row-sub">
            Index values come from funds that track each index (e.g. SPY for the S&amp;P 500), because free data plans
            don&apos;t include the indexes themselves. Movers are ranked from a list of popular stocks and coins.
            NGX prices are delayed (from EODHD), or sample data where marked.
          </p>
        </article>
      </section>

      <footer className="foot">Data may be delayed. Not financial advice.</footer>
    </div>
  );
}

function IndexTile({ sym, label, q }: { sym: string; label: string; q?: Quote }) {
  return (
    <Link href={`/quote/${sym}`} className="card index-tile">
      <div className="row-sub">{label}{sourceNote(q?.source)}</div>
      <div className="index-tile-val">{q ? num(q.price) : "—"}</div>
      <div className={`index-tile-chg ${q ? tone(q.changePct) : ""}`}>
        {q ? `${q.price - q.prev >= 0 ? "+" : "−"}${num(Math.abs(q.price - q.prev))} (${pct(q.changePct)})` : "…"}
      </div>
      <div className="row-sub">{sym === "NGXASI" ? "Index points" : `via ${sym}`}</div>
    </Link>
  );
}

function QuoteRow({ sym, q }: { sym: string; q?: Quote }) {
  return (
    <li>
      <Link href={`/quote/${sym}`} className="row-link">
        <TickerLogo sym={sym} />
        <div className="meta">
          <div className="row-title">{SYMBOL_NAMES[sym] ?? sym}</div>
          <div className="row-sub">{sym}{sourceNote(q?.source)}</div>
        </div>
        <div className="num">
          {q ? money(q.price, "USD", { native: true }) : "—"}
          {q && <div className={`pct ${tone(q.changePct)}`}>{pct(q.changePct)}</div>}
        </div>
      </Link>
    </li>
  );
}

function FxRow({ pair, label, value }: { pair: string; label: string; value: string }) {
  return (
    <li>
      <span className="logo">FX</span>
      <div className="meta">
        <div className="row-title">{pair}</div>
        <div className="row-sub">{label}</div>
      </div>
      <div className="num">{value}</div>
    </li>
  );
}

function MoversList({ title, items, loading }: { title: string; items?: Mover[]; loading: boolean }) {
  return (
    <article className="card">
      <div className="card-head"><div className="title"><span className="title-ic"><Icon name="trend" /></span>{title}</div></div>
      <ul className="movers">
        {loading && <li><div className="row-sub">Loading…</div></li>}
        {!loading && !items?.length && <li><div className="row-sub">Nothing here right now.</div></li>}
        {items?.map((m) => (
          <li key={m.sym}>
            <Link href={`/quote/${m.sym}`} className="row-link">
              <TickerLogo sym={m.sym} cur={m.cur} />
              <div className="meta">
                <div className="row-title">{m.sym}</div>
                <div className="row-sub">{m.name} · {money(m.price, m.cur ?? "USD", { native: true })}</div>
              </div>
              <span className={`pct-pill ${tone(m.pct)}`}>{pct(m.pct)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
