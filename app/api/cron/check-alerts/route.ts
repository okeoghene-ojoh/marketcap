import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { checkAlerts } from "@/lib/alerts/check";
import { adminEnabled } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "no-store" };

/** Only callers that know CRON_SECRET (the Supabase scheduler) may run the checker. */
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// POST (or GET) /api/cron/check-alerts  with  Authorization: Bearer <CRON_SECRET>
async function handle(req: NextRequest) {
  if (!process.env.CRON_SECRET || !adminEnabled()) {
    return NextResponse.json({ error: "Alerts aren't configured (CRON_SECRET / SUPABASE_SECRET_KEY missing)" }, { status: 503, headers: noStore });
  }
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  try {
    const summary = await checkAlerts();
    if (summary.errors.length) console.warn("[alerts] errors:", summary.errors);
    return NextResponse.json(summary, { headers: noStore });
  } catch (e) {
    console.error("[alerts] check failed", e);
    return NextResponse.json({ error: "Check failed" }, { status: 500, headers: noStore });
  }
}

export const GET = handle;
export const POST = handle;
