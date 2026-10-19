"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authEnabled } from "@/lib/supabase/config";
import { supabaseBrowser } from "@/lib/supabase/client";
import { connectAccount, disconnectAccount } from "@/lib/usePortfolio";
import type { AuthState } from "@/lib/supabase/server";

const AuthContext = createContext<AuthState & { enabled: boolean }>({ user: null, profile: null, enabled: false });

export const useAuth = () => useContext(AuthContext);

/** Gets the signed-in user from the server render and keeps the app in sync when it changes. */
export function AuthProvider({ user, profile, children }: AuthState & { children: React.ReactNode }) {
  const router = useRouter();

  // Re-render server components (and so refresh `user`) when the user signs in or out in any tab
  useEffect(() => {
    if (!authEnabled) return;
    const { data } = supabaseBrowser().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  // Point the portfolio store at this account (or back at this browser's storage)
  useEffect(() => {
    if (user) connectAccount(user.id);
    else disconnectAccount();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthContext.Provider value={{ user, profile, enabled: authEnabled }}>{children}</AuthContext.Provider>;
}
