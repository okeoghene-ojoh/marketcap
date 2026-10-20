"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "./supabase/client";

export const STARTING_CASH = 100_000;

export interface PaperPosition { symbol: string; name: string; qty: number; avgCost: number }
export interface PaperTrade {
  id: string; symbol: string; name: string; side: "buy" | "sell";
  qty: number; price: number; realized: number | null; createdAt: string;
}
export interface PaperState {
  /** null until loaded; false when the tables don't exist yet (SQL not run) */
  ready: boolean | null;
  cash: number;
  startingCash: number;
  startedAt: string | null;
  positions: PaperPosition[];
  trades: PaperTrade[];
}

const EMPTY: PaperState = { ready: null, cash: STARTING_CASH, startingCash: STARTING_CASH, startedAt: null, positions: [], trades: [] };

/** The signed-in user's practice account. Reads come straight from Supabase (RLS); trades go through /api/paper. */
export function usePaper() {
  const { user } = useAuth();
  const [state, setState] = useState<PaperState>(EMPTY);

  const load = useCallback(async () => {
    if (!user) return setState(EMPTY);
    const db = supabaseBrowser();
    const [acct, pos, trades] = await Promise.all([
      db.from("paper_accounts").select("cash, starting_cash, started_at").maybeSingle(),
      db.from("paper_positions").select("symbol, name, qty, avg_cost").order("symbol"),
      db.from("paper_trades").select("id, symbol, name, side, qty, price, realized, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    if (acct.error || pos.error || trades.error) return setState({ ...EMPTY, ready: false });
    setState({
      ready: true,
      cash: acct.data ? Number(acct.data.cash) : STARTING_CASH,
      startingCash: acct.data ? Number(acct.data.starting_cash) : STARTING_CASH,
      startedAt: acct.data?.started_at ?? null,
      positions: (pos.data ?? []).map((p) => ({ symbol: p.symbol, name: p.name, qty: Number(p.qty), avgCost: Number(p.avg_cost) })),
      trades: (trades.data ?? []).map((t) => ({
        id: t.id, symbol: t.symbol, name: t.name, side: t.side, qty: Number(t.qty), price: Number(t.price),
        realized: t.realized === null ? null : Number(t.realized), createdAt: t.created_at,
      })),
    });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /** Returns an error message, or null on success. */
  const trade = useCallback(async (order: { symbol: string; side: "buy" | "sell"; qty?: number; amount?: number; name?: string }) => {
    const res = await fetch("/api/paper/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => null);
    if (!res) return "Couldn't reach the server. Check your connection.";
    const body = await res.json().catch(() => ({}));
    await load();
    return res.ok ? null : (body.error ?? "The trade didn't go through.");
  }, [load]);

  const reset = useCallback(async () => {
    const res = await fetch("/api/paper/reset", { method: "POST" }).catch(() => null);
    await load();
    return Boolean(res?.ok);
  }, [load]);

  return { ...state, trade, reset, reload: load };
}
