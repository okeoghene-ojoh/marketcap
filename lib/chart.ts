"use client";

import { ColorType, CrosshairMode, createChart, type IChartApi, type Time, type UTCTimestamp } from "lightweight-charts";
import type { HistoryRange } from "./types";

export const isIntraday = (r: HistoryRange) => r === "1D" || r === "5D";

/** Twelve Data gives "YYYY-MM-DD" for daily bars and "YYYY-MM-DD HH:mm:ss" (exchange time) for intraday. */
export function toChartTime(t: string): Time {
  if (t.length <= 10) return t as Time;
  // Treat exchange-local time as UTC so the axis shows exchange hours
  return (Date.parse(t.replace(" ", "T") + "Z") / 1000) as UTCTimestamp;
}

/** Readable label for a chart time (intraday timestamps or YYYY-MM-DD days). */
export function timeLabel(t: Time) {
  return typeof t === "number"
    ? new Date(t * 1000).toLocaleString("en-US", { timeZone: "UTC", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : new Date(`${t as string}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
}

export function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function withAlpha(hex: string, alpha: number) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
}

/** A chart styled like the rest of the app that re-colours itself when the theme changes. */
export function createThemedChart(box: HTMLElement): { chart: IChartApi; dispose: () => void } {
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
  const observer = new MutationObserver(() =>
    chart.applyOptions({ layout: { textColor: cssVar("--muted") }, grid: { horzLines: { color: cssVar("--line") } } })
  );
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return { chart, dispose: () => { observer.disconnect(); chart.remove(); } };
}
