"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaSeries, ColorType, CrosshairMode, createChart,
  type IChartApi, type ISeriesApi, type Time, type UTCTimestamp,
} from "lightweight-charts";
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

const isIntraday = (r: HistoryRange) => r === "1D" || r === "5D";

/** Twelve Data gives "YYYY-MM-DD" for daily bars and "YYYY-MM-DD HH:mm:ss" (exchange time) for intraday. */
function toChartTime(t: string): Time {
  if (t.length <= 10) return t as Time;
  // Treat exchange-local time as UTC so the axis shows exchange hours
  return (Date.parse(t.replace(" ", "T") + "Z") / 1000) as UTCTimestamp;
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hex: string, alpha: number) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
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
    const chart = createChart(box, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: cssVar("--muted"),
        fontFamily: getComputedStyle(document.body).fontFamily,
        // Keep the TradingView logo: the library's license asks for attribution
      },
      grid: { vertLines: { visible: false }, horzLines: { color: cssVar("--line") } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
      crosshair: { mode: CrosshairMode.Magnet },
      handleScroll: false,
      handleScale: false,
    });
    const series = chart.addSeries(AreaSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: false });

    chart.subscribeCrosshairMove((param) => {
      const point = param.time !== undefined ? param.seriesData.get(series) : undefined;
      if (!point || !("value" in point)) return setHover(null);
      const t = param.time;
      const label =
        typeof t === "number"
          ? new Date(t * 1000).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
          : new Date(`${t as string}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
      setHover({ price: (point as { value: number }).value, label });
    });

    // Re-read colours when the theme changes
    const recolor = () => chart.applyOptions({
      layout: { textColor: cssVar("--muted") },
      grid: { horzLines: { color: cssVar("--line") } },
    });
    const observer = new MutationObserver(recolor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      observer.disconnect();
      chart.remove();
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
        if (d.source === "live") cache.current.set(range, d); // retry sample fallbacks next time
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
