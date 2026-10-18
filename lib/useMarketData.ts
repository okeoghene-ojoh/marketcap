"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialHoldings, initialIndices, watchSyms } from "./sample-data";
import type { Flash, Holding, IndexKey, IndexQuote } from "./types";

const TICK_MS = 3000;

/**
 * Sample market data with simulated ticks, plus a live BTC price from
 * Binance's public stream when it's reachable. Swap this hook's internals
 * for real API calls later; the components won't need to change.
 */
export function useMarketData() {
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [indices, setIndices] = useState<Record<IndexKey, IndexQuote>>(initialIndices);
  const [flash, setFlash] = useState<Flash>({});
  const liveBTC = useRef(false);

  // Simulated ticks
  useEffect(() => {
    const id = setInterval(() => {
      const nextFlash: Flash = {};
      setHoldings((hs) =>
        hs.map((h) => {
          if (h.cls === "cash" || (h.sym === "BTC" && liveBTC.current)) return h;
          if (h.cls === "ngx" && Math.random() < 0.8) return h; // NGX is delayed, so it moves rarely
          const move = h.price * (Math.random() - 0.5) * 0.003;
          if (watchSyms.includes(h.sym)) nextFlash[h.sym] = move >= 0 ? "up" : "down";
          return { ...h, price: Math.max(0.0001, h.price + move) };
        })
      );
      setIndices((ix) => {
        const out = { ...ix };
        for (const k of Object.keys(out) as IndexKey[]) {
          out[k] = { ...out[k], price: out[k].price + out[k].price * (Math.random() - 0.5) * 0.0008 };
        }
        return out;
      });
      setFlash(nextFlash);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Live BTC from Binance (no API key needed). Falls back to simulation.
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
          setHoldings((hs) => hs.map((h) => (h.sym === "BTC" ? { ...h, price: parseFloat(d.c), prev: parseFloat(d.o) } : h)));
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
      return [...hs, { sym, name: sym, ex: "US", cls: "us", cur: "USD", qty, cost, price: cost, prev: cost }];
    });
  }, []);

  return { holdings, indices, flash, addHolding };
}
