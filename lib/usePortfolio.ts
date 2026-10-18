"use client";

// The user's holdings and watchlist, saved in this browser (localStorage) and
// shared by every page. Phase 5 moves this to the user's account in Supabase.
import { useSyncExternalStore } from "react";
import { CRYPTO_IDS, NGX_SYMBOLS, SYMBOL_NAMES, initialHoldings, watchSyms } from "./sample-data";
import type { AssetClass, Currency, Holding } from "./types";

/** A holding without its live price fields. */
export type Position = Omit<Holding, "price" | "prev" | "source">;

export interface WatchEntry {
  sym: string;
  name: string;
  ex: string;
  cur: Currency;
}

interface PortfolioState {
  positions: Position[];
  watchlist: WatchEntry[];
}

const KEY = "marketcap-portfolio-v1";

/** Exchange, asset class and currency for any symbol we support. */
export function describeSymbol(sym: string, name?: string, exchange?: string): WatchEntry & { cls: AssetClass } {
  const displayName = name || SYMBOL_NAMES[sym] || sym;
  if (sym in CRYPTO_IDS) return { sym, name: displayName, ex: "Crypto", cur: "USD", cls: "crypto" };
  if (NGX_SYMBOLS.includes(sym)) return { sym, name: displayName, ex: "NGX", cur: "NGN", cls: "ngx" };
  return { sym, name: displayName, ex: exchange || "US", cur: "USD", cls: "us" };
}

const DEFAULT_STATE: PortfolioState = {
  positions: initialHoldings.map(({ price: _p, prev: _pv, source: _s, ...pos }) => pos),
  watchlist: watchSyms.map((s) => {
    const h = initialHoldings.find((x) => x.sym === s);
    return h ? { sym: s, name: h.name, ex: h.ex, cur: h.cur } : describeSymbol(s);
  }),
};

// ----- tiny external store (one copy shared by all components) -----
let cached: PortfolioState | null = null;
const listeners = new Set<() => void>();

function read(): PortfolioState {
  if (cached) return cached;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cached =
      parsed && Array.isArray(parsed.positions) && Array.isArray(parsed.watchlist)
        ? { positions: parsed.positions, watchlist: parsed.watchlist }
        : DEFAULT_STATE;
  } catch {
    cached = DEFAULT_STATE;
  }
  return cached;
}

function write(next: PortfolioState) {
  cached = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other open tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { cached = null; listener(); }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// ----- actions -----
function addHolding(sym: string, qty: number, cost: number, name?: string, exchange?: string) {
  const s = read();
  const existing = s.positions.find((p) => p.sym === sym);
  const positions = existing
    ? s.positions.map((p) =>
        p.sym === sym ? { ...p, cost: (p.cost * p.qty + cost * qty) / (p.qty + qty), qty: p.qty + qty } : p
      )
    : [...s.positions, { ...describeSymbol(sym, name, exchange), qty, cost }];
  write({ ...s, positions });
}

function addToWatchlist(sym: string, name?: string, exchange?: string) {
  const s = read();
  if (s.watchlist.some((w) => w.sym === sym)) return;
  const { cls: _cls, ...entry } = describeSymbol(sym, name, exchange);
  write({ ...s, watchlist: [...s.watchlist, entry] });
}

function removeFromWatchlist(sym: string) {
  const s = read();
  write({ ...s, watchlist: s.watchlist.filter((w) => w.sym !== sym) });
}

export function usePortfolio() {
  // Server render and first client render use the defaults; saved data loads right after.
  const state = useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);
  return {
    positions: state.positions,
    watchlist: state.watchlist,
    isWatched: (sym: string) => state.watchlist.some((w) => w.sym === sym),
    addHolding,
    addToWatchlist,
    removeFromWatchlist,
  };
}
