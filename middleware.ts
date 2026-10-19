import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, authEnabled } from "@/lib/supabase/config";

/** Keeps the login session fresh on every page load (Supabase tokens expire hourly). */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!authEnabled) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Responses that set auth cookies must never be cached by the CDN
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Don't add code between creating the client and this call: it refreshes the session.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Pages only: skip API routes (cached market data), Next internals and static files
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
