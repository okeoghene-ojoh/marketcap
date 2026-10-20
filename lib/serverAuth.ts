import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "./supabase/server";

export const noStore = { "Cache-Control": "no-store" };

export const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

/** True when a POST comes from one of our own pages (blocks cross-site form posts). */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    return Boolean(origin) && new URL(origin!).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/** The signed-in user, verified with Supabase (not just trusted from the cookie), or null. */
export async function verifiedUser() {
  const { data, error } = await (await supabaseServer()).auth.getUser();
  return error || !data.user ? null : data.user;
}
