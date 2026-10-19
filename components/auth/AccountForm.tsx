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
    </section>
  );
}
