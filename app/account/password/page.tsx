"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

// Reached from Account settings, or from a password-reset email (signed in by /auth/callback).
export default function NewPasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) return setError("The two passwords don’t match.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    router.push("/account");
    router.refresh();
  }

  return (
    <div className="app auth-page">
      <article className="card auth-card">
        <h2>Choose a new password</h2>
        {!user ? (
          <p className="auth-error">This link has expired. Request a new one from the sign-in page.</p>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label>Repeat it<input name="confirm" type="password" minLength={8} required autoComplete="new-password" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="btn primary auth-submit" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
          </form>
        )}
      </article>
    </div>
  );
}
