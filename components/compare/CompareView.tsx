"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "../dashboard/Header";
import { SearchBox } from "../SearchBox";
import { Icon } from "../Icon";
import { CompareChart, toPercentPoints, type CompareLine } from "./CompareChart";
import { SYMBOL_NAMES } from "@/lib/sample-data";
import { HISTORY_RANGES, MAX_COMPARE, type Candle, type DataSource, type HistoryRange } from "@/lib/types";
import { tone } from "@/lib/format";


// Distinct from the green/red used for "up"/"down", and readable in light and dark mode
const COLORS = ["#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];

interface Series {
  candles: Candle[];
  source: DataSource;
}

const pctText = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;

export function CompareView({ initialSymbols, initialRange }: { initialSymbols: string[]; initialRange: HistoryRange }) {
  const router = useRouter();
  const [symbols, setSymbols] = useState(initialSymbols);
  const [range, setRange] = useState(initialRange);
  const [names, setNames] = useState<Record<string, string>>({});
  const [data, setData] = useState<Record<string, Series | "error">>({});
  const [hover, setHover] = useState<{ label: string; values: Record<string, number> } | null>(null);
  const cache = useRef(new Map<string, Series>());

  // Keep the URL shareable: /compare?s=AAPL,MSFT&range=1Y
  useEffect(() => {
    router.replace(`/compare?s=${symbols.join(",")}&range=${range}`, { scroll: false });
  }, [symbols, range, router]);

  // Load each symbol's history for the selected range. Results are keyed by symbol AND range,
  // so lines from a previous range never mix with the current one.
  const keyOf = (sym: string) => `${sym}|${range}`;
  useEffect(() => {
    let cancelled = false;
    for (const sym of symbols) {
      const key = `${sym}|${range}`;
      if (cache.current.has(key)) continue; // live data already loaded
      fetch(`/api/history?symbol=${encodeURIComponent(sym)}&range=${range}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d: Series) => {
          if (cancelled) return;
          if (d.source === "live") cache.current.set(key, d); // sample fallbacks are retried next time
          setData((prev) => ({ ...prev, [key]: d }));
        })
        .catch(() => { if (!cancelled) setData((prev) => ({ ...prev, [key]: "error" })); });
    }
    return () => { cancelled = true; };
  }, [symbols, range]);

  const colorOf = (sym: string) => COLORS[symbols.indexOf(sym) % COLORS.length];

  const lines: CompareLine[] = useMemo(() => {
    const loaded = symbols.flatMap((s) => {
      const d = data[keyOf(s)];
      return d && d !== "error" && d.candles.length > 1 ? [{ symbol: s, color: COLORS[symbols.indexOf(s)], candles: d.candles }] : [];
    });
    // Measure every line from the same starting date, so returns are comparable
    // (ISO date strings sort correctly as text)
    const start = loaded.reduce((max, l) => (l.candles[0].time > max ? l.candles[0].time : max), "");
    return loaded
      .map((l) => ({ ...l, candles: l.candles.filter((c) => c.time >= start) }))
      .filter((l) => l.candles.length > 1);
  },
    [symbols, data, range] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const returns = useMemo(() => {
    const out: Record<string, number> = {};
    for (const l of lines) {
      const pts = toPercentPoints(l.candles);
      if (pts.length) out[l.symbol] = pts[pts.length - 1].value;
    }
    return out;
  }, [lines]);

  const add = (sym: string, name?: string) => {
    if (symbols.includes(sym) || symbols.length >= MAX_COMPARE) return;
    if (name) setNames((n) => ({ ...n, [sym]: name }));
    setSymbols([...symbols, sym]);
  };
  const remove = (sym: string) => setSymbols(symbols.filter((s) => s !== sym));

  const anySample = symbols.some((s) => { const d = data[keyOf(s)]; return d && d !== "error" && d.source === "sample"; });
  const best = Object.entries(returns).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="app">
      <Header />

      <section className="card">
        <div className="card-head">
          <div className="title"><span className="title-ic"><Icon name="trend" /></span>Compare</div>
          <div className="seg small range-seg" role="tablist" aria-label="Range">
            {HISTORY_RANGES.map((r) => (
              <button key={r} className={`seg-btn ${r === range ? "active" : ""}`} onClick={() => setRange(r)}>{r}</button>
            ))}
          </div>
        </div>

        <ul className="compare-legend">
          {symbols.map((s) => {
            const d = data[keyOf(s)];
            const value = hover ? hover.values[s] : returns[s];
            return (
              <li key={s}>
                <span className="swatch" style={{ background: colorOf(s) }} />
                <Link href={`/quote/${s}`} className="compare-sym">{s}</Link>
                <span className="compare-name">{names[s] || SYMBOL_NAMES[s] || ""}</span>
                <span className={`compare-val ${value === undefined ? "" : tone(value)}`}>
                  {d === "error" ? "unavailable" : value === undefined ? (d ? "—" : "loading…") : pctText(value)}
                </span>
                {d && d !== "error" && d.source === "sample" && <span className="tag">sample</span>}
                <button className="chip-x" aria-label={`Remove ${s}`} onClick={() => remove(s)}><Icon name="x" size="sm" /></button>
              </li>
            );
          })}
        </ul>

        {symbols.length < MAX_COMPARE ? (
          <SearchBox inline placeholder={`Add up to ${MAX_COMPARE - symbols.length} more…`} onPick={(r) => add(r.symbol, r.name)} />
        ) : (
          <p className="row-sub">You’re comparing the maximum of {MAX_COMPARE}. Remove one to add another.</p>
        )}

        <div className="chart-legend compare-hover">
          {hover ? <span>{hover.label}</span> : best && lines.length > 1 ? (
            <span><b>{best[0]}</b> did best over {range === "MAX" ? "all time" : `the past ${range}`} ({pctText(best[1])})</span>
          ) : null}
        </div>

        {symbols.length === 0 ? (
          <div className="chart-box compare-box"><div className="chart-msg">Add a stock or coin to start comparing.</div></div>
        ) : (
          <CompareChart lines={lines} range={range} onHover={setHover} />
        )}

        {anySample && (
          <p className="row-sub compare-note">
            Lines marked “sample” couldn’t load live history (the free data plan allows a few chart requests per minute). Try again in a minute.
          </p>
        )}
      </section>

      <footer className="foot">Each line shows the % change from the start of the range. Past performance doesn’t predict future results. Not financial advice.</footer>
    </div>
  );
}
