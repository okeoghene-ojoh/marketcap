import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Links in confirmation / password-reset emails and Google sign-in land here with a one-time
// ?code=, which we swap for a session cookie before sending the user on.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  // Only allow redirects within this site
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }

  const failed = new URL("/login", origin);
  failed.searchParams.set("error", searchParams.get("error_description") ?? "That link is invalid or has expired.");
  return NextResponse.redirect(failed);
}
