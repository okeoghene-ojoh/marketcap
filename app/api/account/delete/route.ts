import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { adminEnabled, supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

// POST /api/account/delete: permanently deletes the signed-in user's account.
// Every table references auth.users with ON DELETE CASCADE, so their profile, holdings,
// watchlists, alerts and notifications go with it.
export async function POST(req: NextRequest) {
  // Only accept requests from our own pages (blocks cross-site form posts)
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.nextUrl.host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  }
  if (!adminEnabled()) {
    return NextResponse.json({ error: "Account deletion isn't configured yet" }, { status: 503, headers: noStore });
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser(); // verified with Supabase, not just the cookie
  if (error || !data.user) return NextResponse.json({ error: "Not signed in" }, { status: 401, headers: noStore });

  const { error: delErr } = await supabaseAdmin().auth.admin.deleteUser(data.user.id);
  if (delErr) {
    console.error("[account] delete failed", delErr.message);
    return NextResponse.json({ error: "Couldn't delete the account. Try again." }, { status: 500, headers: noStore });
  }
  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true }, { headers: noStore });
}
