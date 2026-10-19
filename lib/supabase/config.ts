// Supabase connection settings. Both values are safe to expose to the browser:
// Row-Level Security in the database decides what each user can read or write.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Accounts are switched off (and sign-in hidden) until Supabase is configured. */
export const authEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Show "Continue with Google" once Google is set up in Supabase → Authentication → Providers. */
export const googleEnabled = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";
