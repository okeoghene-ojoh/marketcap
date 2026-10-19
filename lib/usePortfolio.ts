"use client";

// The user's holdings and watchlist, shared by every page.
// Signed in: stored in their Supabase account (synced across devices).
// Signed out: stored in this browser (localStorage), starting from a demo portfolio.
import { useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "./supabase/client";
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

interface Lists {
  positions: Position[];
  watchlist: WatchEntry[];
}

export interface PortfolioState extends Lists {
  /** "loading" while a signed-in user's data is being fetched */
  mode: "local" | "account" | "loading";
  /** Items saved in this browser that could be copied into the account */
  importable: number;
}

/** Exchange, asset class and currency for any symbol we support. */
export function describeSymbol(sym: string, name?: string, exchange?: string): WatchEntry & { cls: AssetClass } {
  const displayName = name || SYMBOL_NAMES[sym] || sym;
  if (sym in CRYPTO_IDS) return { sym, name: displayName, ex: "Crypto", cur: "USD", cls: "crypto" };
  if (NGX_SYMBOLS.includes(sym)) return { sym, name: displayName, ex: "NGX", cur: "NGN", cls: "ngx" };
  return { sym, name: displayName, ex: exchange || "US", cur: "USD", cls: "us" };
}

const LOCAL_KEY = "marketcap-portfolio-v1";
const DISMISS_KEY = "marketcap-import-dismissed"; // user ids who declined importing

const DEMO: Lists = {
  positions: initialHoldings.map(({ price: _p, prev: _pv, source: _s, ...pos }) => pos),
  watchlist: watchSyms.map((s) => {
    const h = initialHoldings.find((x) => x.sym === s);
    return h ? { sym: s, name: h.name, ex: h.ex, cur: h.cur } : describeSymbol(s);
  }),
};
const LOADING: PortfolioState = { positions: [], watchlist: [], mode: "loading", importable: 0 };
const SERVER_SNAPSHOT: PortfolioState = { ...DEMO, mode: "local", importable: 0 };

// ---------------- store ----------------
let local: Lists | null = null;
let account: (Lists & { userId: string; watchlistId: string }) | null = null;
let accountLoading: string | null = null; // user id being fetched
let snapshot: PortfolioState | null = null;
const listeners = new Set<() => void>();

function safeGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

function readLocal(): Lists {
  if (local) return local;
  try {
    const parsed = JSON.parse(safeGet(LOCAL_KEY) ?? "null");
    local =
      parsed && Array.isArray(parsed.positions) && Array.isArray(parsed.watchlist)
        ? { positions: parsed.positions, watchlist: parsed.watchlist }
        : DEMO;
  } catch {
    local = DEMO;
  }
  return local;
}

function writeLocal(next: Lists) {
  local = next;
  safeSet(LOCAL_KEY, JSON.stringify(next));
  emit();
}

/** Browser items not already in the account, unless the user changed nothing or declined. */
function countImportable(): number {
  if (!account) return 0;
  const l = readLocal();
  if (JSON.stringify(l) === JSON.stringify(DEMO)) return 0;
  const dismissed: string[] = JSON.parse(safeGet(DISMISS_KEY) ?? "[]");
  if (dismissed.includes(account.userId)) return 0;
  const has = (list: { sym: string }[], sym: string) => list.some((x) => x.sym === sym);
  return (
    l.positions.filter((p) => !has(account!.positions, p.sym)).length +
    l.watchlist.filter((w) => !has(account!.watchlist, w.sym)).length
  );
}

function getSnapshot(): PortfolioState {
  if (!snapshot) {
    snapshot = account
      ? { positions: account.positions, watchlist: account.watchlist, mode: "account", importable: countImportable() }
      : accountLoading
        ? LOADING
        : { ...readLocal(), mode: "local", importable: 0 };
  }
  return snapshot;
}

function emit() {
  snapshot = null;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_KEY) { local = null; emit(); }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// ---------------- account sync ----------------
interface HoldingRow { symbol: string; name: string; exchange: string; asset_class: AssetClass; currency: Currency; shares: number | string; buy_price: number | string }
interface ItemRow { symbol: string; name: string; exchange: string; currency: Currency }

const fromHoldingRow = (r: HoldingRow): Position => ({
  sym: r.symbol, name: r.name || r.symbol, ex: r.exchange, cls: r.asset_class, cur: r.currency,
  qty: Number(r.shares), cost: Number(r.buy_price),
});
const fromItemRow = (r: ItemRow): WatchEntry => ({ sym: r.symbol, name: r.name || r.symbol, ex: r.exchange, cur: r.currency });

/** Load the signed-in user's portfolio from Supabase (called by AuthProvider). */
export async function connectAccount(userId: string) {
  if (account?.userId === userId || accountLoading === userId) return;
  accountLoading = userId;
  account = null;
  emit();

  const db = supabaseBrowser();
  try {
    let { data: lists, error } = await db.from("watchlists").select("id").order("created_at").limit(1);
    if (error) throw error;
    if (!lists?.length) {
      // Normally created at sign-up; make one if it's missing
      const res = await db.from("watchlists").insert({ user_id: userId }).select("id");
      if (res.error) throw res.error;
      lists = res.data;
    }
    const watchlistId: string = lists![0].id;
    const [holdings, items] = await Promise.all([
      db.from("holdings").select("symbol, name, exchange, asset_class, currency, shares, buy_price").order("created_at"),
      db.from("watchlist_items").select("symbol, name, exchange, currency").eq("watchlist_id", watchlistId).order("added_at"),
    ]);
    if (holdings.error) throw holdings.error;
    if (items.error) throw items.error;
    if (accountLoading !== userId) return; // signed out meanwhile

    account = {
      userId,
      watchlistId,
      positions: (holdings.data as HoldingRow[]).map(fromHoldingRow),
      watchlist: (items.data as ItemRow[]).map(fromItemRow),
    };
  } catch (e) {
    console.error("[portfolio] couldn't load your account data", e);
    account = { userId, watchlistId: "", positions: [], watchlist: [] };
  } finally {
    if (accountLoading === userId) accountLoading = null;
    emit();
  }
}

export function disconnectAccount() {
  if (!account && !accountLoading) return;
  account = null;
  accountLoading = null;
  emit();
}

/** Re-fetch after a failed write so the screen matches the database. */
function resync() {
  if (!account) return;
  const id = account.userId;
  account = null;
  connectAccount(id);
}

function setAccountLists(next: Partial<Lists>) {
  if (!account) return;
  account = { ...account, ...next };
  emit();
}

const toHoldingRow = (userId: string, p: Position) => ({
  user_id: userId, symbol: p.sym, name: p.name, exchange: p.ex, asset_class: p.cls, currency: p.cur,
  shares: p.qty, buy_price: p.cost,
});
const toItemRow = (watchlistId: string, w: WatchEntry) => ({
  watchlist_id: watchlistId, symbol: w.sym, name: w.name, exchange: w.ex, currency: w.cur,
});

// ---------------- actions ----------------
function mergeHolding(positions: Position[], incoming: Position): Position[] {
  const existing = positions.find((p) => p.sym === incoming.sym);
  if (!existing) return [...positions, incoming];
  return positions.map((p) =>
    p.sym === incoming.sym
      ? { ...p, cost: (p.cost * p.qty + incoming.cost * incoming.qty) / (p.qty + incoming.qty), qty: p.qty + incoming.qty }
      : p
  );
}

async function addHolding(sym: string, qty: number, cost: number, name?: string, exchange?: string) {
  const { cls, ...entry } = describeSymbol(sym, name, exchange);
  const incoming: Position = { ...entry, cls, qty, cost };

  if (!account) {
    const l = readLocal();
    writeLocal({ ...l, positions: mergeHolding(l.positions, incoming) });
    return;
  }
  const positions = mergeHolding(account.positions, incoming);
  setAccountLists({ positions }); // optimistic
  const merged = positions.find((p) => p.sym === sym)!;
  const { error } = await supabaseBrowser()
    .from("holdings")
    .upsert(toHoldingRow(account.userId, merged), { onConflict: "user_id,symbol" });
  if (error) { console.error("[portfolio] save failed", error); resync(); }
}

async function addToWatchlist(sym: string, name?: string, exchange?: string) {
  const { cls: _cls, ...entry } = describeSymbol(sym, name, exchange);
  if (!account) {
    const l = readLocal();
    if (!l.watchlist.some((w) => w.sym === sym)) writeLocal({ ...l, watchlist: [...l.watchlist, entry] });
    return;
  }
  if (account.watchlist.some((w) => w.sym === sym)) return;
  setAccountLists({ watchlist: [...account.watchlist, entry] });
  const { error } = await supabaseBrowser()
    .from("watchlist_items")
    .upsert(toItemRow(account.watchlistId, entry), { onConflict: "watchlist_id,symbol", ignoreDuplicates: true });
  if (error) { console.error("[portfolio] save failed", error); resync(); }
}

async function removeFromWatchlist(sym: string) {
  if (!account) {
    const l = readLocal();
    writeLocal({ ...l, watchlist: l.watchlist.filter((w) => w.sym !== sym) });
    return;
  }
  setAccountLists({ watchlist: account.watchlist.filter((w) => w.sym !== sym) });
  const { error } = await supabaseBrowser()
    .from("watchlist_items")
    .delete()
    .eq("watchlist_id", account.watchlistId)
    .eq("symbol", sym);
  if (error) { console.error("[portfolio] delete failed", error); resync(); }
}

/** Copy this browser's holdings and watchlist into the account (skipping symbols already there). */
async function importLocal() {
  if (!account) return;
  const l = readLocal();
  const has = (list: { sym: string }[], sym: string) => list.some((x) => x.sym === sym);
  const newPositions = l.positions.filter((p) => !has(account!.positions, p.sym));
  const newItems = l.watchlist.filter((w) => !has(account!.watchlist, w.sym));
  const db = supabaseBrowser();
  const [h, w] = await Promise.all([
    newPositions.length
      ? db.from("holdings").upsert(newPositions.map((p) => toHoldingRow(account!.userId, p)), { onConflict: "user_id,symbol", ignoreDuplicates: true })
      : { error: null },
    newItems.length
      ? db.from("watchlist_items").upsert(newItems.map((i) => toItemRow(account!.watchlistId, i)), { onConflict: "watchlist_id,symbol", ignoreDuplicates: true })
      : { error: null },
  ]);
  if (h.error || w.error) console.error("[portfolio] import failed", h.error ?? w.error);
  dismissImport();
  resync();
}

function dismissImport() {
  if (!account) return;
  const dismissed: string[] = JSON.parse(safeGet(DISMISS_KEY) ?? "[]");
  safeSet(DISMISS_KEY, JSON.stringify([...new Set([...dismissed, account.userId])]));
  emit();
}

export function usePortfolio() {
  const { user } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  // Signed in but the account isn't loaded yet: don't flash the browser's demo data
  const s = user && state.mode === "local" ? LOADING : state;
  return {
    ...s,
    isWatched: (sym: string) => s.watchlist.some((w) => w.sym === sym),
    addHolding,
    addToWatchlist,
    removeFromWatchlist,
    importLocal,
    dismissImport,
  };
}
