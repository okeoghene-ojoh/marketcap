"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LogoMark } from "../Logo";
import { googleEnabled } from "@/lib/supabase/config";

type Mode = "signin" | "signup" | "reset";

const TITLES: Record<Mode, string> = {
  signin: "Sign in to Marketcap",
  signup: "Create your account",
  reset: "Reset your password",
};

export function AuthForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [notice, setNotice] = useState("");

  const callback = (next = "/") => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const switchTo = (m: Mode) => { setMode(m); setError(""); setNotice(""); };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password") ?? "");
    const auth = supabaseBrowser().auth;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else if (mode === "signup") {
        const name = String(f.get("name")).trim();
        const { data, error } = await auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: callback("/") },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setNotice(`Almost done: we sent a confirmation link to ${email}. Open it to finish creating your account.`);
        }
      } else {
        const { error } = await auth.resetPasswordForEmail(email, { redirectTo: callback("/account/password") });
        if (error) throw error;
        setNotice(`If an account exists for ${email}, a reset link is on its way.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError("");
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback("/") } });
    if (error) setError(error.message);
  }

  return (
    <article className="card auth-card">
      <Link href="/" className="brand auth-brand"><LogoMark size={36} />Marketcap</Link>
      <h2>{TITLES[mode]}</h2>

      {mode !== "reset" && (
        <div className="seg auth-seg" role="tablist">
          <button className={`seg-btn ${mode === "signin" ? "active" : ""}`} onClick={() => switchTo("signin")} type="button">Sign in</button>
          <button className={`seg-btn ${mode === "signup" ? "active" : ""}`} onClick={() => switchTo("signup")} type="button">Create account</button>
        </div>
      )}

      <form onSubmit={onSubmit} className="auth-form">
        {mode === "signup" && (
          <label>Your name<input name="name" required maxLength={80} autoComplete="name" placeholder="e.g. Ada" /></label>
        )}
        <label>Email<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
        {mode !== "reset" && (
          <label>
            Password
            <input
              name="password" type="password" required minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
            />
          </label>
        )}

        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <button className="btn primary auth-submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>
      </form>

      {googleEnabled && mode !== "reset" && (
        <>
          <div className="auth-or"><span>or</span></div>
          <button className="btn outline auth-submit" type="button" onClick={google}>Continue with Google</button>
        </>
      )}

      <div className="auth-links">
        {mode === "signin" && <button type="button" onClick={() => switchTo("reset")}>Forgot your password?</button>}
        {mode === "reset" && <button type="button" onClick={() => switchTo("signin")}>Back to sign in</button>}
      </div>
    </article>
  );
}
