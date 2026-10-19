"use client";

import { forwardRef, useState, type FormEvent } from "react";
import { CONDITION_LABELS } from "@/lib/alerts/describe";
import { CURRENCY_SYMBOLS } from "@/lib/sample-data";
import type { AlertCondition, Currency } from "@/lib/types";

interface Props {
  symbol: string;
  currency: Currency;
  price: number;
  onCreate: (condition: AlertCondition, target: number) => Promise<boolean>;
}

const CONDITIONS = Object.keys(CONDITION_LABELS) as AlertCondition[];

export const SetAlertDialog = forwardRef<HTMLDialogElement, Props>(function SetAlertDialog({ symbol, currency, price, onCreate }, ref) {
  const [condition, setCondition] = useState<AlertCondition>("above");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isPrice = condition === "above" || condition === "below";

  // Suggest a target 5% away from today's price
  const suggestion = condition === "above" ? price * 1.05 : condition === "below" ? price * 0.95 : 5;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== "save") return;
    e.preventDefault(); // keep the dialog open until saved
    const form = e.currentTarget;
    const target = parseFloat(String(new FormData(form).get("target")));
    if (!(target > 0)) return setError("Enter a number above zero.");
    if (condition === "above" && target <= price) return setError(`Pick a price above today's ${CURRENCY_SYMBOLS[currency]}${price.toFixed(2)}.`);
    if (condition === "below" && target >= price) return setError(`Pick a price below today's ${CURRENCY_SYMBOLS[currency]}${price.toFixed(2)}.`);
    setBusy(true);
    const ok = await onCreate(condition, target);
    setBusy(false);
    if (!ok) return setError("Couldn't save the alert. Try again.");
    setError("");
    (form.closest("dialog") as HTMLDialogElement).close();
  }

  return (
    <dialog ref={ref} className="dialog">
      <form method="dialog" onSubmit={handleSubmit}>
        <h2>Alert me about {symbol}</h2>
        <label>
          When
          <select name="condition" value={condition} onChange={(e) => { setCondition(e.target.value as AlertCondition); setError(""); }}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
          </select>
        </label>
        <label>
          {isPrice ? `Price (${currency})` : "Percent"}
          <input
            key={condition} // reset the suggestion when the condition changes
            name="target" type="number" step="any" min="0" required
            defaultValue={isPrice ? suggestion.toFixed(2) : suggestion}
            onChange={() => setError("")}
          />
        </label>
        <p className="row-sub dialog-hint">
          Checked every 5 minutes. You&apos;ll get an email and a notification here, then the alert switches off.
        </p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <div className="dialog-btns">
          <button className="btn outline" value="cancel" formNoValidate>Cancel</button>
          <button className="btn primary" value="save" disabled={busy}>{busy ? "Saving…" : "Create alert"}</button>
        </div>
      </form>
    </dialog>
  );
});
