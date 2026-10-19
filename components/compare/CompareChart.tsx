"use client";

import { useEffect, useRef } from "react";
import { CrosshairMode, LineSeries, LineStyle, type ISeriesApi, type Time } from "lightweight-charts";
import { createThemedChart, cssVar, isIntraday, timeLabel, toChartTime } from "@/lib/chart";
import type { Candle, HistoryRange } from "@/lib/types";

export interface CompareLine {
  symbol: string;
  color: string;
  candles: Candle[];
}

interface Props {
  lines: CompareLine[];
  range: HistoryRange;
  /** Values (% change) under the cursor, or null when the cursor leaves the chart */
  onHover: (hover: { label: string; values: Record<string, number> } | null) => void;
}

const pctLabel = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`;

/** Each line is drawn as % change from its first point in the range, so prices of any size compare fairly. */
export function toPercentPoints(candles: Candle[]) {
  const base = candles[0]?.close;
  if (!base) return [];
  return candles.map((c) => ({ time: toChartTime(c.time), value: (c.close / base - 1) * 100 }));
}

export function CompareChart({ lines, range, onHover }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

  // Build a fresh chart whenever the lines change. Re-using one chart left the removed
  // lines' dates on the time axis (a blank strip on the left); at ≤5 lines a rebuild is instant.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !lines.length) return;
    const { chart, dispose } = createThemedChart(box);
    chart.applyOptions({
      crosshair: { mode: CrosshairMode.Normal }, // free-moving across several lines
      timeScale: { timeVisible: isIntraday(range), secondsVisible: false },
    });

    const series = new Map<string, ISeriesApi<"Line">>();
    lines.forEach((line, i) => {
      const s = chart.addSeries(LineSeries, {
        color: line.color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        priceFormat: { type: "custom", formatter: pctLabel, minMove: 0.01 },
      });
      s.setData(toPercentPoints(line.candles));
      if (i === 0) {
        s.createPriceLine({ price: 0, color: cssVar("--muted"), lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false });
      }
      series.set(line.symbol, s);
    });

    chart.subscribeCrosshairMove((param) => {
      if (param.time === undefined) return onHoverRef.current(null);
      const values: Record<string, number> = {};
      for (const [sym, s] of series) {
        const point = param.seriesData.get(s);
        if (point && "value" in point) values[sym] = (point as { value: number }).value;
      }
      onHoverRef.current({ label: timeLabel(param.time as Time), values });
    });

    chart.timeScale().fitContent();
    return () => {
      dispose();
      onHoverRef.current(null);
    };
  }, [lines, range]);

  return (
    <div className="chart-box compare-box" ref={boxRef}>
      {!lines.length && <div className="chart-msg">Loading chart…</div>}
    </div>
  );
}
