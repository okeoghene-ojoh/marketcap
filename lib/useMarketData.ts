"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INDEX_SYMBOLS, SAMPLE_RATES } from "./sample-data";
import type { DataSource, Flash, IndexKey, MoversResponse, NewsResponse, Quote, Rates } from "./types";

const QUOTES_MS = 15_000;
const MOVERS_MS = 60_000;
const NEWS_MS = 5 * 60_000;
const FX_MS = 60 * 60_000;

const INDEX_KEYS = Object.keys(INDEX_SYMBOLS) as IndexKey[];

export async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Run `fn` now and every `ms`, skipping while the tab is hidden (saves API quota). */
export function usePoll(fn: () => void, ms: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    fn();
    const id = setInterval(() => document.visibilityState === "visible" && fn(), ms);
    const onVisible = () => document.visibilityState === "visible" && fn();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fn, ms, enabled]);
}

/**
 * Live quotes for `symbols`, refreshed every 15s from /api/quotes, with BTC
 * streamed from Binance when reachable. `flash` marks symbols whose price just moved.
 */
export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [flash, setFlash] = useState<Flash>({});
  const quotesRef = useRef(quotes);
  quotesRef.current = quotes;
  const liveBTC = useRef(false);

  const key = [...new Set(symbols)].sort().join(",");

  const load = useCallback(async () => {
    if (!key) return;
    const data = await getJSON<{ quotes: Record<string, Quote> }>(`/api/quotes?symbols=${key}`);
    if (!data) return;
    const nextFlash: Flash = {};
    for (const [s, q] of Object.entries(data.quotes)) {
      const old = quotesRef.current[s];
      if (old && old.price !== q.price) nextFlash[s] = q.price > old.price ? "up" : "down";
    }
    setQuotes((prev) => {
      const next = { ...prev, ...data.quotes };
      if (liveBTC.current && prev.BTC) next.BTC = prev.BTC; // the stream is fresher
      return next;
    });
    setFlash(nextFlash);
  }, [key]);

  usePoll(load, QUOTES_MS);

  const wantsBTC = key.split(",").includes("BTC");
  useEffect(() => {
    if (!wantsBTC) return;
    let ws: WebSocket | null = null;
    let retries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      if (closed || retries++ > 3) return;
      try {
        ws = new WebSocket("wss://data-stream.binance.vision/ws/btcusdt@miniTicker");
        ws.onopen = () => { retries = 0; };
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          const price = parseFloat(d.c);
          const prev = parseFloat(d.o);
          liveBTC.current = true;
          setQuotes((q) => ({
            ...q,
            BTC: { symbol: "BTC", price, prev, changePct: ((price - prev) / prev) * 100, time: Date.now(), source: "live" },
          }));
        };
        ws.onclose = () => {
          liveBTC.current = false;
          if (!closed) timer = setTimeout(connect, 15000 * retries);
        };
      } catch {
        liveBTC.current = false;
      }
    };
    connect();
    return () => { closed = true; clearTimeout(timer); ws?.close(); };
  }, [wantsBTC]);

  return { quotes, flash };
}

/** USD → NGN / EUR rates, refreshed hourly (sample rates until loaded). */
export function useRates() {
  const [rates, setRates] = useState<{ rates: Rates; source: DataSource }>({ rates: SAMPLE_RATES, source: "sample" });
  const load = useCallback(async () => {
    const data = await getJSON<{ rates: Rates; source: DataSource }>("/api/fx");
    if (data) setRates(data);
  }, []);
  usePoll(load, FX_MS);
  return { rates: rates.rates, ratesSource: rates.source };
}

/** Everything the dashboard needs beyond the user's own symbols. */
export function useMarketData(symbols: string[]) {
  const indexSyms = INDEX_KEYS.map((k) => INDEX_SYMBOLS[k].sym);
  const { quotes, flash } = useQuotes([...symbols, ...indexSyms]);
  const { rates, ratesSource } = useRates();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [movers, setMovers] = useState<MoversResponse | null>(null);

  const loadNews = useCallback(async () => {
    const data = await getJSON<NewsResponse>("/api/news");
    if (data) setNews(data);
  }, []);
  const loadMovers = useCallback(async () => {
    const data = await getJSON<MoversResponse>("/api/movers");
    if (data) setMovers(data);
  }, []);

  usePoll(loadNews, NEWS_MS);
  usePoll(loadMovers, MOVERS_MS);

  const indices = Object.fromEntries(INDEX_KEYS.map((k) => [k, quotes[INDEX_SYMBOLS[k].sym] ?? null])) as Record<
    IndexKey,
    Quote | null
  >;

  return { quotes, flash, indices, rates, ratesSource, news, movers };
}
