"use client";

import { forwardRef, type FormEvent } from "react";
import type { Position } from "@/lib/usePortfolio";

interface Props {
  /** The holding being edited; the form resets whenever this changes */
  position: Position | null;
  onSave: (sym: string, changes: { qty: number; cost: number; date?: string }) => void;
}

/** Corrects a holding's shares, average cost and buy date (or a cash balance). */
export const EditHoldingDialog = forwardRef<HTMLDialogElement, Props>(function EditHoldingDialog({ position, onSave }, ref) {
  const isCash = position?.cls === "cash";

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== "save" || !position) return;
    const f = new FormData(e.currentTarget);
    onSave(position.sym, {
      qty: parseFloat(String(f.get("qty"))),
      cost: isCash ? 1 : parseFloat(String(f.get("cost"))),
      date: String(f.get("date") ?? "") || undefined,
    });
  };

  return (
    <dialog ref={ref} className="dialog">
      {position && (
        // key: remount the form so defaultValues match the selected holding
        <form method="dialog" onSubmit={handleSubmit} key={position.sym}>
          <h2>Edit {isCash ? "cash" : position.sym}</h2>
          {isCash ? (
            <label>
              Amount ({position.cur})
              <input name="qty" type="number" step="any" min="0.01" required defaultValue={position.qty} />
            </label>
          ) : (
            <>
              <label>Shares<input name="qty" type="number" step="any" min="0" required defaultValue={position.qty} /></label>
              <label>
                Average cost per share ({position.cur})
                <input name="cost" type="number" step="any" min="0" required defaultValue={position.cost} />
              </label>
              <label>
                Buy date (optional)
                <input name="date" type="date" defaultValue={position.date ?? ""} max={new Date().toISOString().slice(0, 10)} />
              </label>
            </>
          )}
          <div className="dialog-btns">
            <button className="btn outline" value="cancel" formNoValidate>Cancel</button>
            <button className="btn primary" value="save">Save</button>
          </div>
        </form>
      )}
    </dialog>
  );
});
