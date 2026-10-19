import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, authEnabled } from "./config";

/** A Supabase client for the current request (server components, route handlers). Create one per request. */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server components can't set cookies; the middleware refreshes the session instead.
        }
      },
    },
  });
}

export interface AuthState {
  user: { id: string; email: string } | null;
  profile: { name: string; baseCurrency: "USD" | "NGN" | "EUR" } | null;
}

/** The signed-in user (verified) and their profile, or nulls. */
export async function getAuth(): Promise<AuthState> {
  if (!authEnabled) return { user: null, profile: null };
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, base_currency")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    user: { id: claims.sub, email: String(claims.email ?? "") },
    profile: profile ? { name: profile.name ?? "", baseCurrency: profile.base_currency } : null,
  };
}
