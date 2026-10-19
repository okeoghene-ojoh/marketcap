"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** One shared browser client; it keeps the session in cookies the server can read. */
export function supabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
