"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../AuthProvider";
import type { Currency } from "@/lib/types";

interface Props {
  email: string;
  name: string;
  baseCurrency: Currency;
}

export function AccountForm({ email, name, baseCurrency }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabaseBrowser()
      .from("profiles")
      .update({ name: String(f.get("name")).trim(), base_currency: String(f.get("currency")) })
      .eq("id", user.id);
    setBusy(false);
    setStatus(error ? { ok: false, text: error.message } : { ok: true, text: "Saved." });
    if (!error) router.refresh();
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="row account-row">
      <article className="card">
        <div className="card-head"><div className="title">Account settings</div></div>
        <form className="auth-form" onSubmit={save}>
          <label>Email<input value={email} readOnly disabled /></label>
          <label>Name<input name="name" defaultValue={name} required maxLength={80} /></label>
          <label>
            Default currency
            <select name="currency" defaultValue={baseCurrency}>
              <option value="USD">US dollar ($)</option>
              <option value="NGN">Nigerian naira (₦)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </label>
          {status && <p className={status.ok ? "auth-notice" : "auth-error"} role="status">{status.text}</p>}
          <div className="btns">
            <button className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            <Link href="/account/password" className="btn outline">Change password</Link>
            <button type="button" className="btn outline" onClick={signOut}>Sign out</button>
          </div>
        </form>
      </article>

      <DeleteAccount />
    </section>
  );
}

/** Permanently deletes the account, after the user types DELETE to confirm. */
function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirm !== "DELETE") return setError("Type DELETE in capitals to confirm.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setBusy(false);
      const body = await res.json().catch(() => ({}));
      return setError(body.error ?? "Couldn't delete the account. Try again.");
    }
    await supabaseBrowser().auth.signOut();
    window.location.href = "/?deleted=1";
  }

  return (
    <article className="card danger-zone">
      <div className="card-head"><div className="title">Delete account</div></div>
      <p className="row-sub">
        This permanently deletes your account and everything saved in it: holdings, watchlists, alerts and
        notifications. It can&apos;t be undone.
      </p>
      <form className="auth-form" onSubmit={onDelete}>
        <label>
          Type DELETE to confirm
          <input value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} autoComplete="off" />
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="btns">
          <button className="btn danger" disabled={busy}>{busy ? "Deleting…" : "Delete my account"}</button>
        </div>
      </form>
    </article>
  );
}
