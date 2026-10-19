"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { usePoll } from "@/lib/useMarketData";
import type { AlertCondition, AppNotification, Currency, PriceAlert } from "@/lib/types";

const POLL_MS = 60_000;

interface AlertRow {
  id: string; symbol: string; name: string; currency: Currency; condition: AlertCondition; target: number | string;
  active: boolean; last_triggered_at: string | null; last_price: number | string | null;
}
interface NoteRow { id: string; symbol: string | null; title: string; body: string; read: boolean; created_at: string }

const fromAlertRow = (r: AlertRow): PriceAlert => ({
  id: r.id, symbol: r.symbol, name: r.name, currency: r.currency, condition: r.condition, target: Number(r.target),
  active: r.active, lastTriggeredAt: r.last_triggered_at, lastPrice: r.last_price === null ? null : Number(r.last_price),
});
const fromNoteRow = (r: NoteRow): AppNotification => ({
  id: r.id, symbol: r.symbol, title: r.title, body: r.body, read: r.read, createdAt: r.created_at,
});

interface AlertsContext {
  /** false when signed out (alerts need an account) */
  enabled: boolean;
  alerts: PriceAlert[];
  notifications: AppNotification[];
  unread: number;
  createAlert: (a: { symbol: string; name: string; currency: Currency; condition: AlertCondition; target: number }) => Promise<string | null>;
  setActive: (id: string, active: boolean) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AlertsContext | null>(null);

export function useAlerts() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAlerts must be used inside <AlertsProvider>");
  return ctx;
}

/** The signed-in user's price alerts and notifications, refreshed every minute. */
export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) { setAlerts([]); setNotifications([]); }
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const db = supabaseBrowser();
    const [a, n] = await Promise.all([
      db.from("alerts").select("id, symbol, name, currency, condition, target, active, last_triggered_at, last_price").order("created_at", { ascending: false }),
      db.from("notifications").select("id, symbol, title, body, read, created_at").order("created_at", { ascending: false }).limit(30),
    ]);
    // Before the alerts SQL has been run these tables don't exist yet: just show nothing
    if (!a.error) setAlerts((a.data as AlertRow[]).map(fromAlertRow));
    if (!n.error) setNotifications((n.data as NoteRow[]).map(fromNoteRow));
  }, [user]);

  usePoll(refresh, POLL_MS, Boolean(user));

  const value = useMemo<AlertsContext>(() => {
    const db = () => supabaseBrowser();
    return {
      enabled: Boolean(user),
      alerts,
      notifications,
      unread: notifications.filter((n) => !n.read).length,
      async createAlert(a) {
        if (!user) return null;
        const { data, error } = await db()
          .from("alerts")
          .insert({ user_id: user.id, ...a })
          .select("id, symbol, name, currency, condition, target, active, last_triggered_at, last_price")
          .single();
        if (error) { console.error("[alerts] create failed", error); return null; }
        setAlerts((list) => [fromAlertRow(data as AlertRow), ...list]);
        return (data as AlertRow).id;
      },
      async setActive(id, active) {
        setAlerts((list) => list.map((x) => (x.id === id ? { ...x, active } : x)));
        const { error } = await db().from("alerts").update({ active }).eq("id", id);
        if (error) { console.error("[alerts] update failed", error); refresh(); }
      },
      async deleteAlert(id) {
        setAlerts((list) => list.filter((x) => x.id !== id));
        const { error } = await db().from("alerts").delete().eq("id", id);
        if (error) { console.error("[alerts] delete failed", error); refresh(); }
      },
      async markRead(id) {
        setNotifications((list) => list.map((x) => (x.id === id ? { ...x, read: true } : x)));
        const { error } = await db().from("notifications").update({ read: true }).eq("id", id);
        if (error) refresh();
      },
      async markAllRead() {
        setNotifications((list) => list.map((x) => ({ ...x, read: true })));
        const { error } = await db().from("notifications").update({ read: true }).eq("read", false);
        if (error) refresh();
      },
      refresh,
    };
  }, [user, alerts, notifications, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
