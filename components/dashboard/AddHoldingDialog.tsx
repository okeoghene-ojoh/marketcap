"use client";

import { forwardRef, type FormEvent } from "react";
import type { Currency } from "@/lib/types";

interface Props {
  onSave: (sym: string, qty: number, cost: number) => void;
  /** Lock the ticker (e.g. on a quote page) */
  symbol?: string;
  currency?: Currency;
  /** Prefill the buy price, e.g. with the current price */
  suggestedPrice?: number;
}

export const AddHoldingDialog = forwardRef<HTMLDialogElement, Props>(function AddHoldingDialog(
  { onSave, symbol, currency = "USD", suggestedPrice },
  ref
) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== "save") return;
    const f = new FormData(e.currentTarget);
    onSave(
      String(f.get("sym")).trim().toUpperCase(),
      parseFloat(String(f.get("qty"))),
      parseFloat(String(f.get("cost")))
    );
    e.currentTarget.reset();
  };

  return (
    <dialog ref={ref} className="dialog">
      <form method="dialog" onSubmit={handleSubmit}>
        <h2>Add holding</h2>
        <label>
          Ticker
          <input
            name="sym" required maxLength={12} pattern="[A-Za-z0-9.\-]+" placeholder="e.g. TSLA"
            defaultValue={symbol} readOnly={!!symbol}
          />
        </label>
        <label>Shares<input name="qty" type="number" step="any" min="0" required placeholder="10" /></label>
        <label>
          Buy price ({currency})
          <input
            name="cost" type="number" step="any" min="0" required placeholder="250.00"
            defaultValue={suggestedPrice ? suggestedPrice.toFixed(2) : undefined}
          />
        </label>
        <div className="dialog-btns">
          <button className="btn outline" value="cancel" formNoValidate>Cancel</button>
          <button className="btn primary" value="save">Save</button>
        </div>
      </form>
    </dialog>
  );
});
