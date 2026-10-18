"use client";

import { forwardRef, type FormEvent } from "react";

interface Props {
  onSave: (sym: string, qty: number, cost: number) => void;
}

export const AddHoldingDialog = forwardRef<HTMLDialogElement, Props>(function AddHoldingDialog({ onSave }, ref) {
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
        <label>Ticker<input name="sym" required maxLength={10} placeholder="e.g. TSLA" /></label>
        <label>Shares<input name="qty" type="number" step="any" min="0" required placeholder="10" /></label>
        <label>Buy price (USD)<input name="cost" type="number" step="any" min="0" required placeholder="250.00" /></label>
        <div className="dialog-btns">
          <button className="btn outline" value="cancel" formNoValidate>Cancel</button>
          <button className="btn primary" value="save">Save</button>
        </div>
      </form>
    </dialog>
  );
});
