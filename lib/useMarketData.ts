"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CRYPTO_IDS, INDEX_SYMBOLS, SAMPLE_RATES, initialHoldings, sampleQuote, watchSyms } from "./sample-data";
import type {
  DataSource, Flash, Holding, IndexKey, MoversResponse, NewsResponse, Quote, Rates,
} from "./types";

const QUOTES_MS = 15_000;
const MOVERS_MS = 60_000;
const NEWS_MS = 5 * 60_000;
const FX_MS = 60 * 60_000;

const INDEX_KEYS = Object.keys(INDEX_SYMBOLS) as IndexKey[];

async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Run `fn` now and every `ms`, skipping while the tab is hidden (saves API quota). */
function usePoll(fn: () => void, ms: number) {
  useEffect(() => {
    fn();
    const id = setInterval(() => document.visibilityState === "visible" && fn(), ms);
    const onVisible = () => document.visibilityState === "visible" && fn();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fn, ms]);
}

/**
 * Market data for the dashboard, from our /api routes (which hide the API keys
 * and fall back to labelled sample data), plus a live BTC price streamed from
 * Binance when it's reachable.
 */
export function useMarketData() {
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [indices, setIndices] = useState<Record<IndexKey, Quote | null>>(() =>
    Object.fromEntries(INDEX_KEYS.map((k) => [k, sampleQuote(INDEX_SYMBOLS[k].sym)])) as Record<IndexKey, Quote | null>
  );
  const [rates, setRates] = useState<{ rates: Rates; source: DataSource }>({ rates: SAMPLE_RATES, source: "sample" });
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [movers, setMovers] = useState<MoversResponse | null>(null);
  const [flash, setFlash] = useState<Flash>({});

  const holdingsRef = useRef(holdings);
  holdingsRef.current = holdings;
  const liveBTC = useRef(false);

  // Re-subscribe when the set of symbols changes (e.g. a holding is added)
  const symbolKey = holdings.filter((h) => h.cls !== "cash").map((h) => h.sym).join(",");

  const loadQuotes = useCallback(async () => {
    const symbols = [...symbolKey.split(","), ...INDEX_KEYS.map((k) => INDEX_SYMBOLS[k].sym)].filter(Boolean);
    const data = await getJSON<{ quotes: Record<string, Quote> }>(`/api/quotes?symbols=${symbols.join(",")}`);
    if (!data) return;
    const { quotes } = data;

    const nextFlash: Flash = {};
    for (const h of holdingsRef.current) {
      const q = quotes[h.sym];
      if (q && watchSyms.includes(h.sym) && q.price !== h.price) nextFlash[h.sym] = q.price > h.price ? "up" : "down";
    }

    setHoldings((hs) =>
      hs.map((h) => {
        const q = quotes[h.sym];
        if (!q || h.cls === "cash" || (h.sym === "BTC" && liveBTC.current)) return h;
        return { ...h, price: q.price, prev: q.prev, source: q.source };
      })
    );
    setIndices((ix) => {
      const out = { ...ix };
      for (const k of INDEX_KEYS) out[k] = quotes[INDEX_SYMBOLS[k].sym] ?? ix[k];
      return out;
    });
    setFlash(nextFlash);
  }, [symbolKey]);

  const loadRates = useCallback(async () => {
    const data = await getJSON<{ rates: Rates; source: DataSource }>("/api/fx");
    if (data) setRates(data);
  }, []);

  const loadNews = useCallback(async () => {
    const data = await getJSON<NewsResponse>("/api/news");
    if (data) setNews(data);
  }, []);

  const loadMovers = useCallback(async () => {
    const data = await getJSON<MoversResponse>("/api/movers");
    if (data) setMovers(data);
  }, []);

  usePoll(loadQuotes, QUOTES_MS);
  usePoll(loadRates, FX_MS);
  usePoll(loadNews, NEWS_MS);
  usePoll(loadMovers, MOVERS_MS);

  // Live BTC from Binance's public stream (no API key). Falls back to /api/quotes.
  useEffect(() => {
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
          liveBTC.current = true;
          setHoldings((hs) =>
            hs.map((h) => (h.sym === "BTC" ? { ...h, price: parseFloat(d.c), prev: parseFloat(d.o), source: "live" } : h))
          );
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
  }, []);

  const addHolding = useCallback((sym: string, qty: number, cost: number) => {
    setHoldings((hs) => {
      const existing = hs.find((h) => h.sym === sym);
      if (existing) {
        return hs.map((h) =>
          h.sym === sym ? { ...h, cost: (h.cost * h.qty + cost * qty) / (h.qty + qty), qty: h.qty + qty } : h
        );
      }
      const crypto = sym in CRYPTO_IDS;
      // Priced at cost until the next quote refresh picks it up
      return [...hs, {
        sym, name: sym, ex: crypto ? "Crypto" : "US", cls: crypto ? "crypto" : "us", cur: "USD",
        qty, cost, price: cost, prev: cost, source: "sample",
      }];
    });
  }, []);

  return { holdings, indices, rates: rates.rates, ratesSource: rates.source, news, movers, flash, addHolding };
}
