"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AreaSeries, type IChartApi, type ISeriesApi, type Time } from "lightweight-charts";
import { createThemedChart, cssVar, timeLabel, withAlpha } from "@/lib/chart";
import { computeValueSeries } from "@/lib/portfolioHistory";
import { money, pct, tone } from "@/lib/format";
import { CURRENCY_SYMBOLS } from "@/lib/sample-data";
import type { Candle, Currency, DataSource, Holding, HistoryRange, Rates } from "@/lib/types";

const RANGES: HistoryRange[] = ["1M", "6M", "YTD", "1Y"];
type Series = { candles: Candle[]; source: DataSource };

interface Props {
  holdings: Holding[];
  rates: Rates;
  currency: Currency;
  hidden: boolean;
}

/** Value of the user's current holdings over time, in their display currency. */
export function ValueChart({ holdings, rates, currency, hidden }: Props) {
  const [range, setRange] = useState<HistoryRange>("6M");
  const [histories, setHistories] = useState<Record<string, Series | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<{ label: string; value: number } | null>(null);
  const cache = useRef(new Map<string, Series>());

  const symbols = useMemo(() => [...new Set(holdings.filter((h) => h.cls !== "cash").map((h) => h.sym))].sort(), [holdings]);
  const key = symbols.join(",");

  // Load each holding's daily history for the range (live results are kept for the visit)
  useEffect(() => {
    let cancelled = false;
    const syms = key ? key.split(",") : [];
    setLoading(true);
    Promise.all(
      syms.map(async (s) => {
        const k = `${s}|${range}`;
        const hit = cache.current.get(k);
        if (hit) return [s, hit] as const;
        try {
          const r = await fetch(`/api/history?symbol=${encodeURIComponent(s)}&range=${range}`);
          const d: Series = await r.json();
          if (r.ok && d.source !== "sample") cache.current.set(k, d);
          return [s, r.ok ? d : undefined] as const;
        } catch {
          return [s, undefined] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setHistories(Object.fromEntries(entries));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [key, range]);

  const series = useMemo(() => {
    const cashUSD = holdings.filter((h) => h.cls === "cash").reduce((s, h) => s + h.qty, 0);
    return computeValueSeries(
      holdings.filter((h) => h.cls !== "cash").map((h) => ({ sym: h.sym, qty: h.qty, cur: h.cur, price: h.price })),
      histories,
      rates,
      cashUSD
    );
  }, [holdings, histories, rates]);

  const shown = series.points.map((p) => ({ time: p.time as Time, value: p.value * rates[currency] }));
  const first = shown[0]?.value ?? 0;
  const lastV = shown.at(-1)?.value ?? 0;
  const change = lastV - first;
  const changePct = first ? (change / first) * 100 : 0;
  const fmt = (v: number) => money(v, currency, { native: true, digits: 0 });

  // Chart (recreated per data change: one series, cheap)
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  useEffect(() => {
    const box = boxRef.current;
    if (!box || shown.length < 2 || hidden) return;
    const { chart, dispose } = createThemedChart(box);
    const color = cssVar(change >= 0 ? "--pos" : "--neg");
    const s: ISeriesApi<"Area"> = chart.addSeries(AreaSeries, {
      lineWidth: 2, priceLineVisible: false, lastValueVisible: false,
      lineColor: color, topColor: withAlpha(color, 0.28), bottomColor: withAlpha(color, 0.02),
      priceFormat: {
        type: "custom",
        minMove: 1,
        formatter: (v: number) => `${CURRENCY_SYMBOLS[currency]}${v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`,
      },
    });
    s.setData(shown);
    chart.timeScale().fitContent();
    chart.subscribeCrosshairMove((param) => {
      const point = param.time !== undefined ? param.seriesData.get(s) : undefined;
      if (!point || !("value" in point)) return setHover(null);
      setHover({ label: timeLabel(param.time!), value: (point as { value: number }).value });
    });
    chartRef.current = chart;
    return () => { dispose(); chartRef.current = null; setHover(null); };
  }, [JSON.stringify(shown), currency, hidden]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!symbols.length) return null;

  return (
    <div className="value-chart">
      <div className="chart-head">
        <div>
          <div className="label">Value of your current holdings</div>
          <div className="chart-legend">
            {hidden ? <b>••••</b> : hover ? (
              <><b>{fmt(hover.value)}</b> <span>{hover.label}</span></>
            ) : shown.length > 1 ? (
              <><b className={tone(change)}>{money(change, currency, { native: true, sign: true, digits: 0 })} ({pct(changePct)})</b> <span>past {range === "YTD" ? "year to date" : range}</span></>
            ) : null}
          </div>
        </div>
        <div className="seg small" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r} className={`seg-btn ${r === range ? "active" : ""}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="chart-box value-box" ref={boxRef}>
        {hidden && <div className="chart-msg">Values hidden</div>}
        {!hidden && loading && shown.length < 2 && <div className="chart-msg">Loading price history…</div>}
        {!hidden && !loading && shown.length < 2 && (
          <div className="chart-msg">No price history available for these holdings yet. Try again in a minute.</div>
        )}
      </div>

      <p className="row-sub value-note">
        Assumes today&apos;s shares were held throughout, at today&apos;s exchange rates.
        {series.estimated.length > 0 && <> Held at today&apos;s value (no live history): {series.estimated.join(", ")}.</>}
      </p>
    </div>
  );
}
