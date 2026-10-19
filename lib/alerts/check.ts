// Evaluates every active alert against current prices (server-only).
import { supabaseAdmin } from "../supabase/admin";
import { getQuotes } from "../providers";
import { money, pct } from "../format";
import { describeAlert, isTriggered } from "./describe";
import { sendAlertEmail } from "./email";
import type { AlertCondition, Currency } from "../types";

const MAX_SYMBOLS = 50; // keeps one run inside the free Finnhub limit (60 calls/min)

interface AlertRow {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  currency: Currency;
  condition: AlertCondition;
  target: number | string;
}

export interface CheckSummary {
  active: number;
  symbols: number;
  triggered: number;
  emailed: number;
  errors: string[];
}

export async function checkAlerts(): Promise<CheckSummary> {
  const db = supabaseAdmin();
  const summary: CheckSummary = { active: 0, symbols: 0, triggered: 0, emailed: 0, errors: [] };

  const { data, error } = await db
    .from("alerts")
    .select("id, user_id, symbol, name, currency, condition, target")
    .eq("active", true)
    .order("created_at")
    .limit(1000);
  if (error) throw new Error(`loading alerts: ${error.message}`);
  const alerts = (data ?? []) as AlertRow[];
  summary.active = alerts.length;
  if (!alerts.length) return summary;

  const symbols = [...new Set(alerts.map((a) => a.symbol))].slice(0, MAX_SYMBOLS);
  summary.symbols = symbols.length;
  const quotes = await getQuotes(symbols);

  const emails = new Map<string, string | null>(); // user id → email, looked up once per run

  for (const a of alerts) {
    const q = quotes[a.symbol];
    // Never fire on sample data (e.g. NGX until a live feed is connected)
    if (!q || q.source === "sample") continue;
    const target = Number(a.target);
    if (!isTriggered(a.condition, target, q.price, q.changePct)) continue;

    // Claim the alert first, so overlapping runs can't fire it twice
    const { data: claimed, error: claimErr } = await db
      .from("alerts")
      .update({ active: false, last_triggered_at: new Date().toISOString(), last_price: q.price })
      .eq("id", a.id)
      .eq("active", true)
      .select("id");
    if (claimErr) { summary.errors.push(`claim ${a.id}: ${claimErr.message}`); continue; }
    if (!claimed?.length) continue;
    summary.triggered++;

    const title = `${describeAlert({ ...a, target })}`;
    const body = `${a.name || a.symbol} is at ${money(q.price, a.currency, { native: true })} (${pct(q.changePct)} today).`;
    const { error: noteErr } = await db
      .from("notifications")
      .insert({ user_id: a.user_id, alert_id: a.id, symbol: a.symbol, title, body });
    if (noteErr) summary.errors.push(`notify ${a.id}: ${noteErr.message}`);

    if (!emails.has(a.user_id)) {
      const { data: u } = await db.auth.admin.getUserById(a.user_id);
      emails.set(a.user_id, u?.user?.email ?? null);
    }
    const to = emails.get(a.user_id);
    if (to) {
      const result = await sendAlertEmail(to, { title, body, symbol: a.symbol }).catch((e) => ({ sent: false as const, reason: String(e) }));
      if (result.sent) summary.emailed++;
      else if (result.reason !== "no RESEND_API_KEY") summary.errors.push(`email ${a.id}: ${result.reason}`);
    }
  }
  return summary;
}
