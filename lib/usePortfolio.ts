"use client";

// The user's holdings and watchlists, shared by every page.
// Signed in: stored in their Supabase account (synced across devices).
// Signed out: stored in this browser (localStorage), starting from a demo portfolio.
import { useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "./supabase/client";
import { CRYPTO_IDS, NGX_SYMBOLS, SYMBOL_NAMES, initialHoldings, watchSyms } from "./sample-data";
import type { AssetClass, Currency, Holding } from "./types";

/** A holding without its live price fields. `date` is the optional buy date (YYYY-MM-DD). */
export type Position = Omit<Holding, "price" | "prev" | "source"> & { date?: string };

export interface WatchEntry {
  sym: string;
  name: string;
  ex: string;
  cur: Currency;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchEntry[];
}

interface Lists {
  positions: Position[];
  watchlists: Watchlist[];
}

export interface PortfolioState extends Lists {
  /** Items of the first (default) watchlist, shown on the dashboard */
  watchlist: WatchEntry[];
  /** "loading" while a signed-in user's data is being fetched */
  mode: "local" | "account" | "loading";
  /** Items saved in this browser that could be copied into the account */
  importable: number;
}

/** Exchange, asset class and currency for any symbol we support. */
export function describeSymbol(sym: string, name?: string, exchange?: string): WatchEntry & { cls: AssetClass } {
  if (sym === "CASH") return { sym, name: "Cash", ex: "", cur: "USD", cls: "cash" };
  const displayName = name || SYMBOL_NAMES[sym] || sym;
  if (sym in CRYPTO_IDS) return { sym, name: displayName, ex: "Crypto", cur: "USD", cls: "crypto" };
  if (NGX_SYMBOLS.includes(sym)) return { sym, name: displayName, ex: "NGX", cur: "NGN", cls: "ngx" };
  return { sym, name: displayName, ex: exchange || "US", cur: "USD", cls: "us" };
}

const LOCAL_KEY = "marketcap-portfolio-v1";
const DISMISS_KEY = "marketcap-import-dismissed"; // user ids who declined importing
const DEFAULT_LIST_NAME = "My watchlist";

const DEMO: Lists = {
  positions: initialHoldings.map(({ price: _p, prev: _pv, source: _s, ...pos }) => pos),
  watchlists: [{
    id: "local-default",
    name: DEFAULT_LIST_NAME,
    items: watchSyms.map((s) => {
      const h = initialHoldings.find((x) => x.sym === s);
      return h ? { sym: s, name: h.name, ex: h.ex, cur: h.cur } : describeSymbol(s);
    }),
  }],
};

const withDerived = (l: Lists, mode: PortfolioState["mode"], importable = 0): PortfolioState => ({
  ...l, watchlist: l.watchlists[0]?.items ?? [], mode, importable,
});
const LOADING = withDerived({ positions: [], watchlists: [] }, "loading");
const SERVER_SNAPSHOT = withDerived(DEMO, "local");

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `local-${Date.now()}-${Math.random()}`;

// ---------------- store ----------------
let local: Lists | null = null;
let account: (Lists & { userId: string }) | null = null;
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
    if (parsed && Array.isArray(parsed.positions) && Array.isArray(parsed.watchlists)) {
      local = { positions: parsed.positions, watchlists: parsed.watchlists };
    } else if (parsed && Array.isArray(parsed.positions) && Array.isArray(parsed.watchlist)) {
      // Older format with a single list
      local = { positions: parsed.positions, watchlists: [{ id: "local-default", name: DEFAULT_LIST_NAME, items: parsed.watchlist }] };
    } else {
      local = DEMO;
    }
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

const allItems = (l: Lists) => l.watchlists.flatMap((w) => w.items);
const hasSym = (list: { sym: string }[], sym: string) => list.some((x) => x.sym === sym);

/** Browser items not already in the account, unless the user changed nothing or declined. */
function countImportable(): number {
  if (!account) return 0;
  const l = readLocal();
  if (JSON.stringify(l) === JSON.stringify(DEMO)) return 0;
  const dismissed: string[] = JSON.parse(safeGet(DISMISS_KEY) ?? "[]");
  if (dismissed.includes(account.userId)) return 0;
  const accItems = allItems(account);
  const localItems = [...new Map(allItems(l).map((i) => [i.sym, i])).values()];
  return (
    l.positions.filter((p) => !hasSym(account!.positions, p.sym)).length +
    localItems.filter((i) => !hasSym(accItems, i.sym)).length
  );
}

function getSnapshot(): PortfolioState {
  if (!snapshot) {
    snapshot = account
      ? withDerived(account, "account", countImportable())
      : accountLoading
        ? LOADING
        : withDerived(readLocal(), "local");
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
interface HoldingRow {
  symbol: string; name: string; exchange: string; asset_class: AssetClass; currency: Currency;
  shares: number | string; buy_price: number | string; buy_date: string | null;
}
interface ItemRow { symbol: string; name: string; exchange: string; currency: Currency }
interface ListRow { id: string; name: string; watchlist_items: ItemRow[] }

const fromHoldingRow = (r: HoldingRow): Position => ({
  sym: r.symbol, name: r.name || r.symbol, ex: r.exchange, cls: r.asset_class, cur: r.currency,
  qty: Number(r.shares), cost: Number(r.buy_price), date: r.buy_date ?? undefined,
});
const fromItemRow = (r: ItemRow): WatchEntry => ({ sym: r.symbol, name: r.name || r.symbol, ex: r.exchange, cur: r.currency });

const toHoldingRow = (userId: string, p: Position) => ({
  user_id: userId, symbol: p.sym, name: p.name, exchange: p.ex, asset_class: p.cls, currency: p.cur,
  shares: p.qty, buy_price: p.cost, buy_date: p.date || null,
});
const toItemRow = (watchlistId: string, w: WatchEntry) => ({
  watchlist_id: watchlistId, symbol: w.sym, name: w.name, exchange: w.ex, currency: w.cur,
});

/** Load the signed-in user's portfolio from Supabase (called by AuthProvider). */
export async function connectAccount(userId: string) {
  if (account?.userId === userId || accountLoading === userId) return;
  accountLoading = userId;
  account = null;
  emit();

  const db = supabaseBrowser();
  try {
    const [lists, holdings] = await Promise.all([
      db.from("watchlists")
        .select("id, name, watchlist_items(symbol, name, exchange, currency)")
        .order("created_at")
        .order("added_at", { referencedTable: "watchlist_items" }),
      db.from("holdings")
        .select("symbol, name, exchange, asset_class, currency, shares, buy_price, buy_date")
        .order("created_at"),
    ]);
    if (lists.error) throw lists.error;
    if (holdings.error) throw holdings.error;
    if (accountLoading !== userId) return; // signed out meanwhile

    let watchlists: Watchlist[] = (lists.data as ListRow[]).map((l) => ({
      id: l.id, name: l.name, items: (l.watchlist_items ?? []).map(fromItemRow),
    }));
    if (!watchlists.length) {
      // Normally created at sign-up; make one if it's missing
      const res = await db.from("watchlists").insert({ user_id: userId, name: DEFAULT_LIST_NAME }).select("id, name").single();
      if (res.error) throw res.error;
      watchlists = [{ id: res.data.id, name: res.data.name, items: [] }];
    }
    account = { userId, watchlists, positions: (holdings.data as HoldingRow[]).map(fromHoldingRow) };
  } catch (e) {
    console.error("[portfolio] couldn't load your account data", e);
    account = { userId, watchlists: [], positions: [] };
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
function resync(error: unknown) {
  console.error("[portfolio] save failed", error);
  if (!account) return;
  const id = account.userId;
  account = null;
  connectAccount(id);
}

/** Apply a change to whichever store is active (optimistically for the account). */
function update(change: (l: Lists) => Lists) {
  if (account) {
    account = { ...account, ...change(account) };
    emit();
  } else {
    writeLocal(change(readLocal()));
  }
}

const listIdOr = (l: Lists, id?: string) => id ?? l.watchlists[0]?.id;

// ---------------- holdings ----------------
function mergeHolding(positions: Position[], incoming: Position): Position[] {
  const existing = positions.find((p) => p.sym === incoming.sym);
  if (!existing) return [...positions, incoming];
  return positions.map((p) =>
    p.sym === incoming.sym
      ? { ...p, cost: (p.cost * p.qty + incoming.cost * incoming.qty) / (p.qty + incoming.qty), qty: p.qty + incoming.qty }
      : p
  );
}

/** Buy more: averages the cost into an existing holding. */
async function addHolding(sym: string, qty: number, cost: number, name?: string, exchange?: string) {
  const { cls, ...entry } = describeSymbol(sym, name, exchange);
  update((l) => ({ ...l, positions: mergeHolding(l.positions, { ...entry, cls, qty, cost }) }));
  if (!account) return;
  const merged = account.positions.find((p) => p.sym === sym)!;
  const { error } = await supabaseBrowser()
    .from("holdings")
    .upsert(toHoldingRow(account.userId, merged), { onConflict: "user_id,symbol" });
  if (error) resync(error);
}

/** Correct a holding's numbers (replaces them, unlike addHolding). */
async function updateHolding(sym: string, changes: { qty: number; cost: number; date?: string }) {
  update((l) => ({
    ...l,
    positions: l.positions.map((p) => (p.sym === sym ? { ...p, qty: changes.qty, cost: changes.cost, date: changes.date || undefined } : p)),
  }));
  if (!account) return;
  const { error } = await supabaseBrowser()
    .from("holdings")
    .update({ shares: changes.qty, buy_price: changes.cost, buy_date: changes.date || null })
    .eq("symbol", sym);
  if (error) resync(error);
}

async function removeHolding(sym: string) {
  update((l) => ({ ...l, positions: l.positions.filter((p) => p.sym !== sym) }));
  if (!account) return;
  const { error } = await supabaseBrowser().from("holdings").delete().eq("symbol", sym);
  if (error) resync(error);
}

// ---------------- watchlists ----------------
/** Adds to the given list, or the first (default) one. */
async function addToWatchlist(sym: string, name?: string, exchange?: string, listId?: string) {
  const { cls: _cls, ...entry } = describeSymbol(sym, name, exchange);
  const target = listIdOr(account ?? readLocal(), listId);
  if (!target) return;
  const list = (account ?? readLocal()).watchlists.find((w) => w.id === target);
  if (!list || hasSym(list.items, sym)) return;
  update((l) => ({
    ...l,
    watchlists: l.watchlists.map((w) => (w.id === target ? { ...w, items: [...w.items, entry] } : w)),
  }));
  if (!account) return;
  const { error } = await supabaseBrowser()
    .from("watchlist_items")
    .upsert(toItemRow(target, entry), { onConflict: "watchlist_id,symbol", ignoreDuplicates: true });
  if (error) resync(error);
}

async function removeFromWatchlist(sym: string, listId?: string) {
  const target = listIdOr(account ?? readLocal(), listId);
  if (!target) return;
  update((l) => ({
    ...l,
    watchlists: l.watchlists.map((w) => (w.id === target ? { ...w, items: w.items.filter((i) => i.sym !== sym) } : w)),
  }));
  if (!account) return;
  const { error } = await supabaseBrowser().from("watchlist_items").delete().eq("watchlist_id", target).eq("symbol", sym);
  if (error) resync(error);
}

/** Returns the new list's id. */
async function createWatchlist(name: string): Promise<string | null> {
  const clean = name.trim().slice(0, 60) || "New list";
  if (!account) {
    const id = newId();
    update((l) => ({ ...l, watchlists: [...l.watchlists, { id, name: clean, items: [] }] }));
    return id;
  }
  const { data, error } = await supabaseBrowser()
    .from("watchlists")
    .insert({ user_id: account.userId, name: clean })
    .select("id, name")
    .single();
  if (error) { resync(error); return null; }
  update((l) => ({ ...l, watchlists: [...l.watchlists, { id: data.id, name: data.name, items: [] }] }));
  return data.id;
}

async function renameWatchlist(id: string, name: string) {
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  update((l) => ({ ...l, watchlists: l.watchlists.map((w) => (w.id === id ? { ...w, name: clean } : w)) }));
  if (!account) return;
  const { error } = await supabaseBrowser().from("watchlists").update({ name: clean }).eq("id", id);
  if (error) resync(error);
}

/** The last remaining list can't be deleted (the dashboard always shows one). */
async function deleteWatchlist(id: string) {
  const current = account ?? readLocal();
  if (current.watchlists.length <= 1) return;
  update((l) => ({ ...l, watchlists: l.watchlists.filter((w) => w.id !== id) }));
  if (!account) return;
  const { error } = await supabaseBrowser().from("watchlists").delete().eq("id", id);
  if (error) resync(error);
}

// ---------------- importing ----------------
/** Copy this browser's holdings and watchlist items into the account (skipping symbols already there). */
async function importLocal() {
  if (!account || !account.watchlists.length) return;
  const l = readLocal();
  const accItems = allItems(account);
  const newPositions = l.positions.filter((p) => !hasSym(account!.positions, p.sym));
  const newItems = [...new Map(allItems(l).map((i) => [i.sym, i])).values()].filter((i) => !hasSym(accItems, i.sym));
  const firstList = account.watchlists[0].id;
  const db = supabaseBrowser();
  const [h, w] = await Promise.all([
    newPositions.length
      ? db.from("holdings").upsert(newPositions.map((p) => toHoldingRow(account!.userId, p)), { onConflict: "user_id,symbol", ignoreDuplicates: true })
      : { error: null },
    newItems.length
      ? db.from("watchlist_items").upsert(newItems.map((i) => toItemRow(firstList, i)), { onConflict: "watchlist_id,symbol", ignoreDuplicates: true })
      : { error: null },
  ]);
  dismissImport();
  if (h.error || w.error) resync(h.error ?? w.error);
  else { const id = account.userId; account = null; connectAccount(id); }
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
    /** In the default (first) list — what the quote page's button toggles */
    isWatched: (sym: string) => hasSym(s.watchlist, sym),
    addHolding,
    updateHolding,
    removeHolding,
    addToWatchlist,
    removeFromWatchlist,
    createWatchlist,
    renameWatchlist,
    deleteWatchlist,
    importLocal,
    dismissImport,
  };
}
