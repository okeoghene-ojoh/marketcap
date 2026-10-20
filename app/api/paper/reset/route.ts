import { NextResponse, type NextRequest } from "next/server";
import { adminEnabled, supabaseAdmin } from "@/lib/supabase/admin";
import { jsonError, noStore, sameOrigin, verifiedUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/paper/reset: clear practice positions and history, back to $100,000
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Forbidden", 403);
  if (!adminEnabled()) return jsonError("Practice trading isn't set up yet.", 503);
  const user = await verifiedUser();
  if (!user) return jsonError("Sign in first.", 401);
  const { error } = await supabaseAdmin().rpc("paper_reset", { p_user: user.id });
  if (error) {
    console.error("[paper] reset failed", error.message);
    return jsonError("Couldn't reset. Try again.", 500);
  }
  return NextResponse.json({ reset: true }, { headers: noStore });
}
