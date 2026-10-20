"use client";

import { useEffect, useRef, useState } from "react";
import { AreaSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { createThemedChart, cssVar, isIntraday, timeLabel, toChartTime, withAlpha } from "@/lib/chart";
import { HISTORY_RANGES, type Candle, type DataSource, type HistoryRange } from "@/lib/types";
import { pct, tone } from "@/lib/format";

interface Props {
  symbol: string;
  formatPrice: (v: number) => string;
}

interface Series {
  candles: Candle[];
  source: DataSource;
}

export function PriceChart({ symbol, formatPrice }: Props) {
  const [range, setRange] = useState<HistoryRange>("1M");
  const [data, setData] = useState<Series | null>(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<{ price: number; label: string } | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const cache = useRef(new Map<HistoryRange, Series>());

  // Create the chart once
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const { chart, dispose } = createThemedChart(box);
    const series = chart.addSeries(AreaSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: false });

    chart.subscribeCrosshairMove((param) => {
      const point = param.time !== undefined ? param.seriesData.get(series) : undefined;
      if (!point || !("value" in point)) return setHover(null);
      setHover({ price: (point as { value: number }).value, label: timeLabel(param.time!) });
    });

    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      dispose();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load (or reuse) the selected range
  useEffect(() => {
    let cancelled = false;
    const cached = cache.current.get(range);
    if (cached) { setData(cached); return; }
    setError(false);
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Series) => {
        if (cancelled) return;
        if (d.source !== "sample") cache.current.set(range, d); // retry sample fallbacks next time
        setData(d);
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [symbol, range]);

  // Draw it
  const candles = data?.candles ?? [];
  const first = candles[0]?.close;
  const last = candles.at(-1)?.close;
  const change = first && last ? ((last - first) / first) * 100 : 0;

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series || !data) return;
    const color = cssVar(change >= 0 ? "--pos" : "--neg");
    series.applyOptions({ lineColor: color, topColor: withAlpha(color, 0.28), bottomColor: withAlpha(color, 0.02) });
    series.setData(data.candles.map((c) => ({ time: toChartTime(c.time), value: c.close })));
    chart.applyOptions({ timeScale: { timeVisible: isIntraday(range), secondsVisible: false } });
    chart.timeScale().fitContent();
  }, [data, range, change]);

  return (
    <div className="chart">
      <div className="chart-head">
        <div className="seg small" role="tablist" aria-label="Chart range">
          {HISTORY_RANGES.map((r) => (
            <button key={r} className={`seg-btn ${r === range ? "active" : ""}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        <div className="chart-legend">
          {hover ? (
            <><b>{formatPrice(hover.price)}</b> <span>{hover.label}</span></>
          ) : candles.length > 1 ? (
            <><b className={tone(change)}>{pct(change)}</b> <span>past {range === "MAX" ? "all time" : range}</span></>
          ) : null}
          {data?.source === "sample" && <span className="tag">sample</span>}
        </div>
      </div>
      <div className="chart-box" ref={boxRef}>
        {!data && !error && <div className="chart-msg">Loading chart…</div>}
        {error && <div className="chart-msg">Couldn’t load the chart. Try another range.</div>}
      </div>
    </div>
  );
}
